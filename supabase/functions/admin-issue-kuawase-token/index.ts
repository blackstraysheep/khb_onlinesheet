// supabase/functions/admin-issue-kuawase-token/index.ts
// KHB-Kuawase (kk) 連携用の同期トークンを発行する（admin_secret 認証必須）。
// 平文トークンはこのレスポンスでのみ返され、以降 DB には hash のみ保持する。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";
import { sha256Hex, tokenLast4 } from "../_shared/token.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

const DEFAULT_EXPIRES_IN_HOURS = 48;
const MIN_EXPIRES_IN_HOURS = 1;
const MAX_EXPIRES_IN_HOURS = 336;

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generateToken(prefix = "kks-", tokenLength = 32): string {
  const bytes = new Uint8Array(Math.ceil(tokenLength / 2));
  crypto.getRandomValues(bytes);
  const hex = [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, tokenLength);
  return prefix + hex;
}

function clampExpiresInHours(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_EXPIRES_IN_HOURS;
  }
  return Math.min(MAX_EXPIRES_IN_HOURS, Math.max(MIN_EXPIRES_IN_HOURS, Math.round(value)));
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
      label?: string;
      expires_in_hours?: number;
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

    const label = typeof body?.label === "string" ? body.label.trim().slice(0, 200) || null : null;
    const expiresInHours = clampExpiresInHours(body?.expires_in_hours);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const token = generateToken("kks-", 32);
    const tokenHash = await sha256Hex(token);
    const last4 = tokenLast4(token);

    const { error: insertError } = await supabase
      .from("kuawase_sync_tokens")
      .insert({
        token_hash: tokenHash,
        token_last4: last4,
        venue_id: venue.id,
        label,
        expires_at: expiresAt.toISOString(),
      });
    if (insertError) {
      console.error("kuawase_sync_tokens insert error", insertError);
      return json({ error: "failed to issue token" }, corsHeaders, 500);
    }

    // event_log に記録（token 平文は残さない）
    const { error: logError } = await supabase.from("event_log").insert({
      event_type: "KUAWASE_TOKEN_ISSUED",
      match_id: null,
      judge_id: null,
      epoch: null,
      detail: {
        venue_id: venue.id,
        venue_code: venue.code,
        token_last4: last4,
        label,
        expires_at: expiresAt.toISOString(),
      },
    });
    if (logError) {
      console.error("event_log insert error (non-fatal)", logError);
    }

    return json({
      ok: true,
      token,
      token_last4: last4,
      venue_code: venue.code,
      expires_at: expiresAt.toISOString(),
      token_visible_once: true,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
