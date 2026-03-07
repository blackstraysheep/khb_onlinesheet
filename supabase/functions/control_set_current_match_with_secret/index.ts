// supabase/functions/control_set_current_match_with_secret/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null) as {
      admin_secret?: string;
      venue_code?: string;
      match_code?: string;
      epoch?: number;
    } | null;

    const clientSecret =
      typeof body?.admin_secret === "string"
        ? body.admin_secret.trim()
        : "";

    if (!adminSecret) {
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        500,
      );
    }
    if (!clientSecret || clientSecret !== adminSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    // 会場を解決
    const venueCode = (body?.venue_code ?? "default").trim();
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues").select("id").eq("code", venueCode).maybeSingle();
    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, 404);
    }
    const venueId = venueRow.id as string;

    const match_code = body?.match_code?.trim();
    if (!match_code) {
      return json({ error: "match_code is required" }, 400);
    }

    let epoch = body?.epoch;
    if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
      epoch = 1;
    }

    // 1. 対戦取得
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("id, code, name, venue_id")
      .eq("code", match_code)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return json({ error: "match not found" }, 404);
    }

    // 試合の会場と指定会場が一致するか検証
    if (String(matchRow.venue_id) !== venueId) {
      return json({ error: `match '${match_code}' belongs to a different venue` }, 403);
    }

    const match_id: string = matchRow.id as string;
    const nowIso = new Date().toISOString();

    // ★ 競合チェック: この試合の期待審査員が他のアクティブ試合にも登録されていないか
    // 対象試合の expected_judges を取得
    const { data: targetExpected } = await supabase
      .from("expected_judges")
      .select("judge_id")
      .eq("match_id", match_id);
    const targetJudgeIds = (targetExpected ?? []).map((r: any) => String(r.judge_id));

    // 対象試合の timeline を取得
    const { data: targetMatchFull } = await supabase
      .from("matches")
      .select("timeline")
      .eq("id", match_id)
      .maybeSingle();
    const targetTimeline = targetMatchFull?.timeline ?? null;

    type Conflict = {
      judge_id: string;
      judge_name: string | null;
      other_match_code: string;
      other_match_name: string | null;
      other_timeline: number | null;
      same_timeline: boolean;
    };
    const conflicts: Conflict[] = [];

    if (targetJudgeIds.length > 0) {
      // accepting=true の全 state を取得（自分自身の venue 含む）
      const { data: allActiveStates } = await supabase
        .from("state")
        .select("venue_id, current_match_id, epoch")
        .eq("accepting", true);

      // 自分自身の match 以外で current_match_id が設定されているもの
      const otherMatchIds = (allActiveStates ?? [])
        .map((s: any) => String(s.current_match_id))
        .filter((mid: string) => mid && mid !== match_id);

      if (otherMatchIds.length > 0) {
        // それら他試合の expected_judges を取得
        const { data: otherExpected } = await supabase
          .from("expected_judges")
          .select("match_id, judge_id")
          .in("match_id", otherMatchIds)
          .in("judge_id", targetJudgeIds);

        if (otherExpected && otherExpected.length > 0) {
          // 他試合の match 情報を取得
          const otherMatchIdSet = [...new Set(otherExpected.map((r: any) => String(r.match_id)))];
          const { data: otherMatches } = await supabase
            .from("matches")
            .select("id, code, name, num_bouts, timeline")
            .in("id", otherMatchIdSet);
          const otherMatchMap = new Map((otherMatches ?? []).map((m: any) => [String(m.id), m]));

          // 他試合のスナップショットで完了判定
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

          // 審査員名を取得
          const conflictJudgeIds = [...new Set(otherExpected.map((r: any) => String(r.judge_id)))];
          const { data: judgeRows } = await supabase
            .from("judges")
            .select("id, name")
            .in("id", conflictJudgeIds);
          const judgeNameMap = new Map((judgeRows ?? []).map((j: any) => [String(j.id), j.name ?? null]));

          for (const row of otherExpected) {
            const omid = String(row.match_id);
            const om = otherMatchMap.get(omid);
            if (!om) continue;

            // 完了済み（最終epoch確定済み）なら競合ではない
            const numBouts = typeof om.num_bouts === "number" ? om.num_bouts : 5;
            const maxConfirmed = otherMaxEpoch.get(omid) ?? 0;
            if (maxConfirmed >= numBouts) continue;

            const otherTl = om.timeline ?? null;
            const sameTl = targetTimeline !== null && otherTl !== null && targetTimeline === otherTl;

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
      return json({
        error: "same_timeline_conflict",
        message: "同一タイムラインで審査中の審査員がいるため、試合を開始できません。",
        conflicts: sameTimelineConflicts,
      }, 409);
    }

    // ★追加：この match_id に既存スナップショットがあれば勝数を復元（なければ 0）
    const { data: snaps, error: snapsErr } = await supabase
      .from("match_snapshots")
      .select("winner")
      .eq("match_id", match_id);

    if (snapsErr) {
      console.error("match_snapshots load error on SET_MATCH", snapsErr);
      return json({ error: "failed to load snapshots for win tally" }, 500);
    }

    const red_wins = (snaps ?? []).filter((r: any) => r.winner === "red").length;
    const white_wins = (snaps ?? []).filter((r: any) => r.winner === "white").length;

    // ★ E3 判定: 当該 epoch で全期待審査員が提出済みか確認
    let e3_reached = false;
    const { data: expectedRows } = await supabase
      .from("expected_judges")
      .select("judge_id")
      .eq("match_id", match_id);
    const expectedIds = (expectedRows ?? []).map((r: any) => r.judge_id as string);

    if (expectedIds.length > 0) {
      const { data: subRows } = await supabase
        .from("submissions")
        .select("judge_id")
        .eq("match_id", match_id)
        .eq("epoch", epoch);
      const submittedIds = new Set((subRows ?? []).map((r: any) => r.judge_id as string));
      e3_reached = expectedIds.every((id: string) => submittedIds.has(id));
    }

    // 2. state を更新（current_match_id, epoch, accepting, e3_reached）
    const { error: updErr } = await supabase
      .from("state")
      .update({
        current_match_id: match_id,
        epoch,
        accepting: true,
        e3_reached,
       
        // ★変更：常に0ではなく、既存記録があれば再計算値を入れる
        red_wins,
        white_wins,
        wins_updated_at: nowIso,
        
        updated_at: nowIso,
      })
      .eq("venue_id", venueId);

    if (updErr) {
      console.error("state update error on SET_MATCH", updErr);
      return json({ error: "failed to set current match" }, 500);
    }

    // 3. event_log に記録
    await supabase.from("event_log").insert({
      event_type: "SET_MATCH",
      match_id,
      judge_id: null,
      epoch,
      detail: {
        match_id,
        match_code,
        epoch,
      },
    });

    // 異なるタイムラインの競合があれば warnings として返す
    const diffTimelineConflicts = conflicts.filter((c) => !c.same_timeline);

    return json({
      ok: true,
      match: {
        id: match_id,
        code: matchRow.code,
        name: matchRow.name,
      },
      epoch,
      accepting: true,
      ...(diffTimelineConflicts.length > 0 ? { warnings: diffTimelineConflicts } : {}),
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
