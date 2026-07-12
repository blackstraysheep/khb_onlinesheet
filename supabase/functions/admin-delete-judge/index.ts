// supabase/functions/admin-delete-judge/index.ts
// 審査員の削除(管理用)。誤って作った「空の審査員」を掃除するための機能。
//
// 安全策(データを持つ審査員は消せない):
// - expected_judges に割当がある(=試合に紐付いている)場合は拒否
// - submissions に送信済みの採点がある場合は拒否
// 上記を満たす審査員のみ、access_tokens(審査員トークン)ごと削除する。
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
      judge_id?: string;
    } | null;

    if (!adminSecret) {
      return json({ error: "server misconfigured: ADMIN_SETUP_SECRET not set" }, 500);
    }
    const clientSecret = typeof body?.admin_secret === "string" ? body.admin_secret.trim() : "";
    if (!timingSafeEqual(clientSecret, adminSecret)) {
      return json({ error: "unauthorized" }, 401);
    }

    const judgeId = typeof body?.judge_id === "string" ? body.judge_id.trim() : "";
    if (!judgeId) {
      return json({ error: "judge_id is required" }, 400);
    }

    const { data: judgeRow, error: judgeErr } = await supabase
      .from("judges")
      .select("id, name")
      .eq("id", judgeId)
      .maybeSingle();
    if (judgeErr) {
      return json({ error: "failed to load judge" }, 500);
    }
    if (!judgeRow) {
      return json({ error: "judge not found" }, 404);
    }

    // 紐付き試合・送信済み採点のチェック
    const [{ count: assignedCount }, { count: submissionCount }] = await Promise.all([
      supabase.from("expected_judges").select("judge_id", { count: "exact", head: true })
        .eq("judge_id", judgeId),
      supabase.from("submissions").select("judge_id", { count: "exact", head: true })
        .eq("judge_id", judgeId),
    ]);

    if ((assignedCount ?? 0) > 0 || (submissionCount ?? 0) > 0) {
      return json({
        error: "judge_in_use",
        detail: {
          assigned_matches: assignedCount ?? 0,
          submissions: submissionCount ?? 0,
        },
      }, 409);
    }

    // 審査員トークン → 本体の順に削除
    const { error: tokenErr } = await supabase
      .from("access_tokens")
      .delete()
      .eq("judge_id", judgeId);
    if (tokenErr) {
      console.error("access_tokens delete error", tokenErr);
      return json({ error: "failed to delete judge tokens" }, 500);
    }

    const { error: delErr } = await supabase
      .from("judges")
      .delete()
      .eq("id", judgeId);
    if (delErr) {
      console.error("judges delete error", delErr);
      return json({ error: "failed to delete judge" }, 500);
    }

    await supabase.from("event_log").insert({
      event_type: "ADMIN_DELETE_JUDGE",
      match_id: null,
      judge_id: null,
      epoch: null,
      detail: { deleted_judge_id: judgeId, judge_name: judgeRow.name },
    });

    return json({ ok: true, deleted: { judge_id: judgeId, judge_name: judgeRow.name } });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
