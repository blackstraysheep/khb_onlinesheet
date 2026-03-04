-- 20260304000003_tighten_rls.sql
-- ② RLS ポリシー強化（暫定書き込みポリシーの削除）
--
-- 適用タイミング: 以下がすべて完了してから適用すること:
--   1. supabase functions deploy admin-add-judge
--   2. supabase functions deploy admin-set-match-judges
--   3. supabase functions deploy admin-patch-state
--   4. supabase functions deploy admin-setup-match
--   5. supabase functions deploy control_advance_with_secret
--   6. supabase functions deploy control_confirm_with_secret
--   7. supabase functions deploy control_set_current_match_with_secret
--   8. supabase functions deploy judge-submit-with-token
--   9. 管理画面（admin-audio.html）の更新を本番サーバーに反映
--  10. OBS スコアボードの更新を本番サーバーに反映
--
-- 変更内容:
--   - 20260304000001 で追加した "_temp" 書き込みポリシーを削除
--   - 書き込みは service_role (Edge Functions + admin_secret チェック) のみに限定
--   - state への anon UPDATE は削除（admin-patch-state Edge Function 経由に移行済み）

DROP POLICY IF EXISTS "state_update_temp"            ON public.state;
DROP POLICY IF EXISTS "matches_insert_temp"          ON public.matches;
DROP POLICY IF EXISTS "matches_update_temp"          ON public.matches;
DROP POLICY IF EXISTS "judges_insert_temp"           ON public.judges;
DROP POLICY IF EXISTS "judges_update_temp"           ON public.judges;
DROP POLICY IF EXISTS "expected_judges_insert_temp"  ON public.expected_judges;
DROP POLICY IF EXISTS "expected_judges_delete_temp"  ON public.expected_judges;

-- 上記を DROP した後の各テーブルの最終ポリシー:
--   state            : SELECT のみ (anon) | 全操作 (service_role, via admin-patch-state)
--   matches          : SELECT のみ (anon) | 全操作 (service_role, via admin-set-match-judges)
--   judges           : SELECT のみ (anon) | 全操作 (service_role, via admin-add-judge)
--   expected_judges  : SELECT のみ (anon) | 全操作 (service_role, via admin-set-match-judges)
--   submissions      : SELECT のみ (anon) | 全操作 (service_role, via judge-submit-with-token)
--   match_snapshots  : SELECT のみ (anon) | 全操作 (service_role, via control_confirm)
--   access_tokens    : アクセス禁止 (anon) | 全操作 (service_role)
--   event_log        : アクセス禁止 (anon) | 全操作 (service_role)
--   venues           : SELECT のみ (anon) | 全操作 (service_role)
