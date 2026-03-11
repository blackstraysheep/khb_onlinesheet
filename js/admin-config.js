// ============================
// admin-config.js — 設定・定数・DOM参照・内部状態
// ============================

const ADMIN_CONFIG = window.KHB_APP_CONFIG || {};
const SUPABASE_URL = ADMIN_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = ADMIN_CONFIG.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
}

const CONTROL_CONFIRM_URL    = SUPABASE_URL + '/functions/v1/control_confirm_with_secret';
const CONTROL_ADVANCE_URL    = SUPABASE_URL + '/functions/v1/control_advance_with_secret';
const CONTROL_SET_MATCH_URL  = SUPABASE_URL + '/functions/v1/control_set_current_match_with_secret';
const ADMIN_SET_MATCH_JUDGES_URL = SUPABASE_URL + '/functions/v1/admin-set-match-judges';
const ADMIN_PATCH_STATE_URL      = SUPABASE_URL + '/functions/v1/admin-patch-state';

const adminHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
};

const ADMIN_AUTO_REFRESH_MS = 2000;
const AUDIO_NUMERIC_CLIP_MAX = 12;
const AUDIO_QUEUE_SCROLL_CENTER_OFFSET = 35;
const AUDIO_QUEUE_SCROLL_MARGIN = 60;

const query = (sel, root = document) => root.querySelector(sel);
const queryAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// DOM 参照
const venueSelect         = query('#venueSelect');
const matchSelect         = query('#matchSelect');
const btnStartMatch       = query('#btnStartMatch');
const toggleAcceptingBtn  = query('#toggleAcceptingBtn');

const topMsg              = query('#topMsg');
const stateSummary        = query('#stateSummary');
const scoreboardContainer = query('#scoreboardContainer');

const scoreboardModeBtn   = query('#scoreboardModeBtn');

const judgeReorderList    = query('#judgeReorderList');
const btnSaveJudgeOrder   = query('#btnSaveJudgeOrder');
const judgeReorderStatus  = query('#judgeReorderStatus');

const audioStatusEl       = query('#audioStatus');
const audioQueueListEl    = query('#audioQueueList');
const btnAudioPlayAll     = query('#btnAudioPlayAll');
const btnAudioStop        = query('#btnAudioStop');

const adminSecretInput    = query('#adminSecret');
const btnE5               = query('#btnE5');
const btnE6               = query('#btnE6');
const e5e6StatusEl        = query('#e5e6Status');
const epochInput          = query('#epochInput');
const btnSetEpoch         = query('#btnSetEpoch');

// 内部状態
let lastState       = null;
let scoreboardMode  = 'horizontal'; // 'horizontal' | 'vertical'
let currentVenueId  = null;
let currentVenueCode = null;
let matchesCache    = [];
let loadDataInFlight = false;
let pendingAutoReload = false;
let pendingManualReload = false;
let currentLoadPromise = null;
let lastRenderedLoadSignature = null;

function hasUndecidableWinner(submission) {
  if (!submission) return false;

  const redTotal = submission.red_total;
  const whiteTotal = submission.white_total;
  const redWork = submission.red_work;
  const whiteWork = submission.white_work;

  return Number.isFinite(redTotal)
    && Number.isFinite(whiteTotal)
    && Number.isFinite(redWork)
    && Number.isFinite(whiteWork)
    && redTotal === whiteTotal
    && redWork === whiteWork;
}
