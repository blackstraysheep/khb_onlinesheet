// supabase/functions/_shared/confirm-bout.ts
// E5(対戦確定・スナップショット保存)の本体ロジック。
// control_confirm_with_secret(管理者 secret)と kuawase-sync-control
// (KHB-Kuawase token、CONFIRM_AND_ADVANCE)の両方から使う。
//
// 挙動は従来の control_confirm_with_secret と同一:
// - 全期待審査員の提出を必須とする(未提出があれば拒否)
// - snapshot 保存(match_id+epoch で upsert)、winner 判定、勝数再集計
// - state を accepting=false に更新、event_log に E5 を記録
// 追加点:
// - haiku を snapshot.haiku に保存できる(従来は常に null)
// - 試合の会場一致を検証する(venueId と matches.venue_id)

import { getBoutLabel } from "./bout.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClientLike = any;

// epoch と num_bouts から slot(ポジション番号)を返す
function getSlot(epoch: number, numBouts: number): number {
  if (numBouts === 3) {
    const map: Record<number, number> = { 1: 1, 2: 3, 3: 5 };
    return map[epoch] ?? epoch;
  }
  return epoch;
}

// snapshotItems から winner を決める(旗数の多い方。同数は draw)
function decideWinnerFromSnapshotItems(
  // deno-lint-ignore no-explicit-any
  items: Array<any>,
): "red" | "white" | "draw" {
  let redFlags = 0;
  let whiteFlags = 0;

  for (const it of items ?? []) {
    if (it?.red?.flag === true) redFlags += 1;
    if (it?.white?.flag === true) whiteFlags += 1;
  }

  if (redFlags > whiteFlags) return "red";
  if (whiteFlags > redFlags) return "white";
  return "draw";
}

export type ConfirmBoutResult =
  | {
    ok: true;
    match_id: string;
    epoch: number;
    num_bouts: number;
    snapshot_count: number;
    slot: number;
    slot_label: string;
    winner: "red" | "white" | "draw";
    red_wins: number;
    white_wins: number;
  }
  | {
    ok: false;
    status: number;
    error: string;
    detail?: Record<string, unknown>;
  };

export async function confirmBout({
  supabase,
  venueId,
  venueCode,
  matchCode,
  haiku = { red: null, white: null },
}: {
  supabase: SupabaseClientLike;
  venueId: string;
  venueCode: string;
  matchCode: string;
  haiku?: { red: string | null; white: string | null };
}): Promise<ConfirmBoutResult> {
  // 1. 対戦取得(会場一致を検証)
  const { data: matchRow, error: matchErr } = await supabase
    .from("matches")
    .select("id, code, name, red_team_name, white_team_name, num_bouts, venue_id")
    .eq("code", matchCode)
    .maybeSingle();

  if (matchErr || !matchRow) {
    return { ok: false, status: 404, error: "match not found" };
  }
  if (String(matchRow.venue_id) !== String(venueId)) {
    return {
      ok: false,
      status: 403,
      error: `match '${matchCode}' belongs to a different venue`,
    };
  }
  const match_id = matchRow.id as string;
  const numBouts: number = typeof matchRow.num_bouts === "number" ? matchRow.num_bouts : 5;

  // 2. state から現在の epoch を取得
  const { data: stateRow, error: stateErr } = await supabase
    .from("state")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (stateErr || !stateRow) {
    return { ok: false, status: 500, error: "state not found" };
  }

  const epoch = stateRow.epoch;
  if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
    return { ok: false, status: 500, error: "invalid state.epoch" };
  }

  const slot: number = getSlot(epoch, numBouts);
  const slot_label: string = getBoutLabel(epoch, numBouts);

  // 3. 期待審査員一覧(sort_order 付き)
  const { data: expectedJudges, error: expErr } = await supabase
    .from("expected_judges")
    .select("judge_id, sort_order")
    .eq("match_id", match_id);

  if (expErr) {
    return { ok: false, status: 500, error: "failed to load expected_judges" };
  }
  if (!expectedJudges || expectedJudges.length === 0) {
    return { ok: false, status: 400, error: "no expected judges registered" };
  }
  // deno-lint-ignore no-explicit-any
  const expectedIds = expectedJudges.map((r: any) => String(r.judge_id));

  // 4. 提出状況
  const { data: submitted, error: subErr } = await supabase
    .from("submissions")
    .select(
      "id, judge_id, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag",
    )
    .eq("match_id", match_id)
    .eq("epoch", epoch);

  if (subErr) {
    return { ok: false, status: 500, error: "failed to load submissions" };
  }

  const submittedIds = Array.from(
    // deno-lint-ignore no-explicit-any
    new Set((submitted ?? []).map((r: any) => String(r.judge_id))),
  );
  const allArrived = expectedIds.every((id: string) => submittedIds.includes(id));

  if (!allArrived) {
    return {
      ok: false,
      status: 400,
      error: "not all judges have submitted yet",
      detail: {
        expected_count: expectedIds.length,
        submitted_count: submittedIds.length,
      },
    };
  }

  // 5. スナップショット JSON を作成
  const { data: judgesRows, error: judgesErr } = await supabase
    .from("judges")
    .select("id, name");

  if (judgesErr) {
    return { ok: false, status: 500, error: "failed to load judges" };
  }

  const judgeNameById = new Map<string, string>();
  // deno-lint-ignore no-explicit-any
  (judgesRows ?? []).forEach((j: any) => {
    judgeNameById.set(String(j.id), j.name);
  });

  const judgeSortOrderById = new Map<string, number>();
  // deno-lint-ignore no-explicit-any
  (expectedJudges ?? []).forEach((ej: any) => {
    judgeSortOrderById.set(String(ej.judge_id), ej.sort_order ?? 0);
  });

  // deno-lint-ignore no-explicit-any
  const snapshotItems = (submitted ?? []).map((row: any) => {
    const judgeId = String(row.judge_id);
    return {
      judge_id: judgeId,
      judge_name: judgeNameById.get(judgeId) ?? null,
      sort_order: judgeSortOrderById.get(judgeId) ?? 0,
      revision: row.revision,
      red: {
        work_point: row.red_work,
        app_point: row.red_app,
        total: row.red_total,
        flag: row.red_flag,
      },
      white: {
        work_point: row.white_work,
        app_point: row.white_app,
        total: row.white_total,
        flag: row.white_flag,
      },
    };
  });

  // deno-lint-ignore no-explicit-any
  snapshotItems.sort((a: any, b: any) => a.sort_order - b.sort_order);

  const nowIso = new Date().toISOString();

  const snapshot = {
    spec_version: "v3.0",
    venue: {
      id: venueId,
      code: venueCode,
    },
    match: {
      id: match_id,
      code: matchRow.code,
      name: matchRow.name,
    },
    teams: {
      red: matchRow.red_team_name ?? null,
      white: matchRow.white_team_name ?? null,
    },
    epoch,
    bout: {
      slot,
      label: slot_label,
    },
    haiku: {
      red: haiku.red ?? null,
      white: haiku.white ?? null,
    },
    saved_at: nowIso,
    items: snapshotItems,
  };

  const winner = decideWinnerFromSnapshotItems(snapshotItems);

  // 6. match_snapshots に upsert
  const { error: snapErr } = await supabase
    .from("match_snapshots")
    .upsert(
      {
        match_id,
        epoch,
        snapshot,
        winner,
        created_at: nowIso,
      },
      { onConflict: "match_id,epoch" },
    );

  if (snapErr) {
    console.error("match_snapshots upsert error", snapErr);
    return { ok: false, status: 500, error: "failed to save snapshot" };
  }

  // 累計勝数を再集計
  const { data: allSnaps, error: allSnapsErr } = await supabase
    .from("match_snapshots")
    .select("winner")
    .eq("match_id", match_id);

  if (allSnapsErr) {
    console.error("failed to load match_snapshots for win tally", allSnapsErr);
    return { ok: false, status: 500, error: "failed to recalc win tally" };
  }

  // deno-lint-ignore no-explicit-any
  const red_wins = (allSnaps ?? []).filter((r: any) => r.winner === "red").length;
  // deno-lint-ignore no-explicit-any
  const white_wins = (allSnaps ?? []).filter((r: any) => r.winner === "white").length;

  // 7. state を「確定」状態に(受付停止)+累計勝数を反映
  const { error: updStateErr } = await supabase
    .from("state")
    .update({
      accepting: false,
      red_wins,
      white_wins,
      wins_updated_at: nowIso,
      updated_at: nowIso,
    })
    .eq("venue_id", venueId);

  if (updStateErr) {
    console.error("state update error on E5", updStateErr);
    return { ok: false, status: 500, error: "failed to update state" };
  }

  // 8. event_log に E5 を追加
  await supabase.from("event_log").insert({
    event_type: "E5",
    match_id,
    judge_id: null,
    epoch,
    detail: {
      match_id,
      match_code: matchCode,
      epoch,
      saved_at: nowIso,
      slot,
      slot_label,
      winner,
      red_wins,
      white_wins,
    },
  });

  return {
    ok: true,
    match_id,
    epoch,
    num_bouts: numBouts,
    snapshot_count: snapshotItems.length,
    slot,
    slot_label,
    winner,
    red_wins,
    white_wins,
  };
}

// E6(次対戦へ)。state を epoch+1・受付開始に更新し、event_log に記録する。
// 現在試合が設定されている場合、num_bouts を超える前進は拒否する
// (3番勝負で大将戦の後に epoch=4 へ進めてしまう事故の防止)。
// 意図的に超えたい場合は管理画面の Epoch 手動設定を使う。
export async function advanceBout({
  supabase,
  venueId,
  logDetail = {},
}: {
  supabase: SupabaseClientLike;
  venueId: string;
  logDetail?: Record<string, unknown>;
}): Promise<
  | { ok: true; from_epoch: number; to_epoch: number }
  | { ok: false; status: number; error: string; detail?: Record<string, unknown> }
> {
  const { data: stateRow, error: stateErr } = await supabase
    .from("state")
    .select("*")
    .eq("venue_id", venueId)
    .maybeSingle();

  if (stateErr || !stateRow) {
    return { ok: false, status: 500, error: "state not found" };
  }

  const currentEpoch: number = stateRow.epoch;

  if (stateRow.current_match_id) {
    const { data: matchRow } = await supabase
      .from("matches")
      .select("num_bouts")
      .eq("id", stateRow.current_match_id)
      .maybeSingle();
    const numBouts = typeof matchRow?.num_bouts === "number" ? matchRow.num_bouts : 5;
    if (Number.isInteger(currentEpoch) && currentEpoch >= numBouts) {
      return {
        ok: false,
        status: 409,
        error: "final_bout_reached",
        detail: { epoch: currentEpoch, num_bouts: numBouts },
      };
    }
  }
  const nextEpoch = (Number.isInteger(currentEpoch) && currentEpoch >= 1)
    ? currentEpoch + 1
    : 1;

  const nowIso = new Date().toISOString();

  const { error: updErr } = await supabase
    .from("state")
    .update({
      epoch: nextEpoch,
      accepting: true,
      e3_reached: false,
      updated_at: nowIso,
    })
    .eq("venue_id", venueId);

  if (updErr) {
    console.error("state update error on E6", updErr);
    return { ok: false, status: 500, error: "failed to advance state" };
  }

  await supabase.from("event_log").insert({
    event_type: "E6",
    match_id: stateRow.current_match_id ?? null,
    judge_id: null,
    epoch: nextEpoch,
    detail: {
      from_epoch: currentEpoch,
      to_epoch: nextEpoch,
      ...logDetail,
    },
  });

  return { ok: true, from_epoch: currentEpoch, to_epoch: nextEpoch };
}
