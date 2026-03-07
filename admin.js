(function () {
  // ============================
  // 設定（URLとキー）
  // ============================
  const SUPABASE_URL = 'http://127.0.0.1:54321'; // ローカルテスト用
  const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

  const CONTROL_CONFIRM_URL    = 'http://127.0.0.1:54321/functions/v1/control_confirm_with_secret';
  const CONTROL_ADVANCE_URL    = 'http://127.0.0.1:54321/functions/v1/control_advance_with_secret';
  const CONTROL_SET_MATCH_URL  = 'http://127.0.0.1:54321/functions/v1/control_set_current_match_with_secret';
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
  const venueSelect         = $('#venueSelect');
  const matchSelect         = $('#matchSelect');
  const btnStartMatch       = $('#btnStartMatch');
  const toggleAcceptingBtn  = $('#toggleAcceptingBtn');

  const topMsg            = $('#topMsg');
  const stateSummary      = $('#stateSummary');
  const scoreboardContainer = $('#scoreboardContainer');

  // スコアボード表示モード切替ボタン
  const scoreboardModeBtn = $('#scoreboardModeBtn');

  // 審査員並び替え
  const judgeReorderList    = $('#judgeReorderList');
  const btnSaveJudgeOrder   = $('#btnSaveJudgeOrder');
  const judgeReorderStatus  = $('#judgeReorderStatus');

  // Zundamon 再生パネル
  const audioStatusEl   = $('#audioStatus');
  const zundaQueueListEl = $('#zundaQueueList');
  const btnAudioPlayAll = $('#btnAudioPlayAll');
  const btnAudioStop    = $('#btnAudioStop');

  // E5/E6 パネル
  const adminSecretInput = $('#adminSecret');
  const btnE5 = $('#btnE5');
  const btnE6 = $('#btnE6');
  const e5e6StatusEl = $('#e5e6Status');

  // ============================
  // 内部状態
  // ============================
  let lastState      = null;
  let autoLoading    = false;
  let lastExpectedIds = [];
  let scoreboardMode = 'horizontal'; // 'horizontal' | 'vertical'
  let currentVenueId = null;
  let currentVenueCode = null;
  let matchesCache = [];

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
      toggleAcceptingBtn, btnStartMatch,
      btnAudioPlayAll, btnAudioStop, btnE5, btnE6,
      btnSaveJudgeOrder,
    ].forEach(btn => {
      if (btn) btn.disabled = disabled;
    });
    if (venueSelect) venueSelect.disabled = disabled;
    if (matchSelect) matchSelect.disabled = disabled;
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
    const redTeam   = meta.redTeamName  || '紅';
    const whiteTeam = meta.whiteTeamName || '白';

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
  // 会場・試合ドロップダウン
  // ============================
  async function populateVenues() {
    try {
      const venues = await fetchJson('venues', { select: 'id,code,name', order: 'code.asc' });
      if (!venueSelect) return;
      venueSelect.innerHTML = '';
      if (!venues.length) {
        venueSelect.innerHTML = '<option value="">-- 会場なし --</option>';
        return;
      }
      venues.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.code;
        opt.dataset.venueId = v.id;
        opt.textContent = v.name ? `${v.code} (${v.name})` : v.code;
        venueSelect.appendChild(opt);
      });
      venueSelect.selectedIndex = 0;
      await onVenueChange();
    } catch (err) {
      console.error('populateVenues error', err);
      if (venueSelect) venueSelect.innerHTML = '<option value="">-- 読込失敗 --</option>';
    }
  }

  async function onVenueChange() {
    if (!venueSelect) return;
    const opt = venueSelect.selectedOptions[0];
    if (!opt || !opt.value) {
      currentVenueId = null;
      currentVenueCode = null;
      if (matchSelect) matchSelect.innerHTML = '<option value="">-- 会場を選択 --</option>';
      return;
    }
    currentVenueCode = opt.value;
    currentVenueId = opt.dataset.venueId || null;
    if (!currentVenueId) {
      const vRows = await fetchJson('venues', { select: 'id', code: 'eq.' + currentVenueCode });
      if (vRows[0]) currentVenueId = vRows[0].id;
    }
    await populateMatches();
  }

  async function populateMatches() {
    if (!matchSelect) return;
    if (!currentVenueId) {
      matchSelect.innerHTML = '<option value="">-- 会場を選択 --</option>';
      return;
    }
    try {
      const matches = await fetchJson('matches', {
        select: 'id,code,name,red_team_name,white_team_name,num_bouts,timeline,venue_id',
        venue_id: 'eq.' + currentVenueId,
        order: 'timeline.asc.nullslast,code.asc',
      });
      matchesCache = matches;

      const stateRows = await fetchJson('state', {
        select: 'epoch,accepting,e3_reached,updated_at,current_match_id',
        venue_id: 'eq.' + currentVenueId,
      });
      const st = stateRows[0] || null;
      lastState = st;

      matchSelect.innerHTML = '';
      if (!matches.length) {
        matchSelect.innerHTML = '<option value="">-- 試合なし --</option>';
        return;
      }

      let currentMatchCode = null;
      matches.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.code;
        opt.dataset.matchId = m.id;
        const isCurrent = st && st.current_match_id === m.id;
        opt.textContent = (m.name || m.code) + (isCurrent ? ' ★' : '');
        if (isCurrent) currentMatchCode = m.code;
        matchSelect.appendChild(opt);
      });

      if (currentMatchCode) {
        matchSelect.value = currentMatchCode;
      }
      await onMatchChange();
    } catch (err) {
      console.error('populateMatches error', err);
      matchSelect.innerHTML = '<option value="">-- 読込失敗 --</option>';
    }
  }

  async function onMatchChange() {
    const matchCode = matchSelect ? matchSelect.value : '';
    if (!matchCode) return;
    await loadData(false);
    await loadJudgeOrder();
  }

  // ============================
  // 審査員の並び替え
  // ============================
  function getDragAfterElement(container, y) {
    const items = [...container.querySelectorAll('.judge-reorder-item:not(.dragging)')];
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

  async function loadJudgeOrder() {
    if (!judgeReorderList) return;
    const matchCode = matchSelect ? matchSelect.value : '';
    if (!matchCode) {
      judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(試合を選択してください)</div>';
      return;
    }
    const match = matchesCache.find(m => m.code === matchCode);
    if (!match) {
      judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(試合が見つかりません)</div>';
      return;
    }
    try {
      const expected = await fetchJson('expected_judges', {
        select: 'judge_id,sort_order',
        match_id: 'eq.' + match.id,
        order: 'sort_order.asc',
      });
      if (!expected.length) {
        judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(この試合に期待審査員が設定されていません)</div>';
        return;
      }
      const judgeIds = expected.map(e => String(e.judge_id));
      const judges = await fetchJson('judges', {
        select: 'id,name',
        id: 'in.(' + judgeIds.join(',') + ')',
      });
      const judgesMap = Object.fromEntries(judges.map(j => [String(j.id), j.name || '(名前未設定)']));

      judgeReorderList.innerHTML = '';
      judgeIds.forEach(jid => {
        const div = document.createElement('div');
        div.className = 'judge-reorder-item';
        div.dataset.judgeId = jid;
        div.draggable = true;
        div.textContent = judgesMap[jid] || jid;
        div.addEventListener('dragstart', e => {
          div.classList.add('dragging');
          if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
        });
        div.addEventListener('dragend', () => div.classList.remove('dragging'));
        judgeReorderList.appendChild(div);
      });

      if (!judgeReorderList._dndInitialized) {
        judgeReorderList.addEventListener('dragover', e => {
          e.preventDefault();
          const dragging = judgeReorderList.querySelector('.judge-reorder-item.dragging');
          if (!dragging) return;
          const afterElement = getDragAfterElement(judgeReorderList, e.clientY);
          if (afterElement == null) judgeReorderList.appendChild(dragging);
          else judgeReorderList.insertBefore(dragging, afterElement);
        });
        judgeReorderList._dndInitialized = true;
      }
      setJudgeReorderStatus('');
    } catch (err) {
      console.error('loadJudgeOrder error', err);
      judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(読込失敗)</div>';
    }
  }

  function setJudgeReorderStatus(text, type) {
    if (!judgeReorderStatus) return;
    judgeReorderStatus.textContent = text || '';
    judgeReorderStatus.className = 'msg';
    if (type === 'ok') judgeReorderStatus.classList.add('ok');
    if (type === 'err') judgeReorderStatus.classList.add('err');
  }

  async function saveJudgeOrder() {
    const matchCode = matchSelect ? matchSelect.value : '';
    if (!matchCode) {
      setJudgeReorderStatus('試合が選択されていません。', 'err');
      return;
    }
    const adminSec = adminSecretInput ? adminSecretInput.value.trim() : '';
    if (!adminSec) {
      setJudgeReorderStatus('管理用シークレットを入力してください。', 'err');
      return;
    }
    const items = judgeReorderList ? [...judgeReorderList.querySelectorAll('.judge-reorder-item')] : [];
    const judgeIds = items.map(el => el.dataset.judgeId).filter(Boolean);
    if (!judgeIds.length) {
      setJudgeReorderStatus('並び替える審査員がいません。', 'err');
      return;
    }
    try {
      setJudgeReorderStatus('保存中…');
      const match = matchesCache.find(m => m.code === matchCode);
      await callControlFunction(ADMIN_SET_MATCH_JUDGES_URL, {
        admin_secret: adminSec,
        venue_code: currentVenueCode || 'default',
        match_code: matchCode,
        match_name: match ? match.name : null,
        red_team_name: match ? match.red_team_name : null,
        white_team_name: match ? match.white_team_name : null,
        num_bouts: match ? match.num_bouts : 5,
        judge_ids: judgeIds,
      });
      setJudgeReorderStatus('並び順を保存しました。', 'ok');
      await loadData(false);
    } catch (err) {
      console.error('saveJudgeOrder error', err);
      setJudgeReorderStatus('保存に失敗しました: ' + (err.message || String(err)), 'err');
    }
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

    const matchCode = matchSelect ? matchSelect.value : '';

    if (!matchCode) {
      if (!isAuto) {
        setMsg('試合を選択してください。', 'err');
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
      const stateRows = currentVenueId
        ? await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', venue_id: 'eq.' + currentVenueId })
        : await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', id: 'eq.1' });
      const st  = stateRows[0] || null;
      lastState = st;

      // epoch は state から取得
      const epoch = st ? st.epoch : 1;
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
      if (nextVal && lastState.epoch) patch.epoch = lastState.epoch;
      await patchState(patch);
      setMsg(`${label}しました（accepting=${nextVal}）。`, 'ok');
      await loadData();
    } catch (err) {
      console.error(err);
      setMsg(`${label}に失敗しました: ` + err.message, 'err');
      setControlsDisabled(false);
    }
  });

  if (venueSelect) {
    venueSelect.addEventListener('change', onVenueChange);
  }
  if (matchSelect) {
    matchSelect.addEventListener('change', onMatchChange);
  }

  if (btnStartMatch) {
    btnStartMatch.addEventListener('click', async () => {
      const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
      const matchCode = matchSelect ? matchSelect.value : '';
      if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }
      if (!matchCode) { setE5E6Status('試合を選択してください。', false); return; }

      setE5E6Status('現在の試合を設定中…', true);
      try {
        const data = await callControlFunction(CONTROL_SET_MATCH_URL, {
          admin_secret: adminSecret,
          venue_code: currentVenueCode || 'default',
          match_code: matchCode,
          epoch: 1,
        });
        setE5E6Status(`試合を開始しました: ${data.match?.code || matchCode}, epoch=${data.epoch}`, true);
        await populateMatches();
      } catch (err) {
        console.error(err);
        setE5E6Status('試合開始に失敗しました: ' + (err.message || String(err)), false);
      }
    });
  }

  // --- E5 / E6 / SET_MATCH ---

  function setE5E6Status(message, isOk) {
    if (!e5e6StatusEl) return;
    e5e6StatusEl.textContent = message;
    e5e6StatusEl.className = 'msg';
    if (isOk === true)  e5e6StatusEl.classList.add('ok');
    if (isOk === false) e5e6StatusEl.classList.add('err');
  }

  async function onClickE5() {
    const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
    const matchCode   = matchSelect ? matchSelect.value : '';

    if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }
    if (!matchCode)   { setE5E6Status('試合を選択してください。', false); return; }

    setE5E6Status('E5 実行中…（スナップショット保存と受付停止）', true);
    try {
      const data = await callControlFunction(CONTROL_CONFIRM_URL, {
        admin_secret: adminSecret,
        venue_code: currentVenueCode || 'default',
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
        venue_code: currentVenueCode || 'default',
      });
      setE5E6Status(`E6 完了: epoch ${data.from_epoch} → ${data.to_epoch} に進めました（受付再開）`, true);
      await loadData();
    } catch (err) {
      console.error(err);
      setE5E6Status('E6 失敗: ' + (err.message || String(err)), false);
    }
  }

  if (btnE5) btnE5.addEventListener('click', onClickE5);
  if (btnE6) btnE6.addEventListener('click', onClickE6);

  if (btnSaveJudgeOrder) {
    btnSaveJudgeOrder.addEventListener('click', saveJudgeOrder);
  }

  // 自動更新
  setInterval(() => {
    if (!matchSelect || !matchSelect.value) return;
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

  // 初期化: 会場ドロップダウンを読み込み
  populateVenues();

})();
