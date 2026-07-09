// OES 側 E2E: ローカル Supabase に対して kuawase 連携 API を一気通貫で検証する。
const fs = require("fs");
const assert = require("assert");

const BASE = "http://127.0.0.1:54321/functions/v1";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const envText = fs.readFileSync(
  require("path").join(__dirname, "../../supabase/functions/.env"),
  "utf8"
);
const ADMIN_SECRET = envText.match(/ADMIN_SETUP_SECRET=(.+)/)[1].trim();

let step = 0;
function log(name, extra = "") {
  step += 1;
  console.log(`[${String(step).padStart(2, "0")}] ${name} ${extra}`);
}

// ローカル edge runtime のホットリロード再起動による一過性の 502 のみリトライする
async function fetchWithRetry(url, options) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(url, options);
    if (res.status !== 502 || attempt >= 5) return res;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// admin 系: verify_jwt=true なので anon key + 許可 Origin が必要
async function callAdmin(fn, body) {
  const res = await fetchWithRetry(`${BASE}/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({ admin_secret: ADMIN_SECRET, ...body }),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// kuawase 系: anon key なし・Origin なし(kk main プロセスと同条件)
async function callKuawase(fn, token, body, extraHeaders = {}) {
  const res = await fetchWithRetry(`${BASE}/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-kuawase-sync-token": token } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const codes = (r) => (r.data.warnings || []).map((w) => w.code);

async function main() {
  const HASH = "sha256:" + "a".repeat(64);

  // 1. token 発行
  let r = await callAdmin("admin-issue-kuawase-token", {
    venue_code: "default",
    label: "e2e",
    expires_in_hours: 1,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.ok(r.data.token.startsWith("kks-"));
  assert.strictEqual(r.data.token_visible_once, true);
  const TOKEN = r.data.token;
  log("token issued", `last4=${r.data.token_last4}`);

  // 2. 初回接続: 候補未インポート警告
  r = await callKuawase("kuawase-sync-connect", TOKEN, {
    event_id: "e2e-01",
    device_id: "devA",
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.venue.code, "default");
  assert.ok(codes(r).includes("NO_CANDIDATES"), JSON.stringify(r.data));
  log("connect (no candidates)", `warnings=${codes(r)}`);

  // 3. 候補インポート(HTML 混入 → sanitize 確認)
  r = await callKuawase("kuawase-import-candidates", TOKEN, {
    event_id: "e2e-02",
    device_id: "devA",
    compe_name: "E2E<big>大会</big>",
    teams: [
      { cell: "B3", name: "紅組高校" },
      { cell: "B4", name: "白組<script>x</script>高校" },
    ],
    kendai: [
      { cell: "H1", name: "夏の月" },
      { cell: "J1", name: "花火" },
    ],
    excel_hash: HASH,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.deepStrictEqual(r.data.imported, { teams: 2, kendai: 2 });
  log("candidates imported");

  // 4. 試合作成(候補参照つき・3番勝負)
  r = await callAdmin("admin-setup-match", {
    venue_code: "default",
    match_code: "E2E-1",
    match_name: "E2Eテスト試合",
    timeline: 99,
    num_bouts: 3,
    red_team_name: "紅組高校",
    white_team_name: "白組x高校",
    kendai_name: "夏の月",
    kuawase_ref: {
      red_cell: "B3",
      white_cell: "B4",
      kendai_cell: "H1",
      excel_hash: HASH,
    },
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  log("match E2E-1 created (num_bouts=3)");

  // 5. 再接続: preset 配信 + excel_hash 不一致警告
  r = await callKuawase("kuawase-sync-connect", TOKEN, {
    event_id: "e2e-03",
    device_id: "devA",
    excel_hash: "sha256:" + "b".repeat(64),
  });
  assert.strictEqual(r.status, 200);
  const preset = r.data.presets.find((p) => p.code === "E2E-1");
  assert.ok(preset, JSON.stringify(r.data.presets));
  assert.strictEqual(preset.red.cell, "B3");
  assert.strictEqual(preset.num_bouts, 3);
  assert.ok(codes(r).includes("EXCEL_HASH_MISMATCH"));
  log("connect (presets + hash mismatch)", `presets=${r.data.presets.length}`);

  // 6. SET_MATCH
  r = await callKuawase("kuawase-sync-control", TOKEN, {
    event_id: "e2e-04",
    device_id: "devA",
    action: "SET_MATCH",
    match_code: "E2E-1",
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.applied.match_code, "E2E-1");
  assert.strictEqual(r.data.state.epoch, 1);
  assert.strictEqual(r.data.state.accepting, true);
  log("SET_MATCH applied", `epoch=${r.data.state.epoch}`);

  // 7. 同一 event_id 再送 → 冪等 short-circuit
  r = await callKuawase("kuawase-sync-control", TOKEN, {
    event_id: "e2e-04",
    device_id: "devA",
    action: "SET_MATCH",
    match_code: "E2E-1",
  });
  assert.strictEqual(r.data.idempotent, true, JSON.stringify(r.data));
  log("replay -> idempotent");

  // 8. 現在試合の再読込 → no-op(epoch 巻き戻しなし)
  r = await callKuawase("kuawase-sync-control", TOKEN, {
    event_id: "e2e-05",
    device_id: "devA",
    action: "SET_MATCH",
    match_code: "E2E-1",
  });
  assert.strictEqual(r.data.already_current, true, JSON.stringify(r.data));
  log("re-load current match -> no-op");

  // 9. report: slot3(3番勝負で epoch2)⇔ state.epoch=1 → EPOCH_MISMATCH
  r = await callKuawase("kuawase-sync-report", TOKEN, {
    event_id: "e2e-06",
    device_id: "devA",
    kind: "view",
    match_code: "E2E-1",
    slot: 3,
    source_page: "3.html",
  });
  assert.strictEqual(r.status, 200);
  assert.ok(codes(r).includes("EPOCH_MISMATCH"), JSON.stringify(r.data));
  log("report slot3 -> EPOCH_MISMATCH");

  // 10. report: slot2 は 3番勝負で不正
  r = await callKuawase("kuawase-sync-report", TOKEN, {
    event_id: "e2e-07",
    device_id: "devA",
    kind: "view",
    match_code: "E2E-1",
    slot: 2,
    source_page: "2.html",
  });
  assert.ok(codes(r).includes("INVALID_SLOT"), JSON.stringify(r.data));
  log("report slot2 -> INVALID_SLOT");

  // 11. report: 未登録試合 → UNKNOWN_MATCH
  r = await callKuawase("kuawase-sync-report", TOKEN, {
    event_id: "e2e-08",
    device_id: "devA",
    kind: "view",
    match_code: "NOPE-9",
    slot: 1,
    source_page: "1.html",
  });
  assert.ok(codes(r).includes("UNKNOWN_MATCH"), JSON.stringify(r.data));
  log("report unknown match -> UNKNOWN_MATCH");

  // 12. reveal: HTML 混入句が sanitize されて保存される
  r = await callKuawase("kuawase-sync-report", TOKEN, {
    event_id: "e2e-09",
    device_id: "devA",
    kind: "view",
    match_code: "E2E-1",
    slot: 1,
    source_page: "1.html",
  });
  assert.strictEqual(r.status, 200);
  r = await callKuawase("kuawase-sync-report", TOKEN, {
    event_id: "e2e-10",
    device_id: "devA",
    kind: "reveal",
    match_code: "E2E-1",
    slot: 1,
    source_page: "1.html",
    reveal: { side: "red", haiku: "夏の月<b>ほのか</b>に照らす" },
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  log("reveal red reported");

  // 13. 別端末(takeover なし)→ 409
  r = await callKuawase("kuawase-sync-connect", TOKEN, {
    event_id: "e2e-11",
    device_id: "devB",
  });
  assert.strictEqual(r.status, 409, JSON.stringify(r));
  assert.strictEqual(r.data.error, "device_conflict");
  log("devB without takeover -> 409");

  // 14. takeover → 成功 + TAKEN_OVER 警告
  r = await callKuawase("kuawase-sync-connect", TOKEN, {
    event_id: "e2e-12",
    device_id: "devB",
    takeover: true,
  });
  assert.strictEqual(r.status, 200);
  assert.ok(codes(r).includes("TAKEN_OVER"), JSON.stringify(r.data));
  log("devB takeover -> TAKEN_OVER");

  // 15. 管理者が連携解除 → 受動 report では enabled が戻らない
  r = await callAdmin("admin-toggle-kuawase-sync", {
    venue_code: "default",
    enabled: false,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  r = await callKuawase("kuawase-sync-report", TOKEN, {
    event_id: "e2e-13",
    device_id: "devB",
    kind: "view",
    match_code: "E2E-1",
    slot: 1,
    source_page: "1.html",
  });
  assert.strictEqual(r.status, 200);
  log("disabled -> passive report accepted (enabled must stay false; DB checked later)");

  // 16. 明示的な再接続 → enabled が true に戻る
  r = await callKuawase("kuawase-sync-connect", TOKEN, {
    event_id: "e2e-14",
    device_id: "devB",
  });
  assert.strictEqual(r.status, 200);
  log("explicit reconnect (re-enables)");

  // 17. 不正 Origin はブラウザ由来として拒否
  r = await callKuawase(
    "kuawase-sync-connect",
    TOKEN,
    { event_id: "e2e-15", device_id: "devB" },
    { Origin: "http://evil.example" }
  );
  assert.strictEqual(r.status, 403, JSON.stringify(r));
  log("disallowed Origin -> 403");

  // 18. token なし → 401
  r = await callKuawase("kuawase-sync-connect", null, {
    event_id: "e2e-16",
    device_id: "devB",
  });
  assert.strictEqual(r.status, 401);
  log("missing token -> 401");

  // 19. token 失効 → 401
  const list = await callAdmin("admin-list-kuawase-tokens", {});
  const tokenRow = list.data.tokens.find((t) => t.label === "e2e" && !t.revoked_at);
  assert.ok(tokenRow);
  r = await callAdmin("admin-revoke-kuawase-token", { token_hash: tokenRow.token_hash });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  r = await callKuawase("kuawase-sync-connect", TOKEN, {
    event_id: "e2e-17",
    device_id: "devB",
  });
  assert.strictEqual(r.status, 401, JSON.stringify(r));
  assert.strictEqual(r.data.error, "sync token revoked");
  log("revoked token -> 401");

  console.log("\nOES E2E: all API steps passed");
}

main().catch((e) => {
  console.error("E2E FAILED:", e.message);
  process.exit(1);
});
