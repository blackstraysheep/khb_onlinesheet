// supabase/functions/control_advance_with_secret/index.ts
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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
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
    } | null;

    const clientSecret =
      typeof body?.admin_secret === "string"
        ? body.admin_secret.trim()
        : "";

    if (!adminSecret) {
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        corsHeaders,
        500,
      );
    }
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, corsHeaders, 401);
    }

    // 会場を解決
    const venueCode = (body?.venue_code ?? "default").trim();
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues").select("id").eq("code", venueCode).maybeSingle();
    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, corsHeaders, 404);
    }
    const venueId = venueRow.id as string;

    // 1. 現在の state を取得
    const { data: stateRow, error: stateErr } = await supabase
      .from("state")
      .select("*")
      .eq("venue_id", venueId)
      .maybeSingle();

    if (stateErr || !stateRow) {
      return json({ error: "state not found" }, corsHeaders, 500);
    }

    const currentEpoch: number = stateRow.epoch;
    const nextEpoch = (Number.isInteger(currentEpoch) &&
      currentEpoch >= 1)
      ? currentEpoch + 1
      : 1;

    const nowIso = new Date().toISOString();

    // 2. state を次対戦用に更新
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
      return json({ error: "failed to advance state" }, corsHeaders, 500);
    }

    // 3. event_log に E6 を記録
    await supabase.from("event_log").insert({
      event_type: "E6",
      match_id: stateRow.current_match_id ?? null,
      judge_id: null,
      epoch: nextEpoch,
      detail: {
        from_epoch: currentEpoch,
        to_epoch: nextEpoch,
      },
    });

    return json({
      ok: true,
      event_type: "E6",
      venue_code: venueCode,
      from_epoch: currentEpoch,
      to_epoch: nextEpoch,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
