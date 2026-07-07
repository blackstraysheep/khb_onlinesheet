-- Harden judge token storage and narrow anonymous read access.
--
-- Token migration strategy:
--   - token_hash becomes the lookup key for new code.
--   - legacy plaintext tokens are hashed and then removed.
--   - New tokens should be stored with token = NULL.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.access_tokens
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS token_last4 text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

UPDATE public.access_tokens
SET
  id = COALESCE(id, gen_random_uuid()),
  token_hash = COALESCE(token_hash, encode(extensions.digest(token, 'sha256'), 'hex')),
  token_last4 = COALESCE(token_last4, right(token, 4))
WHERE token IS NOT NULL;

ALTER TABLE public.access_tokens
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.access_tokens
  DROP CONSTRAINT IF EXISTS access_tokens_pkey;

ALTER TABLE public.access_tokens
  ADD CONSTRAINT access_tokens_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS access_tokens_token_hash_key
  ON public.access_tokens (token_hash)
  WHERE token_hash IS NOT NULL;

ALTER TABLE public.access_tokens
  ALTER COLUMN token DROP NOT NULL;

UPDATE public.access_tokens
SET token = NULL
WHERE token_hash IS NOT NULL;

ALTER TABLE public.access_tokens
  DROP CONSTRAINT IF EXISTS access_tokens_plaintext_token_null;

ALTER TABLE public.access_tokens
  ADD CONSTRAINT access_tokens_plaintext_token_null CHECK (token IS NULL);

COMMENT ON COLUMN public.access_tokens.token_hash IS 'SHA-256 hex digest of the judge token. New rows should store only this hash.';
COMMENT ON COLUMN public.access_tokens.token IS 'Legacy plaintext token column. Must remain NULL after token_hash migration.';
COMMENT ON COLUMN public.access_tokens.expires_at IS 'Optional token expiration timestamp.';
COMMENT ON COLUMN public.access_tokens.revoked_at IS 'Set when the token is revoked.';

REVOKE ALL ON TABLE public.access_tokens FROM anon;
REVOKE ALL ON TABLE public.access_tokens FROM authenticated;
GRANT ALL ON TABLE public.access_tokens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.access_tokens TO postgres;

CREATE TABLE IF NOT EXISTS public.token_rate_limits (
  bucket text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.token_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.token_rate_limits FROM anon;
REVOKE ALL ON TABLE public.token_rate_limits FROM authenticated;
GRANT ALL ON TABLE public.token_rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.token_rate_limits TO postgres;

-- No policies: anon/authenticated cannot inspect rate-limit buckets.

-- Anonymous scoreboard reads should only expose the currently visible bout.
DROP POLICY IF EXISTS "submissions_select" ON public.submissions;
CREATE POLICY "submissions_select_visible_current"
  ON public.submissions
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.state s
      WHERE s.current_match_id = submissions.match_id
        AND s.epoch = submissions.epoch
        AND s.scoreboard_visible = true
    )
  );

-- Match metadata is public only for the current match or already published snapshots.
DROP POLICY IF EXISTS "matches_select" ON public.matches;
CREATE POLICY "matches_select_public_current_or_snapshot"
  ON public.matches
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.state s
      WHERE s.current_match_id = matches.id
    )
    OR EXISTS (
      SELECT 1
      FROM public.match_snapshots ms
      WHERE ms.match_id = matches.id
    )
  );
