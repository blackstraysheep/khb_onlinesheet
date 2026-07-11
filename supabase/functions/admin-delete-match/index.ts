// supabase/functions/admin-delete-match/index.ts
// 試合の削除(管理用)。関連する子テーブル(expected_judges / submissions /
// match_snapshots / event_log)ごと削除する。
//
// 安全策:
// - どこかの会場 state で current_match_id になっている試合は削除できない
//   (先に別の試合を開始するか、試合を切り替えてから削除する)。
// - 削除は ADMIN_DELETE_MATCH として event_log に記録する(match_id は null、
//   detail に code 等を残す)。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

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
      match_code?: string;
    } | null;

    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string" ? body.admin_secret.trim() : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, 401);
    }

    const matchCode = typeof body?.match_code === "string" ? body.match_code.trim() : "";
    if (!matchCode) {
      return json({ error: "match_code is required" }, 400);
    }

    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("id, code, name, venue_id")
      .eq("code", matchCode)
      .maybeSingle();
    if (matchErr) {
      return json({ error: "failed to load match" }, 500);
    }
    if (!matchRow) {
      return json({ error: `match not found: ${matchCode}` }, 404);
    }

    // 進行中(current_match_id)の試合は削除不可
    const { data: usingStates } = await supabase
      .from("state")
      .select("venue_id")
      .eq("current_match_id", matchRow.id);
    if (usingStates && usingStates.length > 0) {
      return json({
        error: "match_in_progress",
        detail: "この試合は現在試合(current_match)に設定されています。別の試合を開始してから削除してください。",
      }, 409);
    }

    // 子テーブルから順に削除
    const children: Array<[string, string]> = [
      ["submissions", "match_id"],
      ["expected_judges", "match_id"],
      ["match_snapshots", "match_id"],
      ["event_log", "match_id"],
    ];
    for (const [table, column] of children) {
      const { error } = await supabase.from(table).delete().eq(column, matchRow.id);
      if (error) {
        console.error(`failed to delete from ${table}`, error);
        return json({ error: `failed to delete related rows (${table})` }, 500);
      }
    }

    const { error: delErr } = await supabase.from("matches").delete().eq("id", matchRow.id);
    if (delErr) {
      console.error("failed to delete match", delErr);
      return json({ error: "failed to delete match" }, 500);
    }

    await supabase.from("event_log").insert({
      event_type: "ADMIN_DELETE_MATCH",
      match_id: null,
      judge_id: null,
      epoch: null,
      detail: {
        match_code: matchRow.code,
        match_name: matchRow.name,
        venue_id: matchRow.venue_id,
        deleted_match_id: matchRow.id,
      },
    });

    return json({ ok: true, deleted: { match_code: matchRow.code } });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
