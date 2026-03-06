-- 20260304000002_add_venues.sql
-- ② 会場（venues）テーブルの追加とスキーマ変更
--
-- 適用タイミング: 新Edge Functions (admin-add-judge, admin-set-match-judges,
--                 admin-patch-state) のデプロイ と 管理画面更新の前後に適用。
--                 ただし 20260304000003 の適用は更新デプロイ完了後。
--
-- 変更内容:
--   1. venues テーブル新設
--   2. venues テーブルに RLS + anon SELECT ポリシー
--   3. state テーブルに venue_id 列追加（NOT NULL, UNIQUE, FK→venues）
--   4. access_tokens テーブルに venue_id 列追加（NOT NULL, FK→venues）
--   5. デフォルト会場 "default" を挿入し、既存データを紐付け

-- ================================================================
-- 1. venues テーブル作成
-- ================================================================
CREATE TABLE IF NOT EXISTS public.venues (
    id          uuid        DEFAULT gen_random_uuid() NOT NULL,
    code        text        NOT NULL,
    name        text        NOT NULL,
    created_at  timestamptz DEFAULT now(),
    CONSTRAINT venues_pkey     PRIMARY KEY (id),
    CONSTRAINT venues_code_key UNIQUE (code)
);

ALTER TABLE public.venues OWNER TO postgres;

GRANT ALL ON TABLE public.venues TO anon;
GRANT ALL ON TABLE public.venues TO authenticated;
GRANT ALL ON TABLE public.venues TO service_role;

-- ================================================================
-- 2. venues に RLS を有効化し、anon は SELECT のみ許可
-- ================================================================
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venues_select"
  ON public.venues
  FOR SELECT TO anon, authenticated
  USING (true);

-- ================================================================
-- 3. デフォルト会場 "default" を挿入（既存Supabaseプロジェクトとの互換）
-- ================================================================
INSERT INTO public.venues (code, name)
VALUES ('default', 'メイン会場')
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- 4. state テーブルに venue_id 列を追加
--    - 既存の id=1 行はデフォルト会場に紐付け
--    - UNIQUE 制約: 会場ごとに state 行が1つ
-- ================================================================
ALTER TABLE public.state
    ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues (id);

UPDATE public.state
SET venue_id = (SELECT id FROM public.venues WHERE code = 'default')
WHERE venue_id IS NULL;

ALTER TABLE public.state
    ALTER COLUMN venue_id SET NOT NULL;

ALTER TABLE public.state
    ADD CONSTRAINT state_venue_id_key UNIQUE (venue_id);

-- ================================================================
-- 5. access_tokens テーブルに venue_id 列を追加
--    - 既存トークンはデフォルト会場に紐付け
-- ================================================================
ALTER TABLE public.access_tokens
    ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues (id);

UPDATE public.access_tokens
SET venue_id = (SELECT id FROM public.venues WHERE code = 'default')
WHERE venue_id IS NULL;

ALTER TABLE public.access_tokens
    ALTER COLUMN venue_id SET NOT NULL;

-- ================================================================
-- 備考: anon による state/matches/judges/expected_judges への直接書き込みは
-- 引き続き 20260304000001 の暫定ポリシーで許可されています。
-- Edge Functions と管理画面の更新完了後に 20260304000003 を適用し、
-- それらの暫定ポリシーを削除してください。
-- ================================================================
