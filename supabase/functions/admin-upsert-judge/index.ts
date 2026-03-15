// supabase/functions/admin-upsert-judge/index.ts
// 審査員の新規作成・更新とアクセストークン整備
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
      name?: string;
      voice_key?: string | null;
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
    const name = (body?.name ?? "").trim();
    const voiceKey = typeof body?.voice_key === "string"
      ? body.voice_key.trim() || null
      : null;
    const tokenPrefix = (body?.token_prefix ?? "khb-").trim();
    const tokenLength = normalizeTokenLength(body?.token_length);

    if (!name) {
      return json({ error: "name is required" }, corsHeaders, 400);
    }

    const { data: sameNameJudge, error: sameNameError } = await supabase
      .from("judges")
      .select("id")
      .eq("name", name)
      .maybeSingle();
    if (sameNameError) {
      console.error("judges sameName select error", sameNameError);
      return json({ error: "failed to validate judge name" }, corsHeaders, 500);
    }
    if (sameNameJudge && String(sameNameJudge.id) !== judgeId) {
      return json({ error: "judge name already exists" }, corsHeaders, 409);
    }

    let savedJudgeId = judgeId;
    if (judgeId) {
      const { data: updated, error: updateError } = await supabase
        .from("judges")
        .update({ name, voice_key: voiceKey })
        .eq("id", judgeId)
        .select("id, name, voice_key")
        .maybeSingle();

      if (updateError) {
        console.error("judges update error", updateError);
        if ((updateError as { code?: string }).code === "23505") {
          return json({ error: "voice_key already exists" }, corsHeaders, 409);
        }
        return json({ error: "failed to update judge" }, corsHeaders, 500);
      }
      if (!updated) {
        return json({ error: "judge not found" }, corsHeaders, 404);
      }
      savedJudgeId = String(updated.id);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("judges")
        .insert({ name, voice_key: voiceKey })
        .select("id, name, voice_key")
        .single();

      if (insertError || !inserted) {
        console.error("judges insert error", insertError);
        if ((insertError as { code?: string }).code === "23505") {
          return json({ error: "voice_key already exists" }, corsHeaders, 409);
        }
        return json({ error: "failed to insert judge" }, corsHeaders, 500);
      }
      savedJudgeId = String(inserted.id);
    }

    let token: string;
    const { data: existingToken, error: tokenSelectError } = await supabase
      .from("access_tokens")
      .select("token")
      .eq("judge_id", savedJudgeId)
      .eq("role", "judge")
      .limit(1)
      .maybeSingle();

    if (tokenSelectError) {
      console.error("access_tokens select error", tokenSelectError);
      return json({ error: "failed to fetch access token" }, corsHeaders, 500);
    }

    if (existingToken?.token) {
      token = existingToken.token;
    } else {
      token = generateToken(tokenPrefix, tokenLength);
      const { error: tokenInsertError } = await supabase
        .from("access_tokens")
        .insert({ token, judge_id: savedJudgeId, role: "judge" });

      if (tokenInsertError) {
        console.error("access_tokens insert error", tokenInsertError);
        return json({ error: "failed to create access token" }, corsHeaders, 500);
      }
    }

    return json({
      ok: true,
      judge_id: savedJudgeId,
      judge_name: name,
      voice_key: voiceKey,
      token,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
