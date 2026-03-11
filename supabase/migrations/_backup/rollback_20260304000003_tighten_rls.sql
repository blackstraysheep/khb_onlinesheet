-- rollback_20260304000003_tighten_rls.sql
-- 20260304000003 のロールバック（暫定書き込みポリシーを再追加）
-- 適用前提: 20260304000003 が適用済みであること

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'state' AND policyname = 'state_update_temp'
  ) THEN
    CREATE POLICY "state_update_temp"
      ON public.state
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches' AND policyname = 'matches_insert_temp'
  ) THEN
    CREATE POLICY "matches_insert_temp"
      ON public.matches
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matches' AND policyname = 'matches_update_temp'
  ) THEN
    CREATE POLICY "matches_update_temp"
      ON public.matches
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'judges' AND policyname = 'judges_insert_temp'
  ) THEN
    CREATE POLICY "judges_insert_temp"
      ON public.judges
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'judges' AND policyname = 'judges_update_temp'
  ) THEN
    CREATE POLICY "judges_update_temp"
      ON public.judges
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expected_judges' AND policyname = 'expected_judges_insert_temp'
  ) THEN
    CREATE POLICY "expected_judges_insert_temp"
      ON public.expected_judges
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expected_judges' AND policyname = 'expected_judges_delete_temp'
  ) THEN
    CREATE POLICY "expected_judges_delete_temp"
      ON public.expected_judges
      FOR DELETE TO anon
      USING (true);
  END IF;
END
$$;
