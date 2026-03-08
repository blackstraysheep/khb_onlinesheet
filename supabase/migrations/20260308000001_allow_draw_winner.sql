-- match_snapshots の winner CHECK制約に 'draw' を追加
-- decideWinnerFromSnapshotItems() が引き分け時に 'draw' を返すが、
-- 既存の制約が ['red','white'] のみ許可しているため upsert が失敗する問題を修正

ALTER TABLE "public"."match_snapshots"
  DROP CONSTRAINT "match_snapshots_winner_check";

ALTER TABLE "public"."match_snapshots"
  ADD CONSTRAINT "match_snapshots_winner_check"
  CHECK ("winner" = ANY (ARRAY['red'::"text", 'white'::"text", 'draw'::"text"]));
