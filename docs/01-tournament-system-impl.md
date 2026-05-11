# 実装計画：大会概念導入（2026-05-11）

## 概要

OES にグローバルな「大会」エンティティを導入し、複数大会の並立運用と大会単位のトークン管理を実現します。

## 要件確定

- **大会ID**: ユーザー入力、半角英数字4文字以上
- **トークンprefix**: 大会ID + ランダムhex
- **会場関係**: 大会1:会場多（最大10会場同時）
- **UIフロー**: 大会 → 会場 → 試合
- **エクスポート**: 大会/会場/試合単位で可能

---

## DB マイグレーション（Phase 1）

### 1. tournaments テーブル（新規）

```sql
CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,              -- 4文字以上の半角英数字（例: khb26）
  name text NOT NULL,                      -- 大会名（例: 2026関西俳句甲子園本大会）
  status text NOT NULL DEFAULT 'draft',    -- draft / active / closed
  token_prefix text NOT NULL,              -- トークン接頭辞（大会ID＋ランダム）
  metadata jsonb DEFAULT '{}',             -- 将来の拡張用（kuawase連携情報など）
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT code_length CHECK (length(code) >= 4),
  CONSTRAINT code_alphanum CHECK (code ~ '^[a-z0-9]+$'),
  CONSTRAINT status_check CHECK (status IN ('draft', 'active', 'closed'))
);

CREATE INDEX idx_tournaments_code ON tournaments(code);
CREATE INDEX idx_tournaments_status ON tournaments(status);
```

### 2. matches テーブル（変更）

```sql
ALTER TABLE matches ADD COLUMN tournament_id uuid REFERENCES tournaments(id) ON DELETE RESTRICT;
-- 既存レコード向けの一時値設定（migration スクリプトで埋める）
-- ALTER TABLE matches ALTER COLUMN tournament_id SET NOT NULL;  -- 移行後に実行

CREATE INDEX idx_matches_tournament ON matches(tournament_id);
```

### 3. state テーブル（変更）

```sql
ALTER TABLE state ADD COLUMN tournament_id uuid REFERENCES tournaments(id) ON DELETE RESTRICT;
CREATE INDEX idx_state_tournament ON state(tournament_id);
```

### 4. access_tokens テーブル（変更）

```sql
ALTER TABLE access_tokens ADD COLUMN tournament_id uuid REFERENCES tournaments(id) ON DELETE RESTRICT;
-- 既存トークン（大会未指定）は互換期間中も許容、新規発行は tournament_id 必須
CREATE INDEX idx_access_tokens_tournament ON access_tokens(tournament_id);
```

### 5. event_log テーブル（変更）

```sql
ALTER TABLE event_log
  ADD COLUMN tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  ADD COLUMN admin_id text,                 -- 操作者
  ADD COLUMN admin_ip text,                 -- IPアドレス
  ADD COLUMN old_state jsonb,               -- state 変更前
  ADD COLUMN new_state jsonb;               -- state 変更後

CREATE INDEX idx_event_log_tournament ON event_log(tournament_id);
CREATE INDEX idx_event_log_admin_id ON event_log(admin_id);
CREATE INDEX idx_event_log_event_type ON event_log(event_type, created_at);
```

---

## API 拡張（Phase 2）

### 既存エンドポイント修正

#### admin-patch-state

**リクエスト**: `tournament_id` を追加（必須）

```typescript
const body = req.json();
const { admin_secret, venue_id, tournament_id, ...statepatch } = body;

// tournament_id 検証
if (!tournament_id) {
  return error('Missing tournament_id', 400);
}

// 大会存在確認
const tournament = await db.from('tournaments')
  .select('id, status').eq('id', tournament_id).single();

if (tournament.data.status === 'closed') {
  return error('Tournament is closed', 409);
}

// state 更新時に tournament_id をセット
```

#### judge-info

**フィルタ追加**: `tournament_id` で大会に属さない試合を除外

```typescript
const candidate = await db
  .from('matches')
  .select('...')
  .eq('tournament_id', tournament_id)  // ← 追加
  .order('timeline', { ascending: true })
  ...
```

#### admin-e5-confirm

**リクエスト**: `tournament_id` を必須に

```typescript
const isLastEpoch = epoch === num_bouts;

// match_complete フラグは isLastEpoch で判定
const shouldMarkComplete = isLastEpoch;

await db.from('state').update({
  accepting: false,
  match_complete: shouldMarkComplete
}).eq('venue_id', venue_id);
```

---

## UI 追加（Phase 2）

### 管理画面（admin.html / admin.js）

#### 大会選択ドロップダウン

```html
<div class="card">
  <h2>大会選択</h2>
  <select id="tournamentSelect" onchange="handleTournamentChange(event)">
    <option value="">選択してください...</option>
  </select>
  <button id="btnCreateTournament" class="btn-blue">新規大会を作成</button>
</div>
```

**JavaScript**: 
- `currentTournamentId` をセッションストレージで保持
- トーナメント選択時にページリロード
- 全ての `patch` 呼び出しに `tournament_id` を追加

```javascript
let currentTournamentId = sessionStorage.getItem('currentTournamentId');

async function loadTournaments() {
  const resp = await fetch('/tournaments');
  const tournaments = await resp.json();
  // populate dropdown...
}

function handleTournamentChange(e) {
  sessionStorage.setItem('currentTournamentId', e.target.value);
  location.reload();
}

async function adminPatchState(patch) {
  return fetch('/admin-patch-state', {
    body: JSON.stringify({
      admin_secret: ADMIN_SECRET,
      venue_id: currentVenueId,
      tournament_id: currentTournamentId,  // ← 必須追加
      ...patch
    })
  });
}
```

---

## 段階実装

### Phase 1: DB基盤（1週間）
- [ ] tournaments テーブル新設
- [ ] matches, state, access_tokens, event_log に tournament_id 追加
- [ ] インデックス作成
- [ ] 既存データの互換性確認

### Phase 2: API + UI（2週間）
- [ ] 既存エンドポイント拡張（tournament_id対応）
- [ ] 管理画面に大会選択UI追加
- [ ] 全API呼び出しにtournament_idを付与
- [ ] E5確定時のmatch_complete フラグ動作確認

### Phase 3: エクスポート（後追い）
- [ ] 大会/会場/試合単位のJSONエクスポート
- [ ] CSV出力オプション

---

## 監査ログ

全ての大会操作は event_log に記録：

```json
{
  "event_type": "ADMIN_PATCH_STATE",
  "tournament_id": "khb26",
  "admin_id": "admin-console",
  "admin_ip": "192.168.1.1",
  "old_state": { "epoch": 1, "accepting": true },
  "new_state": { "epoch": 1, "accepting": false },
  "detail": { "epoch": 1 }
}
```

---

## 次ステップ

- Phase 1 のDDL作成＆実行テスト
- 既存データの互換性マイグレーション設計


