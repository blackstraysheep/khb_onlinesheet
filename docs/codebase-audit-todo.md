# コードベース分析 TODO

## 🔴 Critical（即座に修正すべき）

- [x] **C1: `match_snapshots`のCHECK制約が`'draw'`を許可していない**
  - ファイル: `supabase/migrations/20260208041306_remote_schema.sql` (L129), `supabase/functions/control_confirm_with_secret/index.ts` (L275)
  - 内容: `decideWinnerFromSnapshotItems()`が`'draw'`を返すが、CHECK制約が`['red','white']`のみ許可。引き分け時にE5確認がDB制約違反でクラッシュする。
  - 修正案: CHECK制約に`'draw'`を追加するか、引き分けは`NULL`で保存する。
  - **済: `supabase/migrations/20260308000001_allow_draw_winner.sql` で制約更新済み**

- [x] **C2: `access_tokens`テーブルが匿名ユーザーに全公開**
  - ファイル: `supabase/migrations/20260306000004_access_tokens_select_policy.sql` (L5-9)
  - 内容: `anon_select_access_tokens`ポリシーが`USING (true)`で全トークンを匿名公開。誰でもトークンを取得して審判になりすませる。
  - 修正案: このポリシーを削除し、admin_secret経由の管理用Edge Functionからのみトークンを提供する。
  - **済: `supabase/migrations/20260310000001_drop_anon_access_tokens_policy.sql` で削除済み**

- [x] **C3: `.env`ファイル（シークレット入り）がGitにコミットされている**
  - ファイル: `supabase/functions/.env`
  - 内容: `ADMIN_SETUP_SECRET=local-test-secret`がコミット済み。
  - 修正案: `.gitignore`に追加し、`.env.example`をプレースホルダーで作成する。
  - **済: 2026-03-10 ルート `.gitignore` に除外を明記し、`supabase/functions/.env.example` を追加**

- [x] **C4: スコア1〜4の音声が再生されない**
  - ファイル: `js/admin-audio.js` (L130-141 vs L50-58)
  - 内容: `numToAudioIds(1)`→`['num_1']`だが、`ensureAudioClip`は`n >= 5 && n <= 12`しか対応しない。スコア1〜4の音声が常にスキップされる。
  - 修正案: `ensureAudioClip`を`n >= 1`に拡張し、`numToAudioIds`のロジックを簡素化。
  - **済: 2026-03-10 修正完了**

## 🟠 High

- [x] **H1: XSS脆弱性 — DB由来データが`innerHTML`で無サニタイズ挿入**
  - ファイル: `js/admin-core.js` (L118,161), `js/admin-scoreboard.js` (L243), `js/admin-audio.js` (L236,249)
  - 内容: `match.code`や`match.name`等がそのまま`innerHTML`に挿入される。
  - 修正案: `textContent`を使用するか、`escapeHtml()`でサニタイズする。
  - **済: 2026-03-10 `innerHTML` 依存を DOM API ベースへ置換**

- [x] **H2: 5つのHTMLファイルにlocalhost URLがハードコード**
  - ファイル: `admin-judges.html` (L128), `admin-match.html` (L115), `obs-scoreboard.html` (L79), `obs-scoreboard-vertical.html` (L74), `winnum_obs_overlay.html` (L86)
  - 内容: `SUPABASE_URL = 'http://127.0.0.1:54321'`がハードコード。デプロイ時に動かない。
  - 修正案: `config.js`から読み込む形に統一する。
  - **済: 2026-03-10 `js/config.js` の共通設定を参照する形に統一（`admin-config.js` も追従）**

- [x] **H3: タイミング攻撃に脆弱なシークレット比較**
  - ファイル: 全7つのEdge Function `index.ts`
  - 内容: `clientSecret !== adminSecret`で文字列比較。タイミングサイドチャネル攻撃に脆弱。
  - 修正案: `timingSafeEqual`等の定数時間比較を使用する。
  - **済: 2026-03-10 `supabase/functions/_shared/secret.ts` の共通ヘルパーへ置換**

- [x] **H4: CORS `*`が管理エンドポイントに設定**
  - ファイル: 全Edge Function
  - 内容: `"Access-Control-Allow-Origin": "*"`で全オリジン許可。
  - 修正案: ホワイトリスト制にするか、`Origin`ヘッダーを検証する。
  - **済: 2026-03-10 `supabase/functions/_shared/cors.ts` で許可オリジンをホワイトリスト化**

- [x] **H5: OBSスコアボードが毎秒5〜6回の直列API呼び出し**
  - ファイル: `html/obs-scoreboard.html` (L239), `html/obs-scoreboard-vertical.html` (L381)
  - 内容: `updateScoreboard()`が毎秒5〜6回の直列`fetchJson()`を実行。
  - 修正案: Supabase Realtimeに切替、または`Promise.all()`で並列化。
  - **済: 2026-03-10 `matches` / `expected_judges` / `submissions` を `Promise.all()` 化、`venue_id` をキャッシュ**

- [ ] **H6: `scoreboard.js`と`admin-scoreboard.js`に〜200行の重複コード**
  - ファイル: `js/scoreboard.js` (284行) vs `js/admin-scoreboard.js`
  - 内容: ほぼ同一のスコアボード描画ロジックが重複。
  - 修正案: 共通ロジックをパラメータ化した共有関数に抽出する。

- [x] **H7: `fetchJson`がHTTPエラーステータスをチェックしていない**
  - ファイル: `html/admin-judges.html` (L155), `html/admin-match.html` (L135)
  - 内容: `res.ok`をチェックせずに`res.json()`を呼び出し。エラー応答が正常データとして処理される。
  - 修正案: `if (!res.ok) throw new Error(...)`を追加する。

## 🟡 Medium

- [ ] **M1: 引き分けタイブレイクが暗黙的に赤勝ちになる**
  - ファイル: `js/admin-audio.js` (L191-201)
  - 内容: `redTotal === whiteTotal`かつ`redWork === whiteWork`の場合、`winnerSideForTotal`がデフォルトで`'red'`に。
  - 修正案: 完全引き分けケースを明示的に処理する。

- [x] **M2: `loadData()`の手動/自動実行間にレースコンディション**
    - ファイル: `js/admin-core.js` (L5-178, L386-389)
    - 内容: `autoLoading`フラグは自動ロード同士を防ぐが、手動と自動の並行実行は防げない。
    - 修正案: 単一のmutexフラグか`AbortController`を使用する。
    - **済: 2026-03-10 単一キュー化し、手動/自動の並行実行を禁止**

- [x] **M3: `stateSummary`のnullチェック欠如**
    - ファイル: `js/admin-core.js` (L13, L37, L161, L169)
    - 内容: `stateSummary.innerHTML`にnullガードなし。DOM要素不在時にクラッシュ。
    - 修正案: `if (stateSummary)`ガードを追加する。
    - **済: 2026-03-10 `setStateSummaryMessage()` / `renderStateSummary()` に集約済み**

- [x] **M4: `getBoutLabel`が3箇所以上に重複**
    - ファイル: `judge-submit-with-token/index.ts` (L23), `control_confirm_with_secret/index.ts` (L42), `obs-scoreboard-vertical.html` (L234)
    - 修正案: 共有モジュールに抽出する。
    - **済: 2026-03-10 フロントは `js/scoreboard.js`、Edge Functions は `_shared/bout.ts` に集約**

- [x] **M5: 審判割り当てがUUIDでなく名前ベース**
    - ファイル: `html/admin-judges.html` (L367-368)
    - 内容: `judge.name`で送信。同名審判がいると誤割り当ての可能性。
    - 修正案: UUIDで送信し、`admin-set-match-judges`を使用する。
    - **済: 2026-03-10 `judge_ids` を `admin-set-match-judges` に送信**

- [x] **M6: ワークスコア0の入力バリデーション欠如**
    - ファイル: `html/judge.html` (L574-577)
    - 内容: `parseOrZero`が未選択を0として受理。審判が何も選ばずに送信可能。
    - 修正案: セレクト要素が明示的に選択されたかを検証する。
    - **済: 2026-03-10 作品点セレクトの明示選択を送信前に必須化**

- [ ] **M7: CSS 90%重複**
  - ファイル: `css/admin.css` (670行), `css/admin-vertical.css` (641行)
  - 修正案: 共通スタイルを`admin-base.css`に抽出する。

- [ ] **M8: `control_advance`がevent_logに`match_id: null`を記録**
  - ファイル: `supabase/functions/control_advance_with_secret/index.ts` (L103)
  - 修正案: `match_id: stateRow.current_match_id`を設定する。

- [ ] **M9: `esc()`がnullでクラッシュ**
  - ファイル: `html/admin-match.html` (L316)
  - 修正案: `d.textContent = s ?? '';`に変更する。

- [ ] **M10: `obs-scoreboard-vertical.html`の`buildScoreboard`が5番目の引数を無視**
  - ファイル: `html/obs-scoreboard-vertical.html` (L96 vs L353)
  - 修正案: `container`パラメータを追加し`scoreboard.js`と一致させる。

- [ ] **M11: `snapshot_viewer.html`が`buildScoreboard`関数を丸ごと複製**
  - ファイル: `html/snapshot_viewer.html` (L152-287)
  - 修正案: `scoreboard.js`を再利用するか、`scoreboard-vertical.js`を作成する。

- [ ] **M12: `state.id`のPKがvenue移行後に形骸化**
  - ファイル: `supabase/migrations/`
  - 修正案: PKを`venue_id`に移行する。

- [x] **M13: API呼び出しの直列ウォーターフォール**
    - ファイル: `js/admin-core.js` (L28-83)
    - 内容: `loadData()`の5つの`fetchJson`が直列。独立したものは`Promise.all`で並列化可能。
    - 修正案: ステップ3,4を`Promise.all`で並列化する。
    - **済: 2026-03-10 `expected_judges` / `submissions` を `Promise.all()` 化**

- [x] **M14: 2秒ポーリングに変更検知なし**
    - ファイル: `js/admin-core.js` (L386-389)
    - 修正案: Supabase Realtimeに切替、または前回データと比較してDOM更新をスキップする。
    - **済: 2026-03-10 自動更新時は前回シグネチャと比較し、同一なら再描画をスキップ**

## 🟢 Low

- [ ] **L1: 全関数・変数がグローバルスコープ**（全admin-*.js）
- [ ] **L2: マジックナンバー多数**（`admin-audio.js`等）
- [x] **L3: 死んだCSSルール `[v-cloak]`**（`obs-scoreboard.html`, `obs-scoreboard-vertical.html`）
  - **済: 2026-03-10 未使用ルールを削除**
- [x] **L4: `zoom: 1.0`はno-op**（`obs-scoreboard-vertical.html`）
  - **済: 2026-03-10 no-op スタイルを削除**
- [x] **L5: 重複HTMLコメント**（`obs-scoreboard.html`）
  - **済: 2026-03-10 重複コメントを削除**
- [x] **L6: `select:focus`スタイル不一致**（`admin-judges.html` vs `admin-match.html`）
  - **済: 2026-03-10 `admin-judges.html` に `select:focus` を追加**
- [ ] **L7: `$`/`$$`ヘルパーがjQuery規約をシャドウ**（`admin-config.js`）
- [x] **L8: `buildAudioSegments`の未使用パラメータ**（`admin-audio.js`）
  - **済: 2026-03-10 修正完了**
- [x] **L9: 死んだコード — `'戦'`サフィックス追加条件が常にfalse**（`admin-core.js`）
  - **済: 2026-03-10 死んだ条件分岐を削除**
- [x] **L10: 審判名トランケーション長の不一致** — `slice(0,4)` vs `slice(0,8)`（`scoreboard.js` vs `admin-scoreboard.js`）
  - **済: 2026-03-10 `scoreboard.js` を 8 文字に統一**
- [x] **L11: ロールバックスクリプトが`CREATE POLICY IF NOT EXISTS`使用**（PG14以前で失敗）
  - **済: 2026-03-10 `_backup/rollback_20260304000003_tighten_rls.sql` を `DO $$` ガードへ変更**
- [x] **L12: `admin-setup-match`がmatch更新エラーを握りつぶす**（`index.ts` L149）
  - **済: 2026-03-10 更新失敗時に 500 を返すよう修正**
- [x] **L13: Edge Functionのモジュールレベルでのクライアント生成にnullチェックなし**
  - **済: 2026-03-10 `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` の取得を `?? \"\"` に統一**
