// supabase/functions/admin-add-judge/index.ts
// 審査員の新規作成とアクセストークン発行
// admin_secret による認証（会場非依存: 1審査員1トークン）
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generateToken(prefix = "khb-"): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
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
      name?: string;
      voice_key?: string;
      token_prefix?: string;
    } | null;

    // 1. admin_secret 確認
    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, corsHeaders, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string"
      ? body.admin_secret.trim()
      : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, corsHeaders, 401);
    }

    // 2. 入力チェック
    const name = (body?.name ?? "").trim();
    if (!name) {
      return json({ error: "name is required" }, corsHeaders, 400);
    }
    const voiceKey = (body?.voice_key ?? "").trim() || null;
    const tokenPrefix = (body?.token_prefix ?? "khb-").trim();

    // 4. judges テーブルに upsert（同名なら voice_key を更新）
    let judgeId: string;
    {
      const { data: existing } = await supabase
        .from("judges")
        .select("id, name")
        .eq("name", name)
        .maybeSingle();

      if (existing) {
        judgeId = existing.id as string;
        if (voiceKey) {
          await supabase
            .from("judges")
            .update({ voice_key: voiceKey })
            .eq("id", judgeId);
        }
      } else {
        const insertPayload: Record<string, unknown> = { name };
        if (voiceKey) insertPayload.voice_key = voiceKey;

        const { data: inserted, error: insErr } = await supabase
          .from("judges")
          .insert(insertPayload)
          .select("id, name")
          .single();

        if (insErr || !inserted) {
          console.error("judges insert error", insErr);
          return json({ error: "failed to insert judge" }, corsHeaders, 500);
        }
        judgeId = inserted.id as string;
      }
    }

    // 5. この審査員の既存トークンを確認（あれば再利用）
    let token: string;
    {
      const { data: existingToken } = await supabase
        .from("access_tokens")
        .select("token")
        .eq("judge_id", judgeId)
        .eq("role", "judge")
        .limit(1)
        .maybeSingle();

      if (existingToken) {
        token = existingToken.token as string;
      } else {
        token = generateToken(tokenPrefix);
        const { error: tokErr } = await supabase
          .from("access_tokens")
          .insert({ token, judge_id: judgeId, role: "judge" });

        if (tokErr) {
          console.error("access_tokens insert error", tokErr);
          return json({ error: "failed to create access token" }, corsHeaders, 500);
        }
      }
    }

    return json({
      ok: true,
      judge_id: judgeId,
      judge_name: name,
      token,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
