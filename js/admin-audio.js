// ============================
// admin-audio.js — 得点読み上げ音声再生
// ============================

(() => {
const adminAudioDom = window.KHBAdmin?.dom || {};
const adminAudioApi = window.KHBAdmin?.api || {};
const adminAudioConstants = window.KHBAdmin?.constants || {};
const adminAudioHelpers = window.KHBAdmin?.helpers || {};
const adminAudioState = window.KHBAdmin?.audioState || {};

const AUDIO_BASE = 'https://blackstraysheep.github.io/khb_onlinesheet/audio/';

const audioPhraseFiles = {
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

function setAudioStatus(text) {
  if (!adminAudioDom.audioStatusEl) return;
  adminAudioDom.audioStatusEl.textContent = text || '';
}

function initAudio() {
  if (adminAudioState.audioInitialized) return;
  Object.entries(audioPhraseFiles).forEach(([id, file]) => {
    adminAudioState.audioClips[id] = new Audio(AUDIO_BASE + file);
  });
  adminAudioState.audioInitialized = true;
}

function ensureAudioClip(id) {
  if (adminAudioState.audioClips[id]) return;

  if (audioPhraseFiles[id]) {
    adminAudioState.audioClips[id] = new Audio(AUDIO_BASE + audioPhraseFiles[id]);
    return;
  }

  if (id.startsWith('num_')) {
    const n = Number(id.slice(4));
    let file;
    if (n >= 1 && n <= adminAudioConstants.AUDIO_NUMERIC_CLIP_MAX) {
      file = `${n}.mp3`;
    } else {
      console.warn('Audio: 未定義の数字クリップです:', n);
      return;
    }
    adminAudioState.audioClips[id] = new Audio(AUDIO_BASE + file);
    return;
  }

  if (id.startsWith('judge_')) {
    adminAudioState.audioClips[id] = new Audio(AUDIO_BASE + `${id}.mp3`);
    return;
  }

  console.warn('Audio: ファイルマッピングがないIDです:', id);
}

function playAudioClip(id) {
  return new Promise(resolve => {
    initAudio();
    ensureAudioClip(id);
    const audio = adminAudioState.audioClips[id];
    if (!audio) {
      console.warn('Audio: インスタンスがありません:', id);
      resolve();
      return;
    }
    audio.currentTime = 0;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(err => {
      console.warn('Audio: 再生エラー', err);
      resolve();
    });
  });
}

async function playAudioQueue() {
  if (!adminAudioState.audioQueue.length) {
    setAudioStatus('再生キューが空です。');
    adminAudioState.audioPlaying = false;
    return;
  }

  adminAudioApi.patchState({ scoreboard_visible: true }).catch(err => console.error(err));
  setAudioStatus('再生中…');
  adminAudioState.audioPlaying = true;
  renderAudioQueue(true);

  while (adminAudioState.audioPlaying && adminAudioState.audioQueueIndex < adminAudioState.audioQueue.length) {
    renderAudioQueue();
    const id = adminAudioState.audioQueue[adminAudioState.audioQueueIndex++];
    await playAudioClip(id);
  }
  renderAudioQueue();

  if (adminAudioState.audioPlaying) {
    setAudioStatus('再生完了');
  } else {
    setAudioStatus('停止しました');
  }
  adminAudioState.audioPlaying = false;
  adminAudioApi.patchState({ scoreboard_visible: false }).catch(err => console.error(err));
  applyPendingAudioRefresh();
}

function stopAudio() {
  adminAudioState.audioPlaying = false;
  Object.values(adminAudioState.audioClips).forEach(a => {
    try { a.pause(); } catch (e) { }
  });
  adminAudioApi.patchState({ scoreboard_visible: false }).catch(err => console.error(err));
  setAudioStatus('停止しました');
  applyPendingAudioRefresh();
}

function numToAudioIds(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return [];

  if (v >= 1 && v <= adminAudioConstants.AUDIO_NUMERIC_CLIP_MAX) return [`num_${v}`];

  console.warn('Audio: 対応していない点数です:', v);
  return [];
}

function getJudgeVoiceKey(judgeId, judgesMap) {
  const j = judgesMap[judgeId];
  if (j && j.voice_key) return j.voice_key;
  return judgeId;
}

function buildAudioSegments(expectedIds, judgesMap, subMap) {
  adminAudioState.audioJudgeSegments = {};
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

    if (Number.isFinite(redWork)) clips.push(...numToAudioIds(redWork));
    clips.push('vs');
    if (Number.isFinite(whiteWork)) clips.push(...numToAudioIds(whiteWork));

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
      clips.push(...numToAudioIds(redTotal));
      clips.push('vs');
      clips.push(...numToAudioIds(whiteTotal));
    }

    if (adminAudioHelpers.hasUndecidableWinner(sub)) {
      console.warn('Audio: 勝敗判定不能のため勝者音声をスキップします:', jid);
      adminAudioState.audioJudgeSegments[jid] = {
        revision: sub.revision || 1,
        clips,
      };
      return;
    }

    const isDrawTotal = (redTotal === whiteTotal);
    let winnerSideForTotal;
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

    adminAudioState.audioJudgeSegments[jid] = {
      revision: sub.revision || 1,
      clips,
    };
  });
}

function rebuildAudioQueue() {
  const queue = [];
  queue.push('start');
  Object.entries(adminAudioState.audioJudgeSegments).forEach(([_, seg]) => {
    seg.clips.forEach(id => queue.push(id));
  });
  queue.push('end');

  adminAudioState.audioQueue = queue;
  adminAudioState.audioQueueIndex = 0;
  setAudioStatus(`再生キューを準備しました（${queue.length}クリップ）。`);
  renderAudioQueue();
}

function renderAudioQueue(forceScroll = false) {
  if (!adminAudioDom.audioQueueListEl) return;
  adminAudioDom.audioQueueListEl.replaceChildren();
  if (!adminAudioState.audioQueue.length) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'audio-empty';
    emptyEl.textContent = '(キューは空です)';
    adminAudioDom.audioQueueListEl.appendChild(emptyEl);
    return;
  }

  adminAudioState.audioQueue.forEach((id, idx) => {
    let label = id;
    if (audioPhraseFiles[id]) {
      label = `[定型] ${id}`;
    } else if (id.startsWith('judge_')) {
      label = `[審査員] ${id}`;
    } else if (id.startsWith('num_')) {
      label = `[数字] ${id.replace('num_', '')}`;
    }
    const isCurrent = (idx === adminAudioState.audioQueueIndex);
    const cls = isCurrent ? 'audio-item current' : 'audio-item';
    const marker = isCurrent ? '▶ ' : '';
    const item = document.createElement('div');
    item.className = cls;
    if (isCurrent) item.id = 'currentAudioItem';
    item.textContent = `${marker}${idx + 1}. ${label}`;
    adminAudioDom.audioQueueListEl.appendChild(item);
  });

  const currentEl = document.getElementById('currentAudioItem');
  if (currentEl) {
    if (forceScroll) {
      const itemTop = currentEl.offsetTop;
      const itemHeight = currentEl.offsetHeight;
      const containerHeight = adminAudioDom.audioQueueListEl.clientHeight;
      const targetTop = itemTop - (containerHeight / 2) + (itemHeight / 2) + adminAudioConstants.AUDIO_QUEUE_SCROLL_CENTER_OFFSET;
      adminAudioDom.audioQueueListEl.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      const cRect = adminAudioDom.audioQueueListEl.getBoundingClientRect();
      const iRect = currentEl.getBoundingClientRect();
      const relativeTop = iRect.top - cRect.top;
      const containerHeight = cRect.height;
      const margin = adminAudioConstants.AUDIO_QUEUE_SCROLL_MARGIN;
      if (relativeTop > -margin && relativeTop < containerHeight + margin) {
        const itemTop = currentEl.offsetTop;
        const itemHeight = currentEl.offsetHeight;
        const targetTop = itemTop - (containerHeight / 2) + (itemHeight / 2) + adminAudioConstants.AUDIO_QUEUE_SCROLL_CENTER_OFFSET;
        adminAudioDom.audioQueueListEl.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }
}

function buildAudioSuite({ expectedIds, judgesMap, subMap }) {
  buildAudioSegments(expectedIds, judgesMap, subMap);
  rebuildAudioQueue();
}

function scheduleAudioRefresh(data) {
  if (!data || !data.expectedIds || !data.expectedIds.length) {
    adminAudioState.pendingAudioRefresh = null;
    adminAudioState.audioQueue = [];
    adminAudioState.audioQueueIndex = 0;
    setAudioStatus('再生キューが空です。');
    return;
  }
  if (adminAudioState.audioPlaying) {
    adminAudioState.pendingAudioRefresh = data;
    return;
  }
  adminAudioState.pendingAudioRefresh = null;
  buildAudioSuite(data);
}

function applyPendingAudioRefresh() {
  if (!adminAudioState.pendingAudioRefresh) return;
  const data = adminAudioState.pendingAudioRefresh;
  adminAudioState.pendingAudioRefresh = null;
  buildAudioSuite(data);
}

window.KHBAdmin.audio = Object.assign(window.KHBAdmin.audio || {}, {
  setAudioStatus,
  playAudioQueue,
  stopAudio,
  buildAudioSuite,
  scheduleAudioRefresh,
  applyPendingAudioRefresh,
});
})();
