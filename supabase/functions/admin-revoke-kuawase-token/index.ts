// supabase/functions/admin-revoke-kuawase-token/index.ts
// KHB-Kuawase (kk) 連携トークンを即時失効させる（admin_secret 認証必須）。
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
      token_hash?: string;
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

    const tokenHash = typeof body?.token_hash === "string" ? body.token_hash.trim() : "";
    if (!tokenHash) {
      return json({ error: "token_hash is required" }, corsHeaders, 400);
    }

    const { data: existing, error: fetchError } = await supabase
      .from("kuawase_sync_tokens")
      .select("token_hash, venue_id, token_last4, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (fetchError) {
      console.error("kuawase_sync_tokens select error", fetchError);
      return json({ error: "failed to fetch token" }, corsHeaders, 500);
    }
    if (!existing) {
      return json({ error: "token not found" }, corsHeaders, 404);
    }

    const nowIso = new Date().toISOString();
    if (!existing.revoked_at) {
      const { error: updateError } = await supabase
        .from("kuawase_sync_tokens")
        .update({ revoked_at: nowIso })
        .eq("token_hash", tokenHash);
      if (updateError) {
        console.error("kuawase_sync_tokens update error", updateError);
        return json({ error: "failed to revoke token" }, corsHeaders, 500);
      }

      const { error: logError } = await supabase.from("event_log").insert({
        event_type: "KUAWASE_TOKEN_REVOKED",
        match_id: null,
        judge_id: null,
        epoch: null,
        detail: {
          venue_id: existing.venue_id,
          token_last4: existing.token_last4,
          revoked_at: nowIso,
        },
      });
      if (logError) {
        console.error("event_log insert error (non-fatal)", logError);
      }
    }

    return json({ ok: true, token_hash: tokenHash, revoked_at: existing.revoked_at ?? nowIso }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
