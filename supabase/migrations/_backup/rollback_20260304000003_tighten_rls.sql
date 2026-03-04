-- rollback_20260304000003_tighten_rls.sql
-- 20260304000003 のロールバック（暫定書き込みポリシーを再追加）
-- 適用前提: 20260304000003 が適用済みであること

CREATE POLICY IF NOT EXISTS "state_update_temp"
  ON public.state
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "matches_insert_temp"
  ON public.matches
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "matches_update_temp"
  ON public.matches
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "judges_insert_temp"
  ON public.judges
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "judges_update_temp"
  ON public.judges
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "expected_judges_insert_temp"
  ON public.expected_judges
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "expected_judges_delete_temp"
  ON public.expected_judges
  FOR DELETE TO anon
  USING (true);
