// supabase/functions/kuawase-import-candidates/index.ts
// KHB-Kuawase から Excel 候補データ（チーム一覧・兼題一覧）を受け取り、
// venue 単位で upsert する。大会前フローの一部。
// 参照: docs/02-kuawase-integration-impl.md 「API」> kuawase-import-candidates
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { authorizeKuawaseSync, isAllowedKuawaseOrigin } from "../_shared/kuawase-auth.ts";
import { sanitizeText } from "../_shared/sanitize.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CELL_RE = /^[A-Z]{1,3}[0-9]{1,4}$/;
const MAX_ITEMS = 200;
const MIN_ITEMS = 1;

type CandidateItem = { cell: string; name: string };

type ImportBody = {
  event_id?: unknown;
  device_id?: unknown;
  compe_name?: unknown;
  teams?: unknown;
  kendai?: unknown;
  excel_hash?: unknown;
};

type MatchRefRow = {
  code: string;
  red_team_name: string | null;
  white_team_name: string | null;
  kendai_name: string | null;
  kuawase_ref: {
    red_cell?: string;
    white_cell?: string;
    kendai_cell?: string;
    excel_hash?: string;
  } | null;
};

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// 候補配列（teams / kendai）の形式を検証し、sanitize 済みの配列を返す。
// 不正なら例外を投げる（呼び出し側で 400 に変換する）。
function parseCandidateList(value: unknown, label: string): CandidateItem[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  if (value.length < MIN_ITEMS || value.length > MAX_ITEMS) {
    throw new Error(`${label} must contain ${MIN_ITEMS}-${MAX_ITEMS} items`);
  }
  return value.map((item, index) => {
    const cell = typeof item?.cell === "string" ? item.cell.trim().toUpperCase() : "";
    if (!CELL_RE.test(cell)) {
      throw new Error(`${label}[${index}].cell is invalid: ${String(item?.cell)}`);
    }
    const name = sanitizeText(item?.name);
    if (!name) {
      throw new Error(`${label}[${index}].name is required`);
    }
    return { cell, name };
  });
}

function buildCellMap(items: CandidateItem[]): Map<string, string> {
  return new Map(items.map((item) => [item.cell, item.name]));
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
    const body = await req.json().catch(() => null) as ImportBody | null;

    // 1. sync token 認可 + device バインド
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
    const excelHash = typeof body?.excel_hash === "string" ? body.excel_hash.trim() : "";
    if (!excelHash) {
      return json({ ok: false, error: "excel_hash is required" }, corsHeaders, 400);
    }
    const compeName = sanitizeText(body?.compe_name);

    // 2. teams / kendai の検証 + sanitize
    let teams: CandidateItem[];
    let kendai: CandidateItem[];
    try {
      teams = parseCandidateList(body?.teams, "teams");
      kendai = parseCandidateList(body?.kendai, "kendai");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return json({ ok: false, error: message }, corsHeaders, 400);
    }

    // event_id が前回と同一なら再送とみなす（idempotent）。
    // 処理自体は upsert のため通常どおり実行し、フラグのみ付与する。
    const idempotent = tokenRow.last_event_id === eventId;

    const nowIso = new Date().toISOString();

    // 3. kuawase_candidates を venue_id で upsert
    const { error: upsertError } = await supabase
      .from("kuawase_candidates")
      .upsert({
        venue_id: venueId,
        teams,
        kendai,
        excel_hash: excelHash,
        compe_name: compeName || null,
        imported_at: nowIso,
      }, { onConflict: "venue_id" });
    if (upsertError) {
      console.error("kuawase_candidates upsert error", upsertError);
      return json({ ok: false, error: "failed to save candidates" }, corsHeaders, 500);
    }

    // 4. 既存 matches（同 venue・kuawase_ref 非 null）との突合。
    //    セルが新候補に無い／名前が変わった場合は警告するのみで拒否はしない。
    const warnings: Array<Record<string, unknown>> = [];
    if (deviceWarning) {
      warnings.push({ code: deviceWarning.code, detail: deviceWarning.detail });
    }

    const { data: matchRows, error: matchesError } = await supabase
      .from("matches")
      .select("code, red_team_name, white_team_name, kendai_name, kuawase_ref")
      .eq("venue_id", venueId)
      .not("kuawase_ref", "is", null);
    if (matchesError) {
      // 突合は付加情報のため、失敗してもインポート自体は成功として扱う
      console.error("matches select error (ref check)", matchesError);
    } else {
      const teamMap = buildCellMap(teams);
      const kendaiMap = buildCellMap(kendai);
      for (const match of (matchRows ?? []) as MatchRefRow[]) {
        const ref = match.kuawase_ref;
        if (!ref) continue;
        const checks: Array<
          [cell: string | undefined, expectedName: string | null, map: Map<string, string>, part: string]
        > = [
          [ref.red_cell, match.red_team_name, teamMap, "red"],
          [ref.white_cell, match.white_team_name, teamMap, "white"],
          [ref.kendai_cell, match.kendai_name, kendaiMap, "kendai"],
        ];
        for (const [cell, expectedName, map, part] of checks) {
          if (!cell) continue;
          const newName = map.get(cell);
          if (newName === undefined) {
            warnings.push({
              code: "REF_MISMATCH",
              match_code: match.code,
              detail: `${part} cell ${cell} is missing from the new candidate list`,
            });
          } else if (expectedName !== null && newName !== expectedName) {
            warnings.push({
              code: "REF_MISMATCH",
              match_code: match.code,
              detail: `${part} cell ${cell} name changed: "${expectedName}" -> "${newName}"`,
            });
          }
        }
      }
    }

    // 5. last_event_id を更新
    const { error: eventIdUpdateError } = await supabase
      .from("kuawase_sync_tokens")
      .update({ last_event_id: eventId })
      .eq("token_hash", tokenRow.token_hash);
    if (eventIdUpdateError) {
      console.error("kuawase_sync_tokens last_event_id update error", eventIdUpdateError);
    }

    // 6. event_log に記録（token 平文・ハッシュは含めない）
    const { error: logError } = await supabase.from("event_log").insert({
      event_type: "KUAWASE_IMPORT",
      match_id: null,
      judge_id: null,
      epoch: null,
      detail: {
        venue_id: venueId,
        device_id: tokenRow.device_id,
        event_id: eventId,
        teams_count: teams.length,
        kendai_count: kendai.length,
        excel_hash: excelHash,
        warnings_count: warnings.length,
      },
    });
    if (logError) {
      console.error("event_log insert error", logError);
    }

    return json({
      ok: true,
      imported: { teams: teams.length, kendai: kendai.length },
      warnings,
      ...(idempotent ? { idempotent: true } : {}),
    }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: "internal error" }, corsHeaders, 500);
  }
});
