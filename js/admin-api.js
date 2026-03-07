// ============================
// admin-api.js — REST API ヘルパー
// ============================

function buildRestUrl(path, params) {
  const url = new URL(SUPABASE_URL + '/rest/v1/' + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, v);
      }
    });
  }
  return url.toString();
}

async function fetchJson(path, params) {
  const url = buildRestUrl(path, params);
  const res = await fetch(url, { headers: adminHeaders });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function callControlFunction(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) { }

  if (!res.ok || data.error) {
    const msg = data.error || res.status;
    const err = new Error(String(msg));
    err.responseData = data;
    throw err;
  }
  return data;
}

// state を更新（admin-patch-state Edge Function 経由）
async function patchState(patch) {
  const adminSec = adminSecretInput ? adminSecretInput.value.trim() : '';
  if (!adminSec) {
    throw new Error('管理用シークレットを入力してください。');
  }
  const venueCode = currentVenueCode || 'default';
  const data = await callControlFunction(ADMIN_PATCH_STATE_URL, {
    admin_secret: adminSec,
    venue_code: venueCode,
    patch,
  });
  if (data && data.state) {
    lastState = { ...lastState, ...data.state };
  }
}
