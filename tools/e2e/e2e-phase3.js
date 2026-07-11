// Phase 3 E2E: CONFIRM_AND_ADVANCE(E5+E6 原子実行)・DISCONNECT・preset name
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
const log = (msg, extra = "") => console.log(`[p3-${String(++step).padStart(2, "0")}] ${msg} ${extra}`);

async function main() {
  // 0. クリーンアップ
  psql(`DELETE FROM public.kuawase_sync_tokens;
        DELETE FROM public.kuawase_sync_status;
        DELETE FROM public.kuawase_candidates;
        UPDATE public.state SET current_match_id=NULL WHERE current_match_id IN (SELECT id FROM public.matches WHERE code='P3-1');
        DELETE FROM public.event_log WHERE match_id IN (SELECT id FROM public.matches WHERE code='P3-1');
        DELETE FROM public.match_snapshots WHERE match_id IN (SELECT id FROM public.matches WHERE code='P3-1');
        DELETE FROM public.submissions WHERE match_id IN (SELECT id FROM public.matches WHERE code='P3-1');
        DELETE FROM public.expected_judges WHERE match_id IN (SELECT id FROM public.matches WHERE code='P3-1');
        DELETE FROM public.matches WHERE code='P3-1';`);
  log("cleanup done");

  // 1. token + 候補 + 試合(3番勝負、審査員1名、試合名あり)
  let r = await callAdmin("admin-issue-kuawase-token", { venue_code: "default", label: "p3", expires_in_hours: 1 });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const TOKEN = r.data.token;

  r = await callK("kuawase-import-candidates", TOKEN, {
    event_id: "p3-imp", device_id: "devP3",
    compe_name: "P3大会",
    teams: [{ cell: "B3", name: "紅組高校" }, { cell: "B4", name: "白組高校" }],
    kendai: [{ cell: "H1", name: "夏の月" }],
    excel_hash: "sha256:" + "c".repeat(64),
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));

  r = await callAdmin("admin-setup-match", {
    venue_code: "default", match_code: "P3-1", match_name: "P3決勝", timeline: 98, num_bouts: 3,
    red_team_name: "紅組高校", white_team_name: "白組高校", kendai_name: "夏の月",
    kuawase_ref: { red_cell: "B3", white_cell: "B4", kendai_cell: "H1", excel_hash: "sha256:" + "c".repeat(64) },
    judges: [{ name: "P3審査員" }],
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const matchId = psql("SELECT id FROM public.matches WHERE code='P3-1';");
  const judgeId = psql(`SELECT judge_id FROM public.expected_judges WHERE match_id='${matchId}' LIMIT 1;`);
  assert.ok(matchId && judgeId, "match/judge seeded");
  log("seeded match P3-1 (3 bouts, 1 judge)");

  // 2. connect: preset に name が含まれる
  r = await callK("kuawase-sync-connect", TOKEN, { event_id: "p3-c1", device_id: "devP3" });
  assert.strictEqual(r.status, 200);
  const preset = r.data.presets.find((p) => p.code === "P3-1");
  assert.strictEqual(preset.name, "P3決勝", JSON.stringify(preset));
  log("connect -> preset includes match name", preset.name);

  // 3. SET_MATCH
  r = await callK("kuawase-sync-control", TOKEN, { event_id: "p3-sm", device_id: "devP3", action: "SET_MATCH", match_code: "P3-1" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.state.epoch, 1);

  // 4. 未提出のまま CONFIRM_AND_ADVANCE → 拒否
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "p3-ca0", device_id: "devP3", action: "CONFIRM_AND_ADVANCE", match_code: "P3-1", slot: 1,
  });
  assert.strictEqual(r.status, 400, JSON.stringify(r.data));
  assert.ok(String(r.data.error).includes("not all judges"), JSON.stringify(r.data));
  log("confirm without submissions -> rejected", r.data.error);

  // 5. 提出を投入して確定(句込み)→ epoch2 へ前進
  function submit(epoch, redFlag, whiteFlag) {
    psql(`INSERT INTO public.submissions (match_id, judge_id, epoch, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag) VALUES ('${matchId}', '${judgeId}', ${epoch}, 1, 5, 5, 10, ${redFlag}, 4, 4, 8, ${whiteFlag});`);
  }
  submit(1, true, false);
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "p3-ca1", device_id: "devP3", action: "CONFIRM_AND_ADVANCE", match_code: "P3-1", slot: 1,
    haiku: { red: "夏の月<b>ほのか</b>", white: "白の句その一" },
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.applied.confirmed_epoch, 1);
  assert.strictEqual(r.data.applied.winner, "red");
  assert.strictEqual(r.data.applied.advanced_to, 2);
  assert.strictEqual(r.data.match_finished, false);
  assert.strictEqual(r.data.state.epoch, 2);
  assert.strictEqual(r.data.state.accepting, true);
  const snapHaiku = psql(`SELECT snapshot->'haiku'->>'red' FROM public.match_snapshots WHERE match_id='${matchId}' AND epoch=1;`);
  assert.strictEqual(snapHaiku, "夏の月ほのか", `sanitized haiku in snapshot: ${snapHaiku}`);
  log("confirm epoch1 -> advanced to 2, haiku in snapshot (sanitized)");

  // 6. 同一 event_id 再送 → 二重前進しない
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "p3-ca1", device_id: "devP3", action: "CONFIRM_AND_ADVANCE", match_code: "P3-1", slot: 3,
  });
  assert.strictEqual(r.data.idempotent, true, JSON.stringify(r.data));
  assert.strictEqual(r.data.state.epoch, 2, "replay must not double-advance");
  log("replay -> idempotent, epoch still 2");

  // 7. slot ガード: epoch2(=slot3)なのに slot1 で確定要求 → 409
  submit(2, false, true);
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "p3-ca2x", device_id: "devP3", action: "CONFIRM_AND_ADVANCE", match_code: "P3-1", slot: 1,
  });
  assert.strictEqual(r.status, 409, JSON.stringify(r.data));
  assert.strictEqual(r.data.error, "slot_epoch_mismatch");
  log("wrong slot -> 409 slot_epoch_mismatch");

  // 8. 正しい slot3 で確定 → epoch3
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "p3-ca2", device_id: "devP3", action: "CONFIRM_AND_ADVANCE", match_code: "P3-1", slot: 3,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.applied.winner, "white");
  assert.strictEqual(r.data.state.epoch, 3);
  log("confirm epoch2 -> advanced to 3");

  // 9. 最終対戦(epoch3 = slot5)確定 → 前進せず試合終了
  submit(3, true, false);
  r = await callK("kuawase-sync-control", TOKEN, {
    event_id: "p3-ca3", device_id: "devP3", action: "CONFIRM_AND_ADVANCE", match_code: "P3-1", slot: 5,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.match_finished, true);
  assert.strictEqual(r.data.applied.advanced_to, null);
  assert.strictEqual(r.data.state.epoch, 3, "final bout must not advance epoch");
  assert.strictEqual(r.data.state.accepting, false);
  const wins = psql(`SELECT red_wins || '-' || white_wins FROM public.state WHERE current_match_id='${matchId}';`);
  assert.strictEqual(wins, "2-1");
  log("final bout -> match finished, wins 2-1, no advance");

  // 10. DISCONNECT → enabled=false
  r = await callK("kuawase-sync-control", TOKEN, { event_id: "p3-dc", device_id: "devP3", action: "DISCONNECT" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(psql("SELECT enabled FROM public.kuawase_sync_status;"), "f");
  log("DISCONNECT -> enabled=false in DB");

  // 11. 互換確認: secret 版 E5(refactor 後)も従来通り動く
  //     (P3-1 は確定済みなので、新しい試合で SET_MATCH からやり直す)
  psql(`DELETE FROM public.submissions WHERE match_id='${matchId}' AND epoch=1;`);
  psql(`INSERT INTO public.submissions (match_id, judge_id, epoch, revision, red_work, red_app, red_total, red_flag, white_work, white_app, white_total, white_flag) VALUES ('${matchId}', '${judgeId}', 1, 1, 5, 5, 10, true, 4, 4, 8, false);`);
  r = await callAdmin("control_set_current_match_with_secret", { venue_code: "default", match_code: "P3-1", epoch: 1 });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  r = await callAdmin("control_confirm_with_secret", { venue_code: "default", match_code: "P3-1" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.event_type, "E5");
  assert.strictEqual(r.data.winner, "red");
  log("secret-based SET_MATCH + E5 still work after refactor");

  console.log("\nPhase 3 E2E: all steps passed");
}

main().catch((e) => {
  console.error("Phase3 E2E FAILED:", e.message);
  process.exit(1);
});
