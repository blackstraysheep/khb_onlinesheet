INSERT INTO public.state (id, epoch, accepting, e3_reached, scoreboard_visible, red_wins, white_wins, venue_id)
SELECT 1, 1, false, false, false, 0, 0, v.id
FROM public.venues v WHERE v.code = 'default'
ON CONFLICT (id) DO NOTHING;
