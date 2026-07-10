// supabase/functions/judge-get-revealed-haiku/index.ts
// 審査員画面向けに「披講済みの句」だけを返す読取専用エンドポイント。
//
// 参照: docs/02-kuawase-integration-impl.md 確定事項一覧 #3
//   句は事前インポートせず、披講ボタン押下時にその場送信される。
//   披講前の句は kuawase_sync_status.last_view に一切存在しないため、
//   この last_view をそのまま(必要フィールドのみ)返す分には漏洩リスクがない。
//   逆に kuawase_candidates 等、句そのものを保持しないテーブルからは
//   何であれ審査員に句相当の情報を出してはならない。
//
// 認可は judge-submit-with-token と全く同じ流儀(access_tokens の hash 照合)。
// kuawase_sync_status には RLS ポリシーがなく service_role のみアクセス可能なため、
// このエンドポイントが審査員向けの唯一の読取口になる。
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { sha256Hex, tokenLast4 } from "../_shared/token.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

function getRateLimitBucket(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = forwardedFor || req.headers.get("cf-connecting-ip") || "unknown";
  return `judge-get-revealed-haiku:${ip}`;
}

async function isWithinRateLimit(bucket: string): Promise<boolean> {
  const now = new Date();
  const { data, error } = await supabase
    .from("token_rate_limits")
    .select("window_start, request_count")
    .eq("bucket", bucket)
    .maybeSingle();

  if (error) {
    console.warn("rate limit lookup failed", error);
    return true;
  }

  if (!data) {
    await supabase.from("token_rate_limits").insert({
      bucket,
      window_start: now.toISOString(),
      request_count: 1,
      updated_at: now.toISOString(),
    });
    return true;
  }

  const windowStartMs = new Date(data.window_start).getTime();
  const expiredWindow = !Number.isFinite(windowStartMs) ||
    now.getTime() - windowStartMs > RATE_LIMIT_WINDOW_MS;
  const nextCount = expiredWindow ? 1 : Number(data.request_count ?? 0) + 1;

  await supabase
    .from("token_rate_limits")
    .update({
      window_start: expiredWindow ? now.toISOString() : data.window_start,
      request_count: nextCount,
      updated_at: now.toISOString(),
    })
    .eq("bucket", bucket);

  return nextCount <= RATE_LIMIT_MAX_REQUESTS;
}

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
  if (!await isWithinRateLimit(getRateLimitBucket(req))) {
    return json({ error: "rate limit exceeded" }, 429);
  }

  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const matchCode = typeof body?.match_code === "string" ? body.match_code.trim() : "";
    if (!token || !matchCode) {
      return json({ error: "invalid request" }, 400);
    }

    // 1. トークン検証（judge-submit-with-token と同一の流儀）
    const tokenHash = await sha256Hex(token);
    let { data: tokenRow, error: tokenErr } = await supabase
      .from("access_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (!tokenRow) {
      const legacyResult = await supabase
        .from("access_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      tokenRow = legacyResult.data;
      tokenErr = legacyResult.error;
    }
    if (tokenErr || !tokenRow) {
      return json({ error: "invalid token" }, 401);
    }
    if (tokenRow.revoked_at) {
      return json({ error: "invalid token" }, 401);
    }
    if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      return json({ error: "token expired" }, 401);
    }
    if (tokenRow.role !== "judge") {
      return json({ error: "invalid role" }, 403);
    }
    const tokenUpdate = {
      token: null,
      token_hash: tokenRow.token_hash ?? tokenHash,
      token_last4: tokenRow.token_last4 ?? tokenLast4(token),
      last_used_at: new Date().toISOString(),
    };
    const tokenUpdateQuery = supabase.from("access_tokens").update(tokenUpdate);
    if (tokenRow.id) {
      await tokenUpdateQuery.eq("id", tokenRow.id);
    } else {
      await tokenUpdateQuery.eq("token", token);
    }

    // 2. match_code → matches（venue_id を得るためだけに使う。句はここには存在しない）
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("id, venue_id")
      .eq("code", matchCode)
      .maybeSingle();
    if (matchErr) {
      return json({ error: "failed to load match" }, 500);
    }
    if (!matchRow || !matchRow.venue_id) {
      // 未登録の match_code。存在有無を詳しく伝えず「披講なし」と同じ扱いにする。
      return json({ ok: true, reveal: null });
    }

    // 3. venue の kuawase_sync_status を読む（唯一の審査員向け読取口）。
    //    kuawase_candidates 等、句を含みうる他テーブルはここでは一切参照しない。
    const { data: statusRow, error: statusErr } = await supabase
      .from("kuawase_sync_status")
      .select("enabled, last_view")
      .eq("venue_id", matchRow.venue_id)
      .maybeSingle();
    if (statusErr) {
      return json({ error: "failed to load sync status" }, 500);
    }
    if (!statusRow || !statusRow.enabled) {
      return json({ ok: true, reveal: null });
    }

    // deno-lint-ignore no-explicit-any
    const lastView = (statusRow.last_view ?? {}) as Record<string, any>;
    if (!lastView || lastView.match_code !== matchCode) {
      return json({ ok: true, reveal: null });
    }

    const slot = typeof lastView.slot === "number" ? lastView.slot : null;
    const reveal = lastView.reveal && typeof lastView.reveal === "object"
      ? {
        red: typeof lastView.reveal.red === "string" ? lastView.reveal.red : null,
        white: typeof lastView.reveal.white === "string" ? lastView.reveal.white : null,
      }
      : { red: null, white: null };

    return json({ ok: true, slot, reveal });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
