// supabase/functions/admin-list-matches/index.ts
// 管理画面用に試合一覧と受付状態を返す（admin_secret 認証必須）
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

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
    } | null;

    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, corsHeaders, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string"
      ? body.admin_secret.trim()
      : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, corsHeaders, 401);
    }

    const [matchesResult, statesResult, venuesResult] = await Promise.all([
      supabase
        .from("matches")
        .select("id,code,name,timeline,num_bouts,red_team_name,white_team_name,kendai_name,kuawase_ref,venue_id,created_at")
        .order("timeline", { ascending: true, nullsFirst: false })
        .order("code", { ascending: true }),
      supabase
        .from("state")
        .select("current_match_id,venue_id,epoch,accepting"),
      supabase
        .from("venues")
        .select("id,code"),
    ]);

    if (matchesResult.error) {
      console.error("matches select error", matchesResult.error);
      return json({ error: "failed to fetch matches" }, corsHeaders, 500);
    }
    if (statesResult.error) {
      console.error("state select error", statesResult.error);
      return json({ error: "failed to fetch states" }, corsHeaders, 500);
    }
    if (venuesResult.error) {
      console.error("venues select error", venuesResult.error);
      return json({ error: "failed to fetch venues" }, corsHeaders, 500);
    }

    const acceptingMatchIds = (statesResult.data ?? [])
      .filter((state) => state.accepting && state.current_match_id)
      .map((state) => state.current_match_id as string);

    let snapshots: { match_id: string; epoch: number }[] = [];
    if (acceptingMatchIds.length > 0) {
      const snapshotsResult = await supabase
        .from("match_snapshots")
        .select("match_id,epoch")
        .in("match_id", acceptingMatchIds);

      if (snapshotsResult.error) {
        console.error("match_snapshots select error", snapshotsResult.error);
        return json({ error: "failed to fetch match snapshots" }, corsHeaders, 500);
      }
      snapshots = snapshotsResult.data ?? [];
    }

    return json({
      ok: true,
      matches: matchesResult.data ?? [],
      states: statesResult.data ?? [],
      venues: venuesResult.data ?? [],
      snapshots,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
