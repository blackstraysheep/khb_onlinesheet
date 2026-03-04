// supabase/functions/admin-add-judge/index.ts
// 審査員の新規作成とアクセストークン発行
// admin_secret による認証 + venue_code で会場に紐付け
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(body: unknown, status = 200) {
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null) as {
      admin_secret?: string;
      name?: string;
      voice_key?: string;
      venue_code?: string;
      token_prefix?: string;
    } | null;

    // 1. admin_secret 確認
    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string"
      ? body.admin_secret.trim()
      : "";
    if (!clientSecret || clientSecret !== adminSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    // 2. 入力チェック
    const name = (body?.name ?? "").trim();
    if (!name) {
      return json({ error: "name is required" }, 400);
    }
    const voiceKey = (body?.voice_key ?? "").trim() || null;
    const venueCode = (body?.venue_code ?? "default").trim();
    const tokenPrefix = (body?.token_prefix ?? "khb-").trim();

    // 3. 会場を解決
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues")
      .select("id")
      .eq("code", venueCode)
      .maybeSingle();

    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, 404);
    }
    const venueId = venueRow.id as string;

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
          return json({ error: "failed to insert judge" }, 500);
        }
        judgeId = inserted.id as string;
      }
    }

    // 5. この審査員の既存トークンを削除して新規発行
    await supabase
      .from("access_tokens")
      .delete()
      .eq("judge_id", judgeId)
      .eq("venue_id", venueId);

    const token = generateToken(tokenPrefix);
    const { error: tokErr } = await supabase
      .from("access_tokens")
      .insert({ token, judge_id: judgeId, role: "judge", venue_id: venueId });

    if (tokErr) {
      console.error("access_tokens insert error", tokErr);
      return json({ error: "failed to create access token" }, 500);
    }

    return json({
      ok: true,
      judge_id: judgeId,
      judge_name: name,
      token,
      venue_code: venueCode,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
