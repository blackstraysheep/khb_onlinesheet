# 実装計画：監査ログ標準版化（2026-05-11）

## 概要

event_log を拡張し、操作者・IPアドレス・状態変更前後を完全記録する標準版スキーマを実装します。

## 最終目標スキーマ

```sql
ALTER TABLE event_log (
  -- 既存
  id bigint PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  detail jsonb,
  venue_id uuid,

  -- 新規（標準版）
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  admin_id text,                 -- 操作者（ユーザーID or token hash）
  admin_ip text,                 -- リクエスト元IPアドレス
  old_state jsonb,               -- 変更前の state snapshot
  new_state jsonb                -- 変更後の state snapshot
);

CREATE INDEX idx_event_log_tournament ON event_log(tournament_id);
CREATE INDEX idx_event_log_admin_id ON event_log(admin_id);
CREATE INDEX idx_event_log_type_date ON event_log(event_type, created_at DESC);
```

---

## 実装フェーズ

### Phase 1: データベース拡張

**カラム追加**:
```sql
ALTER TABLE event_log
  ADD COLUMN tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  ADD COLUMN admin_id text,
  ADD COLUMN admin_ip text,
  ADD COLUMN old_state jsonb,
  ADD COLUMN new_state jsonb;

-- インデックス作成
CREATE INDEX idx_event_log_tournament ON event_log(tournament_id);
CREATE INDEX idx_event_log_admin_id ON event_log(admin_id);
CREATE INDEX idx_event_log_type_date ON event_log(event_type, created_at DESC);
```

**後方互換**: `detail` カラムは保持（検索効率のため分離）

---

### Phase 2: Edge Functions 修正

全ての `event_log.insert()` に以下を追加：

#### 1. admin-patch-state

**実装例**:
```typescript
const before = await db.from('state')
  .select('*')
  .eq('venue_id', venue_id)
  .single();

const after = await db.from('state')
  .update({ ...statepatch, updated_at: new Date().toISOString() })
  .eq('venue_id', venue_id)
  .select()
  .single();

// ログ記録（標準版）
await db.from('event_log').insert({
  event_type: 'ADMIN_PATCH_STATE',
  tournament_id,
  venue_id,
  admin_id: extractAdminId(req),  // ← token hash or user ID
  admin_ip: req.headers.get('x-forwarded-for') || 'unknown',
  old_state: before.data,          // ← 変更前
  new_state: after.data,           // ← 変更後
  detail: statepatch               // detail は後方互換で保持
});
```

#### 2. admin-e5-confirm

**実装例**:
```typescript
const st = await db.from('state')
  .select('*')
  .eq('venue_id', venue_id)
  .single();

const before = st.data;

const after = await db.from('state')
  .update({
    accepting: false,
    match_complete: isLastEpoch
  })
  .eq('venue_id', venue_id)
  .select()
  .single();

// ログ記録
await db.from('event_log').insert({
  event_type: 'E5_CONFIRM',
  tournament_id,
  venue_id,
  admin_id: extractAdminId(req),
  admin_ip: req.headers.get('x-forwarded-for') || 'unknown',
  old_state: before,
  new_state: after.data,
  detail: {
    match_id: current_match_id,
    snapshot_id: snapshot.data.id,
    is_last_epoch: isLastEpoch
  }
});
```

#### 3. admin-e6-proceed（次対戦へ）

**実装例**:
```typescript
const before = await db.from('state')
  .select('*')
  .eq('venue_id', venue_id)
  .single();

const after = await db.from('state')
  .update({
    epoch: (before.data.epoch || 1) + 1,
    accepting: true,
    e3_reached: false
  })
  .eq('venue_id', venue_id)
  .select()
  .single();

await db.from('event_log').insert({
  event_type: 'E6_PROCEED',
  tournament_id,
  venue_id,
  admin_id: extractAdminId(req),
  admin_ip: req.headers.get('x-forwarded-for') || 'unknown',
  old_state: before.data,
  new_state: after.data,
  detail: { from_epoch: before.data.epoch, to_epoch: after.data.epoch }
});
```

#### 4. kuawase-sync-event

**実装例**:
```typescript
await db.from('event_log').insert({
  event_type: `KUAWASE_SYNC_${event_type}`,
  tournament_id,
  admin_id: `kuawase-token:${token.slice(0, 12)}`,  // トークンハッシュ
  admin_ip: req.headers.get('x-forwarded-for') || 'unknown',
  detail: {
    token_hash: token.slice(0, 12) + '***',
    payload,
    received_at: new Date().toISOString()
  }
  // old_state / new_state は不要（kuawaseは内部操作）
});
```

#### 5. judge-submit-with-token（E1/E2）

**実装例**:
```typescript
// E1: 新規提出
if (!existing) {
  await db.from('event_log').insert({
    event_type: 'E1_FIRST_SUBMISSION',
    tournament_id,
    admin_id: `judge:${judge_id}`,  // 審査員ID
    admin_ip: req.headers.get('x-forwarded-for') || 'unknown',
    detail: {
      judge_id,
      match_id,
      epoch,
      revision: 1,
      scores: { work: ..., app: ... }
    }
  });
}

// E2: 修正提出
if (existing) {
  await db.from('event_log').insert({
    event_type: 'E2_REVISION_SUBMISSION',
    tournament_id,
    admin_id: `judge:${judge_id}`,
    admin_ip: req.headers.get('x-forwarded-for') || 'unknown',
    detail: {
      judge_id,
      match_id,
      epoch,
      revision: existing.revision + 1,
      old_scores: { work: existing.work, app: existing.app },
      new_scores: { work: ..., app: ... }
    }
  });
}
```

---

## ヘルパー関数

### extractAdminId（admin_idの抽出）

```typescript
function extractAdminId(req: Request): string {
  // 方法1: ABACスキーマで管理者ユーザーを識別
  const adminUser = req.headers.get('x-admin-user');
  if (adminUser) return `admin:${adminUser}`;

  // 方法2: token hashから識別
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (token) return `token:${token.slice(0, 12)}`;

  // 方法3: デフォルト
  return 'admin-console-anonymous';
}
```

---

## ログクエリ例

### 大会内のすべての操作を日付順に

```sql
SELECT event_type, admin_id, created_at, detail
FROM event_log
WHERE tournament_id = 'khb26-uuid'
ORDER BY created_at DESC
LIMIT 100;
```

### 特定の管理者の操作履歴

```sql
SELECT event_type, venue_id, old_state, new_state, created_at
FROM event_log
WHERE admin_id = 'admin:user123'
  AND event_type LIKE 'ADMIN_%'
ORDER BY created_at DESC;
```

### state の変更履歴

```sql
SELECT 
  created_at,
  old_state->>'epoch' as before_epoch,
  new_state->>'epoch' as after_epoch,
  old_state->>'accepting' as before_accepting,
  new_state->>'accepting' as after_accepting
FROM event_log
WHERE event_type IN ('ADMIN_PATCH_STATE', 'E5_CONFIRM', 'E6_PROCEED', 'KUAWASE_SYNC_BOUT_CHANGED')
  AND tournament_id = 'khb26-uuid'
ORDER BY created_at DESC;
```

### kuawase連携のすべてのイベント

```sql
SELECT event_type, detail, created_at
FROM event_log
WHERE event_type LIKE 'KUAWASE_SYNC_%'
  AND tournament_id = 'khb26-uuid'
ORDER BY created_at DESC;
```

---

## 段階実装

### Phase 1: スキーマ拡張（1日）
- [ ] event_log にカラム追加
- [ ] インデックス作成
- [ ] 既存レコードのNULL埋め

### Phase 2: Edge Functions 修正（3日）
- [ ] admin-patch-state にlogic追加
- [ ] admin-e5-confirm にlogic追加
- [ ] admin-e6-proceed にlogic追加
- [ ] kuawase-sync-event にlogic追加
- [ ] judge-submit-with-token にlogic追加

### Phase 3: テスト・検証（2日）
- [ ] ログ出力の正確性確認
- [ ] クエリパフォーマンス確認
- [ ] 監査ツール的ユーティリティ開発

---

## 監査ポイント

✅ **記録すべき操作**:
- 管理者による state 変更（E5, E6, 手動epoch設定）
- kuawase連携イベント
- 審査員の採点提出（E1/E2）
- E3自動検知

✅ **記録不要（ポーリング）**:
- judge-info の呼び出し（過度）
- state-check（kuawase）の呼び出し（5秒ごと、過度）

---

## 今後の拡張

- **ユーザー管理**: 実ユーザーIDへの移行（認証基盤構築時）
- **事後監査UI**: ログビューア・検索インターフェース
- **アラート**: 異常操作の検知・通知
- **バックアップ**: event_log の定期エクスポート

---

## 次ステップ

- Phase 1（スキーマ拡張） 実行
- 各API実装を順次修正


