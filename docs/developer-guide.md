# KHB オンライン採点シート — 開発者ガイド

## 1. アーキテクチャ概要

```
┌─────────────┐   ┌──────────────────┐   ┌───────────────────┐
│ 静的 HTML/JS │──→│ Supabase REST API │──→│ PostgreSQL (RLS)  │
│ (ブラウザ)   │   │ (読み取り専用)    │   │                   │
└─────────────┘   └──────────────────┘   └───────────────────┘
       │                                          ↑
       ↓                                          │
┌─────────────────────┐                           │
│ Supabase Edge Func. │───────────────────────────┘
│ (Deno / service_role)│
└─────────────────────┘
```

- **フロントエンド**: 静的 HTML＋バニラ JS（フレームワークなし）
- **バックエンド**: Supabase Edge Functions（Deno / TypeScript）
- **データベース**: PostgreSQL（Supabase ホスティング）
- **認証モデル**: anon は SELECT のみ。書き込みは全て Edge Functions（`service_role`）経由
- **管理者認証**: 環境変数 `ADMIN_SETUP_SECRET` との文字列一致
- **審査員認証**: `access_tokens` テーブルでトークン照合

---

## 2. データベーススキーマ

### 2.1 テーブル一覧

| テーブル | 概要 | 主キー |
|----------|------|--------|
| `venues` | 会場マスタ | `id` (uuid) |
| `judges` | 審査員マスタ | `id` (uuid) |
| `matches` | 試合マスタ | `id` (uuid) |
| `state` | 会場ごとの進行状態（1行/会場） | `id` (integer) |
| `expected_judges` | 試合×審査員の割り当て | (`match_id`, `judge_id`) 複合 |
| `submissions` | 審査員の採点データ | `id` (uuid) |
| `match_snapshots` | 対戦確定時のスナップショット | `id` (bigint) |
| `access_tokens` | 審査員トークン | `token` (text) |
| `event_log` | イベント監査ログ | `id` (bigint) |

### 2.2 venues

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` |
| `code` | text | NOT NULL, UNIQUE |
| `name` | text | NOT NULL |
| `created_at` | timestamptz | DEFAULT `now()` |

初期データ: `('default', 'メイン会場')`

### 2.3 judges

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` |
| `name` | text | NOT NULL |
| `created_at` | timestamptz | DEFAULT `now()` |
| `voice_key` | text | UNIQUE, nullable |

### 2.4 matches

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` |
| `code` | text | UNIQUE, nullable |
| `name` | text | nullable |
| `created_at` | timestamptz | DEFAULT `now()` |
| `red_team_name` | text | nullable |
| `white_team_name` | text | nullable |
| `num_bouts` | integer | nullable |
| `timeline` | real | NOT NULL, DEFAULT `1` |
| `venue_id` | uuid | NOT NULL, FK → `venues(id)` |

### 2.5 state（会場ごとシングルトン）

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | integer | PK, DEFAULT `1` |
| `epoch` | integer | NOT NULL, DEFAULT `1` |
| `accepting` | boolean | NOT NULL, DEFAULT `false` |
| `e3_reached` | boolean | NOT NULL, DEFAULT `false` |
| `updated_at` | timestamptz | DEFAULT `now()` |
| `current_match_id` | uuid | FK → `matches(id)`, nullable |
| `scoreboard_visible` | boolean | DEFAULT `false` |
| `red_wins` | integer | NOT NULL, DEFAULT `0` |
| `white_wins` | integer | NOT NULL, DEFAULT `0` |
| `wins_updated_at` | timestamptz | NOT NULL, DEFAULT `now()` |
| `venue_id` | uuid | NOT NULL, UNIQUE, FK → `venues(id)` |

`venue_id` の UNIQUE 制約により、1 会場につき state は 1 行。

### 2.6 expected_judges

| カラム | 型 | 制約 |
|--------|------|------|
| `match_id` | uuid | PK (複合), FK → `matches(id)` ON DELETE CASCADE |
| `judge_id` | uuid | PK (複合), FK → `judges(id)` ON DELETE CASCADE |
| `sort_order` | integer | DEFAULT `0` |

### 2.7 submissions

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | uuid | PK, DEFAULT `gen_random_uuid()` |
| `match_id` | uuid | NOT NULL, FK → `matches(id)` ON DELETE CASCADE |
| `judge_id` | uuid | NOT NULL, FK → `judges(id)` |
| `epoch` | integer | NOT NULL |
| `revision` | integer | NOT NULL, DEFAULT `1` |
| `red_work` | integer | NOT NULL |
| `red_app` | integer | NOT NULL |
| `red_total` | integer | NOT NULL |
| `red_flag` | boolean | NOT NULL |
| `white_work` | integer | NOT NULL |
| `white_app` | integer | NOT NULL |
| `white_total` | integer | NOT NULL |
| `white_flag` | boolean | NOT NULL |
| `created_at` | timestamptz | DEFAULT `now()` |
| `updated_at` | timestamptz | DEFAULT `now()` |

**ユニーク制約**: `submissions_match_judge_epoch_idx` ON `(match_id, judge_id, epoch)` — 1審査員 × 1試合 × 1epoch に 1 行。UPDATE（revision++）で上書き。

### 2.8 match_snapshots

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | bigint | PK, シーケンス |
| `match_id` | uuid | NOT NULL, FK → `matches(id)` ON DELETE CASCADE |
| `epoch` | integer | NOT NULL |
| `snapshot` | jsonb | NOT NULL |
| `created_at` | timestamptz | NOT NULL, DEFAULT `now()` |
| `github_path` | text | nullable |
| `github_pushed_at` | timestamptz | nullable |
| `winner` | text | CHECK (`'red'` or `'white'`), nullable |

**ユニーク制約**: `match_snapshots_match_epoch_unique` ON `(match_id, epoch)`

**snapshot JSON 構造** (spec_version `v3.0`):
```json
{
  "spec_version": "v3.0",
  "venue": {
    "id": "uuid",
    "code": "A"
  },
  "match": {
    "id": "uuid",
    "code": "A-1",
    "name": "予選A 1試合目"
  },
  "teams": {
    "red": "紅チーム名",
    "white": "白チーム名"
  },
  "epoch": 1,
  "bout": { "slot": 1, "label": "先鋒戦" },
  "haiku": {
    "red": null,
    "white": null
  },
  "saved_at": "ISO 8601",
  "items": [
    {
      "judge_id": "uuid",
      "judge_name": "string",
      "sort_order": 0,
      "revision": 1,
      "red": { "work_point": 7, "app_point": 1, "total": 8, "flag": true },
      "white": { "work_point": 6, "app_point": 0, "total": 6, "flag": false }
    }
  ]
}
```

- `venue`: 会場情報（id, code）
- `teams`: 紅白チーム名（`{ red, white }` 構造）
- `haiku`: 句情報プレースホルダ（将来のソフトウェア連携用、現在は `null`）
- `items[]`: `sort_order` 昇順でソート済み。`revision` は提出修正回数
- 旧バージョン (`v2.8-bout`) にあった items 内の `match_id`, `match_code`, `match_name`, `epoch` の重複は廃止

### 2.9 access_tokens

| カラム | 型 | 制約 |
|--------|------|------|
| `token` | text | PK |
| `judge_id` | uuid | NOT NULL, FK → `judges(id)` ON DELETE CASCADE |
| `role` | text | NOT NULL, DEFAULT `'judge'` |
| `created_at` | timestamptz | DEFAULT `now()` |
| `venue_id` | uuid | FK → `venues(id)`, nullable |

トークン形式: `khb-` + 16 バイトの暗号論的乱数 hex 文字列。

### 2.10 event_log

| カラム | 型 | 制約 |
|--------|------|------|
| `id` | bigint | PK, シーケンス |
| `event_type` | text | NOT NULL |
| `match_id` | uuid | nullable |
| `judge_id` | uuid | nullable |
| `epoch` | integer | nullable |
| `detail` | jsonb | nullable |
| `created_at` | timestamptz | DEFAULT `now()` |

`event_type` の値: `E1`, `E2`, `E3`, `E5`, `E6`, `SET_MATCH`

### 2.11 外部キー一覧

| ソース | カラム | 参照先 | ON DELETE |
|--------|--------|--------|-----------|
| `access_tokens.judge_id` | → | `judges(id)` | CASCADE |
| `access_tokens.venue_id` | → | `venues(id)` | — |
| `expected_judges.match_id` | → | `matches(id)` | CASCADE |
| `expected_judges.judge_id` | → | `judges(id)` | CASCADE |
| `match_snapshots.match_id` | → | `matches(id)` | CASCADE |
| `state.current_match_id` | → | `matches(id)` | — |
| `state.venue_id` | → | `venues(id)` | — |
| `submissions.match_id` | → | `matches(id)` | CASCADE |
| `submissions.judge_id` | → | `judges(id)` | — |
| `matches.venue_id` | → | `venues(id)` | — |

---

## 3. RLS ポリシー

全テーブルで RLS が有効。`service_role`（Edge Functions）は RLS バイパス。

| テーブル | ポリシー | 操作 | ロール | ルール |
|----------|----------|------|--------|--------|
| `submissions` | `submissions_select` | SELECT | anon, authenticated | `USING (true)` |
| `match_snapshots` | `match_snapshots_select` | SELECT | anon, authenticated | `USING (true)` |
| `state` | `state_select` | SELECT | anon, authenticated | `USING (true)` |
| `matches` | `matches_select` | SELECT | anon, authenticated | `USING (true)` |
| `judges` | `judges_select` | SELECT | anon, authenticated | `USING (true)` |
| `expected_judges` | `expected_judges_select` | SELECT | anon, authenticated | `USING (true)` |
| `venues` | `venues_select` | SELECT | anon, authenticated | `USING (true)` |
| `access_tokens` | `anon_select_access_tokens` | SELECT | anon | `USING (true)` |

**書き込みなし**: anon/authenticated からの INSERT/UPDATE/DELETE はすべて拒否（Edge Functions の `service_role` のみ）。  
**event_log**: anon/authenticated からの全操作を拒否。

---

## 4. Edge Functions API リファレンス

全関数共通仕様:
- **HTTP メソッド**: POST のみ（他は 405）
- **CORS**: `Access-Control-Allow-Origin: *`、OPTIONS で preflight 対応
- **DB 接続**: `service_role` キーで Supabase クライアント作成（RLS バイパス）
- **認証**: リクエストボディの `admin_secret` を環境変数 `ADMIN_SETUP_SECRET` と照合

### 4.1 admin-setup-match

**目的**: 試合・審査員・トークンの一括セットアップ

```
POST /functions/v1/admin-setup-match

Body:
{
  "admin_secret": "string",
  "venue_code": "string (default: 'default')",
  "match_code": "string (必須)",
  "match_name": "string (必須)",
  "timeline": number (必須),
  "num_bouts": number (default: 5),
  "red_team_name": "string?",
  "white_team_name": "string?",
  "judges": [{ "name": "string" }],
  "token_prefix": "string (default: 'khb-')"
}
```

**処理フロー**:
1. `venues` → `venue_code` で `venue_id` 解決（404 if not found）
2. `matches` を `code` で検索 → 存在すれば UPDATE、なければ INSERT（`venue_id` 付き）
3. 各審査員:
   - `judges` を `name` で検索 → なければ INSERT
   - `expected_judges` を DELETE → INSERT（`sort_order` 付き）
   - `access_tokens` → 既存あれば再利用、なければ `crypto.getRandomValues(16)` で生成

**レスポンス (200)**:
```json
{
  "ok": true,
  "match": { "id", "code", "name", "timeline", "num_bouts" },
  "judge_tokens": [{ "judge_id", "judge_name", "token", "role" }]
}
```

### 4.2 admin-add-judge

**目的**: 審査員追加（＋トークン自動生成）

```
POST /functions/v1/admin-add-judge

Body:
{
  "admin_secret": "string",
  "name": "string (必須)",
  "voice_key": "string?",
  "token_prefix": "string (default: 'khb-')"
}
```

**処理**: `judges` を name で upsert → `access_tokens` を検索/生成

**レスポンス**: `{ ok, judge_id, judge_name, token }`

### 4.3 admin-patch-state

**目的**: state の部分更新

```
POST /functions/v1/admin-patch-state

Body:
{
  "admin_secret": "string",
  "venue_code": "string (default: 'default')",
  "patch": {
    "accepting": boolean?,
    "scoreboard_visible": boolean?,
    "epoch": integer? (>= 1)
  }
}
```

**処理**: `patch` からホワイトリストフィールドのみ抽出 → `state` を `venue_id` で UPDATE

**レスポンス**: `{ ok, venue_code, state: { accepting, scoreboard_visible, epoch, venue_id } }`

### 4.4 admin-set-match-judges

**目的**: 試合の審査員割り当て（並び順含む）

```
POST /functions/v1/admin-set-match-judges

Body:
{
  "admin_secret": "string",
  "venue_code": "string (default: 'default')",
  "match_code": "string (必須)",
  "match_name": "string?",
  "red_team_name": "string?",
  "white_team_name": "string?",
  "num_bouts": number?,
  "judge_ids": ["uuid", ...] (必須, min 1, 順序=sort_order)
}
```

**処理**:
1. `venues` → `venue_id` 解決
2. `matches` を `code` で upsert（`venue_id` 設定）
3. `expected_judges` を `match_id` で全削除 → `judge_ids` を `sort_order` 付きで再 INSERT

**レスポンス**: `{ ok, match: { id, code }, judge_count, venue_code }`

### 4.5 control_set_current_match_with_secret (SET_MATCH)

**目的**: 現在の試合を設定

```
POST /functions/v1/control_set_current_match_with_secret

Body:
{
  "admin_secret": "string",
  "venue_code": "string (default: 'default')",
  "match_code": "string (必須)",
  "epoch": number (default: 1)
}
```

**処理**:
1. `venues` → `venue_id`、`matches` → `match_id` 解決
2. **会場チェック**: `matchRow.venue_id !== venueId` → **403 エラー**（「この試合は別の会場に所属」）
3. **勝数復元**: `match_snapshots` から `match_id` の `winner` を集計 → `red_wins`, `white_wins`
4. **E3 再判定**: `expected_judges` と `submissions` を比較し、当該 epoch で全審査員提出済みなら `e3_reached=true`、そうでなければ `false`
5. `state` を UPDATE: `current_match_id`, `epoch`, `accepting=true`, `e3_reached`（再判定結果）, `red_wins`, `white_wins`
6. `event_log` に `SET_MATCH` 記録

**レスポンス**: `{ ok, match: { id, code, name }, epoch, accepting: true }`

### 4.6 control_confirm_with_secret (E5)

**目的**: 対戦を確定（スナップショット保存＋勝敗決定）

```
POST /functions/v1/control_confirm_with_secret

Body:
{
  "admin_secret": "string",
  "venue_code": "string (default: 'default')",
  "match_code": "string (必須)"
}
```

**処理**:
1. `venues` → `venue_id`、`matches` → `match_id`・`num_bouts` 解決
2. `state` から `epoch` 取得
3. `slot = getSlot(epoch, num_bouts)`、`slot_label = getBoutLabel(epoch, num_bouts)` を計算（DB 参照なし）
4. `expected_judges` → 全期待審査員 ID + `sort_order`
5. `submissions` → `match_id` + `epoch` の提出データ取得（**全員未提出なら 400**）
6. スナップショット JSON を構築（`spec_version: "v3.0"`、`sort_order` 昇順ソート）
7. **Winner 判定**: `decideWinnerFromSnapshotItems()` で旗数カウント → `"red"` / `"white"` / `"draw"`
8. `match_snapshots` に UPSERT（`onConflict: "match_id,epoch"`）
9. **累計勝数再集計**: `match_snapshots` WHERE `match_id` の全 `winner` を COUNT
10. `state` UPDATE: `accepting=false`, `red_wins`, `white_wins`, `wins_updated_at`
11. `event_log` に `E5` 記録

**Winner 判定アルゴリズム**:
```typescript
function decideWinnerFromSnapshotItems(items): "red" | "white" | "draw" {
  let redFlags = 0, whiteFlags = 0;
  for (const item of items) {
    if (item.red.flag) redFlags++;
    if (item.white.flag) whiteFlags++;
  }
  if (redFlags > whiteFlags) return "red";
  if (whiteFlags > redFlags) return "white";
  return "draw";
}
```

**レスポンス**:
```json
{
  "ok": true, "event_type": "E5",
  "match_id", "epoch", "snapshot_count",
  "slot", "slot_label", "winner",
  "red_wins", "white_wins"
}
```

### 4.7 control_advance_with_secret (E6)

**目的**: 次の対戦へ進行

```
POST /functions/v1/control_advance_with_secret

Body:
{
  "admin_secret": "string",
  "venue_code": "string (default: 'default')"
}
```

**処理**:
1. `state` 取得
2. `epoch` +1、`accepting=true`、`e3_reached=false` に UPDATE
3. `event_log` に `E6` 記録

**レスポンス**: `{ ok, event_type: "E6", venue_code, from_epoch, to_epoch }`

### 4.8 judge-submit-with-token

**目的**: 審査員の採点情報取得＋採点提出

```
POST /functions/v1/judge-submit-with-token

Body:
{
  "token": "string (必須)",
  "mode": "info" | undefined,
  "payload": {
    "red": { "work": N, "app": N, "total": N, "flag": boolean },
    "white": { "work": N, "app": N, "total": N, "flag": boolean }
  }
}
```

#### 候補試合選択アルゴリズム（タイムライン方式）

```
1. access_tokens → judge_id を取得
2. state の全行取得（accepting 問わず）
3. 各行の current_match_id について:
   - expected_judges に自分の judge_id があるか確認
4. match_snapshots で確定済み最大 epoch を取得
5. maxConfirmed >= num_bouts → isComplete=true（除外せず保持）
6. 候補を優先度付きソート:
   priority 0 = accepting=true  かつ 未完了   （アクティブ受付中）
   priority 1 = accepting=false かつ 未完了   （受付停止中）
   priority 2 =                      完了済み （試合終了・講評中）
   同優先度内: timeline 昇順 → match.code 辞書順
7. 先頭を選択
```

#### info モード

試合情報と既存提出データを返す。候補なしの場合は `{ waiting: true }` を返す。

**レスポンス**:
```json
{
  "ok": true, "mode": "info",
  "match": { "id", "code", "name", "red_team_name", "white_team_name", "num_bouts" },
  "epoch": 1, "accepting": true,
  "match_complete": false,
  "judge_id", "judge_name",
  "bout": { "slot": 1, "label": "先鋒戦" },
  "submission": { "red": {...}, "white": {...}, "revision": 1 } | null
}
```

- `match_complete: true` の場合: 全対戦スナップショットが保存済み（試合終了・講評中）
- 候補なし（全試合完了 or 割り当てなし）の場合: `{ waiting: true }`

#### 提出モード

**バリデーション**:
- `work`, `app`, `total`: 0–100 の有限数値
- `flag`: boolean
- `total === work + app`

**処理**:
1. `accepting=false` または `match_complete=true` → **409**
2. `submissions` を `(match_id, judge_id, epoch)` で検索:
   - なし → INSERT（**E1**）
   - あり → `revision+1` で UPDATE（**E2**）
3. `event_log` に E1/E2 記録
4. **E3 自動検知**:
   - `expected_judges` の全審査員 ID を取得
   - `submissions` で `match_id` + `epoch` の提出済み judge_id を取得
   - 全員提出済み → `state.e3_reached = true`、`event_log` に E3 記録

**レスポンス**: `{ ok, event_type, revision, match, epoch, bout }`

---

## 5. イベントライフサイクル（E1〜E6）

```
SET_MATCH: 試合開始 (epoch=1, accepting=true)
  │
  ├──→ [対戦 1 (epoch=1)]
  │      E1: 審査員が初回提出
  │      E2: 審査員が修正提出（0回以上）
  │      E3: 全審査員提出完了（自動検知）
  │      E5: 管理者が確定 → snapshot保存, winner判定, accepting=false
  │      E6: 管理者が次対戦へ → epoch=2, accepting=true, e3_reached=false
  │
  ├──→ [対戦 2 (epoch=2)]
  │      E1 → E2 → E3 → E5 → E6
  │
  ├──→ ... (num_bouts 回繰り返し)
  │
  └──→ [最終対戦 (epoch=num_bouts)]
         E1 → E2 → E3 → E5 → (試合終了)
```

### 状態遷移表

| 状態 | accepting | e3_reached | epoch | トリガー |
|------|-----------|------------|-------|----------|
| 試合開始 | `true` | `false` | 1 | SET_MATCH |
| 提出受付中 | `true` | `false` | N | E6 実行後 |
| 全員提出 | `true` | `true` | N | E3 自動検知 |
| 確定済み | `false` | `true` | N | E5 実行後 |
| 次対戦へ | `true` | `false` | N+1 | E6 実行後 |

---

## 6. タイムラインシステム

`matches.timeline`（REAL 型）による試合進行順序管理:

- **同一 timeline 値** → 同時進行（並行試合）
- **小さい値** → 先に進行
- 審査員が複数試合に割り当てられている場合、以下の優先度で候補試合を選択:
  1. `accepting=true` かつ未完了（優先度 0）
  2. `accepting=false` かつ未完了（優先度 1）
  3. 試合完了済み（優先度 2）
  - 同優先度内: timeline 昇順 → match.code 辞書順
- **試合完了後も画面を保持**: 優先度 2 の場合は `match_complete: true` を返し、審査員画面に最終採点内訳を講評終了まで表示し続ける（送信ボタンは無効化）
- 試合完了判定: `match_snapshots` の確定済み epoch 数 ≥ `matches.num_bouts`

REAL 型のため `1.5` のような中間値も可能。

---

## 7. 対戦ラベル・スロット番号（getBoutLabel / getSlot）

**`getBoutLabel(epoch, numBouts)`**: epoch と対戦数から対戦名ラベルを計算。

```typescript
function getBoutLabel(epoch: number, numBouts: number): string {
  if (numBouts === 5) {
    return ['先鋒戦', '次鋒戦', '中堅戦', '副将戦', '大将戦'][epoch - 1];
  }
  if (numBouts === 3) {
    return ['先鋒戦', '中堅戦', '大将戦'][epoch - 1];
  }
  return `第${epoch}対戦`;
}
```

**`getSlot(epoch, numBouts)`**: epoch から「ポジション番号」（先鋒=1, 次鋒=2, 中堅=3, 副将=4, 大将=5）を計算。

```typescript
function getSlot(epoch: number, numBouts: number): number {
  if (numBouts === 3) {
    // 3番勝負: 先鋒(epoch1)→slot1, 中堅(epoch2)→slot3, 大将(epoch3)→slot5
    return { 1: 1, 2: 3, 3: 5 }[epoch] ?? epoch;
  }
  return epoch; // 5番勝負・その他: slot と epoch は一致
}
```

> **注意**: `epoch` は「何対戦目か」を表す通し番号（1, 2, 3…）であり、`slot` は先鋒〜大将のポジション番号（1〜5 固定）。  
> 3 番勝負では `epoch=3, slot=5`（大将戦）のようにズレが生じる。

---

## 8. フロントエンド

### 8.1 ファイル一覧

| ファイル | 用途 |
|----------|------|
| ファイル | 用途 |
|----------|------|
| `config.js` | 審査員画面用: Supabase anon key・Edge Function URL の定義 |
| `admin-config.js` | 管理画面用: 定数・DOM 参照・内部状態変数の定義 |
| `admin-api.js` | 管理画面用: REST API / Edge Function 呼び出しヘルパー |
| `admin-utils.js` | 管理画面用: UI ユーティリティ（setMsg, setControlsDisabled 等） |
| `admin-ui.js` | 管理画面用: 会場・試合ドロップダウン・審査員並び替え |
| `admin-audio.js` | 管理画面用: 得点読み上げ音声キュー管理 |
| `admin-scoreboard.js` | 管理画面用: スコアボード描画（横型・縦型） |
| `admin-core.js` | 管理画面用: データ読み込み・イベントリスナー・初期化 |
| `admin.html` + `admin.css` | 管理パネル（試合進行・スコアボード・音声読み上げ） |
| `admin-match.html` | 試合管理（CRUD） |
| `admin-judges.html` | 審査員管理（CRUD＋トークン発行） |
| `judge.html` + `judge.css` | 審査員入力画面 |
| `scoreboard.js` | OBS 用スコアボード共通ロジック（`reorderIdsForScoreboard`・`getBoutLabel`） |
| `obs-scoreboard.html` | OBS スコアボード（横型） |
| `obs-scoreboard-vertical.html` | OBS スコアボード（縦型） |
| `winnum_obs_overlay.html` | OBS 勝数オーバーレイ |

### 8.2 config.js

```javascript
window.JUDGE_APP_CONFIG = {
  FUNCTION_URL: 'http://127.0.0.1:54321/functions/v1/judge-submit-with-token',
  SUPABASE_ANON_KEY: '...'
};
```

### 8.3 admin（分割 JS）主要構造

**内部状態**（`admin-config.js` で定義）:
| 変数 | 型 | 説明 |
|------|------|------|
| `lastState` | object | 最新の state 行 |
| `autoLoading` | boolean | 自動更新中フラグ |
| `scoreboardMode` | string | `'horizontal'` / `'vertical'` |
| `currentVenueId` | string | 選択中の会場 UUID |
| `currentVenueCode` | string | 選択中の会場コード |
| `matchesCache` | array | 試合一覧キャッシュ |

**REST API 呼び出し**: `fetchJson(path, params)` → `SUPABASE_URL/rest/v1/{path}?{params}` GET（`apikey` + `Authorization: Bearer` ヘッダ）

**自動更新**: `setInterval(() => loadData(true), 2000)` で 2 秒ポーリング

**主要関数**:
| 関数 | 説明 |
|------|------|
| `populateVenues()` | 会場一覧を取得しドロップダウンに反映 |
| `populateMatches()` | 選択中会場の試合一覧取得 |
| `onVenueChange()` | 会場変更ハンドラ |
| `onMatchChange()` | 試合変更ハンドラ |
| `loadData(isAuto)` | 全データ取得＋スコアボード描画＋音声キュー構築 |
| `patchState(patch)` | admin-patch-state 呼び出し |
| `onClickE5()` | E5 確定処理 |
| `onClickE6()` | E6 次対戦へ |
| `loadJudgeOrder()` | 審査員並び順の読み込み＋D&D リスト構築 |
| `saveJudgeOrder()` | 審査員並び順の保存 |
| `buildScoreboard_horizontal()` | 横型スコアボード描画 |
| `buildScoreboard_vertical()` | 縦型スコアボード描画 |
| `buildAudioSuite()` | 音声キュー構築 |

### 8.4 scoreboard.js

**`reorderIdsForScoreboard(ids)`**: スコアボード表示用に ID 配列を中心から外側へ並び替え:
```
入力: [1, 2, 3, 4, 5, 6, 7]
出力: [6, 4, 2, 1, 3, 5, 7]  (奇数インデックスを逆順 → 偶数インデックス昇順)
```

**`buildScoreboard(expectedIds, judgesMap, subMap, meta, container)`**: OBS 用スコアボード HTML テーブル（9 行構成）:
1. 紅 旗
2. 紅 合計
3. 紅 鑑賞点
4. 紅 作品点
5. **審査員名**（中央行）
6. 白 作品点
7. 白 鑑賞点
8. 白 合計
9. 白 旗

### 8.5 judge.html の採点ロジック

**旗の自動決定（クライアント側）**:
```javascript
function updateFlagsAuto() {
  if (redTotal > whiteTotal) → 紅に旗
  else if (whiteTotal > redTotal) → 白に旗
  else {
    if (redWork > whiteWork) → 紅に旗        // 合計同点 → 作品点で判定
    else if (whiteWork > redWork) → 白に旗
    else → 旗なし（完全同点）
  }
}
```

**鑑賞点の排他制御**: `enforceAppExclusion(changedSide)` — 鑑賞点は紅白の一方のみに付与。片方に入力すると他方は 0 にリセット。

**ポーリング**: 5 秒間隔、`document.visibilityState === 'visible'` のときのみ実行。試合/epoch の変化を検知して自動リセット。

**状態変数**:

| 変数 | 型 | 説明 |
|------|------|------|
| `currentMatchId` | string\|null | 現在表示中の試合 ID |
| `currentEpoch` | number\|null | 現在の epoch |
| `currentMatchComplete` | boolean | 試合完了（講評中）フラグ |
| `hasLoadedSubmission` | boolean | 提出済みデータを読み込んだか |
| `initialSent` | boolean | 初回送信済みか |
| `inEdit` | boolean | 現在編集モードか |

**ステータス表示** (`#match-status`):

| 状態 | 表示テキスト |
|------|----------|
| `match_complete: true` | `試合終了（講評中）` |
| `accepting: false`（未完了） | `現在は受付停止中です` |
| 通常受付中 | （空白） |

`match_complete: true` のときは送信ボタンを `disabled` にし、最終採点内訳を画面に保持する。

### 8.6 音声読み上げ

審査員ごとの音声クリップ配列:
```
[judge_{voice_key}, num_{redWork}, vs, num_{whiteWork},
 kansyou_{score}_{side},
 num_{redTotal}, vs, num_{whiteTotal},
 win_{side} | win_draw_{side}]
```

全体キュー: `[start, ...全審査員clips..., end]`

再生開始時に `scoreboard_visible=true`、完了/停止時に `false` を自動設定（`admin-patch-state` 呼び出し）。

---

## 9. URL パラメータ一覧

| 画面 | パラメータ | 説明 |
|------|-----------|------|
| `judge.html` | `?token=khb-xxx` | 審査員トークン（必須） |
| `obs-scoreboard.html` | `?venue=<code>` | 会場コード（default: `default`） |
| `obs-scoreboard-vertical.html` | `?venue=<code>` | 会場コード（default: `default`） |
| `winnum_obs_overlay.html` | `?venue=<code>` | 会場コード（default: `default`） |
| `admin.html` | なし | 管理パネル |

---

## 10. マイグレーション履歴

| ファイル | 目的 |
|----------|------|
| `20260208041306_remote_schema.sql` | 初期スキーマ（全テーブル・FK・インデックス） |
| `20260304000001_enable_rls.sql` | RLS 有効化 + 暫定 `_temp` 書き込みポリシー |
| `20260304000002_add_venues.sql` | `venues` テーブル新設、`state.venue_id`、デフォルト会場 |
| `20260304000003_tighten_rls.sql` | `_temp` ポリシー全削除（書き込みは service_role のみ） |
| `20260306000001_timeline_and_single_token.sql` | `matches.timeline` 追加、`access_tokens.venue_id` nullable 化 |
| `20260306000002_drop_accepting_since.sql` | `state.accepting_since` カラム削除 |
| `20260306000003_matches_venue_id.sql` | `matches.venue_id` 追加（NOT NULL, FK） |
| `20260306000004_access_tokens_select_policy.sql` | `access_tokens` の anon SELECT ポリシー追加 |

---

## 11. イベントフロー図

```
[管理者]                    [Edge Functions]              [DB]                [審査員画面]
   │                            │                         │                       │
   │── SET_MATCH ──────────────→│── state UPDATE ─────────→│                       │
   │                            │── event_log INSERT ─────→│                       │
   │                            │                         │                       │
   │── toggle accepting ──────→│── admin-patch-state ────→│                       │
   │                            │                         │                       │
   │                            │                         │←── poll (5s) ─────────│
   │                            │                         │── info response ─────→│
   │                            │                         │                       │
   │                            │←── E1 submit ──────────────────────────────────│
   │                            │── submission INSERT ───→│                       │
   │                            │── event_log E1 ────────→│                       │
   │                            │── E3 check → state ────→│                       │
   │                            │                         │                       │
   │── E5 (確定) ─────────────→│── snapshot UPSERT ─────→│                       │
   │                            │── winner 判定           │                       │
   │                            │── state UPDATE ─────────→│                       │
   │                            │── event_log E5 ────────→│                       │
   │                            │                         │                       │
   │── E6 (次対戦) ───────────→│── state UPDATE ─────────→│                       │
   │                            │── event_log E6 ────────→│                       │
```

---

## 12. ローカル開発環境

### 前提条件
- Supabase CLI
- Deno（Edge Functions 用）

### セットアップ

```bash
# Supabase ローカル起動
supabase start

# マイグレーション適用
supabase db reset

# Edge Functions 起動
supabase functions serve
```

### 環境変数

| 変数 | ローカル値 |
|------|-----------|
| `ADMIN_SETUP_SECRET` | `local-test-secret` |
| `SUPABASE_URL` | `http://127.0.0.1:54321` |
| `SUPABASE_ANON_KEY` | config.js 参照 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase CLI 出力参照 |

### フロントエンドの URL 切り替え

`admin.js` 内の `SUPABASE_URL` と `SUPABASE_ANON_KEY` をローカル/本番で切り替え。  
`config.js` の `FUNCTION_URL` も同様。
