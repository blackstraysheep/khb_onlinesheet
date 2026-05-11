# 監査ログ要件ガイド（2026-05-10）

## 監査ログとは

「誰が、何を、いつ、どう変えた」を記録し、後から「このデータはなぜこうなったのか」を追跡可能にするもの。

法令要件（例: 個人情報保護法、監査法人向け）や、内部統制（事故発生時の原因究明）で必要。

---

## 一般的な監査ログ要件

### 1. 最低限要素（What to log）

- **操作者情報**: 誰が操作したか（ユーザーID、IP、ユーザー名）
- **操作内容**: 何を操作したか（テーブル、レコードID、操作種別）
- **変更前後**: 何がどう変わったか（old_value → new_value）
- **タイムスタンプ**: いつ操作したか
- **結果**: 成功したか、失敗したか
- **操作元**: 人間か、API か、外部システムか

### 2. 適用対象（What tables to audit）

通常は「状態が変わるもの」と「重要な操作実行」:

- ❌ SELECT（読み出しのみ）
- ✅ INSERT/UPDATE/DELETE（データ変更）
- ✅ 重要な操作（E5確定、トークン発行、大会開始）

### 3. 保持期間

- 法令要件があれば従う
- なければ「トラブル追跡に必要な期間」＋「定期バックアップ」

---

## 現在のOESの状況

### 既存の `event_log` テーブル

```sql
CREATE TABLE event_log (
  id bigint PRIMARY KEY,
  event_type text NOT NULL,
  match_id uuid nullable,
  judge_id uuid nullable,
  epoch integer nullable,
  detail jsonb nullable,
  created_at timestamptz DEFAULT now()
);
```

**現状:**
- ✅ タイムスタンプ記録あり
- ✅ イベント種別（E1, E2, E3, E5, E6）記録
- ❌ **操作者（ユーザー/管理者ID）記録なし**
- ❌ **前後データ記録なし**

### 現在記録されるイベント例

```json
// E1: 審査員初回提出
{ "event_type": "E1", "match_id": "uuid1", "judge_id": "uuid2", "epoch": 1 }

// E5: 確定操作
{ "event_type": "E5", "match_id": "uuid1", "epoch": 2, "detail": { "winner": "red" } }
```

**問題点:**
- 「誰の指示でE5が実行されたのか」が不明
- 「前のepochはいくつだったのか」が不明
- 審査員提出時のIP/ブラウザ情報がない

---

## OESに推奨される監査ログ要件

### パターン1: 軽量版（推奨初期）

「操作者の記録だけ追加」

```javascript
event_log の detail フィールドに操作者情報を追加:

{
  "event_type": "E5",
  "match_id": "abc123",
  "epoch": 2,
  "detail": {
    "winner": "red",
    "admin_secret_hash": "xxxx",  // シークレット検証に使ったユーザーの識別
    "admin_ip": "192.168.x.x",     // (オプション) 管理者のIP
    "triggered_at": "2026-05-10T14:30:00Z"
  }
}
```

**メリット:**
- 既存テーブルの変更なし（detail JSONに追加するだけ）
- 実装簡単
- 「どの管理タスクがいつ実行されたか」は追跡可能

**デメリット:**
- 「状態変更前後」の記録はない
- 「管理者を特定」はできない（シークレットハッシュだけ）

---

### パターン2: 標準版（推奨中期→最終目標に変更）

「操作者 + 状態変更」を記録

テーブル拡張:

```sql
ALTER TABLE event_log ADD COLUMN admin_id text;  -- 管理者を識別するキー
ALTER TABLE event_log ADD COLUMN admin_ip text;   -- 接続元IP
ALTER TABLE event_log ADD COLUMN old_state jsonb; -- 変更前状態
ALTER TABLE event_log ADD COLUMN new_state jsonb; -- 変更後状態
```

使用例:

```json
{
  "event_type": "E5",
  "match_id": "abc123",
  "tournament_id": "khb26",
  "admin_id": "admin:khb26123",  // 大会コード+何か
  "admin_ip": "203.0.113.50",
  "old_state": {
    "epoch": 2,
    "accepting": true,
    "e3_reached": true
  },
  "new_state": {
    "epoch": 2,
    "accepting": false,
    "e3_reached": true
  },
  "detail": {
    "winner": "red",
    "snapshot_id": 1234
  },
  "created_at": "2026-05-10T14:30:00Z"
}
```

**メリット:**
- 「何が変わったのか」が明確に追跡可能
- 誰が操作したかが記録されている
- 誤操作の原因究明が容易
- 監査要件を満たしやすい
- kuawase連携でも同期イベント+承認履歴を完全記録

**デメリット:**
- テーブル拡張が必要
- ログサイズが増える

**決定: ユーザー指示により「標準版」を最終目標とする（2026-05-10）**

---

### パターン3: 厳密版（推奨本番・必要時）

「誰が、何を、いつ、どう、なぜ」を完全記録

追加:

```sql
ALTER TABLE event_log ADD COLUMN reason text;  -- 操作理由（なぜ）
```

Edge Function での記録:

```typescript
await db.from('event_log').insert({
  event_type: 'E5_MANUAL',
  match_id,
  admin_id,
  admin_ip,
  reason: req.body.reason || '（理由記載なし）',  // UI で入力させる場合
  old_state: { ... },
  new_state: { ... },
  created_at: new Date().toISOString()
});
```

**メリット:**
- 完全な意思決定基準の記録
- コンプライアンス完全対応

**デメリット:**
- オペレータが理由を入力する手間
- ログレコードが長くなる

---

## OESに「誰が」の記録が必要か

### 現状での実装

```typescript
// supabase/functions/control_confirm_with_secret/index.ts
const adminSecret = body.admin_secret;
if (adminSecret !== ADMIN_SETUP_SECRET) {
  return { error: 'Unauthorized' };
}
```

- ✅ シークレット検証で「認可された操作」と「未認可操作」を区別
- ❌ 「どの個人が実行したのか」は不明（シークレットは複数人で共有）

### 推奨の段階化

**初期（今）**: パターン1軽量版
- `detail.admin_secret_hash` でシークレット検証状況だけ記録
- 複数人で共有している場合は「あくまでシークレット検証」と解釈

**中期（本番安定後）**: パターン2標準版
- 管理画面で「管理者ログイン」概念を導入（簡易でOK）
- `admin_id`（例: `admin:khb26-user01`）を出力
- 不必須なら UI で入力させず、`session_id` でもOK

**本番（監査要件が出たら）**: パターン3厳密版
- 完全なユーザー認証
- 操作理由の記録

---

## kuawase 連携での監査ログ

方式C（半自動＋承認付き）の場合:

```json
// イベント1: kuawase から提案受信
{
  "event_type": "KUAWASE_SYNC",
  "detail": {
    "sync_type": "received",
    "kuawase_event": "BOUT_CHANGED",
    "proposed_state": { "epoch": 3 },
    "status": "pending"
  }
}

// イベント2: 管理者が承認・実行
{
  "event_type": "E6",  // または KUAWASE_SYNC_APPLIED
  "detail": {
    "sync_type": "applied",
    "triggered_by": "kuawase_proposal",
    "admin_id": "admin:user01",
    "admin_ip": "203.0.113.50"
  },
  "old_state": { "epoch": 2 },
  "new_state": { "epoch": 3 }
}

// イベント3: 管理者がスキップ
{
  "event_type": "KUAWASE_SYNC",
  "detail": {
    "sync_type": "skipped",
    "reason": "Manual override",
    "admin_id": "admin:user01"
  }
}
```

---

## 実装ロードマップ案

### Phase 1（即座: 今月）
- ✅ 既存 `detail` JSON に操作系情報を追加（シークレットハッシュ、IP）
- ✅ kuawase_sync_proposals テーブル新設（提案ログ）
- ✅ 提案受信・スキップ・実行時のイベント記録

### Phase 2（短期：次月）
- `event_log` に `admin_id`, `admin_ip` カラム追加
- 標準版へ移行

### Phase 3（中期：確認後）
- 必要なら `reason` カラム追加
- 厳密版へ

---

## OESでの現実的な推奨

大会ルールと運用リスク考慮で：

**最初に導入すべき:**
1. ✅ 既存event_logの detail に操作者情報を追加（シークレットハッシュ）
2. ✅ kuawase連携ログ（提案受信/実行/スキップ）を detail 記録
3. ✅ E1-E6や重要操作前のstate snapshot を JSON で保存

**中期で検討:**
1. 管理画面にログ ビューアー機能を追加
2. 必要なら admin_id による個人識別追加

**本番要件が来たら:**
1. 完全な監査ログスキーマに移行
2. ユーザー認証統合

