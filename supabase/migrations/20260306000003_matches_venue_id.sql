-- 20260306000003_matches_venue_id.sql
-- matches テーブルに venue_id を追加。
-- 試合は登録した会場でしか current_match に設定できないよう制約する。

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.venues (id);

-- 既存行は default 会場に紐付ける
UPDATE public.matches
SET venue_id = (SELECT id FROM public.venues WHERE code = 'default')
WHERE venue_id IS NULL;

ALTER TABLE public.matches
    ALTER COLUMN venue_id SET NOT NULL;

COMMENT ON COLUMN public.matches.venue_id IS '試合が属する会場。この会場の state でのみ current_match_id に設定可能。';
