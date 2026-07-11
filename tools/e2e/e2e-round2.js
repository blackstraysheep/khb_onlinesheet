// Round 2 E2E: GUI フィードバック対応分の API 検証
// - CONFIRM / ADVANCE(E5・E6 個別アクション)と final_bout_reached ガード
// - kuawase-get-scores(読み上げ用スコア)
// - kuawase-sync-report が enabled を返す(OES 側解除の kk 検出)
// - admin-delete-match(進行中は拒否 → 解除後に削除)
// - sanitizeText の <br> allowlist(試合名)
const fs = require("fs");
const assert = require("assert");
const { execSync } = require("child_process");

const BASE = "http://127.0.0.1:54321/functions/v1";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const ADMIN_SECRET = fs
  .readFileSync(require("path").join(__dirname, "../../supabase/functions/.env"), "utf8")
  .match(/ADMIN_SETUP_SECRET=(.+)/)[1].trim();

function psql(sql) {
  // Windows の cmd 経由では改行入り SQL が確実に通らないため単一行化する
  const oneLine = sql.replace(/\s*\r?\n\s*/g, " ");
  return execSync(
    `docker exec supabase_db_khb_onlinesheet psql -U postgres -d postgres -t -A -c "${oneLine.replace(/"/g, '\\"')}"`
  ).toString().trim();
}

async function post(fn, headers, body) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(`${BASE}/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (res.status !== 502 || attempt >= 5) {
      return { status: res.status, data: await res.json().catch(() => ({})) };
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const adminHeaders = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  Origin: "http://localhost:3000",
};
const callAdmin = (fn, body) => post(fn, adminHeaders, { admin_secret: ADMIN_SECRET, ...body });
const callK = (fn, token, body) => post(fn, { "x-kuawase-sync-token": token }, body);

let step = 0;
const log = (msg, extra = "") => console.log(`[r2-${String(++step).padStart(2, "0")}] ${msg} ${extra}`);

async function main() {
  // 0. クリーンアップ
  psql(`DELETE FROM public.kuawase_sync_tokens;
        DELETE FROM public.kuawase_sync_status;
        DELETE FROM public.kuawase_candidates;
        UPDATE public.state SET current_match_id=NULL WHERE current_match_id IN (SELECT id FROM public.matches WHERE code='R2-1');
        DELETE FROM public.event_log WHERE match_id IN (SELECT id FROM public.matches WHERE code='R2-1');
        DELETE FROM public.match_snapshots WHERE match_id IN (SELECT id FROM public.matches WHERE code='R2-1');
        DELETE FROM public.submissions WHERE match_id IN (SELECT id FROM public.matches WHERE code='R2-1');
        DELETE FROM public.expected_judges WHERE match_id IN (SELECT id FROM public.matches WHERE code='R2-1');
        DELETE FROM public.event_log WHERE event_type='ADMIN_DELETE_MATCH' AND detail->>'match_code'='R2-1';
        DELETE FROM public.matches WHERE code='R2-1';`);
  log("cleanup done");

  // 1. token + 試合(3番勝負、審査員1名)。試合名に <br> と不許可タグを混ぜる
  let r = await callAdmin("admin-issue-kuawase-token", { venue_code: "default", label: "r2", expires_in_hours: 1 });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const TOKEN = r.data.token;

  r = await callAdmin("admin-setup-match", {
    venue_code: "default", match_code: "R2-1",
    match_name: "R2決勝<br>第一試合<b>x</b>",
    timeline: 99, num_bouts: 3,
    red_team_name: "紅組", white_team_name: "白組",
    judges: [{ name: "R2審査員" }],
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const matchId = psql("SELECT id FROM public.matches WHERE code='R2-1';");
  const judgeId = psql(`SELECT judge_id FROM public.expected_judges WHERE match_id='${matchId}' LIMIT 1;`);
  psql(`UPDATE public.judges SET voice_key='r2judge' WHERE id='${judgeId}';`);
  const storedName = psql("SELECT name FROM public.matches WHERE code='R2-1';");
  assert.strictEqual(storedName, "R2決勝<br>第一試合x", `sanitized name: ${storedName}`);
  log("match seeded; name keeps <br>, strips other tags:", storedName);

  // 2. connect + SET_MATCH
  r = await callK("kuawase-sync-connect", TOKEN, { event_id: "r2-c1", device_id: "devR2" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  r = await callK("kuawase-sync-control", TOKEN, { event_id: "r2-sm", device_id: "devR2", action: "SET_MATCH", match_code: "R2-1" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.state.epoch, 1);
  log("connected + SET_MATCH epoch=1");

  // 3. report のレスポンスに enabled が含まれる
  r = await callK("kuawase-sync-report", TOKEN, {
    event_id: "r2-rp1", device_id: "devR2", kind: "view", match_code: "R2-1", slot: 1, source_page: "1.html",
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.enabled, true, JSON.stringify(r.data));
  log("report -> enabled=true in response");

  // 4. 未提出のまま CONFIRM → 拒否
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "r2-cf0", device_id: "devR2", action: "CONFIRM", match_code: "R2-1", slot: 1,
  });
  assert.strictEqual(r.status, 400, JSON.stringify(r.data));
  assert.ok(String(r.data.error).includes("not all judges"), JSON.stringify(r.data));
  log("CONFIRM without submissions -> rejected");

  // 5. 提出 → CONFIRM(E5のみ): epoch は進まず accepting=false、snapshot に句
  function submit(epoch, redFlag, whiteFlag) {
    psql(`INSERT INTO public.submissions (match_id, judge_id, epoch, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag) VALUES ('${matchId}', '${judgeId}', ${epoch}, 1, 5, 2, 7, ${redFlag}, 4, 0, 4, ${whiteFlag});`);
  }
  submit(1, true, false);
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "r2-cf1", device_id: "devR2", action: "CONFIRM", match_code: "R2-1", slot: 1,
    haiku: { red: "紅の句一", white: "白の句一" },
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.applied.action, "CONFIRM");
  assert.strictEqual(r.data.applied.winner, "red");
  assert.strictEqual(r.data.is_final, false);
  assert.strictEqual(r.data.state.epoch, 1, "CONFIRM must not advance");
  assert.strictEqual(r.data.state.accepting, false);
  const snapHaiku = psql(`SELECT snapshot->'haiku'->>'red' FROM public.match_snapshots WHERE match_id='${matchId}' AND epoch=1;`);
  assert.strictEqual(snapHaiku, "紅の句一");
  log("CONFIRM -> confirmed only (epoch stays 1, accepting=false, haiku saved)");

  // 6. kuawase-get-scores: 読み上げに必要なデータが返る
  r = await callK("kuawase-get-scores", TOKEN, { device_id: "devR2" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.match.code, "R2-1");
  assert.strictEqual(r.data.epoch, 1);
  assert.strictEqual(r.data.judges.length, 1);
  assert.strictEqual(r.data.judges[0].voice_key, "r2judge");
  assert.strictEqual(r.data.submissions.length, 1);
  assert.strictEqual(r.data.submissions[0].red_total, 7);
  log("get-scores -> judges + submissions for current bout");

  // 7. ADVANCE(E6のみ) → epoch=2, accepting=true
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "r2-ad1", device_id: "devR2", action: "ADVANCE", match_code: "R2-1",
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.applied.action, "ADVANCE");
  assert.strictEqual(r.data.state.epoch, 2);
  assert.strictEqual(r.data.state.accepting, true);
  log("ADVANCE -> epoch=2 accepting=true");

  // 8. epoch2, 3 を消化して最終対戦まで
  submit(2, false, true);
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "r2-cf2", device_id: "devR2", action: "CONFIRM", match_code: "R2-1", slot: 3,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  r = await callK("kuawase-sync-control", TOKEN, { event_id: "r2-ad2", device_id: "devR2", action: "ADVANCE", match_code: "R2-1" });
  assert.strictEqual(r.data.state.epoch, 3, JSON.stringify(r.data));
  submit(3, true, false);
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "r2-cf3", device_id: "devR2", action: "CONFIRM", match_code: "R2-1", slot: 5,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.is_final, true);
  log("bouts 2-3 confirmed; final bout is_final=true");

  // 9. 最終対戦後の ADVANCE → 409 final_bout_reached(kk 版・secret 版とも)
  r = await callK("kuawase-sync-control", TOKEN, { event_id: "r2-ad3", device_id: "devR2", action: "ADVANCE", match_code: "R2-1" });
  assert.strictEqual(r.status, 409, JSON.stringify(r.data));
  assert.strictEqual(r.data.error, "final_bout_reached");
  r = await callAdmin("control_advance_with_secret", { venue_code: "default" });
  assert.strictEqual(r.status, 409, JSON.stringify(r.data));
  assert.strictEqual(r.data.error, "final_bout_reached");
  assert.strictEqual(psql("SELECT epoch FROM public.state WHERE current_match_id='" + matchId + "';"), "3");
  log("ADVANCE past final bout -> 409 for both kk and admin-secret E6");

  // 10. OES 側解除 → report が enabled=false を返す(kk 検出経路)
  r = await callAdmin("admin-toggle-kuawase-sync", { venue_code: "default", enabled: false });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  r = await callK("kuawase-sync-report", TOKEN, {
    event_id: "r2-rp2", device_id: "devR2", kind: "view", match_code: "R2-1", slot: 5, source_page: "5.html",
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.enabled, false, JSON.stringify(r.data));
  assert.strictEqual(psql("SELECT enabled FROM public.kuawase_sync_status;"), "f", "report must not re-enable");
  log("admin disable -> report returns enabled=false (and stays disabled)");

  // 11. 進行中の試合の削除 → 409、current 解除後 → 削除成功
  r = await callAdmin("admin-delete-match", { match_code: "R2-1" });
  assert.strictEqual(r.status, 409, JSON.stringify(r.data));
  assert.strictEqual(r.data.error, "match_in_progress");
  psql(`UPDATE public.state SET current_match_id=NULL WHERE current_match_id='${matchId}';`);
  r = await callAdmin("admin-delete-match", { match_code: "R2-1" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(psql("SELECT count(*) FROM public.matches WHERE code='R2-1';"), "0");
  assert.strictEqual(psql(`SELECT count(*) FROM public.submissions WHERE match_id='${matchId}';`), "0");
  assert.strictEqual(psql(`SELECT count(*) FROM public.match_snapshots WHERE match_id='${matchId}';`), "0");
  const delLog = psql("SELECT count(*) FROM public.event_log WHERE event_type='ADMIN_DELETE_MATCH' AND detail->>'match_code'='R2-1';");
  assert.strictEqual(delLog, "1");
  log("delete-match: 409 while current, then deleted with children + audit log");

  // 後始末
  psql("DELETE FROM public.kuawase_sync_tokens; DELETE FROM public.kuawase_sync_status;");
  console.log("\nRound2 E2E: all steps passed");
}

main().catch((e) => {
  console.error("Round2 E2E FAILED:", e.message);
  process.exit(1);
});
