// kk 側 E2E: 実物の oes-sync-ipc.js(main プロセス実装)を fake ipcMain で起動し、
// ローカル OES(edge functions)に実接続して一気通貫を検証する。
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert");
const { execSync } = require("child_process");
const { createRequire } = require("module");

const KK_APP = process.env.KK_APP_DIR || path.join(__dirname, "../../../Kuawase-intergrated/apps/khb-kuawase");
const kkRequire = createRequire(path.join(KK_APP, "package.json"));
const axios = kkRequire("axios");
const { registerOesSyncIpcHandlers } = require(path.join(KK_APP, "src/ipc/oes-sync-ipc.js"));

const BASE = "http://127.0.0.1:54321";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const ADMIN_SECRET = fs
  .readFileSync(require("path").join(__dirname, "../../supabase/functions/.env"), "utf8")
  .match(/ADMIN_SETUP_SECRET=(.+)/)[1].trim();

// --- fake Electron userData + ipcMain -----------------------------------
const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), "kk-e2e-"));
const userDataPaths = {
  userDataPath,
  configPath: path.join(userDataPath, "config.json"),
  excelDataPath: path.join(userDataPath, "excelData.json"),
};

// Excel レイアウト準拠(B1 大会名 / B3.. チーム / H1,J1 兼題 / C.. 句)
const excelData = {
  B1: "E2E大会",
  H1: "夏の月",
  J1: "花火",
  B3: "紅組高校",
  B4: "白組x高校",
  C3: "初夏の月へ<i>飛ぶ</i>白鷺",
  C4: "白妙の句",
  G3: "中堅紅の句",
  G4: "中堅白の句",
  K3: "大将紅の句",
  K4: "データなし",
};
fs.writeFileSync(userDataPaths.configPath, "{}", "utf-8");
fs.writeFileSync(userDataPaths.excelDataPath, JSON.stringify(excelData, null, 4), "utf-8");

const handlers = {};
const ipcMain = { handle: (channel, fn) => { handlers[channel] = fn; } };
const invoke = (channel, payload) => handlers[channel]({}, payload);

registerOesSyncIpcHandlers({ ipcMain, fs, path, axios, userDataPaths, log: console });

function dbQuery(sql) {
  return execSync(
    `docker exec supabase_db_khb_onlinesheet psql -U postgres -d postgres -t -A -c "${sql}"`
  ).toString().trim();
}

let step = 0;
function log(name, extra = "") {
  step += 1;
  console.log(`[kk-${String(step).padStart(2, "0")}] ${name} ${extra}`);
}

async function issueToken() {
  const res = await fetch(`${BASE}/functions/v1/admin-issue-kuawase-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      admin_secret: ADMIN_SECRET,
      venue_code: "default",
      label: "e2e-kk",
      expires_in_hours: 1,
    }),
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200, JSON.stringify(data));
  return data.token;
}

async function main() {
  const TOKEN = await issueToken();
  log("fresh token issued");

  // 1. 接続: 前テストで devB がバインド済み → device_conflict → takeover で成功
  let r = await invoke("oes-set-connection", { baseUrl: BASE + "/", token: TOKEN });
  // 新規 token なので device 未バインド → 素直に成功するはず
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.venue.code, "default");
  // 手動テスト用の試合が DB に残っていても通るよう、件数は下限のみ確認する
  assert.ok(r.presetsCount >= 1, JSON.stringify(r));
  log("set-connection + connect", `venue=${r.venue.code} presets=${r.presetsCount}`);

  // 2. 接続時の自動同期: OES 側候補(前テストの値)とローカル Excel の
  //    ハッシュ不一致を connect が検出し、候補を自動送信して一致に転じているはず
  assert.strictEqual(r.autoImported, true, JSON.stringify(r));
  let status = await invoke("oes-get-status");
  assert.strictEqual(status.configured, true);
  assert.strictEqual(status.hasToken, true);
  assert.strictEqual(status.excelHashMatched, true, JSON.stringify(status));
  log("connect auto-imported candidates -> hash matched");

  // 3. 手動の再送信も引き続き動く(冪等)
  r = await invoke("oes-import-candidates");
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.deepStrictEqual(r.imported, { teams: 2, kendai: 2 });
  // 手動テスト用の別試合が残っていると REF_MISMATCH が出るため、E2E-1 分のみ検証
  const e2eRefWarnings = (r.warnings || []).filter((w) => w.match_code === "E2E-1");
  assert.strictEqual(e2eRefWarnings.length, 0, JSON.stringify(r.warnings));
  status = await invoke("oes-get-status");
  assert.strictEqual(status.excelHashMatched, true);
  log("manual import-candidates still works (idempotent)");

  // 4. プリセット読込(E2E-1 は既に current → no-op、config へ反映)
  r = await invoke("oes-load-preset", { code: "E2E-1" });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.alreadyCurrent, true);
  const config = JSON.parse(fs.readFileSync(userDataPaths.configPath, "utf-8"));
  assert.strictEqual(config.redTeam, "B3");
  assert.strictEqual(config.whiteTeam, "B4");
  assert.strictEqual(config.kendai, "H1");
  log("load-preset -> config.json updated", JSON.stringify({ red: config.redTeam, white: config.whiteTeam, kendai: config.kendai }));

  // 5. 表示報告(view)
  r = await invoke("oes-report-view", { kind: "view", slot: 1, sourcePage: "1.html?css=dark" });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.state.epoch, 1);
  const lv1 = dbQuery("SELECT last_view->>'source_page' FROM public.kuawase_sync_status;");
  assert.strictEqual(lv1, "1.html", `query param should be stripped: ${lv1}`);
  log("report view slot1 (query param stripped)");

  // 6. 披講報告(白): C4 の句が main 側で計算・送信される
  r = await invoke("oes-report-view", { kind: "reveal", slot: 1, sourcePage: "1.html", side: "white" });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  const white = dbQuery("SELECT last_view->'reveal'->>'white' FROM public.kuawase_sync_status;");
  assert.strictEqual(white, "白妙の句");
  log("reveal white -> haiku stored", white);

  // 7. 披講報告(紅): HTML 混入句は OES 側 sanitize でタグ除去
  r = await invoke("oes-report-view", { kind: "reveal", slot: 1, sourcePage: "1.html", side: "red" });
  assert.strictEqual(r.ok, true);
  const red = dbQuery("SELECT last_view->'reveal'->>'red' FROM public.kuawase_sync_status;");
  assert.strictEqual(red, "初夏の月へ飛ぶ白鷺");
  log("reveal red -> sanitized haiku stored", red);

  // 8. 「データなし」句は null 正規化(slot5 白 = K4)
  r = await invoke("oes-report-view", { kind: "view", slot: 5, sourcePage: "5.html" });
  assert.strictEqual(r.ok, true);
  r = await invoke("oes-report-view", { kind: "reveal", slot: 5, sourcePage: "5.html", side: "white" });
  assert.strictEqual(r.ok, true);
  const w5 = dbQuery("SELECT last_view->'reveal'->>'white' FROM public.kuawase_sync_status;");
  assert.strictEqual(w5, "", `sentinel must be null, got: ${w5}`);
  log("reveal missing haiku -> null");

  // 9. 版ズレガード: Excel のチーム名を変更 → プリセット読込がブロックされる
  const tampered = { ...excelData, B3: "改名高校" };
  fs.writeFileSync(userDataPaths.excelDataPath, JSON.stringify(tampered), "utf-8");
  r = await invoke("oes-load-preset", { code: "E2E-1" });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error, "preset_mismatch");
  assert.strictEqual(r.mismatches[0].cell, "B3");
  fs.writeFileSync(userDataPaths.excelDataPath, JSON.stringify(excelData, null, 4), "utf-8");
  log("tampered excel -> preset_mismatch (load blocked)");

  // 10. オフライン: 到達不能 URL に切替 → 読込はローカル反映+dirty
  r = await invoke("oes-set-connection", { baseUrl: "http://127.0.0.1:59999", token: "" });
  assert.strictEqual(r.ok, false, JSON.stringify(r)); // 接続テスト自体は失敗する
  r = await invoke("oes-load-preset", { code: "E2E-1" });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  assert.strictEqual(r.offline, true);
  status = await invoke("oes-get-status");
  assert.strictEqual(status.dirty, true);
  log("offline load -> local apply + dirty flag");

  // 11. 復帰: URL を戻す(token 欄は空 = 保存済み token を維持)→ dirty 解消
  r = await invoke("oes-set-connection", { baseUrl: BASE, token: "" });
  assert.strictEqual(r.ok, true, JSON.stringify(r));
  r = await invoke("oes-report-view", { kind: "view", slot: 1, sourcePage: "1.html" });
  assert.strictEqual(r.ok, true);
  status = await invoke("oes-get-status");
  assert.strictEqual(status.dirty, false);
  log("reconnect (kept saved token) -> dirty cleared");

  // 12. 接続クリア: deviceId は維持、token は消える
  const deviceIdBefore = status.deviceId;
  await invoke("oes-clear-connection");
  status = await invoke("oes-get-status");
  assert.strictEqual(status.configured, false);
  assert.strictEqual(status.hasToken, false);
  assert.strictEqual(status.deviceId, deviceIdBefore);
  log("clear-connection -> token gone, deviceId kept");

  // 13. oes-sync.json に token 平文以外の秘匿漏れがないか(renderer へ返す status に token が無いことは 12 で確認済み)
  const storeRaw = fs.readFileSync(path.join(userDataPath, "oes-sync.json"), "utf-8");
  assert.ok(!storeRaw.includes(TOKEN), "cleared store must not contain token");
  log("store file has no residual token");

  console.log("\nkk E2E: all steps passed");
  fs.rmSync(userDataPath, { recursive: true, force: true });
}

main().catch((e) => {
  console.error("kk E2E FAILED:", e.message);
  process.exit(1);
});
