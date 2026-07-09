# 実装計画: KHB-Kuawase 連携 (v2)

- v1: 2026-07-08
- v2: 2026-07-10 全面改訂。KHB-Kuawase 側回答(`oes-integration-khb-review.md`)と設計議論を経てアーキテクチャを確定。v1 の「紐付け方式」「進行は別窓のみ」は本版で破棄。

## この文書の位置づけ

OES(khb_onlinesheet)と KHB-Kuawase(Kuawase-intergrated リポジトリ、以下 kk)の両実装エージェントが参照する共通仕様。以後、両リポジトリは 1 つの AI セッションで直接参照・編集できる前提とし、文書往復による確認依頼は行わない。

- OES リポジトリ: `khb_onlinesheet`(この文書の置き場所が正本)
- kk リポジトリ: `Kuawase-intergrated`(対象 `apps/khb-kuawase`、共通部 `packages/kuawase-core`)

## 確定アーキテクチャ

### 役割分担

```
Excel  = コンテンツのマスタ(チーム名・兼題・句)
OES    = 設定・進行・採点のマスタ(試合設定・timeline・num_bouts・審査員・epoch・E5/E6・snapshot)
kk     = 表示端末 + OES のリモコン(Excel のビューア、進行操作の物理ボタン)
```

設計原理: **当日の操作者の作業と判断を最小化する。** 照合・転記・二重操作を人間に要求する設計は採らない。安全ガードは操作を増やす形ではなく、操作を減らす・塞ぐ形(ボタン無効化、確認ダイアログ、構造的排除)で入れる。

### 全体フロー

```
【大会前】
1. Excel 作成(従来通り)
2. kk で Excel 読込 → 「候補データを OES へ送信」
   送信内容: チーム一覧(表示名+セルキー)、兼題一覧(表示名+セルキー)、excel_hash
   ※句は送らない(漏洩リスク排除。将来拡張余地のみ確保)
3. OES 管理画面で試合設定: 対戦カード(候補から選択式)、順序(timeline)、
   num_bouts、兼題(候補から選択式)、審査員割当
   → 名前照合が原理的に発生しない(プリセットはセルキーと表示名の両方を保持)

【当日】
4. kk が token で接続 → プリセット一覧+state を取得、ローカルキャッシュ
5. kk「この試合を読み込む」1クリック
   → kk の redTeam/whiteTeam/kendai が自動設定、OES へ SET_MATCH(epoch=1)
6. 対戦進行: kk の遷移ボタン=「確定して次へ」(E5+E6+ページ遷移が1ボタン)
7. 句は披講時・確定時にその場送信(admin 表示+snapshot 用)
```

## 確定事項一覧

v1 の未決事項および kk 側回答(`oes-integration-khb-review.md` §4)への決定。

| # | 論点 | 決定 |
|---|------|------|
| 1 | 試合と kk 状態の対応付け | **OES プリセット方式**。kk からの候補データインポート → OES で試合設定 → kk がプリセット読込。kk 側レビュー 1-2 の「紐付け選択方式」は破棄(人間の照合作業を排除するため) |
| 2 | 進行操作 | **kk の遷移ボタンに E5+E6 を統合**(「確定して次へ」)。v1 Phase 4 を中核に繰り上げ。OES 管理画面別窓は復旧・監視用のバックアップ経路に格下げ |
| 3 | 句の扱い | **事前インポートせず、その場送信**。披講ボタン押下時に該当句、E5 確定時に両句を送信。用途は admin 表示+snapshot に限定。審査員向けエンドポイントには出さない |
| 4 | epoch | kk は slot を送り、OES が num_bouts から epoch を導出・検証。kk 側でも表示用に計算してよいが OES が正 |
| 5 | kk の UI | **統合モードを持つ**。接続有効時は試合指定パネルを「OES 試合読込」パネルに差し替え、未使用 slot ボタンを無効化、遷移ボタンを「確定して次へ」化。手動試合指定はフォールバックとして残す |
| 6 | OES 単独使用 | **ハードなモード分岐を作らない**。連携は venue 単位の状態(`kuawase_sync_status.enabled`)で、無効なら完全に従来動作。候補選択 UI は候補データがある場合のみ出る追加機能とし、手入力の試合設定も常に可能 |
| 7 | token 期限 | 発行時に期限指定、既定 48 時間。管理画面から即時 revoke 可能 |
| 8 | 複数端末 | 警告+明示的 takeover(拒否のみにしない。端末故障時の交換経路) |
| 9 | 再接続 | last-state-wins 再送+`event_id` 冪等。イベントキューなし |
| 10 | fetch 場所 | kk の main プロセス。token は renderer に返さない。保存は `userData/oes-sync.json`(`safeStorage` 検討)。`device_id` は初回 UUID 生成 |
| 11 | 別窓 | `shell.openExternal` で OS ブラウザ。URL は main 側で OES ベース URL 由来のみ allowlist |
| 12 | sanitize | Excel 由来テキスト・matchTitle は HTML を含みうる前提で、OES 側は全入力をプレーンテキスト化して保存・表示 |
| 13 | CORS | `_shared/cors.ts` の allow-headers に `x-kuawase-sync-token` を追加 |

kk 側レビューとの主な差分: 1-2(紐付け方式)は全面差し替え、2-1 の試合指定 dirty 検知は不要化(試合切替はプリセット読込という明示操作になるため)、2-5 の「epoch は警告のみ」は「明示ボタンによる control API」に置き換え(暗黙同期で epoch を動かさない点は維持)。

## データモデル

### kuawase_sync_tokens

```sql
CREATE TABLE kuawase_sync_tokens (
  token_hash text PRIMARY KEY,
  venue_id uuid NOT NULL REFERENCES venues(id),
  label text,
  device_id text,              -- 初回接続時に自動バインド
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,  -- 既定: 発行から48時間
  revoked_at timestamptz,
  last_seen_at timestamptz,
  last_event_id text
);
```

- token 平文は保存しない(hash のみ)。表示は発行直後のみ。
- 別 device_id からの接続は `DEVICE_CONFLICT` 警告を返し、takeover フラグ付き再接続で乗り換え(旧バインドを上書きし、event_log に記録)。

### kuawase_candidates(新設)

kk からインポートした Excel 候補データ。venue ごとに 1 セット。

```sql
CREATE TABLE kuawase_candidates (
  venue_id uuid PRIMARY KEY REFERENCES venues(id),
  teams jsonb NOT NULL,      -- [{ "cell": "B3", "name": "○○高校" }, ...]
  kendai jsonb NOT NULL,     -- [{ "cell": "H1", "name": "夏の月" }, ...]
  excel_hash text NOT NULL,  -- kk 側 excelData の正規化ハッシュ
  compe_name text,           -- excelData["B1"]
  imported_at timestamptz NOT NULL DEFAULT now()
);
```

### matches への追加カラム

```sql
ALTER TABLE matches ADD COLUMN kendai_name text;
ALTER TABLE matches ADD COLUMN kuawase_ref jsonb;
-- kuawase_ref: { "red_cell": "B3", "white_cell": "B5", "kendai_cell": "H1", "excel_hash": "..." }
```

- すべて nullable。OES 単独使用(候補データなしの手入力試合)では null のまま。
- `kuawase_ref` があればプリセットとして kk に配信可能。

### kuawase_sync_status(新設)

```sql
CREATE TABLE kuawase_sync_status (
  venue_id uuid PRIMARY KEY REFERENCES venues(id),
  enabled boolean NOT NULL DEFAULT false,
  source_device_id text,
  last_view jsonb,           -- { "source_page": "3.html", "slot": 3, "match_code": "A-1" }
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

`enabled=false` の venue では OES は連携由来の警告・ロックを一切出さない(単独使用の完全互換)。

### 句の保存先

事前テーブルは作らない。E5 確定時の payload に含まれる句を `match_snapshots.snapshot.haiku` に保存する。披講時送信の句は `kuawase_sync_status.last_view` 内に持たせ、admin 画面のライブ表示にのみ使う(揮発扱い)。

## API(Supabase Edge Functions)

認可はすべて `x-kuawase-sync-token`。token → venue_id 解決後、venue 外のデータには一切触れない。全 API で `event_id` を受け、`last_event_id` と同一なら前回結果を返す(冪等)。

### kuawase-import-candidates

大会前の候補データ登録。冪等 upsert。

```json
// request
{
  "event_id": "...",
  "device_id": "...",
  "compe_name": "第X回大会",
  "teams": [{ "cell": "B3", "name": "○○高校" }],
  "kendai": [{ "cell": "H1", "name": "夏の月" }],
  "excel_hash": "sha256:..."
}
```

- 再インポート時、既存 matches の `kuawase_ref` と食い違うセル(セルキーは同じだが name が変わった、または消えた)があればレスポンスの `warnings` で列挙する。matches 側の追従(表示名更新)は OES 管理画面で確認して適用。
- 全テキストは保存前に sanitize。

### kuawase-sync-connect

接続テスト兼、当日の初期化。

```json
// response
{
  "ok": true,
  "venue": { "id": "...", "code": "A", "name": "A会場" },
  "state": { "current_match_id": "...", "epoch": 2, "accepting": true, "e3_reached": false },
  "excel_hash": "sha256:...",   // インポート時のもの。kk 側で手元と照合
  "presets": [
    {
      "code": "A-1",
      "red":   { "cell": "B3", "name": "○○高校" },
      "white": { "cell": "B5", "name": "△△高校" },
      "kendai": { "cell": "H1", "name": "夏の月" },
      "num_bouts": 3,
      "timeline_order": 1
    }
  ],
  "warnings": []   // DEVICE_CONFLICT, EXCEL_HASH_MISMATCH など
}
```

kk は presets をローカルキャッシュし、以後オフラインでも試合読込を継続できるようにする。

### kuawase-sync-report

表示状態・披講の報告。**state は変更しない。** 警告生成と admin ライブ表示のみ。

```json
// request
{
  "event_id": "...",
  "device_id": "...",
  "kind": "view" | "reveal",
  "match_code": "A-1",
  "slot": 3,                    // 対戦外(top/index 表示中)は null
  "source_page": "3.html",      // クエリ除去済みファイル名
  "reveal": { "side": "red", "haiku": "紅の句" },   // kind=reveal のみ
  "changed_at": "2026-07-10T12:00:00+09:00"
}
```

- レスポンスで現在の `state` と warnings(表示と受付中対戦の不一致、確定済み対戦への戻り等)を返す。
- 句の欠落は `null`(kk の sentinel `"データなし"` を送らない)。
- 対戦外状態(reload で top.html に戻る等)は正常運用で頻発するため、それ自体を警告にしない。「最後に報告された対戦」との比較は OES 側で行う。

### kuawase-sync-control

state を変更する唯一の API。既存 `control_*_with_secret` のロジックを token 認可で再利用する。

```json
// request
{
  "event_id": "...",
  "device_id": "...",
  "action": "SET_MATCH" | "CONFIRM_AND_ADVANCE",
  "match_code": "A-1",
  "slot": 3,                    // kk 視点の現在 slot。OES が epoch を導出・検証
  "haiku": { "red": "紅の句", "white": "白の句" }   // CONFIRM_AND_ADVANCE のみ。snapshot 用
}
```

- `SET_MATCH`: プリセット読込時。`current_match_id` 設定+epoch=1 で受付開始。
- `CONFIRM_AND_ADVANCE`: E5(確定+snapshot 保存、句を `snapshot.haiku` へ)→ E6(次 epoch・受付開始)を原子的に実行。**最終対戦(epoch=num_bouts)では E5 のみ実行し、`accepting=false` で試合終了状態にする**(E6 は発行しない)。
- 検証: slot→epoch 変換(5番: slot=epoch / 3番: 1,3,5→1,2,3)が state.epoch と整合しない場合、確定済み epoch への操作の場合は `applied: false` +警告で拒否。
- レスポンスは report と同形(現在 state + warnings)。

### slot ↔ epoch 変換(再掲・確定)

```text
5番勝負: slot 1,2,3,4,5 → epoch 1,2,3,4,5
3番勝負: slot 1,3,5     → epoch 1,2,3
```

3番勝負の slot=2,4 は kk 側でボタン無効化により構造的に発生させない(万一 report で来たら警告のみ)。

## kk 側実装

### 統合モード UI(apps/khb-kuawase 層で完結)

OES 接続が有効なとき、home.html の管理画面を次のように切り替える。切替判定は load 時に main へ IPC(`oes-get-status`)で問い合わせる(reload 耐性のため状態は全て main 持ち)。

1. **試合指定パネル**(`#redTeamSelect` 等)を隠し、**OES 試合読込パネル**を表示:
   プリセット一覧(timeline 順、済/現在/未のステータス付き)+「この試合を読み込む」。
   読込 = config の redTeam/whiteTeam/kendai を書込み → `SET_MATCH` 送信 → reload。
   手動試合指定へのフォールバックはトグルで残す(オフライン時・緊急時)。
2. **遷移ボタン**(`#page-controls`): `bootstrapBattlePage` の `hooks.afterInitExtensions` でバインドを差し替え。
   - ラベルを「確定して次へ(中堅戦→大将戦)」等に変更。
   - 押下時: `CONFIRM_AND_ADVANCE` 送信 → 成功でページ遷移。
   - **E3 未達なら確認ダイアログ**(「n名未提出です。確定しますか」)。OES の e3_reached は直近の report/control レスポンスで main が保持。
   - 送信失敗/オフライン: ページ遷移は通す(kk のオフライン動作は死守)+ dirty フラグ+未同期警告。復旧は OES 管理画面(別窓)で。
   - **戻る方向は逆イベントを発行しない**。遷移は通すが report のみ+警告表示。
   - num_bouts=3 のとき次鋒・副将ボタンを disabled に。
3. **披講ボタン**(`showRed`/`showWhite`): 既存ハンドラの後に `kind: "reveal"` の report を送る(該当側の句を main が計算して同梱)。
4. **状態バー**: 接続状態 / 会場 / OES 現在試合・対戦 / 受付・提出状況 / 最終同期 / 警告。renderer は表示のみ、値は main から IPC で取得。

### main プロセス

- `apps/khb-kuawase/src/ipc/oes-sync-ipc.js` を新設し、`extraIpcRegistrars` に登録(`user-top-ipc.js` と同型)。
- OES への fetch は全て main(axios 既存依存)。token は renderer に渡さない。
- `userData/oes-sync.json`: base URL / token / device_id / venue / プリセットキャッシュ / dirty フラグ。`reset-data` の影響を受けない独立ファイル。
- 句の計算: `getHaikuCellKey`(`packages/kuawase-core/src/renderer/match-helpers.js`、純粋関数)+ excelData(Excel パースは main 側)で main が実行。`"データなし"` は `null` に正規化。
- `excel_hash`: excelData の正規化 JSON の sha256。Excel 読込時に計算・保持。

### IPC チャンネル(preloadExtraInvokeChannels に追加)

```text
oes-get-status        接続状態・プリセット一覧・OES state・警告(token は含めない)
oes-set-connection    base URL / token 保存+接続テスト(takeover フラグ対応)
oes-clear-connection
oes-import-candidates 候補データ送信(Excel 読込済みが前提)
oes-load-preset       プリセット読込(config 書込+SET_MATCH)
oes-confirm-advance   確定して次へ(E5+E6)
oes-report-view       表示状態報告(遷移・披講)
oes-open-admin        shell.openExternal(OES URL allowlist 検証は main 側)
```

### core への変更(最小)

- `renderer-extension-contract.js` に `onIframeSrcChanged(src)` を追加(report 用 hook。`transformIframeSrc` と同様の任意メソッドで public 側影響なし)。
- それ以外の UI 差し替え・ボタン挙動は全て `apps/khb-kuawase` 層で行う。

## OES 側実装

- 上記 4 API と 2 テーブル+matches 拡張。
- **管理画面(admin-match.html)**: 候補データがある venue では対戦カード・兼題を候補からのプルダウン選択式にする(`kuawase_ref` を保存)。候補がなければ従来の手入力(単独使用の完全互換)。num_bouts・timeline は既存 UI。
- **token 発行 UI**: admin-judges.html の judge token 管理と同居。発行(期限指定・既定48h)・revoke・接続状況(last_seen/device)表示。
- **admin.html**: 連携パネル(接続端末・最終報告・kk 表示状態・警告)。`enabled` 中は現在試合・進行操作に「kk 側操作が正」の警告(ロックではなく警告に留め、緊急時の手動操作経路を塞がない)。連携解除ボタン。
- **句のアクセス制御**: 披講/確定で送られた句は admin 系レスポンスと snapshot にのみ含める。judge 系エンドポイントには出さない。
- 監査: import / connect / control / takeover を `event_log` に記録(token 平文は残さない)。
- Realtime: `kuawase_sync_status` の変更を admin 画面へ配信(スコアボードで導入済みのパターン)。

## 実装フェーズ(改訂)

### Phase 1: 接続基盤+事前設定(大会前フローの成立)

- [x] OES: `kuawase_sync_tokens` / `kuawase_candidates` / matches 拡張の migration(20260710000001)
- [x] OES: token 発行・revoke UI(admin-judges + admin-issue/list/revoke-kuawase-token)
- [x] OES: `kuawase-import-candidates` / `kuawase-sync-connect`(+ `_shared/kuawase-auth.ts`, `_shared/sanitize.ts`)
- [x] OES: admin-match.html の候補選択式試合設定(手入力フォールバック付き)
- [x] OES: `_shared/cors.ts` に `x-kuawase-sync-token`
- [ ] kk: `oes-sync-ipc.js`(接続設定・保存・fetch 基盤)+接続設定 UI
- [ ] kk: 候補データ送信(excel_hash 計算含む)

### Phase 2: 当日フロー(読込+報告)

- [ ] kk: 統合モード UI(試合指定パネル差し替え、プリセット読込、状態バー)
- [ ] kk: `oes-load-preset` → `SET_MATCH`
- [ ] OES: `kuawase-sync-control`(SET_MATCH)+`kuawase-sync-report`
- [ ] kk: 遷移・披講の report 送信(core の `onIframeSrcChanged` hook 追加)
- [ ] 両側: excel_hash 照合+セルキー↔表示名検証の警告
- [ ] OES: admin.html 連携パネル+警告表示

### Phase 3: 進行統合(E5+E6)

- [ ] OES: `CONFIRM_AND_ADVANCE`(既存 control ロジックの token 認可版、最終対戦の終了処理含む)
- [ ] kk: 遷移ボタンの「確定して次へ」化+E3 確認ダイアログ+slot 無効化
- [ ] kk: 句のその場送信(披講 reveal+確定時同梱)
- [ ] OES: snapshot への句保存、句のアクセス制御
- [ ] 両側: オフライン時のローカル遷移+dirty+復旧警告

### Phase 4: 運用強化

- [ ] takeover フロー(kk 側 UI+OES 側記録)
- [ ] `shell.openExternal` での OES 管理画面・審査員管理導線
- [ ] 現場フィードバックによる調整(受付開始/停止の kk 側ボタン化の要否など)

## テスト観点(主要な事故シナリオ)

1. 3番勝負で E3 未達のまま「確定して次へ」→ ダイアログで止まるか。
2. 試合中のネットワーク断 → kk 単独で最後まで進行でき、未同期警告が出続けるか。復旧後に OES 管理画面で追いつけるか。
3. reload で top.html に戻る → 誤警告が出ないか。状態バーが main から正しく復元されるか。
4. インポート後に Excel の句を修正(セル位置不変)→ hash 警告は出るが運用継続できるか。
5. 行が動く Excel 編集 → プリセット読込時の name 検証で捕捉されるか。
6. 端末故障 → 予備機で takeover 接続し、進行を引き継げるか。
7. 確定済み対戦への戻り操作 → state が動かず警告のみか。
8. matchTitle・チーム名に HTML → OES 側で無害化されるか。
9. 連携 `enabled=false` の venue → OES 単独運用が v1 以前と完全に同一挙動か。
