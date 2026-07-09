// supabase/functions/kuawase-sync-control/index.ts
// KHB-Kuawase から OES の state を変更する唯一の API。
// Phase 2: SET_MATCH(プリセット読込)のみ。CONFIRM_AND_ADVANCE は Phase 3 で追加する。
// 参照: docs/02-kuawase-integration-impl.md 「API」> kuawase-sync-control
//
// 冪等性(重要): 同一 event_id の再送では処理を実行せず現在 state を返す。
// 将来の CONFIRM_AND_ADVANCE で再送により epoch が二重に進む事故を防ぐため、
// ここは import/connect と違い「常に実行」ではなく厳格に short-circuit する。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeKuawaseSync, isAllowedKuawaseOrigin } from "../_shared/kuawase-auth.ts";
import { setCurrentMatch } from "../_shared/set-match.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

type ControlBody = {
  event_id?: unknown;
  device_id?: unknown;
  takeover?: unknown;
  action?: unknown;
  match_code?: unknown;
  slot?: unknown;
};

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function loadState(venueId: string) {
  const { data } = await supabase
    .from("state")
    .select("current_match_id, epoch, accepting, e3_reached")
    .eq("venue_id", venueId)
    .maybeSingle();
  return data ?? null;
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
    const body = await req.json().catch(() => null) as ControlBody | null;

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

    // 同一 event_id の再送: 処理せず現在 state を返す(厳格冪等)
    if (tokenRow.last_event_id === eventId) {
      const state = await loadState(venueId);
      return json({ ok: true, idempotent: true, state, warnings: [] }, corsHeaders);
    }

    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const matchCode = typeof body?.match_code === "string" ? body.match_code.trim() : "";

    const warnings: Array<Record<string, unknown>> = [];
    if (deviceWarning) {
      warnings.push({ code: deviceWarning.code, detail: deviceWarning.detail });
    }

    if (action === "SET_MATCH") {
      if (!matchCode) {
        return json({ ok: false, error: "match_code is required" }, corsHeaders, 400);
      }

      // 既に現在試合なら epoch を巻き戻さない(kk 再起動時のプリセット再読込を無害化する)。
      const { data: currentMatch } = await supabase
        .from("matches")
        .select("id, code")
        .eq("code", matchCode)
        .eq("venue_id", venueId)
        .maybeSingle();
      const stateBefore = await loadState(venueId);
      if (
        currentMatch &&
        stateBefore &&
        String(stateBefore.current_match_id) === String(currentMatch.id)
      ) {
        await supabase
          .from("kuawase_sync_tokens")
          .update({ last_event_id: eventId })
          .eq("token_hash", tokenRow.token_hash);
        return json({
          ok: true,
          already_current: true,
          state: stateBefore,
          warnings,
        }, corsHeaders);
      }

      const result = await setCurrentMatch({
        supabase,
        venueId,
        matchCode,
        epoch: 1,
        logDetail: { source: "kuawase", device_id: tokenRow.device_id, event_id: eventId },
      });

      if (!result.ok) {
        return json({
          ok: false,
          error: result.error,
          ...(result.message ? { message: result.message } : {}),
          ...(result.conflicts ? { conflicts: result.conflicts } : {}),
        }, corsHeaders, result.status);
      }

      for (const conflict of result.warnings) {
        warnings.push({ code: "JUDGE_TIMELINE_CONFLICT", detail: conflict });
      }

      // 同期状態を更新
      const nowIso = new Date().toISOString();
      await supabase
        .from("kuawase_sync_status")
        .upsert({
          venue_id: venueId,
          enabled: true,
          source_device_id: tokenRow.device_id,
          last_view: {
            match_code: result.match.code,
            slot: null,
            source_page: null,
            changed_at: nowIso,
          },
          last_synced_at: nowIso,
          updated_at: nowIso,
        }, { onConflict: "venue_id" });

      await supabase
        .from("kuawase_sync_tokens")
        .update({ last_event_id: eventId })
        .eq("token_hash", tokenRow.token_hash);

      const state = await loadState(venueId);
      return json({
        ok: true,
        applied: { action: "SET_MATCH", match_code: result.match.code, epoch: result.epoch },
        state,
        warnings,
      }, corsHeaders);
    }

    return json({ ok: false, error: `unsupported action: ${action}` }, corsHeaders, 400);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "internal error" }, corsHeaders, 500);
  }
});
