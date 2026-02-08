// supabase/functions/control_confirm_with_secret/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const adminSecret = (Deno.env.get("ADMIN_SETUP_SECRET") ?? "").trim();
const supabase = createClient(supabaseUrl, serviceRoleKey);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * snapshotItems から winner を決める（暫定ルール：旗数の多い方。同数は draw）
 * - flag は boolean / number / null 等が混在しうるため、真なら1とみなす
 * - 同点時のタイブレ（作品点など）を入れたくなったらここに追加する
 */
function decideWinnerFromSnapshotItems(
  items: Array<any>,
): "red" | "white" | "draw" {
  let redFlags = 0;
  let whiteFlags = 0;

  for (const it of items ?? []) {
    const rf = it?.red?.flag;
    const wf = it?.white?.flag;

    if (rf === true) redFlags += 1;
    else if (typeof rf === "number") redFlags += rf ? 1 : 0;

    if (wf === true) whiteFlags += 1;
    else if (typeof wf === "number") whiteFlags += wf ? 1 : 0;
  }

  if (redFlags > whiteFlags) return "red";
  if (whiteFlags > redFlags) return "white";
  return "draw";
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const clientSecret =
      typeof body?.admin_secret === "string" ? body.admin_secret.trim() : "";

    if (!adminSecret) {
      return json(
        { error: "server misconfigured: ADMIN_SETUP_SECRET not set" },
        500,
      );
    }
    if (!clientSecret || clientSecret !== adminSecret) {
      return json({ error: "unauthorized" }, 401);
    }

    const match_code = body?.match_code;
    if (!match_code) {
      return json({ error: "match_code is required" }, 400);
    }

    // 1. 対戦取得
    const { data: matchRow, error: matchErr } = await supabase
      .from("matches")
      .select("id, code, name")
      .eq("code", match_code)
      .maybeSingle();

    if (matchErr || !matchRow) {
      return json({ error: "match not found" }, 404);
    }
    const match_id = matchRow.id;

    // 2. state から現在の epoch / accepting を取得
    const { data: stateRow, error: stateErr } = await supabase
      .from("state")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (stateErr || !stateRow) {
      return json({ error: "state not found" }, 500);
    }

    const epoch = stateRow.epoch;
    const accepting = stateRow.accepting;

    if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
      return json({ error: "invalid state.epoch" }, 500);
    }

    // 2.5. 現在の epoch に対応するポジション情報（先鋒/中堅/大将など）を取得
    let slot: number | null = null;
    let slot_label: string | null = null;
    try {
      const { data: boutRow, error: boutErr } = await supabase
        .from("match_bouts")
        .select("slot, label")
        .eq("match_id", match_id)
        .eq("epoch", epoch)
        .maybeSingle();
      if (!boutErr && boutRow) {
        slot = boutRow.slot;
        slot_label = boutRow.label;
      }
    } catch (e) {
      console.error("match_bouts lookup failed", e);
    }

    // 3. 期待審査員一覧
    const { data: expectedJudges, error: expErr } = await supabase
      .from("expected_judges")
      .select("judge_id")
      .eq("match_id", match_id);

    if (expErr) {
      return json({ error: "failed to load expected_judges" }, 500);
    }
    if (!expectedJudges || expectedJudges.length === 0) {
      return json({ error: "no expected judges registered" }, 400);
    }
    const expectedIds = expectedJudges.map((r) => String(r.judge_id));

    // 4. submissions から、この match_id & epoch の提出状況を取得
    const { data: submitted, error: subErr } = await supabase
      .from("submissions")
      .select(
        "id, judge_id, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag",
      )
      .eq("match_id", match_id)
      .eq("epoch", epoch);

    if (subErr) {
      return json({ error: "failed to load submissions" }, 500);
    }

    const submittedIds = Array.from(
      new Set((submitted ?? []).map((r) => String(r.judge_id))),
    );
    const allArrived = expectedIds.every((id) => submittedIds.includes(id));

    if (!allArrived) {
      return json(
        {
          error: "not all judges have submitted yet",
          detail: {
            expected_count: expectedIds.length,
            submitted_count: submittedIds.length,
          },
        },
        400,
      );
    }

    // 5. スナップショット JSON を作成（judges テーブルと join）
    const { data: judgesRows, error: judgesErr } = await supabase
      .from("judges")
      .select("id, name");

    if (judgesErr) {
      return json({ error: "failed to load judges" }, 500);
    }

    const judgeNameById = new Map<string, string>();
    (judgesRows ?? []).forEach((j: any) => {
      judgeNameById.set(String(j.id), j.name);
    });

    const snapshotItems = (submitted ?? []).map((row: any) => {
      const judgeId = String(row.judge_id);
      return {
        judge_id: judgeId,
        judge_name: judgeNameById.get(judgeId) ?? null,
        match_id,
        match_code: matchRow.code,
        match_name: matchRow.name,
        epoch,
        revision: row.revision,
        red: {
          work_point: row.red_work,
          app_point: row.red_app,
          total: row.red_total,
          flag: row.red_flag,
        },
        white: {
          work_point: row.white_work,
          app_point: row.white_app,
          total: row.white_total,
          flag: row.white_flag,
        },
      };
    });

    const nowIso = new Date().toISOString();

    const snapshot = {
      spec_version: "v2.8-bout", // ★ slot 情報付きのバージョン
      match: {
        id: match_id,
        code: matchRow.code,
        name: matchRow.name,
      },
      epoch,
      bout: {
        slot,
        label: slot_label,
      },
      saved_at: nowIso,
      items: snapshotItems,
    };

    // ★追加: winner を決める
    const winner = decideWinnerFromSnapshotItems(snapshotItems);

    // 6. match_snapshots に upsert（同じ match_id+epoch があれば上書き）
    // ★追加: winner も保存
    const { error: snapErr } = await supabase
      .from("match_snapshots")
      .upsert(
        {
          match_id,
          epoch,
          snapshot,
          winner,
        },
        {
          onConflict: "match_id,epoch",
        },
      );

    if (snapErr) {
      console.error("match_snapshots upsert error", snapErr);
      return json({ error: "failed to save snapshot" }, 500);
    }

    // ★追加: この match の全epoch分から累計勝数を再集計（安全：E5連打しても壊れない）
    const { data: allSnaps, error: allSnapsErr } = await supabase
      .from("match_snapshots")
      .select("winner")
      .eq("match_id", match_id);

    if (allSnapsErr) {
      console.error("failed to load match_snapshots for win tally", allSnapsErr);
      return json({ error: "failed to recalc win tally" }, 500);
    }

    const red_wins = (allSnaps ?? []).filter((r: any) =>
      r.winner === "red"
    ).length;
    const white_wins = (allSnaps ?? []).filter((r: any) =>
      r.winner === "white"
    ).length;

    // 7. state を「確定」状態に（受付停止）＋ ★累計勝数を反映
    const { error: updStateErr } = await supabase
      .from("state")
      .update({
        accepting: false,
        red_wins,
        white_wins,
        wins_updated_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", 1);

    if (updStateErr) {
      console.error("state update error on E5", updStateErr);
      // ここで落としてもスナップショットは残っているが、OBS表示が目的なので基本はエラーにしてよい
      // いったんsoftにせず、明示エラーで返す
      return json({ error: "failed to update state" }, 500);
    }

    // 8. event_log に E5 を追加（slot 情報も含める）＋ ★winner/勝数も含める
    await supabase.from("event_log").insert({
      event_type: "E5",
      match_id,
      judge_id: null,
      epoch,
      detail: {
        match_id,
        match_code,
        epoch,
        saved_at: nowIso,
        slot,
        slot_label,
        winner,
        red_wins,
        white_wins,
      },
    });

    return json({
      ok: true,
      event_type: "E5",
      match_id,
      epoch,
      snapshot_count: snapshotItems.length,
      slot,
      slot_label,
      winner,
      red_wins,
      white_wins,
    });
  } catch (e) {
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
});
