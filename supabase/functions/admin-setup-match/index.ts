// supabase/functions/admin-setup-match/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";
import { sha256Hex, tokenLast4 } from "../_shared/token.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ENV のシークレットは前後の空白を削っておく
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

type JudgeInput = { name: string };

// kuawase_ref: kuawase_candidates 由来のセルキー参照。
// 参照: docs/02-kuawase-integration-impl.md 「matches への追加カラム」
type KuawaseRefInput = {
  red_cell?: string;
  white_cell?: string;
  kendai_cell?: string;
  excel_hash?: string;
} | null;

type RequestBody = {
  admin_secret?: string;
  venue_code?: string;
  match_code?: string;
  match_name?: string;
  timeline?: number;
  num_bouts?: number;
  red_team_name?: string;
  white_team_name?: string;
  kendai_name?: string;
  kuawase_ref?: KuawaseRefInput;
  judges?: JudgeInput[];
  token_prefix?: string;
  token_length?: number;
};

const KUAWASE_CELL_RE = /^[A-Z]{1,3}[0-9]{1,4}$/;

// kuawase_ref を検証・正規化する。
// - undefined: リクエストに含まれない → 既存値を変更しない（呼び出し側で判定）
// - null: 明示的なクリア（手入力への切り替え時）
// - object: セル形式を検証し、想定外のキーは結果に含めない（捨てる）
function normalizeKuawaseRef(value: unknown): Record<string, string> | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error("kuawase_ref must be an object or null");
  }

  const src = value as Record<string, unknown>;
  const result: Record<string, string> = {};

  for (const key of ["red_cell", "white_cell", "kendai_cell"] as const) {
    const raw = src[key];
    if (raw === undefined || raw === null || raw === "") continue;
    if (typeof raw !== "string") {
      throw new Error(`kuawase_ref.${key} must be a string`);
    }
    const cell = raw.trim().toUpperCase();
    if (!KUAWASE_CELL_RE.test(cell)) {
      throw new Error(`kuawase_ref.${key} is invalid: ${raw}`);
    }
    result[key] = cell;
  }

  const excelHash = src.excel_hash;
  if (typeof excelHash === "string" && excelHash.trim()) {
    result.excel_hash = excelHash.trim();
  }

  // それ以外のキーは result に写さないため、自動的に捨てられる。
  return result;
}

function normalizeTokenLength(value: unknown, fallback = 32): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.min(128, Math.max(8, value));
}

// ランダムなトークンを生成
function generateToken(prefix = "khb-", tokenLength = 32): string {
  const bytes = new Uint8Array(Math.ceil(tokenLength / 2));
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, tokenLength);
  return prefix + hex;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  if (!isAllowedOrigin(req)) {
    return json({ error: "forbidden origin" }, 403);
  }
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json().catch(() => null)) as RequestBody | null;

    const {
      admin_secret,
      venue_code,
      match_code,
      match_name,
      timeline,
      num_bouts,
      red_team_name,
      white_team_name,
      kendai_name,
      kuawase_ref,
      judges,
      token_prefix = "khb-",
      token_length,
    } = body ?? {};
    const tokenLength = normalizeTokenLength(token_length);

    // 1. 管理用シークレット確認
    if (!adminSecret) {
      // ENV に何も入っていない場合はサーバ設定ミス
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        500,
      );
    }

    const clientSecret =
      typeof admin_secret === "string" ? admin_secret.trim() : "";

    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, 401);
    }

    let kuawaseRef: Record<string, string> | null | undefined;
    try {
      kuawaseRef = normalizeKuawaseRef(kuawase_ref);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : String(e) }, 400);
    }

    // 2. 入力チェック
    if (!match_code) {
      return json({ error: "match_code is required" }, 400);
    }
    if (!match_name) {
      return json({ error: "match_name is required" }, 400);
    }
    if (typeof timeline !== "number" || !Number.isFinite(timeline)) {
      return json({ error: "timeline is required (number)" }, 400);
    }
    const numBouts = (typeof num_bouts === "number" && Number.isInteger(num_bouts) && num_bouts >= 1)
      ? num_bouts : 5;

    // 2b. 会場を解決
    const venueCode = (venue_code ?? "default").trim();
    const { data: venueRow, error: venueErr } = await supabase
      .from("venues").select("id").eq("code", venueCode).maybeSingle();
    if (venueErr || !venueRow) {
      return json({ error: `venue not found: ${venueCode}` }, 404);
    }
    const venueId = venueRow.id as string;

    // 3. 対戦を取得 or 作成（code で一意とみなす）
    let match_id: string;

    {
      const { data: existing, error: selErr } = await supabase
        .from("matches")
        .select("id, code, name")
        .eq("code", match_code)
        .maybeSingle();

      if (selErr) {
        console.error("matches select error", selErr);
        return json({ error: "failed to select match" }, 500);
      }

      const matchPayload: Record<string, unknown> = {
        name: match_name,
        timeline,
        num_bouts: numBouts,
        venue_id: venueId,
      };
      if (red_team_name !== undefined) matchPayload.red_team_name = red_team_name;
      if (white_team_name !== undefined) matchPayload.white_team_name = white_team_name;
      if (kendai_name !== undefined) matchPayload.kendai_name = kendai_name;
      if (kuawaseRef !== undefined) matchPayload.kuawase_ref = kuawaseRef;

      if (existing) {
        match_id = existing.id as string;
        const { error: updErr } = await supabase
          .from("matches")
          .update(matchPayload)
          .eq("id", match_id);
        if (updErr) {
          console.error("matches update error", updErr);
          return json({ error: "failed to update match" }, 500);
        }
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from("matches")
          .insert({ code: match_code, ...matchPayload })
          .select("id, code, name")
          .single();

        if (insErr || !inserted) {
          console.error("matches insert error", insErr);
          return json({ error: "failed to insert match" }, 500);
        }
        match_id = inserted.id as string;
      }
    }

    // 3. 審査員ごとに judges / expected_judges / access_tokens を整備
    const judgeResults: {
      judge_id: string;
      judge_name: string;
      token: string | null;
      token_visible_once: boolean;
      role: "judge";
    }[] = [];

    const processedJudgeIds: string[] = [];

    for (const [judgeIndex, j] of (judges ?? []).entries()) {
      const name = (j?.name || "").trim();
      if (!name) continue;

      // 4-1. judge を取得 or 作成（name で一意とみなす）
      let judge_id: string;

      {
        const { data: existing, error: selErr } = await supabase
          .from("judges")
          .select("id, name")
          .eq("name", name)
          .maybeSingle();

        if (selErr) {
          console.error("judges select error", selErr);
          return json(
            { error: `failed to select judge: ${name}` },
            500,
          );
        }

        if (existing) {
          judge_id = existing.id as string;
        } else {
          const { data: inserted, error: insErr } = await supabase
            .from("judges")
            .insert({ name })
            .select("id, name")
            .single();

          if (insErr || !inserted) {
            console.error("judges insert error", insErr);
            return json(
              { error: `failed to insert judge: ${name}` },
              500,
            );
          }
          judge_id = inserted.id as string;
        }
      }

      // 4-2. expected_judges に登録（重複は一旦削除してから insert）
      {
        const { error: delErr } = await supabase
          .from("expected_judges")
          .delete()
          .eq("match_id", match_id)
          .eq("judge_id", judge_id);

        if (delErr) {
          console.error("expected_judges delete error", delErr);
        }

        const { error: insErr } = await supabase
          .from("expected_judges")
          .insert({
            match_id,
            judge_id,
            sort_order: judgeIndex + 1,
          });

        if (insErr) {
          console.error("expected_judges insert error", insErr);
          return json(
            {
              error: `failed to insert expected_judges for judge: ${name}`,
            },
            500,
          );
        }
      }

      // 4-3. access_tokens を発行（1審査員1トークン: venue_id なし）
      // 既存トークンがあればそれを使い回す
      let token: string | null;
      {
        const { data: existingToken } = await supabase
          .from("access_tokens")
          .select("id, token, token_hash, token_last4")
          .eq("judge_id", judge_id)
          .eq("role", "judge")
          .limit(1)
          .maybeSingle();

        if (existingToken?.token) {
          const legacyToken = existingToken.token as string;
          const tokenHash = existingToken.token_hash ?? await sha256Hex(legacyToken);
          const { error: tokenUpdateError } = await supabase
            .from("access_tokens")
            .update({
              token: null,
              token_hash: tokenHash,
              token_last4: existingToken.token_last4 ?? tokenLast4(legacyToken),
            })
            .eq("id", existingToken.id);
          if (tokenUpdateError) {
            console.error("access_tokens legacy migration error", tokenUpdateError);
            return json({ error: `failed to migrate legacy access_token for judge: ${name}` }, 500);
          }
          token = null;
        } else if (existingToken?.token_hash) {
          token = null;
        } else {
          token = generateToken(token_prefix, tokenLength);
          const tokenHash = await sha256Hex(token);
          const { error: insErr } = await supabase
            .from("access_tokens")
            .insert({
              token: null,
              token_hash: tokenHash,
              token_last4: tokenLast4(token),
              judge_id,
              role: "judge",
            });

          if (insErr) {
            console.error("access_tokens insert error", insErr);
            return json(
              { error: `failed to insert access_token for judge: ${name}` },
              500,
            );
          }
        }
      }

      judgeResults.push({
        judge_id,
        judge_name: name,
        token,
        token_visible_once: token !== null,
        role: "judge",
      });
      processedJudgeIds.push(judge_id);
    }

    // 今回のリクエストに含まれなかった審査員を expected_judges から削除
    if (judges && judges.length > 0 && processedJudgeIds.length > 0) {
      const { error: cleanupErr } = await supabase
        .from("expected_judges")
        .delete()
        .eq("match_id", match_id)
        .not("judge_id", "in", `(${processedJudgeIds.join(",")})`);
      if (cleanupErr) {
        console.error("expected_judges cleanup error", cleanupErr);
      }
    } else if (judges && judges.length === 0) {
      // 空配列が明示的に渡された場合、全員削除
      const { error: cleanupErr } = await supabase
        .from("expected_judges")
        .delete()
        .eq("match_id", match_id);
      if (cleanupErr) {
        console.error("expected_judges cleanup error", cleanupErr);
      }
    }

    return json({
      ok: true,
      match: {
        id: match_id,
        code: match_code,
        name: match_name,
        timeline,
        num_bouts: numBouts,
      },
      judge_tokens: judgeResults,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
