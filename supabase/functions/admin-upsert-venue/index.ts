// supabase/functions/admin-upsert-venue/index.ts
// 会場の作成・名称変更(管理用)。
// 会場は従来 migration の seed('default')か DB 直接操作でしか作れなかったため、
// 管理画面から作成できるようにする。作成時は state 行(進行状態)も必ず用意する
// (state が無い会場は試合開始時に落ちるため)。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";
import { sanitizeText } from "../_shared/sanitize.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

const VENUE_CODE_RE = /^[A-Za-z0-9_-]{1,32}$/;

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  if (!isAllowedOrigin(req)) {
    return json({ error: "forbidden origin" }, 403);
  }
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
      venue_name?: string;
    } | null;

    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string" ? body.admin_secret.trim() : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, 401);
    }

    const venueCode = typeof body?.venue_code === "string" ? body.venue_code.trim() : "";
    if (!VENUE_CODE_RE.test(venueCode)) {
      return json({
        error: "venue_code must be 1-32 chars of letters, digits, '-' or '_'",
      }, 400);
    }
    const venueName = sanitizeText(body?.venue_name);
    if (!venueName) {
      return json({ error: "venue_name is required" }, 400);
    }

    // 会場を upsert(code で一意)
    const { data: existing, error: selErr } = await supabase
      .from("venues")
      .select("id, code, name")
      .eq("code", venueCode)
      .maybeSingle();
    if (selErr) {
      return json({ error: "failed to load venue" }, 500);
    }

    let venueId: string;
    let created = false;
    if (existing) {
      venueId = existing.id as string;
      const { error: updErr } = await supabase
        .from("venues")
        .update({ name: venueName })
        .eq("id", venueId);
      if (updErr) {
        console.error("venues update error", updErr);
        return json({ error: "failed to update venue" }, 500);
      }
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from("venues")
        .insert({ code: venueCode, name: venueName })
        .select("id")
        .single();
      if (insErr || !inserted) {
        console.error("venues insert error", insErr);
        return json({ error: "failed to create venue" }, 500);
      }
      venueId = inserted.id as string;
      created = true;
    }

    // state 行を必ず用意する(既にあれば触らない)
    const nowIso = new Date().toISOString();
    const { error: stateErr } = await supabase
      .from("state")
      .upsert({
        venue_id: venueId,
        epoch: 1,
        accepting: false,
        e3_reached: false,
        scoreboard_visible: false,
        red_wins: 0,
        white_wins: 0,
        wins_updated_at: nowIso,
        updated_at: nowIso,
      }, { onConflict: "venue_id", ignoreDuplicates: true });
    if (stateErr) {
      console.error("state upsert error", stateErr);
      return json({ error: "venue saved but failed to ensure state row" }, 500);
    }

    await supabase.from("event_log").insert({
      event_type: "ADMIN_UPSERT_VENUE",
      match_id: null,
      judge_id: null,
      epoch: null,
      detail: { venue_id: venueId, venue_code: venueCode, venue_name: venueName, created },
    });

    return json({
      ok: true,
      created,
      venue: { id: venueId, code: venueCode, name: venueName },
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
