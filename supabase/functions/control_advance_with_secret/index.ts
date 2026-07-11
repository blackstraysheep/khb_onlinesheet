// supabase/functions/control_advance_with_secret/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";
import { advanceBout } from "../_shared/confirm-bout.ts";

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

    // E6 本体は共有モジュールへ委譲(num_bouts 超過ガード込み)
    const result = await advanceBout({
      supabase,
      venueId,
      logDetail: { source: "admin_secret" },
    });

    if (!result.ok) {
      return json({
        error: result.error,
        ...(result.detail ? { detail: result.detail } : {}),
      }, corsHeaders, result.status);
    }

    return json({
      ok: true,
      event_type: "E6",
      venue_code: venueCode,
      from_epoch: result.from_epoch,
      to_epoch: result.to_epoch,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
