// supabase/functions/control_set_current_match_with_secret/index.ts
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
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
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
      match_code?: string;
      epoch?: number;
    } | null;

    const clientSecret =
      typeof body?.admin_secret === "string"
        ? body.admin_secret.trim()
        : "";

    if (!adminSecret) {
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        500,
      );
    }
    if (!clientSecret || clientSecret !== adminSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    const match_code = body?.match_code?.trim();
    if (!match_code) {
      return json({ error: "match_code is required" }, 400);
    }

    let epoch = body?.epoch;
    if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
      epoch = 1;
    }

    // 1. 対戦取得
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("id, code, name")
      .eq("code", match_code)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return json({ error: "match not found" }, 404);
    }

    const match_id: string = matchRow.id as string;
    const nowIso = new Date().toISOString();

    // ★追加：この match_id に既存スナップショットがあれば勝数を復元（なければ 0）
    const { data: snaps, error: snapsErr } = await supabase
      .from("match_snapshots")
      .select("winner")
      .eq("match_id", match_id);

    if (snapsErr) {
      console.error("match_snapshots load error on SET_MATCH", snapsErr);
      return json({ error: "failed to load snapshots for win tally" }, 500);
    }

    const red_wins = (snaps ?? []).filter((r: any) => r.winner === "red").length;
    const white_wins = (snaps ?? []).filter((r: any) => r.winner === "white").length;

    // 2. state を更新（current_match_id, epoch, accepting, e3_reached）
    const { error: updErr } = await supabase
      .from("state")
      .update({
        current_match_id: match_id,
        epoch,
        accepting: true,
        e3_reached: false,
       
        // ★変更：常に0ではなく、既存記録があれば再計算値を入れる
        red_wins,
        white_wins,
        wins_updated_at: nowIso,
        
        updated_at: nowIso,
      })
      .eq("id", 1);

    if (updErr) {
      console.error("state update error on SET_MATCH", updErr);
      return json({ error: "failed to set current match" }, 500);
    }

    // 3. event_log に記録
    await supabase.from("event_log").insert({
      event_type: "SET_MATCH",
      match_id,
      judge_id: null,
      epoch,
      detail: {
        match_id,
        match_code,
        epoch,
      },
    });

    return json({
      ok: true,
      match: {
        id: match_id,
        code: matchRow.code,
        name: matchRow.name,
      },
      epoch,
      accepting: true,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
