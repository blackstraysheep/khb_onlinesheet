// supabase/functions/kuawase-sync-connect/index.ts
// KHB-Kuawase からの接続テスト兼、当日の初期化 API。
// venue / state / 候補データの excel_hash / プリセット一覧を返す。
// 参照: docs/02-kuawase-integration-impl.md 「API」> kuawase-sync-connect
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeKuawaseSync, isAllowedKuawaseOrigin } from "../_shared/kuawase-auth.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

type ConnectBody = {
  event_id?: unknown;
  device_id?: unknown;
  takeover?: unknown;
  excel_hash?: unknown;
};

type MatchPresetRow = {
  code: string;
  red_team_name: string | null;
  white_team_name: string | null;
  kendai_name: string | null;
  num_bouts: number | null;
  timeline: number | null;
  kuawase_ref: {
    red_cell?: string;
    white_cell?: string;
    kendai_cell?: string;
  } | null;
};

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (!isAllowedKuawaseOrigin(req)) {
    return json({ error: "forbidden origin" }, corsHeaders, 403);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => null) as ConnectBody | null;

    // 1. sync token 認可 + device バインド（takeover 対応）
    const auth = await authorizeKuawaseSync(supabase, req, body);
    if (!auth.ok) {
      return json({ ok: false, error: auth.error }, corsHeaders, auth.status);
    }
    const { tokenRow, deviceWarning } = auth;
    const venueId = tokenRow.venue_id;

    const eventId = typeof body?.event_id === "string" ? body.event_id.trim() : "";
    if (!eventId) {
      return json({ ok: false, error: "event_id is required" }, corsHeaders, 400);
    }
    const idempotent = tokenRow.last_event_id === eventId;

    const warnings: Array<Record<string, unknown>> = [];
    if (deviceWarning) {
      warnings.push({ code: deviceWarning.code, detail: deviceWarning.detail });
    }

    // 2. venue 情報
    const { data: venueRow, error: venueError } = await supabase
      .from("venues")
      .select("id, code, name")
      .eq("id", venueId)
      .maybeSingle();
    if (venueError) {
      console.error("venues select error", venueError);
      return json({ ok: false, error: "failed to load venue" }, corsHeaders, 500);
    }
    if (!venueRow) {
      return json({ ok: false, error: "venue not found" }, corsHeaders, 404);
    }

    // 3. state（進行状態）
    const { data: stateRow, error: stateError } = await supabase
      .from("state")
      .select("current_match_id, epoch, accepting, e3_reached")
      .eq("venue_id", venueId)
      .maybeSingle();
    if (stateError) {
      console.error("state select error", stateError);
      return json({ ok: false, error: "failed to load state" }, corsHeaders, 500);
    }

    // 4. 候補データ（excel_hash / compe_name）
    const { data: candidatesRow, error: candidatesError } = await supabase
      .from("kuawase_candidates")
      .select("excel_hash, compe_name")
      .eq("venue_id", venueId)
      .maybeSingle();
    if (candidatesError) {
      console.error("kuawase_candidates select error", candidatesError);
      return json({ ok: false, error: "failed to load candidates" }, corsHeaders, 500);
    }
    if (!candidatesRow) {
      warnings.push({ code: "NO_CANDIDATES", detail: "no candidate data has been imported for this venue" });
    }

    const bodyExcelHash = typeof body?.excel_hash === "string" ? body.excel_hash.trim() : "";
    if (bodyExcelHash && candidatesRow?.excel_hash && bodyExcelHash !== candidatesRow.excel_hash) {
      warnings.push({
        code: "EXCEL_HASH_MISMATCH",
        detail: `local excel_hash (${bodyExcelHash}) differs from imported excel_hash (${candidatesRow.excel_hash})`,
      });
    }

    // 5. プリセット一覧（kuawase_ref が設定済みの matches を timeline 順に整形）
    const { data: matchRows, error: matchesError } = await supabase
      .from("matches")
      .select("code, red_team_name, white_team_name, kendai_name, num_bouts, timeline, kuawase_ref")
      .eq("venue_id", venueId)
      .not("kuawase_ref", "is", null)
      .order("timeline", { ascending: true });
    if (matchesError) {
      console.error("matches select error (presets)", matchesError);
      return json({ ok: false, error: "failed to load presets" }, corsHeaders, 500);
    }

    const presets = ((matchRows ?? []) as MatchPresetRow[]).map((m) => {
      const ref = m.kuawase_ref ?? {};
      return {
        code: m.code,
        red: { cell: ref.red_cell ?? null, name: m.red_team_name ?? null },
        white: { cell: ref.white_cell ?? null, name: m.white_team_name ?? null },
        kendai: { cell: ref.kendai_cell ?? null, name: m.kendai_name ?? null },
        num_bouts: m.num_bouts,
        timeline_order: m.timeline,
      };
    });

    // 6. kuawase_sync_status を upsert（連携有効化 + 接続端末を記録）
    const nowIso = new Date().toISOString();
    const { error: statusError } = await supabase
      .from("kuawase_sync_status")
      .upsert({
        venue_id: venueId,
        enabled: true,
        source_device_id: tokenRow.device_id,
        updated_at: nowIso,
      }, { onConflict: "venue_id" });
    if (statusError) {
      console.error("kuawase_sync_status upsert error", statusError);
      return json({ ok: false, error: "failed to update sync status" }, corsHeaders, 500);
    }

    // 7. last_event_id を更新
    const { error: eventIdUpdateError } = await supabase
      .from("kuawase_sync_tokens")
      .update({ last_event_id: eventId })
      .eq("token_hash", tokenRow.token_hash);
    if (eventIdUpdateError) {
      console.error("kuawase_sync_tokens last_event_id update error", eventIdUpdateError);
    }

    // 8. event_log に記録（接続・takeover。token 平文・ハッシュは含めない）
    const { error: logError } = await supabase.from("event_log").insert({
      event_type: "KUAWASE_CONNECT",
      match_id: null,
      judge_id: null,
      epoch: null,
      detail: {
        venue_id: venueId,
        device_id: tokenRow.device_id,
        event_id: eventId,
        takeover: !!deviceWarning,
      },
    });
    if (logError) {
      console.error("event_log insert error", logError);
    }

    return json({
      ok: true,
      venue: { id: venueRow.id, code: venueRow.code, name: venueRow.name },
      state: stateRow
        ? {
          current_match_id: stateRow.current_match_id,
          epoch: stateRow.epoch,
          accepting: stateRow.accepting,
          e3_reached: stateRow.e3_reached,
        }
        : null,
      excel_hash: candidatesRow?.excel_hash ?? null,
      presets,
      warnings,
      ...(idempotent ? { idempotent: true } : {}),
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "internal error" }, corsHeaders, 500);
  }
});
