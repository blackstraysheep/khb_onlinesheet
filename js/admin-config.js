// ============================
// admin-config.js — 設定・定数・DOM参照・内部状態
// ============================

const KHBAdmin = window.KHBAdmin || (window.KHBAdmin = {});
KHBAdmin.config = KHBAdmin.config || {};
KHBAdmin.constants = KHBAdmin.constants || {};
KHBAdmin.dom = KHBAdmin.dom || {};
KHBAdmin.helpers = KHBAdmin.helpers || {};
KHBAdmin.state = KHBAdmin.state || {};
KHBAdmin.audioState = KHBAdmin.audioState || {};

const ADMIN_CONFIG = window.KHB_APP_CONFIG || {};
const SUPABASE_URL = ADMIN_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = ADMIN_CONFIG.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
}

Object.assign(KHBAdmin.config, {
  ADMIN_CONFIG,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
});

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

Object.assign(KHBAdmin.constants, {
  CONTROL_CONFIRM_URL,
  CONTROL_ADVANCE_URL,
  CONTROL_SET_MATCH_URL,
  ADMIN_SET_MATCH_JUDGES_URL,
  ADMIN_PATCH_STATE_URL,
  adminHeaders,
  ADMIN_AUTO_REFRESH_MS,
  AUDIO_NUMERIC_CLIP_MAX,
  AUDIO_QUEUE_SCROLL_CENTER_OFFSET,
  AUDIO_QUEUE_SCROLL_MARGIN,
});

const query = (sel, root = document) => root.querySelector(sel);
const queryAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));

Object.assign(KHBAdmin.helpers, {
  query,
  queryAll,
});

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

Object.assign(KHBAdmin.dom, {
  venueSelect,
  matchSelect,
  btnStartMatch,
  toggleAcceptingBtn,
  topMsg,
  stateSummary,
  scoreboardContainer,
  scoreboardModeBtn,
  judgeReorderList,
  btnSaveJudgeOrder,
  judgeReorderStatus,
  audioStatusEl,
  audioQueueListEl,
  btnAudioPlayAll,
  btnAudioStop,
  adminSecretInput,
  btnE5,
  btnE6,
  e5e6StatusEl,
  epochInput,
  btnSetEpoch,
});

Object.assign(KHBAdmin.state, {
  lastState: null,
  scoreboardMode: 'horizontal',
  currentVenueId: null,
  currentVenueCode: null,
  matchesCache: [],
  loadDataInFlight: false,
  pendingAutoReload: false,
  pendingManualReload: false,
  currentLoadPromise: null,
  lastRenderedLoadSignature: null,
});

Object.assign(KHBAdmin.audioState, {
  audioClips: {},
  audioInitialized: false,
  audioPlaying: false,
  audioQueue: [],
  audioQueueIndex: 0,
  audioJudgeSegments: {},
  pendingAudioRefresh: null,
});

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

KHBAdmin.helpers.hasUndecidableWinner = hasUndecidableWinner;
