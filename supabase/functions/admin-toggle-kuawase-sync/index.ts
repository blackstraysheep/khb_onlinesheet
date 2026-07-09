// supabase/functions/admin-toggle-kuawase-sync/index.ts
// KHB-Kuawase (kk) 連携の有効/無効を admin.html から切り替える（admin_secret 認証必須）。
// 主用途は緊急時の「連携解除」。kuawase_sync_status.enabled を更新し、
// event_log に KUAWASE_SYNC_TOGGLED を記録する。
// 参照: docs/02-kuawase-integration-impl.md 「OES 側実装」> admin.html
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
      venue_id?: string;
      venue_code?: string;
      enabled?: boolean;
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

    if (typeof body?.enabled !== "boolean") {
      return json({ error: "enabled (boolean) is required" }, corsHeaders, 400);
    }
    const enabled = body.enabled;

    const venueId = typeof body?.venue_id === "string" ? body.venue_id.trim() : "";
    const venueCode = typeof body?.venue_code === "string" ? body.venue_code.trim() : "";
    if (!venueId && !venueCode) {
      return json({ error: "venue_id or venue_code is required" }, corsHeaders, 400);
    }

    // 会場の解決・存在確認
    let venueQuery = supabase.from("venues").select("id, code, name");
    venueQuery = venueId ? venueQuery.eq("id", venueId) : venueQuery.eq("code", venueCode);
    const { data: venue, error: venueError } = await venueQuery.maybeSingle();
    if (venueError) {
      console.error("venues select error", venueError);
      return json({ error: "failed to fetch venue" }, corsHeaders, 500);
    }
    if (!venue) {
      return json({ error: `venue not found: ${venueId || venueCode}` }, corsHeaders, 404);
    }

    const { data: existing, error: existingError } = await supabase
      .from("kuawase_sync_status")
      .select("venue_id, enabled")
      .eq("venue_id", venue.id)
      .maybeSingle();
    if (existingError) {
      console.error("kuawase_sync_status select error", existingError);
      return json({ error: "failed to fetch sync status" }, corsHeaders, 500);
    }

    const nowIso = new Date().toISOString();
    const previousEnabled = existing?.enabled ?? false;

    const { data: updated, error: upsertError } = await supabase
      .from("kuawase_sync_status")
      .upsert({
        venue_id: venue.id,
        enabled,
        updated_at: nowIso,
      }, { onConflict: "venue_id" })
      .select("venue_id, enabled, source_device_id, last_view, last_synced_at")
      .maybeSingle();
    if (upsertError) {
      console.error("kuawase_sync_status upsert error", upsertError);
      return json({ error: "failed to update sync status" }, corsHeaders, 500);
    }

    if (previousEnabled !== enabled) {
      const { error: logError } = await supabase.from("event_log").insert({
        event_type: "KUAWASE_SYNC_TOGGLED",
        match_id: null,
        judge_id: null,
        epoch: null,
        detail: {
          venue_id: venue.id,
          venue_code: venue.code,
          enabled,
          previous_enabled: previousEnabled,
        },
      });
      if (logError) {
        console.error("event_log insert error (non-fatal)", logError);
      }
    }

    return json({
      ok: true,
      venue_code: venue.code,
      status: updated,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
