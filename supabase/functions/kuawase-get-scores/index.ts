// supabase/functions/kuawase-get-scores/index.ts
// KHB-Kuawase の「得点読み上げ」用に、現在試合・現在対戦の審査員と提出得点を返す
// 読み取り専用エンドポイント。OES 管理画面の読み上げパネルと同じデータを
// kk 側で組み立てられるようにする(音声クリップの合成は kk 側で行う)。
//
// - 認可は他の kuawase-* と同じ sync token(会場単位)。
// - state は一切変更しない。event_log にも記録しない(高頻度ポーリングを許容)。
// - 句(haiku)はここでは返さない(句の経路は reveal / snapshot に限定)。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeKuawaseSync, isAllowedKuawaseOrigin } from "../_shared/kuawase-auth.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (!isAllowedKuawaseOrigin(req)) {
    return json({ error: "forbidden origin" }, corsHeaders, 403);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;

    const auth = await authorizeKuawaseSync(supabase, req, body);
    if (!auth.ok) {
      return json({ ok: false, error: auth.error }, corsHeaders, auth.status);
    }
    const venueId = auth.tokenRow.venue_id;

    const { data: stateRow } = await supabase
      .from("state")
      .select("current_match_id, epoch, accepting, e3_reached")
      .eq("venue_id", venueId)
      .maybeSingle();

    if (!stateRow || !stateRow.current_match_id) {
      return json({
        ok: true,
        match: null,
        epoch: stateRow?.epoch ?? null,
        judges: [],
        submissions: [],
      }, corsHeaders);
    }

    const { data: matchRow } = await supabase
      .from("matches")
      .select("id, code, name, num_bouts, red_team_name, white_team_name")
      .eq("id", stateRow.current_match_id)
      .maybeSingle();
    if (!matchRow) {
      return json({ ok: true, match: null, epoch: stateRow.epoch, judges: [], submissions: [] }, corsHeaders);
    }

    const { data: expected } = await supabase
      .from("expected_judges")
      .select("judge_id, sort_order")
      .eq("match_id", matchRow.id)
      .order("sort_order", { ascending: true });
    // deno-lint-ignore no-explicit-any
    const expectedIds = (expected ?? []).map((r: any) => String(r.judge_id));

    // deno-lint-ignore no-explicit-any
    let judgesRows: any[] = [];
    if (expectedIds.length > 0) {
      const { data } = await supabase
        .from("judges")
        .select("id, name, voice_key")
        .in("id", expectedIds);
      judgesRows = data ?? [];
    }
    const judgeById = new Map(judgesRows.map((j) => [String(j.id), j]));

    const { data: subs } = await supabase
      .from("submissions")
      .select(
        "judge_id, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag",
      )
      .eq("match_id", matchRow.id)
      .eq("epoch", stateRow.epoch);

    return json({
      ok: true,
      match: {
        code: matchRow.code,
        name: matchRow.name,
        num_bouts: matchRow.num_bouts,
        red_team_name: matchRow.red_team_name,
        white_team_name: matchRow.white_team_name,
      },
      epoch: stateRow.epoch,
      accepting: stateRow.accepting === true,
      e3_reached: stateRow.e3_reached === true,
      // deno-lint-ignore no-explicit-any
      judges: (expected ?? []).map((r: any) => {
        const j = judgeById.get(String(r.judge_id));
        return {
          judge_id: String(r.judge_id),
          sort_order: r.sort_order ?? 0,
          name: j?.name ?? null,
          voice_key: j?.voice_key ?? null,
        };
      }),
      submissions: subs ?? [],
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "internal error" }, corsHeaders, 500);
  }
});
