-- rollback_20260304000001_enable_rls.sql
-- 20260304000001 のロールバック（RLS を全テーブルで無効化しポリシーを削除）
-- !! 適用前提: 20260304000002/20260304000003 が先にロールバック済みであること
-- !! このスクリプトを実行すると RLS が無効になりセキュリティが元の状態（無防備）に戻ります

-- ================== ポリシー削除 ==================

DROP POLICY IF EXISTS "submissions_select"         ON public.submissions;
DROP POLICY IF EXISTS "match_snapshots_select"     ON public.match_snapshots;

DROP POLICY IF EXISTS "state_select"               ON public.state;
DROP POLICY IF EXISTS "state_update_temp"          ON public.state;

DROP POLICY IF EXISTS "matches_select"             ON public.matches;
DROP POLICY IF EXISTS "matches_insert_temp"        ON public.matches;
DROP POLICY IF EXISTS "matches_update_temp"        ON public.matches;

DROP POLICY IF EXISTS "judges_select"              ON public.judges;
DROP POLICY IF EXISTS "judges_insert_temp"         ON public.judges;
DROP POLICY IF EXISTS "judges_update_temp"         ON public.judges;

DROP POLICY IF EXISTS "expected_judges_select"     ON public.expected_judges;
DROP POLICY IF EXISTS "expected_judges_insert_temp" ON public.expected_judges;
DROP POLICY IF EXISTS "expected_judges_delete_temp" ON public.expected_judges;

-- ================== RLS 無効化 ==================

ALTER TABLE public.access_tokens        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_judges      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_snapshots      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.state                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions          DISABLE ROW LEVEL SECURITY;
