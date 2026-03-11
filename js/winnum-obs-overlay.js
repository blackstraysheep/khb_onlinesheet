const CONFIG = window.KHB_APP_CONFIG || {};
const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
const POLL_INTERVAL_MS = 2000;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
}

let lastRed = null;
let lastWhite = null;
let venueId = null;

const redEl = document.getElementById('redCount');
const whiteEl = document.getElementById('whiteCount');

function applyPulse(el) {
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

const apiHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

async function resolveVenueId() {
  const venueCode = new URLSearchParams(window.location.search).get('venue') || 'default';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues?select=id&code=eq.${venueCode}`, { headers: apiHeaders });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0]?.id || null;
}

async function fetchState() {
  try {
    if (!venueId) {
      venueId = await resolveVenueId();
      if (!venueId) return;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/state?venue_id=eq.${venueId}&select=red_wins,white_wins`, { headers: apiHeaders });
    if (!res.ok) return;

    const rows = await res.json();
    if (!rows || !rows[0]) return;

    const { red_wins, white_wins } = rows[0];
    if (typeof red_wins !== 'number' || typeof white_wins !== 'number') return;

    if (red_wins !== lastRed) {
      redEl.textContent = red_wins;
      if (lastRed !== null) applyPulse(redEl);
      lastRed = red_wins;
    }

    if (white_wins !== lastWhite) {
      whiteEl.textContent = white_wins;
      if (lastWhite !== null) applyPulse(whiteEl);
      lastWhite = white_wins;
    }
  } catch (e) {
    // OBS用途なので黙殺する。
  }
}

fetchState();
setInterval(fetchState, POLL_INTERVAL_MS);
