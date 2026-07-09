// supabase/functions/admin-select/index.ts
// 管理画面用の限定 SELECT プロキシ（admin_secret 認証必須）
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, isAllowedOrigin } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/secret.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();

const supabase = createClient(supabaseUrl, serviceRoleKey);

const ALLOWED_TABLES = new Set([
  "venues",
  "matches",
  "state",
  "expected_judges",
  "judges",
  "submissions",
  "match_snapshots",
  "kuawase_candidates",
]);

type RequestBody = {
  admin_secret?: string;
  table?: string;
  params?: Record<string, string>;
};

function json(body: unknown, corsHeaders: HeadersInit, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function applyFilter(query: any, key: string, rawValue: string) {
  const value = String(rawValue);
  if (key === "select" || key === "order" || key === "limit") return query;

  const separator = value.indexOf(".");
  if (separator < 0) return query.eq(key, value);

  const op = value.slice(0, separator);
  const operand = value.slice(separator + 1);

  if (op === "eq") return query.eq(key, operand);
  if (op === "neq") return query.neq(key, operand);
  if (op === "gt") return query.gt(key, operand);
  if (op === "gte") return query.gte(key, operand);
  if (op === "lt") return query.lt(key, operand);
  if (op === "lte") return query.lte(key, operand);
  if (op === "in") {
    const trimmed = operand.replace(/^\(/, "").replace(/\)$/, "");
    const values = trimmed ? trimmed.split(",").map((item) => item.trim()) : [];
    return query.in(key, values);
  }

  return query.eq(key, value);
}

function applyOrder(query: any, rawOrder: string) {
  for (const part of rawOrder.split(",")) {
    const [column, direction, nulls] = part.split(".").map((item) => item.trim());
    if (!column) continue;
    query = query.order(column, {
      ascending: direction !== "desc",
      nullsFirst: nulls === "nullsfirst",
    });
  }
  return query;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (!isAllowedOrigin(req)) {
    return json({ error: "forbidden origin" }, corsHeaders, 403);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => null) as RequestBody | null;
    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, corsHeaders, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string"
      ? body.admin_secret.trim()
      : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, corsHeaders, 401);
    }

    const table = body?.table ?? "";
    if (!ALLOWED_TABLES.has(table)) {
      return json({ error: "table is not allowed" }, corsHeaders, 400);
    }

    const params = body?.params ?? {};
    let query = supabase.from(table).select(params.select ?? "*");
    for (const [key, value] of Object.entries(params)) {
      query = applyFilter(query, key, value);
    }
    if (params.order) query = applyOrder(query, params.order);
    if (params.limit) {
      const limit = Number(params.limit);
      if (Number.isInteger(limit) && limit > 0) query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("admin-select error", { table, params, error });
      return json({ error: "failed to fetch data" }, corsHeaders, 500);
    }

    return json({ ok: true, data: data ?? [] }, corsHeaders);
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, corsHeaders, 500);
  }
});
