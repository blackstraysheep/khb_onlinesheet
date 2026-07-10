// judge-get-revealed-haiku の検証: 披講済みの句のみが審査員に届くこと
const fs = require("fs");
const assert = require("assert");
const { execSync } = require("child_process");

const BASE = "http://127.0.0.1:54321/functions/v1";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const ADMIN_SECRET = fs
  .readFileSync(require("path").join(__dirname, "../../supabase/functions/.env"), "utf8")
  .match(/ADMIN_SETUP_SECRET=(.+)/)[1].trim();

const psql = (sql) =>
  execSync(`docker exec supabase_db_khb_onlinesheet psql -U postgres -d postgres -t -A -c "${sql.replace(/"/g, '\\"')}"`)
    .toString().trim();

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
const adminHeaders = { apikey: ANON, Authorization: `Bearer ${ANON}`, Origin: "http://localhost:3000" };
const judgeHeaders = { apikey: ANON, Authorization: `Bearer ${ANON}`, Origin: "http://localhost:3000" };

async function main() {
  psql("DELETE FROM public.token_rate_limits WHERE bucket LIKE 'judge-get-revealed-haiku%';");
  psql("DELETE FROM public.kuawase_sync_status;");
  psql("UPDATE public.state SET current_match_id=NULL WHERE current_match_id IN (SELECT id FROM public.matches WHERE code='JH-1'); DELETE FROM public.event_log WHERE match_id IN (SELECT id FROM public.matches WHERE code='JH-1'); DELETE FROM public.expected_judges WHERE match_id IN (SELECT id FROM public.matches WHERE code='JH-1'); DELETE FROM public.matches WHERE code='JH-1';");

  // 試合+審査員を作成し、judge token を再発行して平文を得る
  let r = await post("admin-setup-match", adminHeaders, {
    admin_secret: ADMIN_SECRET, venue_code: "default", match_code: "JH-1", match_name: "句表示テスト",
    timeline: 97, num_bouts: 3, judges: [{ name: "JH審査員" }],
  });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const matchId = psql("SELECT id FROM public.matches WHERE code='JH-1';");
  const judgeId = psql(`SELECT judge_id FROM public.expected_judges WHERE match_id='${matchId}' LIMIT 1;`);
  r = await post("admin-regenerate-judge-token", adminHeaders, { admin_secret: ADMIN_SECRET, judge_id: judgeId });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  const JTOKEN = r.data.token;

  const venueId = psql("SELECT venue_id FROM public.matches WHERE code='JH-1';");

  // 1. 未連携 → reveal null
  r = await post("judge-get-revealed-haiku", judgeHeaders, { token: JTOKEN, match_code: "JH-1" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.reveal, null);
  console.log("[jh-1] no sync row -> reveal null");

  // 2. 連携+紅のみ披講 → red だけ返る
  psql(`INSERT INTO public.kuawase_sync_status (venue_id, enabled, last_view) VALUES ('${venueId}', true, json_build_object('match_code','JH-1','slot',1,'reveal',json_build_object('red','披講済みの紅句')));`);
  r = await post("judge-get-revealed-haiku", judgeHeaders, { token: JTOKEN, match_code: "JH-1" });
  assert.strictEqual(r.status, 200, JSON.stringify(r.data));
  assert.strictEqual(r.data.reveal.red, "披講済みの紅句");
  assert.strictEqual(r.data.reveal.white, null);
  assert.strictEqual(r.data.slot, 1);
  console.log("[jh-2] revealed red only -> red returned, white null");

  // 3. 別試合の match_code → null(他会場・他試合の句が漏れない)
  r = await post("judge-get-revealed-haiku", judgeHeaders, { token: JTOKEN, match_code: "NOPE" });
  assert.strictEqual(r.data.reveal ?? null, null);
  console.log("[jh-3] other match_code -> null");

  // 4. 連携解除(enabled=false)→ null
  psql("UPDATE public.kuawase_sync_status SET enabled=false;");
  r = await post("judge-get-revealed-haiku", judgeHeaders, { token: JTOKEN, match_code: "JH-1" });
  assert.strictEqual(r.data.reveal, null);
  console.log("[jh-4] disabled -> null");

  // 5. 不正 token → 401
  r = await post("judge-get-revealed-haiku", judgeHeaders, { token: "khb-bogus", match_code: "JH-1" });
  assert.strictEqual(r.status, 401);
  console.log("[jh-5] bogus token -> 401");

  // 後始末
  psql("DELETE FROM public.kuawase_sync_status;");
  psql(`DELETE FROM public.event_log WHERE match_id='${matchId}'; DELETE FROM public.expected_judges WHERE match_id='${matchId}'; DELETE FROM public.matches WHERE id='${matchId}';`);
  console.log("\njudge-haiku E2E: all steps passed");
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
