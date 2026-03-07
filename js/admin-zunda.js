// ============================
// admin-zunda.js — Zundamon 音声再生
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
