// supabase/functions/admin-set-match-judges/index.ts
// 試合の作成/更新 + 期待審査員の設定（一括）
// admin_secret による認証 + venue_code で会場に紐付け
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { timingSafeEqual } from "../_shared/secret.ts";

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
      venue_code?: string;
      match_code?: string;
      match_name?: string | null;
      red_team_name?: string | null;
      white_team_name?: string | null;
      num_bouts?: number;
      timeline?: number;
      judge_ids?: string[]; // 順序つき uuid 配列
    } | null;

    // 1. admin_secret 確認
    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string"
      ? body.admin_secret.trim()
      : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, 401);
    }

    // 2. 入力チェック
    const matchCode = (body?.match_code ?? "").trim();
    if (!matchCode) {
      return json({ error: "match_code is required" }, 400);
    }
    const judgeIds = body?.judge_ids;
    if (!Array.isArray(judgeIds) || judgeIds.length === 0) {
      return json({ error: "judge_ids array is required (min 1)" }, 400);
    }
    const venueCode = (body?.venue_code ?? "default").trim();

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

    // 4. matches を upsert（code で一意）
    let matchId: string;
    {
      const { data: existing } = await supabase
        .from("matches")
        .select("id, code, name")
        .eq("code", matchCode)
        .maybeSingle();

      const patchFields: Record<string, unknown> = {};
      if (body?.match_name !== undefined) patchFields.name = body.match_name;
      if (body?.red_team_name !== undefined) patchFields.red_team_name = body.red_team_name;
      if (body?.white_team_name !== undefined) patchFields.white_team_name = body.white_team_name;
      if (body?.num_bouts !== undefined) patchFields.num_bouts = body.num_bouts;
      if (body?.timeline !== undefined) patchFields.timeline = body.timeline;

      if (existing) {
        matchId = existing.id as string;
        if (Object.keys(patchFields).length > 0) {
          const { error: updErr } = await supabase
            .from("matches")
            .update(patchFields)
            .eq("id", matchId);
          if (updErr) {
            console.error("matches update error", updErr);
            return json({ error: "failed to update match" }, 500);
          }
        }
      } else {
        const insertPayload: Record<string, unknown> = { code: matchCode, venue_id: venueId, ...patchFields };
        const { data: inserted, error: insErr } = await supabase
          .from("matches")
          .insert(insertPayload)
          .select("id, code, name")
          .single();

        if (insErr || !inserted) {
          console.error("matches insert error", insErr);
          return json({ error: "failed to insert match" }, 500);
        }
        matchId = inserted.id as string;
      }
    }

    // 5. expected_judges をリセット（既存分を削除して再挿入）
    const { error: delErr } = await supabase
      .from("expected_judges")
      .delete()
      .eq("match_id", matchId);

    if (delErr) {
      console.error("expected_judges delete error", delErr);
      return json({ error: "failed to clear expected_judges" }, 500);
    }

    const ejRows = judgeIds.map((jid, idx) => ({
      match_id: matchId,
      judge_id: jid,
      sort_order: idx + 1,
    }));

    const { error: ejInsErr } = await supabase
      .from("expected_judges")
      .insert(ejRows);

    if (ejInsErr) {
      console.error("expected_judges insert error", ejInsErr);
      return json({ error: "failed to insert expected_judges" }, 500);
    }

    return json({
      ok: true,
      match: {
        id: matchId,
        code: matchCode,
      },
      judge_count: judgeIds.length,
      venue_code: venueCode,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
