// ============================
// admin-config.js — 設定・定数・DOM参照・内部状態
// ============================

const SUPABASE_URL = 'http://127.0.0.1:54321'; // ローカルテスト用
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

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

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// DOM 参照
const venueSelect         = $('#venueSelect');
const matchSelect         = $('#matchSelect');
const btnStartMatch       = $('#btnStartMatch');
const toggleAcceptingBtn  = $('#toggleAcceptingBtn');

const topMsg              = $('#topMsg');
const stateSummary        = $('#stateSummary');
const scoreboardContainer = $('#scoreboardContainer');

const scoreboardModeBtn   = $('#scoreboardModeBtn');

const judgeReorderList    = $('#judgeReorderList');
const btnSaveJudgeOrder   = $('#btnSaveJudgeOrder');
const judgeReorderStatus  = $('#judgeReorderStatus');

const audioStatusEl       = $('#audioStatus');
const audioQueueListEl    = $('#audioQueueList');
const btnAudioPlayAll     = $('#btnAudioPlayAll');
const btnAudioStop        = $('#btnAudioStop');

const adminSecretInput    = $('#adminSecret');
const btnE5               = $('#btnE5');
const btnE6               = $('#btnE6');
const e5e6StatusEl        = $('#e5e6Status');
const epochInput          = $('#epochInput');
const btnSetEpoch         = $('#btnSetEpoch');

// 内部状態
let lastState       = null;
let autoLoading     = false;
let lastExpectedIds = [];
let scoreboardMode  = 'horizontal'; // 'horizontal' | 'vertical'
let currentVenueId  = null;
let currentVenueCode = null;
let matchesCache    = [];
