// supabase/functions/admin-patch-state/index.ts
// state テーブルの部分更新（accepting / scoreboard_visible / epoch）
// admin_secret 認証 + venue_code で対象会場を特定
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
      patch?: {
        accepting?: boolean;
        scoreboard_visible?: boolean;
        epoch?: number;
      };
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

    // 2. patch 内容を検証（許可フィールドのみ）
    const rawPatch = body?.patch ?? {};
    const safePatch: Record<string, unknown> = {};

    if (typeof rawPatch.accepting === "boolean") {
      safePatch.accepting = rawPatch.accepting;
    }
    if (typeof rawPatch.scoreboard_visible === "boolean") {
      safePatch.scoreboard_visible = rawPatch.scoreboard_visible;
    }
    if (
      typeof rawPatch.epoch === "number" &&
      Number.isInteger(rawPatch.epoch) &&
      rawPatch.epoch >= 1
    ) {
      safePatch.epoch = rawPatch.epoch;
    }
    if (Object.keys(safePatch).length === 0) {
      return json({ error: "patch must contain at least one of: accepting, scoreboard_visible, epoch" }, 400);
    }
    safePatch.updated_at = new Date().toISOString();

    // 3. 会場を解決
    const venueCode = (body?.venue_code ?? "default").trim();
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues")
      .select("id")
      .eq("code", venueCode)
      .maybeSingle();

    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, 404);
    }
    const venueId = venueRow.id as string;

    // 4. state を更新
    const { data: updated, error: updErr } = await supabase
      .from("state")
      .update(safePatch)
      .eq("venue_id", venueId)
      .select("accepting, scoreboard_visible, epoch, e3_reached, venue_id, current_match_id")
      .maybeSingle();

    if (updErr) {
      console.error("state patch error", updErr);
      return json({ error: "failed to patch state" }, 500);
    }

    // 4.5. epoch変更時はe3_reachedを自動判定
    if (typeof safePatch.epoch === "number" && updated?.current_match_id) {
      const targetEpoch = safePatch.epoch as number;
      const matchId = updated.current_match_id as string;

      const { data: expectedAll } = await supabase
        .from("expected_judges")
        .select("judge_id")
        .eq("match_id", matchId);

      let e3 = false;
      if (expectedAll && expectedAll.length > 0) {
        const expectedIds = expectedAll.map((r: any) => String(r.judge_id));
        const { data: submittedAll } = await supabase
          .from("submissions")
          .select("judge_id")
          .eq("match_id", matchId)
          .eq("epoch", targetEpoch);

        if (submittedAll) {
          const submittedIds = new Set(submittedAll.map((r: any) => String(r.judge_id)));
          e3 = expectedIds.every((id: string) => submittedIds.has(id));
        }
      }

      if (e3 !== updated.e3_reached) {
        await supabase
          .from("state")
          .update({ e3_reached: e3, updated_at: new Date().toISOString() })
          .eq("venue_id", venueId);
        updated.e3_reached = e3;
      }
    }

    return json({
      ok: true,
      venue_code: venueCode,
      state: updated,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
