// supabase/functions/control_confirm_with_secret/index.ts
// E5(対戦確定)。本体ロジックは _shared/confirm-bout.ts に共通化されており、
// この関数は管理者 secret 認可と入出力の互換維持のみを担う。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";
import { confirmBout } from "../_shared/confirm-bout.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();
const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  if (!isAllowedOrigin(req)) {
    return json({ error: "forbidden origin" }, 403);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const clientSecret =
      typeof body?.admin_secret === "string" ? body.admin_secret.trim() : "";

    if (!adminSecret) {
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        500,
      );
    }
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, 401);
    }

    // 会場を解決
    const venueCode = ((body?.venue_code ?? "default") + "").trim();
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues").select("id").eq("code", venueCode).maybeSingle();
    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, 404);
    }
    const venueId = venueRow.id as string;

    const match_code = body?.match_code;
    if (!match_code) {
      return json({ error: "match_code is required" }, 400);
    }

    const result = await confirmBout({
      supabase,
      venueId,
      venueCode,
      matchCode: String(match_code),
    });

    if (!result.ok) {
      return json({
        error: result.error,
        ...(result.detail ? { detail: result.detail } : {}),
      }, result.status);
    }

    return json({
      ok: true,
      event_type: "E5",
      match_id: result.match_id,
      epoch: result.epoch,
      snapshot_count: result.snapshot_count,
      slot: result.slot,
      slot_label: result.slot_label,
      winner: result.winner,
      red_wins: result.red_wins,
      white_wins: result.white_wins,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
