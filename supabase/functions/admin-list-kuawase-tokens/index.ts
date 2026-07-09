// supabase/functions/admin-list-kuawase-tokens/index.ts
// KHB-Kuawase (kk) 連携トークンの一覧を返す（admin_secret 認証必須）。
// 平文トークンは保存していないため返せない。token_hash は revoke 操作の識別子として返す。
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

    const { data, error } = await supabase
      .from("kuawase_sync_tokens")
      .select(
        "token_hash, token_last4, label, device_id, created_at, expires_at, revoked_at, last_seen_at, venue_id, venues(code, name)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("kuawase_sync_tokens select error", error);
      return json({ error: "failed to fetch tokens" }, corsHeaders, 500);
    }

    type VenueJoin = { code: string | null; name: string | null } | null;
    const tokens = (data ?? []).map((row) => {
      const venue = (row as unknown as { venues: VenueJoin }).venues;
      return {
        token_hash: row.token_hash,
        token_last4: row.token_last4,
        label: row.label,
        venue_id: row.venue_id,
        venue_code: venue?.code ?? null,
        venue_name: venue?.name ?? null,
        device_id: row.device_id,
        created_at: row.created_at,
        expires_at: row.expires_at,
        revoked_at: row.revoked_at,
        last_seen_at: row.last_seen_at,
      };
    });

    return json({ ok: true, tokens }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
