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
import { advanceBout, confirmBout } from "../_shared/confirm-bout.ts";
import { slotToEpoch } from "../_shared/bout.ts";
import { sanitizeText } from "../_shared/sanitize.ts";

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
  haiku?: { red?: unknown; white?: unknown } | null;
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

async function getVenueCode(venueId: string): Promise<string> {
  const { data } = await supabase
    .from("venues")
    .select("code")
    .eq("id", venueId)
    .maybeSingle();
  return data?.code ?? "default";
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

    // CONFIRM / CONFIRM_AND_ADVANCE / ADVANCE 共通: 対象試合と state の整合検証。
    // 成功時は { matchRow, numBouts, stateBefore, slot } を返し、
    // 失敗時は Response を返す(呼び出し側でそのまま return する)。
    // deno-lint-ignore no-explicit-any
    async function validateCurrentMatch(requireSlotGuard: boolean): Promise<any> {
      if (!matchCode) {
        return { response: json({ ok: false, error: "match_code is required" }, corsHeaders, 400) };
      }
      const { data: matchRow } = await supabase
        .from("matches")
        .select("id, code, num_bouts, venue_id")
        .eq("code", matchCode)
        .eq("venue_id", venueId)
        .maybeSingle();
      if (!matchRow) {
        return { response: json({ ok: false, error: "match not found" }, corsHeaders, 404) };
      }
      const numBouts = typeof matchRow.num_bouts === "number" ? matchRow.num_bouts : 5;

      const stateBefore = await loadState(venueId);
      if (!stateBefore || String(stateBefore.current_match_id) !== String(matchRow.id)) {
        return {
          response: json({
            ok: false,
            error: "not_current_match",
            state: stateBefore,
          }, corsHeaders, 409),
        };
      }

      // slot ガード: kk が表示している対戦(slot)と OES の受付対戦(epoch)が
      // 一致しているときだけ確定を許す。ズレたままの誤確定を防ぐ。
      const slot = typeof body?.slot === "number" && Number.isInteger(body.slot)
        ? body.slot
        : null;
      if (requireSlotGuard && slot !== null) {
        const reportedEpoch = slotToEpoch(slot, numBouts);
        if (reportedEpoch === null || reportedEpoch !== stateBefore.epoch) {
          return {
            response: json({
              ok: false,
              error: "slot_epoch_mismatch",
              detail: {
                slot,
                reported_epoch: reportedEpoch,
                state_epoch: stateBefore.epoch,
              },
              state: stateBefore,
            }, corsHeaders, 409),
          };
        }
      }

      return { matchRow, numBouts, stateBefore, slot };
    }

    // E5 本体(句の補完込み)。CONFIRM と CONFIRM_AND_ADVANCE の共通部。
    async function runConfirm(slot: number | null) {
      // 句: payload 優先、無ければ披講報告済みの句(同一対戦のもの)で補完
      let haikuRed = sanitizeText(body?.haiku?.red) || null;
      let haikuWhite = sanitizeText(body?.haiku?.white) || null;
      if (!haikuRed || !haikuWhite) {
        const { data: statusRow } = await supabase
          .from("kuawase_sync_status")
          .select("last_view")
          .eq("venue_id", venueId)
          .maybeSingle();
        // deno-lint-ignore no-explicit-any
        const lastView = (statusRow?.last_view ?? {}) as Record<string, any>;
        if (lastView.match_code === matchCode && lastView.slot === slot && lastView.reveal) {
          haikuRed = haikuRed ?? (lastView.reveal.red || null);
          haikuWhite = haikuWhite ?? (lastView.reveal.white || null);
        }
      }

      return await confirmBout({
        supabase,
        venueId,
        venueCode: await getVenueCode(venueId),
        matchCode,
        haiku: { red: haikuRed, white: haikuWhite },
      });
    }

    // 同期状態の鮮度更新と event_id の確定(操作系アクション成功時の共通処理)
    async function touchSyncStatus() {
      const nowIso = new Date().toISOString();
      await supabase
        .from("kuawase_sync_status")
        .upsert({
          venue_id: venueId,
          enabled: true,
          source_device_id: tokenRow.device_id,
          last_synced_at: nowIso,
          updated_at: nowIso,
        }, { onConflict: "venue_id" });
      await supabase
        .from("kuawase_sync_tokens")
        .update({ last_event_id: eventId })
        .eq("token_hash", tokenRow.token_hash);
    }

    // E5 のみ(kk の「確定」ボタン)。得点読み上げ→E6 を挟む運用のために分離。
    if (action === "CONFIRM") {
      const v = await validateCurrentMatch(true);
      if (v.response) return v.response;
      const { numBouts, slot } = v;

      const confirm = await runConfirm(slot);
      if (!confirm.ok) {
        return json({
          ok: false,
          error: confirm.error,
          ...(confirm.detail ? { detail: confirm.detail } : {}),
          state: v.stateBefore,
        }, corsHeaders, confirm.status);
      }

      await touchSyncStatus();
      const state = await loadState(venueId);
      return json({
        ok: true,
        applied: {
          action: "CONFIRM",
          match_code: matchCode,
          confirmed_epoch: confirm.epoch,
          confirmed_slot: confirm.slot,
          winner: confirm.winner,
          red_wins: confirm.red_wins,
          white_wins: confirm.white_wins,
        },
        is_final: confirm.epoch >= numBouts,
        state,
        warnings,
      }, corsHeaders);
    }

    // E6 のみ(kk の「次の対戦へ」ボタン)。num_bouts 超過は advanceBout が拒否する。
    if (action === "ADVANCE") {
      const v = await validateCurrentMatch(false);
      if (v.response) return v.response;

      const adv = await advanceBout({
        supabase,
        venueId,
        logDetail: { source: "kuawase", device_id: tokenRow.device_id, event_id: eventId },
      });
      if (!adv.ok) {
        return json({
          ok: false,
          error: adv.error,
          ...(adv.detail ? { detail: adv.detail } : {}),
          state: v.stateBefore,
        }, corsHeaders, adv.status);
      }

      await touchSyncStatus();
      const state = await loadState(venueId);
      return json({
        ok: true,
        applied: { action: "ADVANCE", from_epoch: adv.from_epoch, to_epoch: adv.to_epoch },
        state,
        warnings,
      }, corsHeaders);
    }

    if (action === "CONFIRM_AND_ADVANCE") {
      const v = await validateCurrentMatch(true);
      if (v.response) return v.response;
      const { numBouts, stateBefore, slot } = v;

      // E5: 確定+snapshot(句込み)
      const confirm = await runConfirm(slot);

      if (!confirm.ok) {
        return json({
          ok: false,
          error: confirm.error,
          ...(confirm.detail ? { detail: confirm.detail } : {}),
          state: stateBefore,
        }, corsHeaders, confirm.status);
      }

      // E6: 最終対戦でなければ次対戦へ(最終対戦は accepting=false のまま試合終了)
      const isFinal = confirm.epoch >= numBouts;
      let advancedTo: number | null = null;
      if (!isFinal) {
        const adv = await advanceBout({
          supabase,
          venueId,
          logDetail: { source: "kuawase", device_id: tokenRow.device_id, event_id: eventId },
        });
        if (!adv.ok) {
          // E5 は成立済み。E6 だけ失敗した場合は復旧経路(OES管理画面)を案内する
          return json({
            ok: false,
            error: "confirmed_but_advance_failed",
            detail: { confirmed_epoch: confirm.epoch },
            state: await loadState(venueId),
          }, corsHeaders, 500);
        }
        advancedTo = adv.to_epoch;
      }

      await touchSyncStatus();

      const state = await loadState(venueId);
      return json({
        ok: true,
        applied: {
          action: "CONFIRM_AND_ADVANCE",
          match_code: matchCode,
          confirmed_epoch: confirm.epoch,
          confirmed_slot: confirm.slot,
          winner: confirm.winner,
          red_wins: confirm.red_wins,
          white_wins: confirm.white_wins,
          advanced_to: advancedTo,
        },
        match_finished: isFinal,
        state,
        warnings,
      }, corsHeaders);
    }

    if (action === "DISCONNECT") {
      const nowIso = new Date().toISOString();
      const { error: statusError } = await supabase
        .from("kuawase_sync_status")
        .upsert({
          venue_id: venueId,
          enabled: false,
          source_device_id: tokenRow.device_id,
          last_synced_at: nowIso,
          updated_at: nowIso,
        }, { onConflict: "venue_id" });
      if (statusError) {
        console.error("kuawase_sync_status upsert error (disconnect)", statusError);
        return json({ ok: false, error: "failed to disconnect" }, corsHeaders, 500);
      }

      await supabase.from("event_log").insert({
        event_type: "KUAWASE_DISCONNECT",
        match_id: null,
        judge_id: null,
        epoch: null,
        detail: { venue_id: venueId, device_id: tokenRow.device_id, event_id: eventId },
      });

      await supabase
        .from("kuawase_sync_tokens")
        .update({ last_event_id: eventId })
        .eq("token_hash", tokenRow.token_hash);

      return json({ ok: true, applied: { action: "DISCONNECT" }, warnings }, corsHeaders);
    }

    return json({ ok: false, error: `unsupported action: ${action}` }, corsHeaders, 400);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "internal error" }, corsHeaders, 500);
  }
});
