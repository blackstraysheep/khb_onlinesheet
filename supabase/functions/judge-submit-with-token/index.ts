// supabase/functions/judge-submit-with-token/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// CORS ヘッダ
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceRoleKey);

type MatchRow = {
  id: string;
  code: string;
  name: string | null;
  num_bouts: number | null;
  red_team_name: string | null;
  white_team_name: string | null;
  timeline: number | null;
};

type SubmissionInfo = {
  red: {
    work: any;
    app: any;
    total: any;
    flag: boolean;
  };
  white: {
    work: any;
    app: any;
    total: any;
    flag: boolean;
  };
  revision: any;
} | null;
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

    // 2. タイムライン方式で担当試合を特定
    //    全 state を取得 → expected_judges で自分が含まれるものに絞る
    //    → 優先度: active未完了 > inactive未完了 > 完了済み → timeline昇順
    const { data: activeStates, error: statesErr } = await supabase
      .from("state")
      .select("*");
    if (statesErr) {
      return json({ error: "failed to load states" }, 500);
    }
    if (!activeStates || activeStates.length === 0) {
      if (infoMode) {
        // 審査員名だけ返す
        const { data: judgeRow } = await supabase.from("judges").select("id, name").eq("id", judge_id).maybeSingle();
        return json({ ok: true, mode: "info", waiting: true, judge_id, judge_name: judgeRow?.name ?? null });
      }
      return json({ error: "no active match" }, 409);
    }

    // current_match_id の一覧と match 情報を取得
    const matchIds = activeStates.map((s) => s.current_match_id).filter(Boolean);
    if (matchIds.length === 0) {
      if (infoMode) {
        const { data: judgeRow } = await supabase.from("judges").select("id, name").eq("id", judge_id).maybeSingle();
        return json({ ok: true, mode: "info", waiting: true, judge_id, judge_name: judgeRow?.name ?? null });
      }
      return json({ error: "current match not set" }, 409);
    }

    // expected_judges で自分が含まれる match に絞る
    const { data: myExpected, error: myExpErr } = await supabase
      .from("expected_judges")
      .select("match_id")
      .eq("judge_id", judge_id)
      .in("match_id", matchIds);
    if (myExpErr) {
      return json({ error: "failed to check expected_judges" }, 500);
    }
    const myMatchIds = new Set((myExpected ?? []).map((r) => String(r.match_id)));

    // match 情報を取得（timeline を含む）
    const { data: matchRows, error: matchesErr } = await supabase
      .from("matches")
      .select("id, code, name, num_bouts, red_team_name, white_team_name, timeline")
      .in("id", matchIds);
    if (matchesErr) {
      return json({ error: "failed to load matches" }, 500);
    }
    const matchById = new Map<string, MatchRow>(((matchRows ?? []) as MatchRow[]).map((m)=>[
        String(m.id),
        m
      ]));

    // 最終epoch E5確定済み（match_snapshots に最終epoch分が存在）を除外
    const { data: finalSnaps, error: snapsErr } = await supabase
      .from("match_snapshots")
      .select("match_id, epoch")
      .in("match_id", matchIds);
    if (snapsErr) {
      return json({ error: "failed to load snapshots" }, 500);
    }
    // match_id → 確定済み最大epoch
    const confirmedMaxEpoch = new Map<string, number>();
    for (const snap of (finalSnaps ?? [])) {
      const mid = String(snap.match_id);
      const cur = confirmedMaxEpoch.get(mid) ?? 0;
      if (snap.epoch > cur) confirmedMaxEpoch.set(mid, snap.epoch);
    }

    // 候補をフィルタ
    type Candidate = { stateRow: any; matchRow: any; isComplete: boolean };
    const candidates: Candidate[] = [];
    for (const st of activeStates) {
      const mid = String(st.current_match_id);
      if (!myMatchIds.has(mid)) continue; // 自分が期待されていない
      const m = matchById.get(mid);
      if (!m) continue;
      const numBouts = typeof m.num_bouts === "number" ? m.num_bouts : 5;
      const maxConfirmed = confirmedMaxEpoch.get(mid) ?? 0;
      const isComplete = maxConfirmed >= numBouts; // 最終epoch確定済み = 試合完了
      candidates.push({ stateRow: st, matchRow: m, isComplete });
    }

    if (candidates.length === 0) {
      if (infoMode) {
        const { data: judgeRow } = await supabase.from("judges").select("id, name").eq("id", judge_id).maybeSingle();
        return json({ ok: true, mode: "info", waiting: true, judge_id, judge_name: judgeRow?.name ?? null });
      }
      return json({ error: "no active match for this judge" }, 409);
    }

    // 優先度付きソート: 0=active未完了, 1=inactive未完了, 2=完了済み → timeline昇順 → code辞書順
    const candidatePriority = (c: Candidate): number => {
      if (c.isComplete) return 2;
      if (c.stateRow.accepting) return 0;
      return 1;
    };
    candidates.sort((a, b) => {
      const pA = candidatePriority(a), pB = candidatePriority(b);
      if (pA !== pB) return pA - pB;
      const tA = a.matchRow.timeline ?? 0;
      const tB = b.matchRow.timeline ?? 0;
      if (tA !== tB) return tA - tB;
      return (a.matchRow.code ?? '').localeCompare(b.matchRow.code ?? '');
    });

    const chosen = candidates[0];
    const stateRow = chosen.stateRow;
    const matchRow = chosen.matchRow;
    const venue_id = String(stateRow.venue_id);
    const match_id = String(matchRow.id);
    const epoch = stateRow.epoch;
    const accepting = stateRow.accepting;
    const numBouts = typeof matchRow.num_bouts === "number" ? matchRow.num_bouts : 5;
    if (typeof epoch !== "number" || !Number.isInteger(epoch) || epoch < 1) {
      return json({ error: "invalid state.epoch" }, 500);
    }
    // epoch / num_bouts から bout 情報を生成
    const bout = {
      slot: epoch,
      label: getBoutLabel(epoch, numBouts)
    };
    // ★ info モードのときはここで情報だけ返して終了（審査員名＋提出済み点数も付ける）
    if (infoMode) {
      // judges テーブルから審査員名を取得（失敗しても致命ではない）
      const { data: judgeRow } = await supabase.from("judges").select("id, name").eq("id", judge_id).maybeSingle();

      // 会場情報を取得
      const { data: venueRow } = await supabase.from("venues").select("id, code, name").eq("id", venue_id).maybeSingle();
      // 複数会場があるかどうか
      const { count: venueCount } = await supabase.from("venues").select("id", { count: "exact", head: true });

      // 既に送信済みの得点があれば submissions から取得する
      let submission: SubmissionInfo = null;
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
          num_bouts: matchRow.num_bouts,
          timeline: matchRow.timeline
        },
        venue: venueRow ? { code: venueRow.code, name: venueRow.name } : null,
        multiple_venues: (venueCount ?? 0) > 1,
        epoch,
        accepting,
        match_complete: chosen.isComplete,
        judge_id,
        judge_name: judgeRow?.name ?? null,
        bout,
        submission
      });
    }
    // 5. 受付中チェック（送信時のみ）
    if (!accepting || chosen.isComplete) {
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
    } catch (e: any) {
      return json({
        error: e?.message ?? "invalid payload"
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
            const { data: stateRow2 } = await supabase.from("state").select("*").eq("venue_id", venue_id).maybeSingle();
            if (stateRow2 && !stateRow2.e3_reached) {
              await supabase.from("state").update({
                e3_reached: true,
                updated_at: nowIso
              }).eq("venue_id", venue_id);
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
    } catch (e: unknown) {
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
