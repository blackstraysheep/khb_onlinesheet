-- 20260306000001_timeline_and_single_token.sql
-- タイムライン方式への移行 + 1審査員1トークン化
--
-- 変更内容:
--   1. matches.timeline カラム追加 (REAL NOT NULL DEFAULT 1)
--   2. state.accepting_since カラム追加 (TIMESTAMPTZ, nullable)
--   3. access_tokens.venue_id を nullable 化（1審査員1トークンへの移行）

-- ================================================================
-- 1. matches.timeline: 試合のタイムライン番号（同時進行グループ）
-- ================================================================
ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS timeline real NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.matches.timeline IS '試合のタイムライン番号。同じ番号の試合は同時進行グループ。';

-- ================================================================
-- 2. state.accepting_since: accepting=true になった時刻
-- ================================================================
ALTER TABLE public.state
    ADD COLUMN IF NOT EXISTS accepting_since timestamptz;

-- 既に accepting=true の行があれば now() をセット
UPDATE public.state
SET accepting_since = now()
WHERE accepting = true AND accepting_since IS NULL;

COMMENT ON COLUMN public.state.accepting_since IS 'accepting=true になった時刻。タイブレーカー用。';

-- ================================================================
-- 3. access_tokens.venue_id を nullable 化
--    既存トークンの venue_id はそのまま残す（後方互換）
-- ================================================================
ALTER TABLE public.access_tokens
    ALTER COLUMN venue_id DROP NOT NULL;
