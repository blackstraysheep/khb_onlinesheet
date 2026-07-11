# KHB-Kuawase 連携 E2E テスト

ローカル Supabase に対して kuawase 連携 API(Phase 1-2)を一気通貫で検証するスクリプト。
2026-07-10 の Phase 2 完了時点で全ステップ通過を確認済み。

## 前提

- Docker + `supabase start` 済み(ポートは既定の 54321/54322)
- Edge Functions を配信中:
  `npx supabase functions serve --env-file supabase/functions/.env`
  (`.env` に `ADMIN_SETUP_SECRET` が必要)
- migration 適用済み: `npx supabase migration up`
- `e2e-kk.js` は KHB-Kuawase リポジトリの実コード
  (`apps/khb-kuawase/src/ipc/oes-sync-ipc.js`)を直接 require する。
  場所が既定(`../Kuawase-intergrated`)と違う場合は `KK_APP_DIR` 環境変数で指定。

## 実行順(依存あり)

```sh
node tools/e2e/e2e-oes.js            # OES API 全 19 ステップ(試合 E2E-1 を作成)
node tools/e2e/e2e-disable-check.js  # 連携解除が受動 report で戻らないことの DB 検証
node tools/e2e/e2e-kk.js             # kk main プロセス実装の実接続検証(E2E-1 を使用)
node tools/e2e/e2e-phase3.js         # CONFIRM_AND_ADVANCE(E5+E6)・DISCONNECT(自己完結、P3-1 を作成)
node tools/e2e/e2e-judge-haiku.js    # 審査員向け披講済み句 API(自己完結)
node tools/e2e/e2e-round2.js         # CONFIRM/ADVANCE 個別・final_bout ガード・get-scores・
                                     # report の enabled・delete-match・<br> sanitize(自己完結、R2-1 を作成)
```

- ローカル edge runtime のホットリロードによる一過性 502 は自動リトライする。
- 再実行前・実行後のクリーンアップ(テストは既存 kuawase 行を消す前提):

```sql
DELETE FROM public.kuawase_sync_tokens;
DELETE FROM public.kuawase_sync_status;
DELETE FROM public.kuawase_candidates;
UPDATE public.state SET current_match_id=NULL
  WHERE current_match_id IN (SELECT id FROM public.matches WHERE code='E2E-1');
DELETE FROM public.event_log WHERE event_type LIKE 'KUAWASE%'
  OR match_id IN (SELECT id FROM public.matches WHERE code='E2E-1');
DELETE FROM public.matches WHERE code='E2E-1';
```

注意: `e2e-oes.js` の SET_MATCH は対象 venue(default)の `state` を実際に書き換える。
本番プロジェクトに向けて実行しないこと(URL がローカル固定なのはそのため)。
