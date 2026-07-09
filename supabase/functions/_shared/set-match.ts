// supabase/functions/_shared/set-match.ts
// SET_MATCH(現在試合の設定)の本体ロジック。
// control_set_current_match_with_secret(管理者 secret 認可)と
// kuawase-sync-control(KHB-Kuawase token 認可)の両方から使う。
// 挙動は従来の control_set_current_match_with_secret と同一:
// - 審査員の同一タイムライン競合チェック(競合時はブロック)
// - 既存スナップショットからの勝数復元
// - 指定 epoch での E3 再判定
// - state upsert + event_log 記録

// deno-lint-ignore no-explicit-any
type SupabaseClientLike = any;

type MatchRow = {
  id: string;
  code: string;
  name: string | null;
  venue_id: string;
};

type MatchTimelineRow = {
  timeline: number | null;
};

type OtherMatchRow = {
  id: string;
  code: string;
  name: string | null;
  num_bouts: number | null;
  timeline: number | null;
};

export type JudgeConflict = {
  judge_id: string;
  judge_name: string | null;
  other_match_code: string;
  other_match_name: string | null;
  other_timeline: number | null;
  same_timeline: boolean;
};

export type SetMatchResult =
  | {
    ok: true;
    match: { id: string; code: string; name: string | null };
    epoch: number;
    accepting: true;
    warnings: JudgeConflict[];
  }
  | {
    ok: false;
    status: number;
    error: string;
    message?: string;
    conflicts?: JudgeConflict[];
  };

export async function setCurrentMatch({
  supabase,
  venueId,
  matchCode,
  epoch: epochInput,
  logDetail = {},
}: {
  supabase: SupabaseClientLike;
  venueId: string;
  matchCode: string;
  epoch?: number;
  logDetail?: Record<string, unknown>;
}): Promise<SetMatchResult> {
  let epoch = epochInput;
  if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
    epoch = 1;
  }

  // 1. 対戦取得
  const { data: matchRow, error: matchErr } = await supabase
    .from("matches")
    .select("id, code, name, venue_id")
    .eq("code", matchCode)
    .maybeSingle();
  const resolvedMatchRow = matchRow as MatchRow | null;

  if (matchErr || !resolvedMatchRow) {
    return { ok: false, status: 404, error: "match not found" };
  }

  // 試合の会場と指定会場が一致するか検証
  if (String(resolvedMatchRow.venue_id) !== String(venueId)) {
    return {
      ok: false,
      status: 403,
      error: `match '${matchCode}' belongs to a different venue`,
    };
  }

  const match_id: string = resolvedMatchRow.id;
  const nowIso = new Date().toISOString();

  // ★ 競合チェック: この試合の期待審査員が他のアクティブ試合にも登録されていないか
  const { data: targetExpected } = await supabase
    .from("expected_judges")
    .select("judge_id")
    .eq("match_id", match_id);
  // deno-lint-ignore no-explicit-any
  const targetJudgeIds = (targetExpected ?? []).map((r: any) => String(r.judge_id));

  const { data: targetMatchFull } = await supabase
    .from("matches")
    .select("timeline")
    .eq("id", match_id)
    .maybeSingle();
  const targetTimeline = (targetMatchFull as MatchTimelineRow | null)?.timeline ?? null;

  const conflicts: JudgeConflict[] = [];

  if (targetJudgeIds.length > 0) {
    // accepting=true の全 state を取得(自分自身の venue 含む)
    const { data: allActiveStates } = await supabase
      .from("state")
      .select("venue_id, current_match_id, epoch")
      .eq("accepting", true);

    const otherMatchIds = (allActiveStates ?? [])
      // deno-lint-ignore no-explicit-any
      .map((s: any) => String(s.current_match_id))
      .filter((mid: string) => mid && mid !== match_id);

    if (otherMatchIds.length > 0) {
      const { data: otherExpected } = await supabase
        .from("expected_judges")
        .select("match_id, judge_id")
        .in("match_id", otherMatchIds)
        .in("judge_id", targetJudgeIds);

      if (otherExpected && otherExpected.length > 0) {
        // deno-lint-ignore no-explicit-any
        const otherMatchIdSet = [...new Set(otherExpected.map((r: any) => String(r.match_id)))];
        const { data: otherMatches } = await supabase
          .from("matches")
          .select("id, code, name, num_bouts, timeline")
          // deno-lint-ignore no-explicit-any
          .in("id", otherMatchIdSet) as { data: OtherMatchRow[] | null; error: any };
        const otherMatchMap = new Map<string, OtherMatchRow>(
          ((otherMatches ?? []) as OtherMatchRow[]).map((m) => [String(m.id), m]),
        );

        const { data: otherSnaps } = await supabase
          .from("match_snapshots")
          .select("match_id, epoch")
          .in("match_id", otherMatchIdSet);
        const otherMaxEpoch = new Map<string, number>();
        for (const snap of (otherSnaps ?? [])) {
          const mid = String(snap.match_id);
          const cur = otherMaxEpoch.get(mid) ?? 0;
          if (snap.epoch > cur) otherMaxEpoch.set(mid, snap.epoch);
        }

        // deno-lint-ignore no-explicit-any
        const conflictJudgeIds = [...new Set(otherExpected.map((r: any) => String(r.judge_id)))];
        const { data: judgeRows } = await supabase
          .from("judges")
          .select("id, name")
          .in("id", conflictJudgeIds);
        const judgeNameMap = new Map<string, string | null>(
          // deno-lint-ignore no-explicit-any
          (judgeRows ?? []).map((j: any) => [String(j.id), j.name ?? null]),
        );

        for (const row of otherExpected) {
          const omid = String(row.match_id);
          const om = otherMatchMap.get(omid);
          if (!om) continue;

          // 完了済み(最終epoch確定済み)なら競合ではない
          const numBouts = typeof om.num_bouts === "number" ? om.num_bouts : 5;
          const maxConfirmed = otherMaxEpoch.get(omid) ?? 0;
          if (maxConfirmed >= numBouts) continue;

          const otherTl = om.timeline ?? null;
          const sameTl = targetTimeline !== null && otherTl !== null &&
            targetTimeline === otherTl;

          conflicts.push({
            judge_id: String(row.judge_id),
            judge_name: judgeNameMap.get(String(row.judge_id)) ?? null,
            other_match_code: om.code,
            other_match_name: om.name ?? null,
            other_timeline: otherTl,
            same_timeline: sameTl,
          });
        }
      }
    }
  }

  // 同一 timeline の競合がある場合はブロック
  const sameTimelineConflicts = conflicts.filter((c) => c.same_timeline);
  if (sameTimelineConflicts.length > 0) {
    return {
      ok: false,
      status: 409,
      error: "same_timeline_conflict",
      message: "同一タイムラインで審査中の審査員がいるため、試合を開始できません。",
      conflicts: sameTimelineConflicts,
    };
  }

  // ★ この match_id に既存スナップショットがあれば勝数を復元(なければ 0)
  const { data: snaps, error: snapsErr } = await supabase
    .from("match_snapshots")
    .select("winner")
    .eq("match_id", match_id);

  if (snapsErr) {
    console.error("match_snapshots load error on SET_MATCH", snapsErr);
    return { ok: false, status: 500, error: "failed to load snapshots for win tally" };
  }

  // deno-lint-ignore no-explicit-any
  const red_wins = (snaps ?? []).filter((r: any) => r.winner === "red").length;
  // deno-lint-ignore no-explicit-any
  const white_wins = (snaps ?? []).filter((r: any) => r.winner === "white").length;

  // ★ E3 判定: 当該 epoch で全期待審査員が提出済みか確認
  let e3_reached = false;
  if (targetJudgeIds.length > 0) {
    const { data: subRows } = await supabase
      .from("submissions")
      .select("judge_id")
      .eq("match_id", match_id)
      .eq("epoch", epoch);
    // deno-lint-ignore no-explicit-any
    const submittedIds = new Set((subRows ?? []).map((r: any) => r.judge_id as string));
    e3_reached = targetJudgeIds.every((id: string) => submittedIds.has(id));
  }

  // 2. state を更新(current_match_id, epoch, accepting, e3_reached)
  const { error: updErr } = await supabase
    .from("state")
    .upsert({
      venue_id: venueId,
      current_match_id: match_id,
      epoch,
      accepting: true,
      e3_reached,
      red_wins,
      white_wins,
      wins_updated_at: nowIso,
      updated_at: nowIso,
    }, { onConflict: "venue_id" });

  if (updErr) {
    console.error("state update error on SET_MATCH", updErr);
    return { ok: false, status: 500, error: "failed to set current match" };
  }

  // 3. event_log に記録
  await supabase.from("event_log").insert({
    event_type: "SET_MATCH",
    match_id,
    judge_id: null,
    epoch,
    detail: {
      match_id,
      match_code: matchCode,
      epoch,
      ...logDetail,
    },
  });

  const diffTimelineConflicts = conflicts.filter((c) => !c.same_timeline);

  return {
    ok: true,
    match: {
      id: match_id,
      code: resolvedMatchRow.code,
      name: resolvedMatchRow.name,
    },
    epoch,
    accepting: true,
    warnings: diffTimelineConflicts,
  };
}
