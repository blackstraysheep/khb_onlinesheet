-- 20260306000002_drop_accepting_since.sql
-- accepting_since カラム削除
-- タイムライン方式では同一タイムラインに同一審査員を配置しない設計のため、
-- accepting_since によるタイブレーカーは不要。

ALTER TABLE public.state DROP COLUMN IF EXISTS accepting_since;
