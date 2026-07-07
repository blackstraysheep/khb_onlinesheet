-- Ensure a default venue state row exists for fresh local/project databases.
INSERT INTO public.state (
  venue_id,
  epoch,
  accepting,
  e3_reached,
  scoreboard_visible,
  red_wins,
  white_wins,
  wins_updated_at,
  updated_at
)
SELECT
  v.id,
  1,
  false,
  false,
  false,
  0,
  0,
  now(),
  now()
FROM public.venues v
WHERE v.code = 'default'
ON CONFLICT (venue_id) DO NOTHING;
