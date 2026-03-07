(function () {
  // ============================
  // 設定（URLとキー）
  // ============================
  const SUPABASE_URL = 'http://127.0.0.1:54321'; // ローカルテスト用
  const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

  const CONTROL_CONFIRM_URL    = 'http://127.0.0.1:54321/functions/v1/control_confirm_with_secret';
  const CONTROL_ADVANCE_URL    = 'http://127.0.0.1:54321/functions/v1/control_advance_with_secret';
  const CONTROL_SET_MATCH_URL  = 'http://127.0.0.1:54321/functions/v1/control_set_current_match_with_secret';
  const ADMIN_ADD_JUDGE_URL        = 'http://127.0.0.1:54321/functions/v1/admin-add-judge';
  const ADMIN_SET_MATCH_JUDGES_URL = 'http://127.0.0.1:54321/functions/v1/admin-set-match-judges';
  const ADMIN_PATCH_STATE_URL      = 'http://127.0.0.1:54321/functions/v1/admin-patch-state';

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ============================
  // DOM 参照
  // ============================
  const matchCodeInput    = $('#matchCode');
  const epochInput        = $('#epoch');
  const loadBtn           = $('#loadBtn');
  const toggleAcceptingBtn = $('#toggleAcceptingBtn');

  // 次試合作成関連
  const nextMatchSetupBtn    = $('#nextMatchSetupBtn');
  const judgeSelectSection   = $('#judgeSelectSection');
  const judgeSelectInfo      = $('#judgeSelectInfo');
  const judgeSelectList      = $('#judgeSelectList');
  const judgeSelectAllBtn    = $('#judgeSelectAllBtn');
  const judgeSelectClearBtn  = $('#judgeSelectClearBtn');
  const judgeSelectConfirmBtn = $('#judgeSelectConfirmBtn');
  const judgeSelectCancelBtn  = $('#judgeSelectCancelBtn');

  const newJudgeNameInput    = $('#newJudgeName');
  const newJudgeVoiceKeyInput = $('#newJudgeVoiceKey');
  const addJudgeBtn          = $('#addJudgeBtn');

  // 試合情報入力フォーム要素
  const newMatchSetupCode  = $('#newMatchSetupCode');
  const newMatchSetupName  = $('#newMatchSetupName');
  const newMatchSetupRed   = $('#newMatchSetupRed');
  const newMatchSetupWhite = $('#newMatchSetupWhite');
  const newMatchSetupBouts = $('#newMatchSetupBouts');
  const venueCodeInput     = $('#venueCode');
  let currentVenueId = null;
  if (venueCodeInput) {
    venueCodeInput.addEventListener('change', () => { currentVenueId = null; });
  }

  const topMsg            = $('#topMsg');
  const stateSummary      = $('#stateSummary');
  const scoreboardContainer = $('#scoreboardContainer');

  // スコアボード表示モード切替ボタン
  const scoreboardModeBtn = $('#scoreboardModeBtn');

  // Zundamon 再生パネル
  const audioStatusEl   = $('#audioStatus');
  const zundaQueueListEl = $('#zundaQueueList');
  const btnAudioPlayAll = $('#btnAudioPlayAll');
  const btnAudioStop    = $('#btnAudioStop');

  // E5/E6 パネル
  const adminSecretInput = $('#adminSecret');
  const btnSetMatch = $('#btnSetMatch');
  const btnE5 = $('#btnE5');
  const btnE6 = $('#btnE6');
  const e5e6StatusEl = $('#e5e6Status');

  // ============================
  // 内部状態
  // ============================
  let lastState      = null;
  let autoLoading    = false;
  let pendingNextMatch = null;
  let lastExpectedIds = [];
  let scoreboardMode = 'horizontal'; // 'horizontal' | 'vertical'

  // ============================
  // スコアボードモード切替
  // ============================
  function setScoreboardMode(mode) {
    scoreboardMode = mode;
    if (scoreboardModeBtn) {
      scoreboardModeBtn.textContent = mode === 'horizontal' ? '縦型に切替' : '横型に切替';
    }
  }
  if (scoreboardModeBtn) {
    scoreboardModeBtn.addEventListener('click', () => {
      setScoreboardMode(scoreboardMode === 'horizontal' ? 'vertical' : 'horizontal');
    });
  }

  // ============================
  // ユーティリティ
  // ============================
  function setMsg(text, type) {
    if (!topMsg) return;
    topMsg.textContent = text || '';
    topMsg.className = 'msg';
    if (type === 'ok') topMsg.classList.add('ok');
    if (type === 'err') topMsg.classList.add('err');
  }

  function setControlsDisabled(disabled) {
    [
      loadBtn, toggleAcceptingBtn,
      nextMatchSetupBtn, judgeSelectConfirmBtn, judgeSelectCancelBtn,
      judgeSelectAllBtn, judgeSelectClearBtn, addJudgeBtn,
      btnAudioPlayAll, btnAudioStop
    ].forEach(btn => {
      if (btn) btn.disabled = disabled;
    });
  }

  // ============================
  // Zundamon 音声再生関連
  // ============================
  const ZUNDA_BASE = 'https://blackstraysheep.github.io/khb_onlinesheet/audio/';

  const zundaPhraseFiles = {
    start: 'start.mp3',
    end: 'end.mp3',
    vs: 'vs.mp3',
    kansyou_1_red:   'kansyo_1_red.mp3',
    kansyou_2_red:   'kansyo_2_red.mp3',
    kansyou_1_white: 'kansyo_1_white.mp3',
    kansyou_2_white: 'kansyo_2_white.mp3',
    win_red:        'deRed.mp3',
    win_white:      'deWhite.mp3',
    win_draw_red:   'deRed_sakuhin.mp3',
    win_draw_white: 'deWhite_sakuhin.mp3',
  };

  const zundaAudio = {};
  let zundaInitialized = false;
  let zundaPlaying = false;
  let zundaQueue = [];
  let zundaQueueIndex = 0;
  let zundaJudgeSegments = {};
  let pendingZundaRefresh = null;

  function setAudioStatus(text) {
    if (!audioStatusEl) return;
    audioStatusEl.textContent = text || '';
  }

  function initZundamon() {
    if (zundaInitialized) return;
    Object.entries(zundaPhraseFiles).forEach(([id, file]) => {
      zundaAudio[id] = new Audio(ZUNDA_BASE + file);
    });
    zundaInitialized = true;
  }

  function ensureZundaClip(id) {
    if (zundaAudio[id]) return;

    if (zundaPhraseFiles[id]) {
      zundaAudio[id] = new Audio(ZUNDA_BASE + zundaPhraseFiles[id]);
      return;
    }

    if (id.startsWith('num_')) {
      const n = Number(id.slice(4));
      let file;
      if (n >= 5 && n <= 12) {
        file = `${n}.mp3`;
      } else {
        console.warn('Zundamon: 未定義の数字クリップです:', n);
        return;
      }
      zundaAudio[id] = new Audio(ZUNDA_BASE + file);
      return;
    }

    if (id.startsWith('judge_')) {
      zundaAudio[id] = new Audio(ZUNDA_BASE + `${id}.mp3`);
      return;
    }

    console.warn('Zundamon: ファイルマッピングがないIDです:', id);
  }

  function playZundaClip(id) {
    return new Promise(resolve => {
      initZundamon();
      ensureZundaClip(id);
      const audio = zundaAudio[id];
      if (!audio) {
        console.warn('Zundamon: Audio インスタンスがありません:', id);
        resolve();
        return;
      }
      audio.currentTime = 0;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(err => {
        console.warn('Zundamon: 再生エラー', err);
        resolve();
      });
    });
  }

  async function playZundaQueue() {
    if (!zundaQueue.length) {
      setAudioStatus('再生キューが空です。');
      zundaPlaying = false;
      return;
    }

    patchState({ scoreboard_visible: true }).catch(err => console.error(err));
    setAudioStatus('再生中…');
    zundaPlaying = true;
    renderZundaQueue(true);

    while (zundaPlaying && zundaQueueIndex < zundaQueue.length) {
      renderZundaQueue();
      const id = zundaQueue[zundaQueueIndex++];
      await playZundaClip(id);
    }
    renderZundaQueue();

    if (zundaPlaying) {
      setAudioStatus('再生完了');
    } else {
      setAudioStatus('停止しました');
    }
    zundaPlaying = false;
    patchState({ scoreboard_visible: false }).catch(err => console.error(err));
    applyPendingZundaRefresh();
  }

  function stopZunda() {
    zundaPlaying = false;
    Object.values(zundaAudio).forEach(a => {
      try { a.pause(); } catch (e) { }
    });
    patchState({ scoreboard_visible: false }).catch(err => console.error(err));
    setAudioStatus('停止しました');
    applyPendingZundaRefresh();
  }

  // 数値 n を「Zundamon 数字クリップ」のID配列に変換
  function numToZundaIds(n) {
    const v = Number(n);
    if (!Number.isFinite(v) || v < 0) return [];

    if (v === 1) return ['num_1'];
    if (v === 2) return ['num_2'];

    if (v >= 5 && v <= 12) return [`num_${v}`];

    console.warn('Zundamon: 対応していない点数です:', v);
    return [];
  }

  function getJudgeVoiceKey(judgeId, judgesMap) {
    const j = judgesMap[judgeId];
    if (j && j.voice_key) return j.voice_key;
    return judgeId;
  }

  function buildZundaSegments(match, epoch, boutLabelFull, expectedIds, judgesMap, subMap) {
    zundaJudgeSegments = {};
    if (!expectedIds || !expectedIds.length) return;

    expectedIds.forEach(jid => {
      const sub = subMap[jid];
      if (!sub) return;

      const clips = [];
      const redWork  = sub.red_work;
      const whiteWork = sub.white_work;
      const redApp   = sub.red_app;
      const whiteApp  = sub.white_app;
      const redTotal  = sub.red_total;
      const whiteTotal = sub.white_total;

      const vk = getJudgeVoiceKey(jid, judgesMap);
      clips.push(`judge_${vk}`);

      if (Number.isFinite(redWork)) clips.push(...numToZundaIds(redWork));
      clips.push('vs');
      if (Number.isFinite(whiteWork)) clips.push(...numToZundaIds(whiteWork));

      if ((redApp || 0) > 0 || (whiteApp || 0) > 0) {
        let appSide = 'red';
        let appScore = redApp;
        if ((whiteApp || 0) > (redApp || 0)) {
          appSide = 'white';
          appScore = whiteApp;
        }
        if (appScore === 1 || appScore === 2) {
          clips.push(`kansyou_${appScore}_${appSide}`);
        }
      }

      const haveTotals = Number.isFinite(redTotal) && Number.isFinite(whiteTotal);
      if (haveTotals) {
        clips.push(...numToZundaIds(redTotal));
        clips.push('vs');
        clips.push(...numToZundaIds(whiteTotal));
      }

      const isDrawTotal = (redTotal === whiteTotal);
      let winnerSideForTotal = 'red';
      if (!isDrawTotal) {
        winnerSideForTotal = (redTotal > whiteTotal) ? 'red' : 'white';
      } else {
        if ((whiteWork || 0) > (redWork || 0)) {
          winnerSideForTotal = 'white';
        } else {
          winnerSideForTotal = 'red';
        }
      }

      if (isDrawTotal) {
        clips.push(`win_draw_${winnerSideForTotal}`);
      } else {
        clips.push(`win_${winnerSideForTotal}`);
      }

      zundaJudgeSegments[jid] = {
        revision: sub.revision || 1,
        clips,
      };
    });
  }

  function rebuildZundaQueue(match, epoch, boutLabelFull) {
    const queue = [];
    queue.push('start');
    Object.entries(zundaJudgeSegments).forEach(([jid, seg]) => {
      seg.clips.forEach(id => queue.push(id));
    });
    queue.push('end');

    zundaQueue = queue;
    zundaQueueIndex = 0;
    setAudioStatus(`再生キューを準備しました（${queue.length}クリップ）。`);
    renderZundaQueue();
  }

  function renderZundaQueue(forceScroll = false) {
    if (!zundaQueueListEl) return;
    if (!zundaQueue.length) {
      zundaQueueListEl.innerHTML = '<div class="zunda-empty">(キューは空です)</div>';
      return;
    }
    zundaQueueListEl.innerHTML = zundaQueue.map((id, idx) => {
      let label = id;
      if (zundaPhraseFiles[id]) {
        label = `[定型] ${id}`;
      } else if (id.startsWith('judge_')) {
        label = `[審査員] ${id}`;
      } else if (id.startsWith('num_')) {
        label = `[数字] ${id.replace('num_', '')}`;
      }
      const isCurrent = (idx === zundaQueueIndex);
      const cls = isCurrent ? 'zunda-item current' : 'zunda-item';
      const marker = isCurrent ? '▶ ' : '';
      const divId = isCurrent ? 'currentZundaItem' : '';
      return `<div id="${divId}" class="${cls}">${marker}${idx + 1}. ${label}</div>`;
    }).join('');

    const currentEl = document.getElementById('currentZundaItem');
    if (currentEl) {
      if (forceScroll) {
        const itemTop = currentEl.offsetTop;
        const itemHeight = currentEl.offsetHeight;
        const containerHeight = zundaQueueListEl.clientHeight;
        const targetTop = itemTop - (containerHeight / 2) + (itemHeight / 2) + 35;
        zundaQueueListEl.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else {
        const cRect = zundaQueueListEl.getBoundingClientRect();
        const iRect = currentEl.getBoundingClientRect();
        const relativeTop = iRect.top - cRect.top;
        const containerHeight = cRect.height;
        const margin = 60;
        if (relativeTop > -margin && relativeTop < containerHeight + margin) {
          const itemTop = currentEl.offsetTop;
          const itemHeight = currentEl.offsetHeight;
          const targetTop = itemTop - (containerHeight / 2) + (itemHeight / 2) + 35;
          zundaQueueListEl.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }
    }
  }

  function buildZundaAudioSuite({ match, epoch, boutLabelFull, expectedIds, judgesMap, subMap }) {
    buildZundaSegments(match, epoch, boutLabelFull, expectedIds, judgesMap, subMap);
    rebuildZundaQueue(match, epoch, boutLabelFull);
  }

  function scheduleZundaAudioRefresh(data) {
    if (!data || !data.expectedIds || !data.expectedIds.length) {
      pendingZundaRefresh = null;
      zundaQueue = [];
      zundaQueueIndex = 0;
      setAudioStatus('再生キューが空です。');
      return;
    }
    lastExpectedIds = data.expectedIds.slice();
    if (zundaPlaying) {
      pendingZundaRefresh = data;
      return;
    }
    pendingZundaRefresh = null;
    buildZundaAudioSuite(data);
  }

  function applyPendingZundaRefresh() {
    if (!pendingZundaRefresh) return;
    const data = pendingZundaRefresh;
    pendingZundaRefresh = null;
    buildZundaAudioSuite(data);
  }

  // ============================
  // トークン生成
  // ============================
  function generateToken() {
    const hex = [];
    const chars = '0123456789abcdef';
    for (let i = 0; i < 32; i++) {
      hex.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    return 'khb-' + hex.join('');
  }

  // ============================
  // REST API ヘルパー
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
    const res = await fetch(url, { headers });
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
      throw new Error(String(msg));
    }
    return data;
  }

  // state を更新（admin-patch-state Edge Function 経由）
  async function patchState(patch) {
    const adminSec = adminSecretInput ? adminSecretInput.value.trim() : '';
    if (!adminSec) {
      console.warn('patchState: 管理用シークレット未入力のためスキップ');
      return;
    }
    const venueCode = (venueCodeInput && venueCodeInput.value.trim()) || 'default';
    const data = await callControlFunction(ADMIN_PATCH_STATE_URL, {
      admin_secret: adminSec,
      venue_code: venueCode,
      patch,
    });
    if (data && data.state) {
      lastState = { ...lastState, ...data.state };
    }
  }

  // ============================
  // スコアボード：横型レイアウト
  // ============================
  function buildScoreboard_horizontal(expectedIds, judgesMap, subMap, meta) {
    if (!scoreboardContainer) return;
    scoreboardContainer.innerHTML = '';

    if (!expectedIds || !expectedIds.length) return;

    meta = meta || {};
    const matchLabel  = meta.matchLabel  || '試合名';
    const boutLabelFull = meta.boutLabelFull || '対戦名';
    const redTeam   = meta.redTeamName  || '長田';
    const whiteTeam = meta.whiteTeamName || '灘 A';

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const createCell = (text, className) => {
      const td = document.createElement('td');
      if (className) td.className = className;
      if (text !== undefined && text !== null) td.textContent = text;
      return td;
    };

    const outerColumnPlan = {
      left: [
        [
          { start: 0, rowSpan: 4, text: '紅', className: 'outer-col side-col side-red' },
          { start: 4, rowSpan: 1, text: matchLabel, className: 'outer-col match-label' },
          { start: 5, rowSpan: 4, text: '白', className: 'outer-col side-col side-white' },
        ],
        [
          { start: 0, rowSpan: 4, text: redTeam, className: 'outer-col team-col team-red' },
          { start: 4, rowSpan: 1, text: boutLabelFull, className: 'outer-col bout-label' },
          { start: 5, rowSpan: 4, text: whiteTeam, className: 'outer-col team-col team-white' },
        ],
      ],
      right: [
        [
          { start: 0, rowSpan: 4, text: redTeam, className: 'outer-col team-col team-red' },
          { start: 4, rowSpan: 1, text: boutLabelFull, className: 'outer-col bout-label' },
          { start: 5, rowSpan: 4, text: whiteTeam, className: 'outer-col team-col team-white' },
        ],
        [
          { start: 0, rowSpan: 4, text: '紅', className: 'outer-col side-col side-red' },
          { start: 4, rowSpan: 1, text: matchLabel, className: 'outer-col match-label' },
          { start: 5, rowSpan: 4, text: '白', className: 'outer-col side-col side-white' },
        ],
      ],
    };

    const addOuterCells = (tr, rowIndex, side) => {
      const cols = outerColumnPlan[side];
      if (!cols) return;
      cols.forEach(col => {
        const def = col.find(item => item.start === rowIndex);
        if (!def) return;
        const td = createCell(def.text, def.className);
        if (def.rowSpan && def.rowSpan > 1) td.rowSpan = def.rowSpan;
        tr.appendChild(td);
      });
    };

    let rowIndex = 0;

    // 紅 旗
    let tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('旗', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'red-star');
      if (s && s.red_flag) td.textContent = '★';
      tr.appendChild(td);
    });
    tr.appendChild(createCell('旗', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 紅 合計
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('合計', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'score-big');
      if (s && s.red_total != null) td.textContent = s.red_total;
      tr.appendChild(td);
    });
    tr.appendChild(createCell('合計', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 紅 鑑賞点
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('鑑賞点', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'score');
      if (s && s.red_app != null && s.red_app !== 0) td.textContent = s.red_app;
      tr.appendChild(td);
    });
    tr.appendChild(createCell('鑑賞点', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 紅 作品点
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('作品点', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'score');
      if (s && s.red_work != null) td.textContent = s.red_work;
      tr.appendChild(td);
    });
    tr.appendChild(createCell('作品点', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 審査員名（中央）
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('審査員', 'label center-block-cell vertical'));
    expectedIds.forEach(id => {
      let name = id.slice(0, 8);
      const j = judgesMap[id];
      if (j) {
        if (typeof j === 'string') name = j;
        else if (typeof j === 'object' && j.name) name = j.name;
      }
      tr.appendChild(createCell(name, 'judge-name center-block-cell vertical'));
    });
    tr.appendChild(createCell('審査員', 'label center-block-cell vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 白 作品点
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('作品点', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'score');
      if (s && s.white_work != null) td.textContent = s.white_work;
      tr.appendChild(td);
    });
    tr.appendChild(createCell('作品点', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 白 鑑賞点
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('鑑賞点', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'score');
      if (s && s.white_app != null && s.white_app !== 0) td.textContent = s.white_app;
      tr.appendChild(td);
    });
    tr.appendChild(createCell('鑑賞点', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 白 合計
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('合計', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'score-big');
      if (s && s.white_total != null) td.textContent = s.white_total;
      tr.appendChild(td);
    });
    tr.appendChild(createCell('合計', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    // 白 旗
    tr = document.createElement('tr');
    addOuterCells(tr, rowIndex, 'left');
    tr.appendChild(createCell('旗', 'label vertical'));
    expectedIds.forEach(id => {
      const s = subMap[id];
      const td = createCell('', 'star');
      if (s && s.white_flag) td.textContent = '★';
      tr.appendChild(td);
    });
    tr.appendChild(createCell('旗', 'label vertical'));
    addOuterCells(tr, rowIndex, 'right');
    tbody.appendChild(tr);
    rowIndex++;

    scoreboardContainer.appendChild(table);
  }

  // ============================
  // スコアボード：縦型レイアウト
  // ============================
  function buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta) {
    if (!scoreboardContainer) return;
    scoreboardContainer.innerHTML = '';

    if (!expectedIds || !expectedIds.length) return;

    meta = meta || {};
    const matchLabel  = meta.matchLabel  || '試合名';
    const boutLabelFull = meta.boutLabelFull || '対戦名';
    const redTeam   = meta.redTeamName  || '紅チーム';
    const whiteTeam = meta.whiteTeamName || '白チーム';

    const table = document.createElement('table');
    table.className = 'scoreboard-v';
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const createCell = (text, className, rowSpan, colSpan) => {
      const td = document.createElement('td');
      if (className) td.className = className;
      if (text !== undefined && text !== null) td.textContent = text;
      if (rowSpan) td.rowSpan = rowSpan;
      if (colSpan) td.colSpan = colSpan;
      return td;
    };

    // ヘッダー1行目: 紅 | 試合名 | 白
    const trTop = document.createElement('tr');
    trTop.appendChild(createCell('紅', 'header-team-red', 1, 3));
    const tdMatch = createCell('', 'header-match-info', 1, 1);
    tdMatch.innerHTML = (matchLabel || '').replace(/　/g, '<br>');
    trTop.appendChild(tdMatch);
    trTop.appendChild(createCell('白', 'header-team-white', 1, 3));
    tbody.appendChild(trTop);

    // ヘッダー2行目: 紅チーム名 | 対戦名 | 白チーム名
    const trTeam = document.createElement('tr');
    trTeam.appendChild(createCell(redTeam, 'team-name-red', 1, 3));
    trTeam.appendChild(createCell(boutLabelFull, 'header-match-info', 1, 1));
    trTeam.appendChild(createCell(whiteTeam, 'team-name-white', 1, 3));
    tbody.appendChild(trTeam);

    // カラムヘッダー行
    const trColHead = document.createElement('tr');
    trColHead.appendChild(createCell('旗', 'col-header', 1, 1));
    trColHead.appendChild(createCell('合計', 'col-header', 1, 1));
    const tdRedWorkApp = createCell('', 'col-header', 1, 1);
    tdRedWorkApp.innerHTML = '作品点<div class="sub-label">鑑賞点</div>';
    trColHead.appendChild(tdRedWorkApp);
    trColHead.appendChild(createCell('審査員', 'col-header', 1, 1));
    const tdWhiteWorkApp = createCell('', 'col-header', 1, 1);
    tdWhiteWorkApp.innerHTML = '作品点<div class="sub-label">鑑賞点</div>';
    trColHead.appendChild(tdWhiteWorkApp);
    trColHead.appendChild(createCell('合計', 'col-header', 1, 1));
    trColHead.appendChild(createCell('旗', 'col-header', 1, 1));
    tbody.appendChild(trColHead);

    // 審査員ごとのデータ行
    expectedIds.forEach(id => {
      const s = subMap[id] || {};
      const tr = document.createElement('tr');

      // 紅 旗
      const tdRedFlag = createCell('', 'cell-flag red-flag');
      if (s.red_flag) tdRedFlag.textContent = '◆';
      tr.appendChild(tdRedFlag);

      // 紅 合計
      tr.appendChild(createCell(s.red_total != null ? s.red_total : '', 'cell-total'));

      // 紅 作品点/鑑賞点（スタック）
      const tdRedScores = createCell('', 'cell-scores');
      const redWorkDiv = document.createElement('div');
      redWorkDiv.className = 'score-main';
      redWorkDiv.textContent = s.red_work != null ? s.red_work : '';
      const redAppDiv = document.createElement('div');
      redAppDiv.className = 'score-sub';
      redAppDiv.textContent = (s.red_app != null && s.red_app !== 0) ? s.red_app : '';
      tdRedScores.appendChild(redWorkDiv);
      tdRedScores.appendChild(redAppDiv);
      tr.appendChild(tdRedScores);

      // 審査員名
      let name = id.slice(0, 8);
      const j = judgesMap[id];
      if (j) name = (typeof j === 'object' ? j.name : j) || name;
      tr.appendChild(createCell(name, 'cell-judge'));

      // 白 作品点/鑑賞点（スタック）
      const tdWhiteScores = createCell('', 'cell-scores');
      const whiteWorkDiv = document.createElement('div');
      whiteWorkDiv.className = 'score-main';
      whiteWorkDiv.textContent = s.white_work != null ? s.white_work : '';
      const whiteAppDiv = document.createElement('div');
      whiteAppDiv.className = 'score-sub';
      whiteAppDiv.textContent = (s.white_app != null && s.white_app !== 0) ? s.white_app : '';
      tdWhiteScores.appendChild(whiteWorkDiv);
      tdWhiteScores.appendChild(whiteAppDiv);
      tr.appendChild(tdWhiteScores);

      // 白 合計
      tr.appendChild(createCell(s.white_total != null ? s.white_total : '', 'cell-total'));

      // 白 旗
      const tdWhiteFlag = createCell('', 'cell-flag');
      if (s.white_flag) {
        tdWhiteFlag.textContent = '◆';
        tdWhiteFlag.classList.add('white-flag');
      }
      tr.appendChild(tdWhiteFlag);

      tbody.appendChild(tr);
    });

    scoreboardContainer.appendChild(table);
  }

  // ============================
  // 次試合コード計算
  // ============================
  function calcNextMatchCode(code) {
    const s = (code || '').trim();
    if (!s) return s;
    const m = s.match(/^(.*?)(\d+)(\D*)$/);
    if (!m) return s;
    const prefix = m[1];
    const numStr = m[2];
    const suffix = m[3] || '';
    const next = String(Number(numStr) + 1).padStart(numStr.length, '0');
    return prefix + next + suffix;
  }

  function showJudgeSelectSection(show) {
    if (!judgeSelectSection) return;
    judgeSelectSection.style.display = show ? 'block' : 'none';
    if (!show && judgeSelectList) {
      judgeSelectList.innerHTML = '';
    }
  }

  // ドラッグ中の要素の直下に来ている要素を取得
  function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll('.judge-select-item:not(.dragging)')];
    let closest = { offset: Number.POSITIVE_INFINITY, element: null };
    items.forEach(item => {
      const box = item.getBoundingClientRect();
      const offset = y - (box.top + box.height / 2);
      if (offset < 0 && Math.abs(offset) < closest.offset) {
        closest = { offset: Math.abs(offset), element: item };
      }
    });
    return closest.element;
  }

  // ============================
  // 次試合：審査員選択UI を開く
  // ============================
  async function openJudgeSelectionForNextMatch() {
    const curCode = (matchCodeInput.value || '').trim();
    if (!curCode) {
      setMsg('現在の対戦コードを先に入力してください。', 'err');
      return;
    }

    const nextCode = calcNextMatchCode(curCode);
    if (!nextCode) {
      setMsg('次の試合コードを計算できませんでした。', 'err');
      return;
    }

    try {
      setMsg('次の試合の期待審査員候補を取得中…', '');

      const curMatches = await fetchJson('matches', {
        select: 'id,code,name,num_bouts',
        code: 'eq.' + curCode
      });
      const curMatch = curMatches[0];
      const prevMatchId = curMatch ? curMatch.id : null;
      const curMatchName = curMatch ? curMatch.name : '';
      const curNumBouts = (curMatch && curMatch.num_bouts) ? curMatch.num_bouts : 5;

      const nextMatches = await fetchJson('matches', {
        select: 'id,code,name,red_team_name,white_team_name,num_bouts',
        code: 'eq.' + nextCode
      });
      const existingNextMatch = nextMatches[0];

      if (existingNextMatch) {
        if (newMatchSetupCode)  newMatchSetupCode.value  = existingNextMatch.code || nextCode;
        if (newMatchSetupName)  newMatchSetupName.value  = existingNextMatch.name || '';
        if (newMatchSetupRed)   newMatchSetupRed.value   = existingNextMatch.red_team_name || '';
        if (newMatchSetupWhite) newMatchSetupWhite.value = existingNextMatch.white_team_name || '';
        if (newMatchSetupBouts) newMatchSetupBouts.value = existingNextMatch.num_bouts || curNumBouts;
      } else {
        if (newMatchSetupCode)  newMatchSetupCode.value  = nextCode;
        if (newMatchSetupName)  newMatchSetupName.value  = '';
        if (newMatchSetupRed)   newMatchSetupRed.value   = '';
        if (newMatchSetupWhite) newMatchSetupWhite.value = '';
        if (newMatchSetupBouts) newMatchSetupBouts.value = curNumBouts;
      }

      pendingNextMatch = {
        prevCode: curCode,
        nextCode: nextCode,
        prevMatchId: curMatch ? curMatch.id : null,
        prevMatchName: curMatchName,
      };

      const judges = await fetchJson('judges', { select: 'id,name' });

      let prevExpectedIds = [];
      if (prevMatchId) {
        const expected = await fetchJson('expected_judges', {
          select: 'judge_id,sort_order',
          match_id: 'eq.' + prevMatchId,
          order: 'sort_order.asc',
        });
        prevExpectedIds = (expected || []).map(r => String(r.judge_id));
      }

      const defaultSet = new Set(
        prevExpectedIds.length ? prevExpectedIds : judges.map(j => j.id)
      );

      if (prevExpectedIds.length) {
        const orderIndex = new Map();
        prevExpectedIds.forEach((id, idx) => orderIndex.set(String(id), idx));
        judges.sort((a, b) => {
          const ia = orderIndex.has(String(a.id)) ? orderIndex.get(String(a.id)) : Number.MAX_SAFE_INTEGER;
          const ib = orderIndex.has(String(b.id)) ? orderIndex.get(String(b.id)) : Number.MAX_SAFE_INTEGER;
          if (ia !== ib) return ia - ib;
          return (a.name || '').localeCompare(b.name || '', 'ja');
        });
      } else {
        judges.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
      }

      if (judgeSelectInfo) {
        judgeSelectInfo.textContent = prevExpectedIds.length
          ? `前回の期待審査員 ${prevExpectedIds.length}人を既定で選択しました。`
          : `前回の期待審査員設定が無いため、審査員全員 (${judges.length}人) を既定で選択しました。`;
      }

      if (judgeSelectList) {
        judgeSelectList.innerHTML = '';
        judges.forEach(j => {
          const div = document.createElement('div');
          div.className = 'judge-select-item';
          div.dataset.judgeId = j.id;
          div.draggable = true;
          const id = 'judgeChk_' + j.id;
          const checked = defaultSet.has(j.id) ? 'checked' : '';
          div.innerHTML =
            `<label><input type="checkbox" class="judge-select-checkbox" ` +
            `data-judge-id="${j.id}" id="${id}" ${checked}> ` +
            `${j.name || '(名前未設定)'}</label>`;
          div.addEventListener('dragstart', e => {
            div.classList.add('dragging');
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          });
          div.addEventListener('dragend', () => div.classList.remove('dragging'));
          judgeSelectList.appendChild(div);
        });

        if (!judgeSelectList._dndInitialized) {
          judgeSelectList.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = judgeSelectList.querySelector('.judge-select-item.dragging');
            if (!dragging) return;
            const afterElement = getDragAfterElement(judgeSelectList, e.clientY);
            if (afterElement == null) judgeSelectList.appendChild(dragging);
            else judgeSelectList.insertBefore(dragging, afterElement);
          });
          judgeSelectList._dndInitialized = true;
        }
      }

      showJudgeSelectSection(true);
      setMsg('次の試合の期待審査員を選択してください。', '');

    } catch (err) {
      console.error('openJudgeSelectionForNextMatch error', err);
      setMsg('次の試合の期待審査員取得に失敗しました: ' + (err.message || String(err)), 'err');
    }
  }

  // ============================
  // 審査員追加
  // ============================
  async function addJudgeFromUI() {
    const name = (newJudgeNameInput && newJudgeNameInput.value || '').trim();
    if (!name) {
      setMsg('審査員名を入力してください。', 'err');
      return;
    }
    const adminSec = adminSecretInput ? adminSecretInput.value.trim() : '';
    if (!adminSec) {
      setMsg('管理用シークレットを入力してください。', 'err');
      return;
    }

    // フォーム入力内容を先に保存
    const savedMatchCode  = newMatchSetupCode  ? newMatchSetupCode.value  : '';
    const savedMatchName  = newMatchSetupName  ? newMatchSetupName.value  : '';
    const savedRedTeam    = newMatchSetupRed   ? newMatchSetupRed.value   : '';
    const savedWhiteTeam  = newMatchSetupWhite ? newMatchSetupWhite.value : '';
    const savedBouts      = newMatchSetupBouts ? newMatchSetupBouts.value : '';

    try {
      setControlsDisabled(true);
      setMsg('審査員を追加中…', '');

      const voiceKey  = newJudgeVoiceKeyInput ? newJudgeVoiceKeyInput.value.trim() : '';

      const data = await callControlFunction(ADMIN_ADD_JUDGE_URL, {
        admin_secret: adminSec,
        name,
        voice_key: voiceKey || undefined,
      });

      // 審査員名・ボイスキー入力欄のみクリア（試合情報は保持）
      if (newJudgeNameInput)    newJudgeNameInput.value    = '';
      if (newJudgeVoiceKeyInput) newJudgeVoiceKeyInput.value = '';

      // 試合情報フォームを確実に復元
      if (newMatchSetupCode)  newMatchSetupCode.value  = savedMatchCode;
      if (newMatchSetupName)  newMatchSetupName.value  = savedMatchName;
      if (newMatchSetupRed)   newMatchSetupRed.value   = savedRedTeam;
      if (newMatchSetupWhite) newMatchSetupWhite.value = savedWhiteTeam;
      if (newMatchSetupBouts) newMatchSetupBouts.value = savedBouts;

      const judgeUrl = `${location.origin}/judge.html?token=${encodeURIComponent(data.token)}`;
      const judgeInfoEl = $('#judgeSelectInfo');
      if (judgeInfoEl) {
        judgeInfoEl.innerHTML =
          `<strong>✔ 審査員追加完了:</strong> ${data.judge_name}` +
          `<br>トークン: <code>${data.token}</code>` +
          `<br>URL: <a href="${judgeUrl}" target="_blank">${judgeUrl}</a>`;
      }
      setMsg(`審査員を追加しました: ${data.judge_name}`, 'ok');

      if (judgeSelectSection && judgeSelectSection.style.display !== 'none') {
        await refreshJudgeSelectList();
        // リスト再読み込み後にも念のため復元
        if (newMatchSetupCode)  newMatchSetupCode.value  = savedMatchCode;
        if (newMatchSetupName)  newMatchSetupName.value  = savedMatchName;
        if (newMatchSetupRed)   newMatchSetupRed.value   = savedRedTeam;
        if (newMatchSetupWhite) newMatchSetupWhite.value = savedWhiteTeam;
        if (newMatchSetupBouts) newMatchSetupBouts.value = savedBouts;
      }

    } catch (err) {
      console.error('addJudgeFromUI error', err);
      setMsg('審査員追加中にエラーが発生しました: ' + (err.message || String(err)), 'err');
    } finally {
      setControlsDisabled(false);
    }
  }

  // ============================
  // 試合作成＋期待審査員設定
  // ============================
  async function createMatchWithExpectedJudges() {
    if (!pendingNextMatch) {
      setMsg('次の試合情報がありません。「次の試合を作成」からやり直してください。', 'err');
      return;
    }

    const nextCode = (newMatchSetupCode && newMatchSetupCode.value.trim()) || pendingNextMatch.nextCode;

    if (!judgeSelectList) {
      setMsg('内部エラー: 審査員リストが見つかりません。', 'err');
      return;
    }

    const checkboxes = Array.from(judgeSelectList.querySelectorAll('.judge-select-checkbox'));
    const selectedIds = checkboxes
      .filter(cb => cb.checked)
      .map(cb => cb.getAttribute('data-judge-id'))
      .filter(Boolean);

    if (!selectedIds.length) {
      setMsg('少なくとも1人は審査員を選択してください。', 'err');
      return;
    }

    try {
      setControlsDisabled(true);
      setMsg('試合と期待審査員を作成中…', '');

      const adminSec = adminSecretInput ? adminSecretInput.value.trim() : '';
      if (!adminSec) {
        setMsg('管理用シークレットを入力してください。', 'err');
        setControlsDisabled(false);
        return;
      }
      const venueCode = (venueCodeInput && venueCodeInput.value.trim()) || 'default';
      const matchName = (newMatchSetupName && newMatchSetupName.value.trim()) || null;
      const redTeam   = (newMatchSetupRed && newMatchSetupRed.value.trim()) || null;
      const whiteTeam = (newMatchSetupWhite && newMatchSetupWhite.value.trim()) || null;
      let numBouts = Number(newMatchSetupBouts && newMatchSetupBouts.value);
      if (!numBouts || isNaN(numBouts)) numBouts = 5;

      await callControlFunction(ADMIN_SET_MATCH_JUDGES_URL, {
        admin_secret: adminSec,
        venue_code: venueCode,
        match_code: nextCode,
        match_name: matchName,
        red_team_name: redTeam,
        white_team_name: whiteTeam,
        num_bouts: numBouts,
        judge_ids: selectedIds,
      });

      matchCodeInput.value = nextCode;
      if (epochInput) epochInput.value = '1';
      showJudgeSelectSection(false);
      pendingNextMatch = null;

      setMsg(`試合作成/更新完了: ${nextCode} ／ 期待審査員 ${selectedIds.length}人`, 'ok');
      await loadData(false);

    } catch (err) {
      console.error('createMatchWithExpectedJudges error', err);
      setMsg('試合作成中にエラーが発生しました: ' + (err.message || String(err)), 'err');
    } finally {
      setControlsDisabled(false);
    }
  }

  // ============================
  // 審査員選択リスト再読み込み（フォーム入力内容を保持）
  // ============================
  async function refreshJudgeSelectList() {
    if (!pendingNextMatch) return;
    const prevMatchId = pendingNextMatch.prevMatchId;

    const savedCode  = newMatchSetupCode  ? newMatchSetupCode.value  : '';
    const savedName  = newMatchSetupName  ? newMatchSetupName.value  : '';
    const savedRed   = newMatchSetupRed   ? newMatchSetupRed.value   : '';
    const savedWhite = newMatchSetupWhite ? newMatchSetupWhite.value : '';
    const savedBouts = newMatchSetupBouts ? newMatchSetupBouts.value : '';

    const checkedIds = new Set(
      Array.from((judgeSelectList || document).querySelectorAll('.judge-select-checkbox:checked'))
        .map(cb => cb.getAttribute('data-judge-id'))
    );

    try {
      const judges = await fetchJson('judges', { select: 'id,name' });
      let prevExpectedIds = [];
      if (prevMatchId) {
        const expected = await fetchJson('expected_judges', {
          select: 'judge_id,sort_order',
          match_id: 'eq.' + prevMatchId,
          order: 'sort_order.asc',
        });
        prevExpectedIds = (expected || []).map(r => String(r.judge_id));
      }

      const newJudgeIds = judges.map(j => String(j.id)).filter(id => !checkedIds.has(id) && !prevExpectedIds.length);
      const finalCheckedIds = new Set([...checkedIds, ...newJudgeIds]);

      if (judgeSelectList) {
        judgeSelectList.innerHTML = '';
        const orderMap = new Map();
        (prevExpectedIds.length ? prevExpectedIds : []).forEach((id, i) => orderMap.set(id, i));
        const sorted = [...judges].sort((a, b) => {
          const ai = orderMap.has(String(a.id)) ? orderMap.get(String(a.id)) : 9999;
          const bi = orderMap.has(String(b.id)) ? orderMap.get(String(b.id)) : 9999;
          return ai !== bi ? ai - bi : a.name.localeCompare(b.name, 'ja');
        });
        sorted.forEach(j => {
          const checked = finalCheckedIds.has(String(j.id));
          const div = document.createElement('div');
          div.className = 'judge-select-item';
          div.dataset.judgeId = j.id;
          div.draggable = true;
          const id = 'judgeChk_' + j.id;
          div.innerHTML =
            `<label><input type="checkbox" class="judge-select-checkbox" ` +
            `data-judge-id="${j.id}" id="${id}" ${checked ? 'checked' : ''}> ` +
            `${j.name || '(名前未設定)'}</label>`;
          div.addEventListener('dragstart', e => {
            div.classList.add('dragging');
            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
          });
          div.addEventListener('dragend', () => div.classList.remove('dragging'));
          judgeSelectList.appendChild(div);
        });
        if (!judgeSelectList._dndInitialized) {
          judgeSelectList.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = judgeSelectList.querySelector('.judge-select-item.dragging');
            if (!dragging) return;
            const afterElement = getDragAfterElement(judgeSelectList, e.clientY);
            if (!afterElement) judgeSelectList.appendChild(dragging);
            else judgeSelectList.insertBefore(dragging, afterElement);
          });
          judgeSelectList._dndInitialized = true;
        }
      }
    } catch (e) {
      console.error('refreshJudgeSelectList error', e);
    }

    if (newMatchSetupCode  && savedCode)  newMatchSetupCode.value  = savedCode;
    if (newMatchSetupName  && savedName  !== undefined) newMatchSetupName.value  = savedName;
    if (newMatchSetupRed   && savedRed   !== undefined) newMatchSetupRed.value   = savedRed;
    if (newMatchSetupWhite && savedWhite !== undefined) newMatchSetupWhite.value = savedWhite;
    if (newMatchSetupBouts && savedBouts) newMatchSetupBouts.value = savedBouts;
  }

  // ============================
  // データ読み込み
  // ============================
  async function loadData(isAuto = false) {
    if (isAuto && autoLoading) return;
    if (isAuto) {
      autoLoading = true;
    } else {
      setMsg('読み込み中…', '');
      setControlsDisabled(true);
      if (scoreboardContainer) scoreboardContainer.innerHTML = '';
      stateSummary.innerHTML = '<span class="small">読み込み中…</span>';
    }

    const matchCode = matchCodeInput.value.trim();
    const epoch     = Number(epochInput.value || '1');

    if (!matchCode) {
      if (!isAuto) {
        setMsg('対戦コードを入力してください。', 'err');
        setControlsDisabled(false);
      }
      if (isAuto) autoLoading = false;
      return;
    }

    try {
      // 1. matches
      const matches = await fetchJson('matches', {
        select: 'id,code,name,red_team_name,white_team_name,num_bouts',
        code: 'eq.' + matchCode,
      });

      if (!matches.length) {
        if (!isAuto) {
          setMsg(`matches.code = "${matchCode}" の対戦が見つかりません。`, 'err');
          stateSummary.innerHTML = '<span class="small">対戦が見つかりません。</span>';
        }
        if (isAuto) autoLoading = false;
        return;
      }
      const match   = matches[0];
      const matchId = match.id;

      // 2. state（会場別）
      {
        const vc = (venueCodeInput && venueCodeInput.value.trim()) || 'default';
        if (!currentVenueId) {
          const vRows = await fetchJson('venues', { select: 'id', code: 'eq.' + vc });
          if (vRows[0]) currentVenueId = vRows[0].id;
        }
      }
      const stateRows = currentVenueId
        ? await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', venue_id: 'eq.' + currentVenueId })
        : await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', id: 'eq.1' });
      const st  = stateRows[0] || null;
      lastState = st;

      const numBouts = Number(match.num_bouts || 0);
      const boutLabelFull = getBoutLabel(epoch, numBouts);

      // 3. expected_judges
      const expected    = await fetchJson('expected_judges', {
        select: 'judge_id, sort_order',
        match_id: 'eq.' + matchId,
        order: 'sort_order.asc',
      });
      const expectedIds = expected.map(r => String(r.judge_id));

      // 4. submissions
      const subs = await fetchJson('submissions', {
        select: 'judge_id,revision,red_work,red_app,red_total,red_flag,white_work,white_app,white_total,white_flag',
        match_id: 'eq.' + matchId,
        epoch: 'eq.' + epoch,
      });

      // 5. judges
      let judgesMap = {};
      if (expectedIds.length) {
        const idList = expectedIds.join(',');
        const judges = await fetchJson('judges', {
          select: 'id,name,voice_key',
          id: 'in.(' + idList + ')',
        });
        judgesMap = Object.fromEntries(
          judges.map(j => [String(j.id), { name: j.name, voice_key: j.voice_key }])
        );
      }

      // 6. スコアボード描画
      const subMap = {};
      subs.forEach(s => { subMap[String(s.judge_id)] = s; });

      const matchLabel = (match.name || match.code).replace(/　/g, '\n');
      let boutLabelForBoard = boutLabelFull || '対戦名';
      if (boutLabelForBoard && !boutLabelForBoard.endsWith('戦')) {
        boutLabelForBoard = boutLabelForBoard + '戦';
      }

      const meta = {
        matchLabel:    matchLabel,
        boutLabelFull: boutLabelForBoard,
        redTeamName:   match.red_team_name  || '紅',
        whiteTeamName: match.white_team_name || '白',
      };

      if (scoreboardMode === 'vertical') {
        buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta);
      } else {
        const displayIds = reorderIdsForScoreboard(expectedIds);
        buildScoreboard_horizontal(displayIds, judgesMap, subMap, meta);
      }

      // Zundamon
      scheduleZundaAudioRefresh({ match, epoch, boutLabelFull, expectedIds, judgesMap, subMap });

      // 7. 状態サマリ
      const submittedIds  = new Set(subs.map(s => String(s.judge_id)));
      const submittedCount = submittedIds.size;
      const expectedCount  = expectedIds.length;

      const parts = [];
      parts.push(`<span>試合: <strong>${match.code}</strong> (${match.name || ''})</span>`);
      if (boutLabelFull) {
        parts.push(`<span>第${epoch}対戦（${boutLabelFull}）</span>`);
      } else {
        parts.push(`<span>第${epoch}対戦</span>`);
      }

      if (st) {
        parts.push(`<span>state.epoch: <strong>${st.epoch}</strong></span>`);
        parts.push(`<span class="tag ${st.accepting ? 'ok' : 'danger'}">accepting: ${st.accepting}</span>`);
        parts.push(`<span class="tag outline ${st.e3_reached ? 'ok' : 'warn'}">e3_reached: ${st.e3_reached}</span>`);

        if (st.current_match_id) {
          parts.push(st.current_match_id === matchId
            ? '<span class="tag ok">current_match_id: true</span>'
            : '<span class="tag warn">current_match_id: false</span>');
        } else {
          parts.push('<span class="tag warn">current_match_id: 未設定</span>');
        }

        if (st.epoch === epoch) {
          parts.push('<span class="tag ok">current_epoch: true</span>');
        } else {
          parts.push('<span class="tag warn">current_epoch: false</span>');
        }

        if (toggleAcceptingBtn) {
          if (st.accepting) {
            toggleAcceptingBtn.textContent = '受付締切（現在: 受付中）';
            toggleAcceptingBtn.className = 'small-btn btn-red';
          } else {
            toggleAcceptingBtn.textContent = '受付開始（現在: 停止中）';
            toggleAcceptingBtn.className = 'small-btn btn-green';
          }
        }
      } else {
        parts.push('<span class="tag warn">state が取得できません</span>');
        if (toggleAcceptingBtn) {
          toggleAcceptingBtn.textContent = 'state 不明';
          toggleAcceptingBtn.className = 'small-btn btn-grey';
        }
      }

      parts.push(`<span>期待審査員: <strong>${expectedCount}</strong> 人</span>`);
      parts.push(`<span>提出済み: <strong>${submittedCount}</strong> 人</span>`);
      stateSummary.innerHTML = parts.join('');

      if (!isAuto) setMsg('読み込み完了', 'ok');

    } catch (err) {
      console.error(err);
      if (!isAuto) {
        setMsg('読み込み中にエラーが発生しました: ' + err.message, 'err');
        stateSummary.innerHTML = '<span class="small">エラーが発生しました。</span>';
      }
    } finally {
      if (isAuto) {
        autoLoading = false;
      } else {
        setControlsDisabled(false);
      }
    }
  }

  // ============================
  // イベントリスナー
  // ============================

  toggleAcceptingBtn.addEventListener('click', async () => {
    if (!lastState) {
      setMsg('状態が読み込まれていません。', 'err');
      return;
    }
    const nextVal = !lastState.accepting;
    const label = nextVal ? '受付開始' : '受付締切';
    try {
      setMsg(`${label}処理中…`, '');
      setControlsDisabled(true);
      const patch = { accepting: nextVal };
      if (nextVal) patch.epoch = Number(epochInput.value || '1');
      await patchState(patch);
      setMsg(`${label}しました（accepting=${nextVal}）。`, 'ok');
      await loadData();
    } catch (err) {
      console.error(err);
      setMsg(`${label}に失敗しました: ` + err.message, 'err');
      setControlsDisabled(false);
    }
  });

  loadBtn.addEventListener('click', loadData);

  if (nextMatchSetupBtn) {
    nextMatchSetupBtn.addEventListener('click', openJudgeSelectionForNextMatch);
  }
  if (judgeSelectAllBtn) {
    judgeSelectAllBtn.addEventListener('click', () => {
      if (!judgeSelectList) return;
      judgeSelectList.querySelectorAll('.judge-select-checkbox').forEach(cb => { cb.checked = true; });
    });
  }
  if (judgeSelectClearBtn) {
    judgeSelectClearBtn.addEventListener('click', () => {
      if (!judgeSelectList) return;
      judgeSelectList.querySelectorAll('.judge-select-checkbox').forEach(cb => { cb.checked = false; });
    });
  }
  if (judgeSelectConfirmBtn) {
    judgeSelectConfirmBtn.addEventListener('click', createMatchWithExpectedJudges);
  }
  if (judgeSelectCancelBtn) {
    judgeSelectCancelBtn.addEventListener('click', () => {
      showJudgeSelectSection(false);
      pendingNextMatch = null;
      setMsg('次の試合作成をキャンセルしました。', '');
    });
  }
  if (addJudgeBtn) {
    addJudgeBtn.addEventListener('click', addJudgeFromUI);
  }

  // --- E5 / E6 / SET_MATCH ---

  function setE5E6Status(message, isOk) {
    if (!e5e6StatusEl) return;
    e5e6StatusEl.textContent = message;
    e5e6StatusEl.className = 'msg';
    if (isOk === true)  e5e6StatusEl.classList.add('ok');
    if (isOk === false) e5e6StatusEl.classList.add('err');
  }

  async function onClickSetMatch() {
    const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
    const matchCode   = matchCodeInput   ? matchCodeInput.value.trim()   : '';
    const epochVal    = Number(epochInput.value || '1');

    if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }
    if (!matchCode)   { setE5E6Status('対象の対戦コード（matches.code）を入力してください。', false); return; }

    setE5E6Status('現在の試合を設定中…（current_match_id, epoch, accepting を更新）', true);
    try {
      const data = await callControlFunction(CONTROL_SET_MATCH_URL, {
        admin_secret: adminSecret,
        venue_code: (venueCodeInput && venueCodeInput.value.trim()) || 'default',
        match_code: matchCode,
        epoch: epochVal,
      });
      if (epochInput && typeof data.epoch === 'number') epochInput.value = String(data.epoch);
      setE5E6Status(`現在の試合を設定しました: match=${data.match?.code || matchCode}, epoch=${data.epoch}`, true);
      await loadData();
    } catch (err) {
      console.error(err);
      setE5E6Status('現在の試合の設定に失敗しました: ' + (err.message || String(err)), false);
    }
  }

  async function onClickE5() {
    const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
    const matchCode   = matchCodeInput   ? matchCodeInput.value.trim()   : '';

    if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }
    if (!matchCode)   { setE5E6Status('対象の対戦コード（matches.code）を入力してください。', false); return; }

    setE5E6Status('E5 実行中…（スナップショット保存と受付停止）', true);
    try {
      const data = await callControlFunction(CONTROL_CONFIRM_URL, {
        admin_secret: adminSecret,
        venue_code: (venueCodeInput && venueCodeInput.value.trim()) || 'default',
        match_code: matchCode,
      });
      setE5E6Status(`E5 完了: match=${matchCode}, epoch=${data.epoch}（スナップショット件数: ${data.snapshot_count}）`, true);
      await loadData();
    } catch (err) {
      console.error(err);
      setE5E6Status('E5 失敗: ' + (err.message || String(err)), false);
    }
  }

  async function onClickE6() {
    const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
    if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }

    setE5E6Status('E6 実行中…（epoch を進めて受付再開）', true);
    try {
      const data = await callControlFunction(CONTROL_ADVANCE_URL, {
        admin_secret: adminSecret,
        venue_code: (venueCodeInput && venueCodeInput.value.trim()) || 'default',
      });
      if (epochInput && typeof data.to_epoch === 'number') epochInput.value = String(data.to_epoch);
      setE5E6Status(`E6 完了: epoch ${data.from_epoch} → ${data.to_epoch} に進めました（受付再開）`, true);
      await loadData();
    } catch (err) {
      console.error(err);
      setE5E6Status('E6 失敗: ' + (err.message || String(err)), false);
    }
  }

  if (btnSetMatch) btnSetMatch.addEventListener('click', onClickSetMatch);
  if (btnE5) btnE5.addEventListener('click', onClickE5);
  if (btnE6) btnE6.addEventListener('click', onClickE6);

  // 自動更新
  setInterval(() => {
    if (!matchCodeInput.value.trim()) return;
    loadData(true);
  }, 2000);

  // 音声再生ボタン
  if (btnAudioPlayAll) {
    btnAudioPlayAll.addEventListener('click', () => {
      if (!zundaQueue.length) {
        setAudioStatus('再生キューが空です。先に読み込みを行ってください。');
        return;
      }
      if (zundaPlaying) {
        setAudioStatus('すでに再生中です。');
        return;
      }
      zundaQueueIndex = 0;
      playZundaQueue();
    });
  }
  if (btnAudioStop) {
    btnAudioStop.addEventListener('click', stopZunda);
  }

})();
