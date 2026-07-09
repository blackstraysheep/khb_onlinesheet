// 連携解除(enabled=false)が受動 report で再有効化されないことの検証
const fs = require("fs");
const assert = require("assert");
const { execSync } = require("child_process");

const BASE = "http://127.0.0.1:54321/functions/v1";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const ADMIN_SECRET = fs
  .readFileSync(require("path").join(__dirname, "../../supabase/functions/.env"), "utf8")
  .match(/ADMIN_SETUP_SECRET=(.+)/)[1].trim();

function dbEnabled() {
  const out = execSync(
    'docker exec supabase_db_khb_onlinesheet psql -U postgres -d postgres -t -A -c "SELECT enabled FROM public.kuawase_sync_status;"'
  ).toString().trim();
  return out === "t";
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

async function main() {
  // 新しい token を発行(前テストで失効済みのため)
  let r = await post("admin-issue-kuawase-token", adminHeaders, {
    admin_secret: ADMIN_SECRET,
    venue_code: "default",
    label: "e2e-disable-check",
    expires_in_hours: 1,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const TOKEN = r.data.token;

  r = await post("kuawase-sync-connect", { "x-kuawase-sync-token": TOKEN }, {
    event_id: "dc-1",
    device_id: "devB",
    takeover: true,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(dbEnabled(), true, "connect should enable");

  // 管理者が解除
  r = await post("admin-toggle-kuawase-sync", adminHeaders, {
    admin_secret: ADMIN_SECRET,
    venue_code: "default",
    enabled: false,
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(dbEnabled(), false, "toggle should disable");

  // 受動 report → enabled は false のまま
  r = await post("kuawase-sync-report", { "x-kuawase-sync-token": TOKEN }, {
    event_id: "dc-2",
    device_id: "devB",
    kind: "view",
    match_code: "E2E-1",
    slot: 1,
    source_page: "1.html",
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(dbEnabled(), false, "passive report must NOT re-enable");

  // 明示 connect → true に戻る
  r = await post("kuawase-sync-connect", { "x-kuawase-sync-token": TOKEN }, {
    event_id: "dc-3",
    device_id: "devB",
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(dbEnabled(), true, "explicit connect should re-enable");

  console.log("disable-persistence check: passed");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
