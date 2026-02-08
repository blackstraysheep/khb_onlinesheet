// supabase/functions/control_advance_with_secret/index.ts
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

    // 1. 現在の state を取得
    const { data: stateRow, error: stateErr } = await supabase
      .from("state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (stateErr || !stateRow) {
      return json({ error: "state not found" }, 500);
    }

    const currentEpoch: number = stateRow.epoch;
    const nextEpoch = (typeof currentEpoch === "number" &&
      Number.isInteger(currentEpoch) &&
      currentEpoch >= 1)
      ? currentEpoch + 1
      : 1;

    const nowIso = new Date().toISOString();

    // 2. state を次対戦用に更新
    const { error: updErr } = await supabase
      .from("state")
      .update({
        epoch: nextEpoch,
        accepting: true,
        e3_reached: false,
        updated_at: nowIso,
      })
      .eq("id", 1);

    if (updErr) {
      console.error("state update error on E6", updErr);
      return json({ error: "failed to advance state" }, 500);
    }

    // 3. event_log に E6 を記録（match_id は省略：現仕様では state に持っていない）
    await supabase.from("event_log").insert({
      event_type: "E6",
      match_id: null,
      judge_id: null,
      epoch: nextEpoch,
      detail: {
        from_epoch: currentEpoch,
        to_epoch: nextEpoch,
      },
    });

    return json({
      ok: true,
      event_type: "E6",
      from_epoch: currentEpoch,
      to_epoch: nextEpoch,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
