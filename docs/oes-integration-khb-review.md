# KHB-Kuawase 側回答: OES 連携実装計画レビュー

作成日: 2026-07-08
対象: `khb_onlinesheet/docs/02-kuawase-integration-impl.md`(2026-07-08 版)

OES 側計画書の「KHB-Kuawase 側エージェントへの依頼メモ」7 項目への現状調査結果と、
KHB-Kuawase 側視点での指摘・決定すべき事項をまとめる。

## 1. 依頼メモ 7 項目への回答

### 1-1. 現在状態を 1 つの JS オブジェクトとして取得できるか

**可能。ただし情報源が 3 つに分散しており、集約関数は新規実装になる。**

| 情報 | 取得元 | 形式 |
|------|--------|------|
| 紅チーム・白チーム・兼題 | `config.json`(IPC `get-config`)の `redTeam` / `whiteTeam` / `kendai` | **Excel セルキー**(`"B3"`, `"H1"` 等)。表示名は `excelData[key]` で展開が必要 |
| 試合名 | 同 `matchTitle` | 自由テキスト。**HTML を含みうる**(表示側 sanitize 前提の仕様) |
| 現在対戦 slot | 管理画面(`home.html`)の iframe `#slide-frame` の src ファイル名(`1.html`〜`5.html`) | `getMatchIndexFromIframe()`(`packages/kuawase-core/src/renderer/match-helpers.js`)が既存 |
| 紅白句 | `getHaikuCellKey(teamKey, kendaiKey, slot)` + `excelData` | 披講前でも任意時点で計算可能。欠落時は `"データなし"` が返る |
| 大会名 | `excelData["B1"]` | — |

補足:

- `top.html`(大会TOP)・`index.html`(試合TOP)表示中は「対戦外」状態。payload はこの状態を表現できる shape にする必要がある(計画書の例は `bout` 必須に見える)。
- iframe src には CSS テーマのクエリパラメータが付く場合がある(`buildSrcWithCssParam`)。`source_page` はファイル名だけ切り出して送る。
- 句の欠落 sentinel `"データなし"` は payload では `null` に正規化すべき。

### 1-2. `match_code` を含められるか

**現状は含められない。KHB-Kuawase に試合の安定 ID は存在しない。**

`matchTitle` は自由テキストで ID には使えない。さらに重要な事実として、
**KHB-Kuawase には `num_bouts`(3番勝負/5番勝負)の概念も存在しない**。
Excel フォーマットは兼題ごとに常に 5 slot 分の列(10 列)を持ち、3 番勝負は
操作者が次鋒・副将ボタンを押さないだけである。つまり計画書の payload 例にある
`match.num_bouts` を KHB-Kuawase は自力で知り得ない。

**推奨解**: `kuawase-sync-connect` のレスポンスに、その会場の試合一覧
(`code`, `red_team_name`, `white_team_name`, `num_bouts`)を含める。
KHB-Kuawase 側は試合指定パネル(または OES 連携パネル)で OES 試合との
紐付けを操作者に選ばせる(チーム名一致で候補を自動提示)。選択した
`match_code` と `num_bouts` を連携設定として保存する。

これにより:

- `match_code` 生成規則を KHB 側で発明しなくて済む。
- `num_bouts` は OES がマスタになり、epoch 計算・slot 検証の材料が揃う。
- 「未登録試合の自動作成」問題が原理的に消える(自動作成には反対)。
- チーム名不一致警告を KHB 側でも接続時点で出せる。

### 1-3. slot=1,3,5 と epoch 変換の場所

slot の唯一の真実は iframe の src ファイル名(`N.html`)。3 番勝負でも
ボタン・ファイルは 5 つのままで、`slot=2,4` を「押さない」運用。

- epoch 計算には `num_bouts` が必須(前項の通り OES から取得)。
- 変換は KHB 側 sync モジュールで行い、OES 側でも再計算・検証(計画書の方針で良い)。
- **決めるべき点**: 3 番勝負中に操作者が `2.html` / `4.html` を開いた場合の扱い。
  推奨は「同期送信しない + KHB 側で警告表示」。

### 1-4. public Kuawase と KHB-Kuawase の分岐点

**きれいに分離済みで、OES 連携は core 変更ほぼゼロで KHB 側に閉じ込められる。**

- 管理画面 `home.html` は app ごとの別ファイル(`apps/khb-kuawase/home.html`)。
  OES 連携パネルの UI・スクリプトは KHB の home.html にだけ追加すればよい。
- main プロセス IPC: `apps/khb-kuawase/src/main.js` の `extraIpcRegistrars` に
  登録する既存パターンあり(`src/ipc/user-top-ipc.js` が実例)。
  `src/ipc/oes-sync-ipc.js` を同型で追加する。
- preload の invoke チャンネル allowlist: `apps/khb-kuawase/src/preload.js` の
  `preloadExtraInvokeChannels` に追加する既存パターンあり。
- 唯一 core に手を入れたくなるのはページ遷移 hook(後述 2-1)。

### 1-5. OES 管理画面を別窓表示する既存パターン

**存在しない。** `window.open` ハンドラも `shell.openExternal` も未使用。
renderer は `sandbox: true` + `contextIsolation: true` + IPC allowlist で、
外部 URL をアプリ内に読み込む前提が今のところ一切ない。

選択肢と推奨:

1. **(初期実装の推奨)`shell.openExternal(url)` で OS 既定ブラウザで開く。**
   実装が最小で、リモートコンテンツをアプリのプロセスに持ち込まない
   (過去のセキュリティレビュー方針と整合)。OES admin のログイン状態
   (ADMIN_SETUP_SECRET)もブラウザ側に残る。URL は main プロセス側で
   OES ベース URL 由来のものだけに allowlist する。
2. (後段の選択肢)専用 BrowserWindow。**アプリの preload を絶対に渡さない**
   (IPC API が外部ページに露出する)。`sandbox: true`、preload なし、
   `setWindowOpenHandler` で遷移制限、が最低条件。
3. 注意: OES `admin.html` は ADMIN_SETUP_SECRET 手入力方式のため、
   どちらの方式でも自動ログインはできない。別窓を Electron 内にする場合、
   session の永続化(partition)を確認しないと開くたびに secret 入力になる。

計画書 Phase 3 の「popup ブロック・多重起動」チェック項目は、
`shell.openExternal` 方式ならほぼ消滅する。

### 1-6. token / OES URL / device_id の保存場所

**既存の `config.json` は不適。専用の保存領域を新設すべき。**

理由:

- `config.json` は `get-config` → 全体 spread → `update-config` という
  「renderer が全体を丸ごと往復させる」設計。既存フロー(試合指定保存、
  BGM 設定等)が token を消したり古い値で上書きしたりする事故が構造的に起きうる。
- `reset-data`(全データ初期化・句データリセット)で `{}` に戻る。
  接続設定が巻き添えで消えるのは運用上まずい。
- token 平文が renderer に常時渡ってしまう。

**推奨**: `userData/oes-sync.json` を新設し、専用 IPC で管理。
token は renderer に返さない(設定 UI には「設定済み/未設定」だけ返す)。
Electron の `safeStorage` で暗号化保存も検討(初期は平文ファイルでも可、
ファイルを分離すること自体が先)。`device_id` は初回に UUID 生成して同ファイルに保存。

OES への fetch は **main プロセスで行う**。`axios` は既に依存にあり、
Google Sheets 読み込みが同型の前例。renderer(file:// origin)から直接
fetch すると CORS・Origin の扱いが Supabase 側設定に絡んで面倒になるのに対し、
main からなら問題にならない。token を renderer に出さない方針とも一致する。

### 1-7. オフライン警告を出せる UI 領域

`showToast`(既存トースト)と、home.html に新設する OES 連携パネルで対応可能。
ただし **重大な注意点**: KHB-Kuawase の管理画面は主要操作のたびに
**ページ全体を再読込する**(`showToastAndReload`: 試合指定保存、Excel 読込、
言語変更などで `window.location.reload()`)。

含意:

- 接続状態・最終同期時刻・dirty フラグ等の **同期状態は main プロセスに持つ**。
  renderer のパネルは load 時に IPC で読み直して表示するだけにする。
- 再読込後、iframe は初期値 `top.html` に戻る。つまり「KHB の表示」と
  「OES の現在対戦」は正常運用でも定期的にズレる。
  「top.html 表示 = 対戦外」を OES 側警告のトリガにしない、
  もしくは「最後に同期した対戦」を main が保持して比較する、等の設計が必要。

## 2. KHB-Kuawase 側視点の追加指摘

### 2-1. 同期トリガの実装位置

- **ページ遷移 hook**: `battle-renderer.js` の `changeIframeSrc` が唯一の関門
  (home.html のボタンは `bootstrap-battle-page` が onclick を張り替えて
  ここへ集約している)。extension contract に `onIframeSrcChanged(src)` を
  1 メソッド追加するのが最も素直(core への小変更。`transformIframeSrc`
  という前例があり contract は汎用なので public 側への影響なし)。
- **試合指定 hook**: 保存ボタンは成功直後に reload するため、renderer 側 hook は
  送信中に画面が消える競合がある。main プロセスの `update-config` ハンドラで
  `redTeam`/`whiteTeam`/`kendai` の変化を diff 検知して dirty フラグを立てる方が堅い。
- 計画書自身の慎重論に同意: **初期は「状態検出 + 手動同期ボタン」**で開始し、
  自動送信は hook だけ仕込んでおいて後から有効化する。

### 2-2. payload 仕様で決め打ちすべきこと

- チーム名・兼題は **Excel 展開後の表示名**を送る(セルキーは送らない)。
- `matchTitle`・句・チーム名は OES 側で必ずプレーンテキストとして sanitize
  (KHB 仕様として試合名に HTML が入りうる)。
- 句欠落は `null`。`"データなし"` をそのまま送らない。
- `source_page` はクエリ除去済みファイル名。
- 「対戦外」(top/index 表示中)を表現できる shape にする(`bout: null` 等)。
- `num_bouts` は KHB 発信ではなく OES マスタ(1-2 参照)。payload に含めるなら
  「接続時に OES から受け取った値のエコーバック」という意味に限定する。

### 2-3. 披講タイミングと句の公開範囲

KHB は紅披講→白披講と段階公開する。ページ遷移時に両句を OES へ送る設計は、
OES 管理画面・スナップショット用途なら問題ないが、将来 judge 画面に句を
表示するなら「披講前の句が審査員に見える」問題が生じる。Phase 1 の同期先を
admin 表示 + snapshot 保存用に限定することを OES 側仕様として明記してほしい。
(必要になれば披講ボタンは `bootstrap-battle-page.js` の `showRed`/`showWhite`
ハンドラに hook できるので、披講イベント同期は後から追加可能。)

### 2-4. 再接続時の扱い(計画書の未決事項への意見)

**last-state-wins の再送 + 手動同期ボタン、イベントキューなし**を推奨。
payload は「現在状態」で冪等なので、切断中の中間遷移を順に再生する価値がない。
`event_id` は状態変化ごとに採番し、OES 側は同一 `event_id` 再送を冪等処理
(計画書の方針どおり)。main プロセスに dirty フラグを持ち、再接続時に
最新状態を 1 回送る。

### 2-5. `kuawase-sync-current` の state 反映範囲(Phase 2 の範囲確定)

計画書は「`state.current_match_id` / `epoch` へ反映するか警告だけにするかは
段階的に決める」としているが、KHB 側の実装を確定させるために先に決めたい。提案:

- Phase 2: `current_match_id` のみ自動反映(SET_MATCH 相当)。`epoch` は
  **報告 + 不一致警告のみ**で state 不変。E5/E6 は OES 管理画面(別窓)で操作。
- 確定済み epoch への巻き戻し同期は拒否(`applied: false` + 警告)で state 不変。
- 理由: epoch は E5/E6 と密結合しており、KHB のページ遷移(誤操作・巻き戻り・
  reload での top.html 復帰)を直結させると事故面が広すぎる。

### 2-6. 複数端末・token 運用

- 後続接続は「拒否」ではなく **警告 + 明示的な引き継ぎ(takeover)** を推奨。
  拒否のみだと端末故障時に交換できない。
- `device_id` は KHB 側で UUID 自動生成(1-6)。`kuawase_sync_tokens.device_id`
  は初回接続時に自動バインドで良い(事前登録必須にしない)。
- `expires_at` の運用(大会当日発行・当日失効か)は OES 側で決めてほしい。

### 2-7. OES 側 API への細かい要望

- `kuawase-sync-connect` レスポンスに **会場の試合一覧**を追加(1-2 の根拠)。
  既存 `admin-list-matches` の sync-token スコープ版に相当。
- レスポンスには OES ベース URL 起点で admin 画面を開くための `venue.code` が
  含まれる(計画書どおり)。KHB 側は接続設定で「OES ベース URL」を 1 つだけ
  持ち、`{base}/html/admin.html?venue={code}&mode=kuawase` を組み立てる。
- CORS: main プロセス fetch のため Origin ヘッダ問題は基本なし。
  Supabase Edge Functions 側は独自ヘッダ `x-kuawase-sync-token` を
  CORS allow-headers に含めること(ブラウザ経由でのテストや将来の変更に備え)。

## 3. KHB-Kuawase 側の実装スケッチ(Phase 1-2 相当)

新規ファイル(すべて `apps/khb-kuawase` 内、core 変更は hook 1 点のみ):

```text
apps/khb-kuawase/src/ipc/oes-sync-ipc.js   main側: 接続/同期/状態IPC、fetch、oes-sync.json 管理
apps/khb-kuawase/js/oes-sync-panel.js      renderer側: 接続設定UI・状態表示・手動同期ボタン
apps/khb-kuawase/home.html                 パネルDOM + script 追加
apps/khb-kuawase/src/preload.js            preloadExtraInvokeChannels に oes-* を追加
apps/khb-kuawase/src/main.js               extraIpcRegistrars に oes-sync-ipc を追加
packages/kuawase-core/.../battle-renderer.js  extension.onIframeSrcChanged hook 追加(任意・自動同期用)
```

IPC チャンネル案(すべて KHB 専用 allowlist):

```text
oes-get-status        接続状態・会場・最終同期・警告(tokenは含めない)
oes-set-connection    base URL / token / 有効化(main が保存・接続テスト)
oes-clear-connection
oes-sync-now          現在状態を集約して送信(手動同期ボタン)
oes-report-view       renderer からの表示状態通知(source_page / slot)
oes-open-admin        shell.openExternal で admin/admin-judges を開く
```

## 4. OES 側に決めてほしいこと(まとめ)

1. `kuawase-sync-connect` に試合一覧(code, チーム名, num_bouts)を含めるか。→ 含めてほしい(1-2)
2. Phase 2 の state 反映範囲: current_match_id のみ自動、epoch は警告のみ、で確定してよいか(2-5)
3. 句情報の用途を Phase 1 では admin 表示 + snapshot 用に限定すること(2-3)
4. 複数端末: 警告 + takeover 方式でよいか(2-6)
5. token の `expires_at` 運用(2-6)
6. `x-kuawase-sync-token` の CORS allow-headers 追加(2-7)
7. 再接続時: last-state-wins 再送 + `event_id` 冪等、で確定してよいか(2-4)
