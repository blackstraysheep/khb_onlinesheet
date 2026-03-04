-- rollback_20260304000002_add_venues.sql
-- 20260304000002 のロールバック（venues テーブル・venue_id 列を削除）
-- !! 適用前提: 20260304000003 がまだ適用されていないか、すでにロールバック済みであること
-- !! このスクリプトを実行すると venues テーブルおよびデータが消えます
-- !! まず 20260304000003 のロールバック → その後このスクリプト の順で実行すること

-- 1. access_tokens から venue_id 列を削除
ALTER TABLE public.access_tokens
    DROP COLUMN IF EXISTS venue_id;

-- 2. state から venue_id 列と UNIQUE 制約を削除
ALTER TABLE public.state
    DROP CONSTRAINT IF EXISTS state_venue_id_key;

ALTER TABLE public.state
    DROP COLUMN IF EXISTS venue_id;

-- 3. venues テーブルを削除
DROP TABLE IF EXISTS public.venues;
