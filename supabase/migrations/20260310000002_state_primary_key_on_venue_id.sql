-- state テーブルの主キーを venue_id に移行し、旧 id 列を撤去する
ALTER TABLE public.state
  DROP CONSTRAINT IF EXISTS state_pkey;

ALTER TABLE public.state
  DROP CONSTRAINT IF EXISTS state_venue_id_key;

ALTER TABLE public.state
  DROP COLUMN IF EXISTS id;

ALTER TABLE public.state
  ADD CONSTRAINT state_pkey PRIMARY KEY (venue_id);
