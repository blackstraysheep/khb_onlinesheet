// supabase/functions/kuawase-sync-report/index.ts
// KHB-Kuawase からの表示状態・披講の報告。**state は一切変更しない。**
// kuawase_sync_status.last_view の更新と、state との不一致警告の生成のみを行う。
// 参照: docs/02-kuawase-integration-impl.md 「API」> kuawase-sync-report
//
// - 対戦外(top.html / index.html 表示中 = slot null)は正常運用で頻発するため
//   警告にしない。
// - 披講(kind=reveal)の句は admin ライブ表示用に last_view.reveal に保持する
//   (揮発扱い。恒久保存は Phase 3 の E5 確定時に snapshot へ)。
// - event_log には記録しない(頻度が高くノイズになるため。監査対象は
//   import / connect / control / takeover)。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeKuawaseSync, isAllowedKuawaseOrigin } from "../_shared/kuawase-auth.ts";
import { sanitizeText } from "../_shared/sanitize.ts";
import { slotToEpoch } from "../_shared/bout.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SOURCE_PAGE_RE = /^[\w.-]{1,64}$/;

type ReportBody = {
  event_id?: unknown;
  device_id?: unknown;
  takeover?: unknown;
  kind?: unknown;
  match_code?: unknown;
  slot?: unknown;
  source_page?: unknown;
  reveal?: { side?: unknown; haiku?: unknown } | null;
  changed_at?: unknown;
  // kk が試合読込時に取り込んだ参照(チーム・兼題)。OES 側でその後
  // 試合設定が編集された場合の乖離検出(MATCH_CONFIG_CHANGED)に使う。
  loaded_ref?: {
    red_cell?: unknown;
    red_name?: unknown;
    white_cell?: unknown;
    white_name?: unknown;
    kendai_cell?: unknown;
    kendai_name?: unknown;
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
    const body = await req.json().catch(() => null) as ReportBody | null;

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

    const kind = body?.kind === "reveal" ? "reveal" : "view";
    const matchCode = typeof body?.match_code === "string" && body.match_code.trim()
      ? body.match_code.trim()
      : null;
    const slot = typeof body?.slot === "number" && Number.isInteger(body.slot) &&
        body.slot >= 1 && body.slot <= 5
      ? body.slot
      : null;
    const sourcePage = typeof body?.source_page === "string" &&
        SOURCE_PAGE_RE.test(body.source_page.trim())
      ? body.source_page.trim()
      : null;
    const changedAt = typeof body?.changed_at === "string" ? body.changed_at : null;

    const warnings: Array<Record<string, unknown>> = [];
    if (deviceWarning) {
      warnings.push({ code: deviceWarning.code, detail: deviceWarning.detail });
    }

    // state と報告内容の突き合わせ(警告生成のみ)
    const { data: stateRow } = await supabase
      .from("state")
      .select("current_match_id, epoch, accepting, e3_reached")
      .eq("venue_id", venueId)
      .maybeSingle();

    // deno-lint-ignore no-explicit-any
    let reportedMatch: any = null;
    if (matchCode) {
      const { data: matchRow } = await supabase
        .from("matches")
        .select("id, code, num_bouts, red_team_name, white_team_name, kendai_name, kuawase_ref")
        .eq("code", matchCode)
        .eq("venue_id", venueId)
        .maybeSingle();
      if (!matchRow) {
        warnings.push({
          code: "UNKNOWN_MATCH",
          detail: `reported match_code '${matchCode}' is not registered in this venue`,
        });
      } else {
        reportedMatch = matchRow;
      }
    }

    if (reportedMatch && stateRow?.current_match_id) {
      if (String(stateRow.current_match_id) !== String(reportedMatch.id)) {
        warnings.push({
          code: "MATCH_MISMATCH",
          detail:
            `kk is showing match '${reportedMatch.code}' but OES current match is different`,
        });
      } else if (slot !== null) {
        // 同一試合を表示中の場合のみ slot ↔ epoch を検証する
        const numBouts = typeof reportedMatch.num_bouts === "number"
          ? reportedMatch.num_bouts
          : 5;
        const reportedEpoch = slotToEpoch(slot, numBouts);
        if (reportedEpoch === null) {
          warnings.push({
            code: "INVALID_SLOT",
            detail: `slot ${slot} is not valid for a ${numBouts}-bout match`,
          });
        } else if (
          typeof stateRow.epoch === "number" && reportedEpoch !== stateRow.epoch
        ) {
          warnings.push({
            code: "EPOCH_MISMATCH",
            detail:
              `kk is showing slot ${slot} (epoch ${reportedEpoch}) but OES is at epoch ${stateRow.epoch}`,
          });
        }
      }

      // 試合設定の乖離検出: kk が読込時に取り込んだチーム・兼題と、
      // OES 側の現在の試合設定が食い違っていたら警告する
      // (kk 読込後に OES で試合を編集したケース。読込し直しで解消する)。
      const loadedRef = body?.loaded_ref;
      if (loadedRef && typeof loadedRef === "object") {
        const diffs: string[] = [];
        const cmpName = (label: string, loaded: unknown, current: unknown) => {
          const a = sanitizeText(loaded);
          const b = sanitizeText(current);
          if (a !== b) diffs.push(`${label} name: kk="${a}" oes="${b}"`);
        };
        cmpName("red", loadedRef.red_name, reportedMatch.red_team_name);
        cmpName("white", loadedRef.white_name, reportedMatch.white_team_name);
        cmpName("kendai", loadedRef.kendai_name, reportedMatch.kendai_name);

        // deno-lint-ignore no-explicit-any
        const ref = (reportedMatch.kuawase_ref ?? null) as Record<string, any> | null;
        const cmpCell = (label: string, loaded: unknown, current: unknown) => {
          if (typeof loaded === "string" && loaded && typeof current === "string" && current &&
            loaded !== current) {
            diffs.push(`${label} cell: kk=${loaded} oes=${current}`);
          }
        };
        if (ref) {
          cmpCell("red", loadedRef.red_cell, ref.red_cell);
          cmpCell("white", loadedRef.white_cell, ref.white_cell);
          cmpCell("kendai", loadedRef.kendai_cell, ref.kendai_cell);
        }

        if (diffs.length > 0) {
          warnings.push({
            code: "MATCH_CONFIG_CHANGED",
            detail: `match '${reportedMatch.code}' was edited on OES after kk loaded it: ${diffs.join("; ")}`,
          });
        }
      }
    }

    // last_view を更新する。reveal は披講済みの句を側ごとにマージし、
    // view で対戦(slot / match)が変わったら reveal をリセットする。
    const { data: statusRow } = await supabase
      .from("kuawase_sync_status")
      .select("last_view, enabled")
      .eq("venue_id", venueId)
      .maybeSingle();
    // deno-lint-ignore no-explicit-any
    const prevView = (statusRow?.last_view ?? {}) as Record<string, any>;

    const nowIso = new Date().toISOString();
    // deno-lint-ignore no-explicit-any
    let nextView: Record<string, any>;

    if (kind === "reveal") {
      const side = body?.reveal?.side === "white" ? "white" : "red";
      const haiku = sanitizeText(body?.reveal?.haiku) || null;
      nextView = {
        ...prevView,
        match_code: matchCode ?? prevView.match_code ?? null,
        slot: slot ?? prevView.slot ?? null,
        source_page: sourcePage ?? prevView.source_page ?? null,
        changed_at: changedAt ?? nowIso,
        reveal: { ...(prevView.reveal ?? {}), [side]: haiku },
      };
    } else {
      const sameBout = prevView.match_code === matchCode && prevView.slot === slot;
      nextView = {
        match_code: matchCode,
        slot,
        source_page: sourcePage,
        changed_at: changedAt ?? nowIso,
        // 同一対戦の再報告(reload 等)では披講状態を維持する
        ...(sameBout && prevView.reveal ? { reveal: prevView.reveal } : {}),
      };
    }

    // report は受動的な報告なので enabled を書き換えない。
    // 管理者が連携解除(enabled=false)した状態を kk の報告が勝手に戻さないため。
    // 再有効化は明示操作(kuawase-sync-connect / kuawase-sync-control)のみが行う。
    const { error: statusError } = await supabase
      .from("kuawase_sync_status")
      .upsert({
        venue_id: venueId,
        enabled: statusRow ? statusRow.enabled : true,
        source_device_id: tokenRow.device_id,
        last_view: nextView,
        last_synced_at: nowIso,
        updated_at: nowIso,
      }, { onConflict: "venue_id" });
    if (statusError) {
      console.error("kuawase_sync_status upsert error", statusError);
      return json({ ok: false, error: "failed to update sync status" }, corsHeaders, 500);
    }

    await supabase
      .from("kuawase_sync_tokens")
      .update({ last_event_id: eventId })
      .eq("token_hash", tokenRow.token_hash);

    return json({
      ok: true,
      // OES 管理画面から連携解除された場合、kk はこの enabled=false を見て
      // 統合 UI を落とす(report は enabled を書き換えないが、返しはする)。
      enabled: statusRow ? statusRow.enabled === true : true,
      state: stateRow ?? null,
      warnings,
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "internal error" }, corsHeaders, 500);
  }
});
