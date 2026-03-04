-- 20260304000001_enable_rls.sql
-- ① RLS 有効化（フェーズ1）
--
-- 適用タイミング: 即座に適用可能。管理画面・Edge Function への影響なし。
-- 主なセキュリティ効果:
--   - access_tokens を anon から完全に隠蔽（トークン盗用を防止）
--   - submissions への直接 INSERT/UPDATE を block（偽スコア注入を防止）
--   - event_log を anon から完全に隠蔽
--   - match_snapshots への直接書き込みを block
-- 暫定措置（フェーズ2の20260304000003で削除）:
--   - state / matches / judges / expected_judges の anon 書き込みを暫定許可
--     （管理画面の直接REST呼び出しが残っているため。フェーズ2でEdge Function化後に削除）

-- ================================================================
-- 全テーブルに RLS を有効化
-- ================================================================
ALTER TABLE public.access_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_judges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_snapshots      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions          ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- access_tokens: anon/authenticated アクセス完全禁止
-- （service_role = Edge Functions はRLSをバイパスするため問題なし）
-- ================================================================
-- ポリシーなし = deny all for anon/authenticated

-- ================================================================
-- event_log: anon/authenticated アクセス完全禁止
-- ================================================================
-- ポリシーなし = deny all for anon/authenticated

-- ================================================================
-- submissions: anon は SELECT のみ（スコアボード表示に必要）
--   INSERT / UPDATE / DELETE は service_role (Edge Function) のみ
-- ================================================================
CREATE POLICY "submissions_select"
  ON public.submissions
  FOR SELECT TO anon, authenticated
  USING (true);

-- ================================================================
-- match_snapshots: anon は SELECT のみ（スコアボード・履歴表示に必要）
-- ================================================================
CREATE POLICY "match_snapshots_select"
  ON public.match_snapshots
  FOR SELECT TO anon, authenticated
  USING (true);

-- ================================================================
-- state: SELECT オープン（スコアボード・管理画面で必要）
--        UPDATE 暫定許可（管理画面の patchState() / scoreboard_visible 操作に必要）
--        ※ フェーズ2 migration 20260304000003 で UPDATE policy を削除
-- ================================================================
CREATE POLICY "state_select"
  ON public.state
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "state_update_temp"
  ON public.state
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- matches: SELECT オープン（管理画面・OBSで必要）
--          INSERT/UPDATE 暫定許可（管理画面の直接REST呼び出しに必要）
--          ※ フェーズ2 migration 20260304000003 で書き込みポリシーを削除
-- ================================================================
CREATE POLICY "matches_select"
  ON public.matches
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "matches_insert_temp"
  ON public.matches
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "matches_update_temp"
  ON public.matches
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- judges: SELECT オープン（審査員名表示に必要）
--         INSERT/UPDATE 暫定許可（管理画面の直接REST呼び出しに必要）
--         ※ フェーズ2 migration 20260304000003 で書き込みポリシーを削除
-- ================================================================
CREATE POLICY "judges_select"
  ON public.judges
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "judges_insert_temp"
  ON public.judges
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "judges_update_temp"
  ON public.judges
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- expected_judges: SELECT オープン（管理画面・審査員情報表示に必要）
--                  INSERT/DELETE 暫定許可（管理画面の直接REST呼び出しに必要）
--                  ※ フェーズ2 migration 20260304000003 で書き込みポリシーを削除
-- ================================================================
CREATE POLICY "expected_judges_select"
  ON public.expected_judges
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "expected_judges_insert_temp"
  ON public.expected_judges
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "expected_judges_delete_temp"
  ON public.expected_judges
  FOR DELETE TO anon
  USING (true);
