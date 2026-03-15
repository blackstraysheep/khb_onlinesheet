// supabase/functions/admin-patch-state/index.ts
// state テーブルの部分更新（accepting / scoreboard_visible / epoch）
// admin_secret 認証 + venue_code で対象会場を特定
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

type StateRow = {
  accepting: boolean | null;
  current_match_id: string | null;
};

type MatchRow = {
  id: string;
  code: string;
  name: string | null;
  num_bouts: number | null;
  timeline: number | null;
};

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (!isAllowedOrigin(req)) {
    return json({ error: "forbidden origin" }, corsHeaders, 403);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => null) as {
      admin_secret?: string;
      venue_code?: string;
      patch?: {
        accepting?: boolean;
        scoreboard_visible?: boolean;
        epoch?: number;
      };
    } | null;

    // 1. admin_secret 確認
    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, corsHeaders, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string"
      ? body.admin_secret.trim()
      : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, corsHeaders, 401);
    }

    // 2. patch 内容を検証（許可フィールドのみ）
    const rawPatch = body?.patch ?? {};
    const safePatch: Record<string, unknown> = {};

    if (typeof rawPatch.accepting === "boolean") {
      safePatch.accepting = rawPatch.accepting;
    }
    if (typeof rawPatch.scoreboard_visible === "boolean") {
      safePatch.scoreboard_visible = rawPatch.scoreboard_visible;
    }
    if (
      typeof rawPatch.epoch === "number" &&
      Number.isInteger(rawPatch.epoch) &&
      rawPatch.epoch >= 1
    ) {
      safePatch.epoch = rawPatch.epoch;
    }
    if (Object.keys(safePatch).length === 0) {
      return json({ error: "patch must contain at least one of: accepting, scoreboard_visible, epoch" }, corsHeaders, 400);
    }
    safePatch.updated_at = new Date().toISOString();

    // 3. 会場を解決
    const venueCode = (body?.venue_code ?? "default").trim();
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues")
      .select("id")
      .eq("code", venueCode)
      .maybeSingle();

    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, corsHeaders, 404);
    }
    const venueId = venueRow.id as string;

    const { data: currentState, error: currentStateErr } = await supabase
      .from("state")
      .select("accepting, current_match_id")
      .eq("venue_id", venueId)
      .maybeSingle();

    if (currentStateErr || !currentState) {
      return json({ error: "state not found" }, corsHeaders, 404);
    }

    const resolvedCurrentState = currentState as StateRow;
    const isExplicitAcceptingRestart = safePatch.accepting === true &&
      resolvedCurrentState.accepting !== true;

    if (isExplicitAcceptingRestart && resolvedCurrentState.current_match_id) {
      const targetMatchId = String(resolvedCurrentState.current_match_id);

      const { data: targetExpected } = await supabase
        .from("expected_judges")
        .select("judge_id")
        .eq("match_id", targetMatchId);
      const targetJudgeIds = (targetExpected ?? []).map((r: any) => String(r.judge_id));

      const { data: targetMatch } = await supabase
        .from("matches")
        .select("id, code, name, num_bouts, timeline")
        .eq("id", targetMatchId)
        .maybeSingle() as { data: MatchRow | null; error: unknown };

      if (!targetMatch) {
        return json({ error: "current match not found" }, corsHeaders, 404);
      }

      if (targetJudgeIds.length > 0) {
        const { data: allActiveStates } = await supabase
          .from("state")
          .select("venue_id, current_match_id")
          .eq("accepting", true);

        const otherMatchIds = (allActiveStates ?? [])
          .filter((row: any) => String(row.venue_id) !== venueId)
          .map((row: any) => String(row.current_match_id))
          .filter((matchId: string) => matchId && matchId !== targetMatchId);

        if (otherMatchIds.length > 0) {
          const { data: otherExpected } = await supabase
            .from("expected_judges")
            .select("match_id, judge_id")
            .in("match_id", otherMatchIds)
            .in("judge_id", targetJudgeIds);

          if (otherExpected && otherExpected.length > 0) {
            const otherMatchIdSet = [...new Set(otherExpected.map((row: any) => String(row.match_id)))];
            const { data: otherMatches } = await supabase
              .from("matches")
              .select("id, code, name, num_bouts, timeline")
              .in("id", otherMatchIdSet) as { data: MatchRow[] | null; error: unknown };
            const otherMatchMap = new Map<string, MatchRow>(
              (otherMatches ?? []).map((match) => [String(match.id), match]),
            );

            const { data: otherSnaps } = await supabase
              .from("match_snapshots")
              .select("match_id, epoch")
              .in("match_id", otherMatchIdSet);
            const otherMaxEpoch = new Map<string, number>();
            for (const snap of (otherSnaps ?? [])) {
              const matchId = String(snap.match_id);
              const currentMax = otherMaxEpoch.get(matchId) ?? 0;
              if (snap.epoch > currentMax) otherMaxEpoch.set(matchId, snap.epoch);
            }

            const conflictJudgeIds = [...new Set(otherExpected.map((row: any) => String(row.judge_id)))];
            const { data: judgeRows } = await supabase
              .from("judges")
              .select("id, name")
              .in("id", conflictJudgeIds);
            const judgeNameMap = new Map<string, string | null>(
              (judgeRows ?? []).map((judge: any) => [String(judge.id), judge.name ?? null]),
            );

            const conflicts = [];
            for (const row of otherExpected) {
              const otherMatchId = String(row.match_id);
              const otherMatchRow = otherMatchMap.get(otherMatchId);
              if (!otherMatchRow) continue;

              const numBouts = typeof otherMatchRow.num_bouts === "number"
                ? otherMatchRow.num_bouts
                : 5;
              const maxConfirmed = otherMaxEpoch.get(otherMatchId) ?? 0;
              if (maxConfirmed >= numBouts) continue;

              const sameTimeline = targetMatch.timeline !== null &&
                otherMatchRow.timeline !== null &&
                targetMatch.timeline === otherMatchRow.timeline;
              if (!sameTimeline) continue;

              conflicts.push({
                judge_id: String(row.judge_id),
                judge_name: judgeNameMap.get(String(row.judge_id)) ?? null,
                other_match_code: otherMatchRow.code,
                other_match_name: otherMatchRow.name ?? null,
                other_timeline: otherMatchRow.timeline ?? null,
                same_timeline: true,
              });
            }

            if (conflicts.length > 0) {
              return json({
                error: "same_timeline_conflict",
                message: "同一タイムラインで審査中の審査員がいるため、受付を再開できません。",
                conflicts,
              }, corsHeaders, 409);
            }
          }
        }
      }
    }

    // 4. state を更新
    const { data: updated, error: updErr } = await supabase
      .from("state")
      .update(safePatch)
      .eq("venue_id", venueId)
      .select("accepting, scoreboard_visible, epoch, e3_reached, venue_id, current_match_id")
      .maybeSingle();

    if (updErr) {
      console.error("state patch error", updErr);
      return json({ error: "failed to patch state" }, corsHeaders, 500);
    }

    // 4.5. epoch変更時はe3_reachedを自動判定
    if (typeof safePatch.epoch === "number" && updated?.current_match_id) {
      const targetEpoch = safePatch.epoch as number;
      const matchId = updated.current_match_id as string;

      const { data: expectedAll } = await supabase
        .from("expected_judges")
        .select("judge_id")
        .eq("match_id", matchId);

      let e3 = false;
      if (expectedAll && expectedAll.length > 0) {
        const expectedIds = expectedAll.map((r: any) => String(r.judge_id));
        const { data: submittedAll } = await supabase
          .from("submissions")
          .select("judge_id")
          .eq("match_id", matchId)
          .eq("epoch", targetEpoch);

        if (submittedAll) {
          const submittedIds = new Set(submittedAll.map((r: any) => String(r.judge_id)));
          e3 = expectedIds.every((id: string) => submittedIds.has(id));
        }
      }

      if (e3 !== updated.e3_reached) {
        await supabase
          .from("state")
          .update({ e3_reached: e3, updated_at: new Date().toISOString() })
          .eq("venue_id", venueId);
        updated.e3_reached = e3;
      }
    }

    return json({
      ok: true,
      venue_code: venueCode,
      state: updated,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
