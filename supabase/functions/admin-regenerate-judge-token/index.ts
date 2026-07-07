// supabase/functions/admin-regenerate-judge-token/index.ts
// 審査員IDを維持したままアクセストークンだけを再発行する。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";
import { sha256Hex, tokenLast4 } from "../_shared/token.ts";

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

function normalizeTokenLength(value: unknown, fallback = 32): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.min(128, Math.max(8, value));
}

function generateToken(prefix = "khb-", tokenLength = 32): string {
  const bytes = new Uint8Array(Math.ceil(tokenLength / 2));
  crypto.getRandomValues(bytes);
  const hex = [...bytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, tokenLength);
  return prefix + hex;
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
      judge_id?: string;
      token_prefix?: string;
      token_length?: number;
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

    const judgeId = (body?.judge_id ?? "").trim();
    if (!judgeId) {
      return json({ error: "judge_id is required" }, corsHeaders, 400);
    }

    const { data: judge, error: judgeError } = await supabase
      .from("judges")
      .select("id, name")
      .eq("id", judgeId)
      .maybeSingle();
    if (judgeError) {
      console.error("judges select error", judgeError);
      return json({ error: "failed to fetch judge" }, corsHeaders, 500);
    }
    if (!judge) {
      return json({ error: "judge not found" }, corsHeaders, 404);
    }

    const tokenPrefix = (body?.token_prefix ?? "khb-").trim();
    const tokenLength = normalizeTokenLength(body?.token_length);
    const token = generateToken(tokenPrefix, tokenLength);
    const tokenHash = await sha256Hex(token);
    const tokenPatch = {
      token: null,
      token_hash: tokenHash,
      token_last4: tokenLast4(token),
      role: "judge",
      revoked_at: null,
      expires_at: null,
      last_used_at: null,
    };

    const { data: existingToken, error: existingTokenError } = await supabase
      .from("access_tokens")
      .select("id")
      .eq("judge_id", judgeId)
      .eq("role", "judge")
      .limit(1)
      .maybeSingle();
    if (existingTokenError) {
      console.error("access_tokens select error", existingTokenError);
      return json({ error: "failed to fetch access token" }, corsHeaders, 500);
    }

    if (existingToken?.id) {
      const { error: updateError } = await supabase
        .from("access_tokens")
        .update(tokenPatch)
        .eq("id", existingToken.id);
      if (updateError) {
        console.error("access_tokens update error", updateError);
        return json({ error: "failed to regenerate access token" }, corsHeaders, 500);
      }
    } else {
      const { error: insertError } = await supabase
        .from("access_tokens")
        .insert({
          ...tokenPatch,
          judge_id: judgeId,
        });
      if (insertError) {
        console.error("access_tokens insert error", insertError);
        return json({ error: "failed to create access token" }, corsHeaders, 500);
      }
    }

    return json({
      ok: true,
      judge_id: String(judge.id),
      judge_name: judge.name,
      token,
      token_visible_once: true,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
