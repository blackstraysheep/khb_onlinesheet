// supabase/functions/judge-submit-with-token/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// CORS ヘッダ
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, serviceRoleKey);
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
// epoch と num_bouts から対戦名（先鋒戦・中堅戦など）を決め打ち
function getBoutLabel(epoch, numBouts) {
  const e = Number(epoch || 0);
  if (numBouts === 5) {
    const labels = [
      "先鋒",
      "次鋒",
      "中堅",
      "副将",
      "大将"
    ];
    const base = labels[e - 1];
    return base ? `${base}戦` : `第${e}対戦`;
  }
  if (numBouts === 3) {
    const labels = [
      "先鋒",
      "中堅",
      "大将"
    ];
    const base = labels[e - 1];
    return base ? `${base}戦` : `第${e}対戦`;
  }
  return `第${e}対戦`;
}
serve(async (req)=>{
  // preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return json({
      error: "Method not allowed"
    }, 405);
  }
  try {
    const body = await req.json().catch(()=>null);
    const token = body?.token;
    const payload = body?.payload;
    const mode = body?.mode;
    const infoMode = mode === "info";
    // info モードなら payload は不要、通常モードは必須
    if (!token || !infoMode && !payload) {
      return json({
        error: "invalid request"
      }, 400);
    }
    // 1. トークン検証（judge_id だけ使う）
    const { data: tokenRow, error: tokenErr } = await supabase.from("access_tokens").select("*").eq("token", token).single();
    if (tokenErr || !tokenRow) {
      return json({
        error: "invalid token"
      }, 401);
    }
    if (tokenRow.role !== "judge") {
      return json({
        error: "invalid role"
      }, 403);
    }
    const judge_id = String(tokenRow.judge_id);
    // 2. state を取得（現在の match + epoch + accepting）
    const { data: stateRow, error: stateErr } = await supabase.from("state").select("*").eq("id", 1).maybeSingle();
    if (stateErr || !stateRow) {
      return json({
        error: "state not found"
      }, 500);
    }
    const epoch = stateRow.epoch;
    const accepting = stateRow.accepting;
    const current_match_id = stateRow.current_match_id ?? null;
    if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
      return json({
        error: "invalid state.epoch"
      }, 500);
    }
    if (!current_match_id) {
      // 現在の試合がセットされていない
      return json({
        error: "current match not set"
      }, 409);
    }
    const match_id = current_match_id;
    // 3. 対戦情報を取得（code, name, num_bouts, red/white チーム名）
    const { data: matchRow, error: matchErr } = await supabase.from("matches").select("id, code, name, num_bouts, red_team_name, white_team_name").eq("id", match_id).maybeSingle();
    if (matchErr || !matchRow) {
      return json({
        error: "match not found"
      }, 500);
    }
    const numBouts = typeof matchRow.num_bouts === "number" ? matchRow.num_bouts : 5;
    // epoch / num_bouts から bout 情報を生成（slot は epoch と同じ整数）
    const bout = {
      slot: epoch,
      label: getBoutLabel(epoch, numBouts)
    };
    // 4. 期待審査員かどうか
    const { data: expected, error: expErr } = await supabase.from("expected_judges").select("judge_id").eq("match_id", match_id).eq("judge_id", judge_id).maybeSingle();
    if (expErr || !expected) {
      return json({
        error: "unexpected judge"
      }, 403);
    }
    // ★ info モードのときはここで情報だけ返して終了（審査員名＋提出済み点数も付ける）
    if (infoMode) {
      // judges テーブルから審査員名を取得（失敗しても致命ではない）
      const { data: judgeRow } = await supabase.from("judges").select("id, name").eq("id", judge_id).maybeSingle();
      // 既に送信済みの得点があれば submissions から取得する
      let submission = null;
      const { data: submissionRow, error: submissionErr } = await supabase.from("submissions").select("red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag, revision").eq("match_id", match_id).eq("judge_id", judge_id).eq("epoch", epoch).order("revision", {
        ascending: false
      }).limit(1).maybeSingle();
      if (!submissionErr && submissionRow) {
        submission = {
          red: {
            work: submissionRow.red_work,
            app: submissionRow.red_app,
            total: submissionRow.red_total,
            flag: !!submissionRow.red_flag
          },
          white: {
            work: submissionRow.white_work,
            app: submissionRow.white_app,
            total: submissionRow.white_total,
            flag: !!submissionRow.white_flag
          },
          revision: submissionRow.revision ?? 1
        };
      }
      return json({
        ok: true,
        mode: "info",
        match: {
          id: matchRow.id,
          code: matchRow.code,
          name: matchRow.name,
          red_team_name: matchRow.red_team_name,
          white_team_name: matchRow.white_team_name,
          num_bouts: matchRow.num_bouts
        },
        epoch,
        accepting,
        judge_id,
        judge_name: judgeRow?.name ?? null,
        bout,
        submission
      });
    }
    // 5. 受付中チェック（送信時のみ）
    if (!accepting) {
      return json({
        error: "not accepting"
      }, 409);
    }
    // 6. 値のバリデーション（minus なし版）
    const red = payload?.red;
    const white = payload?.white;
    function checkSide(side, sideName) {
      for (const key of [
        "work",
        "app",
        "total"
      ]){
        const v = side[key];
        if (!Number.isFinite(v) || v < 0 || v > 100) {
          throw new Error(`invalid ${sideName}.${key}`);
        }
      }
      if (typeof side.flag !== "boolean") {
        throw new Error(`invalid ${sideName}.flag`);
      }
      // 合計 = 作品点 + 鑑賞点 になっているか軽くチェック
      if (side.total !== side.work + side.app) {
        throw new Error(`invalid ${sideName}.total_mismatch`);
      }
    }
    try {
      checkSide(red, "red");
      checkSide(white, "white");
    } catch (e) {
      return json({
        error: e.message
      }, 400);
    }
    // 7. submissions に upsert（初回=E1, 修正=E2）
    const nowIso = new Date().toISOString();
    const { data: existing } = await supabase.from("submissions").select("id, revision").eq("match_id", match_id).eq("judge_id", judge_id).eq("epoch", epoch).maybeSingle();
    let eventType = "E1";
    let revision = 1;
    if (!existing) {
      const { error: insErr } = await supabase.from("submissions").insert({
        match_id,
        judge_id,
        epoch,
        revision,
        red_work: red.work,
        red_app: red.app,
        red_total: red.total,
        red_flag: red.flag,
        white_work: white.work,
        white_app: white.app,
        white_total: white.total,
        white_flag: white.flag,
        created_at: nowIso,
        updated_at: nowIso
      });
      if (insErr) throw insErr;
    } else {
      revision = existing.revision + 1;
      eventType = "E2";
      const { error: updErr } = await supabase.from("submissions").update({
        revision,
        red_work: red.work,
        red_app: red.app,
        red_total: red.total,
        red_flag: red.flag,
        white_work: white.work,
        white_app: white.app,
        white_total: white.total,
        white_flag: white.flag,
        updated_at: nowIso
      }).eq("id", existing.id);
      if (updErr) throw updErr;
    }
    // 8. E1/E2 イベントログ
    await supabase.from("event_log").insert({
      event_type: eventType,
      match_id,
      judge_id,
      epoch,
      detail: payload
    });
    // 9. E3 判定（期待審査員が全員提出したか）
    try {
      const { data: expectedAll, error: expAllErr } = await supabase.from("expected_judges").select("judge_id").eq("match_id", match_id);
      if (!expAllErr && expectedAll && expectedAll.length > 0) {
        const expectedIds = expectedAll.map((r)=>String(r.judge_id));
        const { data: submittedAll, error: subAllErr } = await supabase.from("submissions").select("judge_id").eq("match_id", match_id).eq("epoch", epoch);
        if (!subAllErr && submittedAll) {
          const submittedIds = Array.from(new Set(submittedAll.map((r)=>String(r.judge_id))));
          const allSubmitted = expectedIds.every((id)=>submittedIds.includes(id));
          if (allSubmitted) {
            const { data: stateRow2 } = await supabase.from("state").select("*").eq("id", 1).maybeSingle();
            if (stateRow2 && !stateRow2.e3_reached && stateRow2.epoch === epoch) {
              await supabase.from("state").update({
                e3_reached: true,
                updated_at: nowIso
              }).eq("id", 1);
              await supabase.from("event_log").insert({
                event_type: "E3",
                match_id,
                epoch,
                detail: {
                  match_id,
                  epoch
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("E3 check failed", e);
    }
    return json({
      ok: true,
      event_type: eventType,
      revision,
      match: {
        id: matchRow.id,
        code: matchRow.code,
        name: matchRow.name,
        red_team_name: matchRow.red_team_name,
        white_team_name: matchRow.white_team_name,
        num_bouts: matchRow.num_bouts
      },
      epoch,
      bout
    });
  } catch (e) {
    console.error(e);
    return json({
      error: "internal error"
    }, 500);
  }
});
