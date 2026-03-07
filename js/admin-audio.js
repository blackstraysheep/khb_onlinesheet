// ============================
// admin-audio.js — 得点読み上げ音声再生
// ============================

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

const audioClips = {};
let audioInitialized = false;
let audioPlaying = false;
let audioQueue = [];
let audioQueueIndex = 0;
let audioJudgeSegments = {};
let pendingAudioRefresh = null;

function setAudioStatus(text) {
  if (!audioStatusEl) return;
  audioStatusEl.textContent = text || '';
}

function initAudio() {
  if (audioInitialized) return;
  Object.entries(audioPhraseFiles).forEach(([id, file]) => {
    audioClips[id] = new Audio(AUDIO_BASE + file);
  });
  audioInitialized = true;
}

function ensureAudioClip(id) {
  if (audioClips[id]) return;

  if (audioPhraseFiles[id]) {
    audioClips[id] = new Audio(AUDIO_BASE + audioPhraseFiles[id]);
    return;
  }

  if (id.startsWith('num_')) {
    const n = Number(id.slice(4));
    let file;
    if (n >= 5 && n <= 12) {
      file = `${n}.mp3`;
    } else {
      console.warn('Audio: 未定義の数字クリップです:', n);
      return;
    }
    audioClips[id] = new Audio(AUDIO_BASE + file);
    return;
  }

  if (id.startsWith('judge_')) {
    audioClips[id] = new Audio(AUDIO_BASE + `${id}.mp3`);
    return;
  }

  console.warn('Audio: ファイルマッピングがないIDです:', id);
}

function playAudioClip(id) {
  return new Promise(resolve => {
    initAudio();
    ensureAudioClip(id);
    const audio = audioClips[id];
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
  if (!audioQueue.length) {
    setAudioStatus('再生キューが空です。');
    audioPlaying = false;
    return;
  }

  patchState({ scoreboard_visible: true }).catch(err => console.error(err));
  setAudioStatus('再生中…');
  audioPlaying = true;
  renderAudioQueue(true);

  while (audioPlaying && audioQueueIndex < audioQueue.length) {
    renderAudioQueue();
    const id = audioQueue[audioQueueIndex++];
    await playAudioClip(id);
  }
  renderAudioQueue();

  if (audioPlaying) {
    setAudioStatus('再生完了');
  } else {
    setAudioStatus('停止しました');
  }
  audioPlaying = false;
  patchState({ scoreboard_visible: false }).catch(err => console.error(err));
  applyPendingAudioRefresh();
}

function stopAudio() {
  audioPlaying = false;
  Object.values(audioClips).forEach(a => {
    try { a.pause(); } catch (e) { }
  });
  patchState({ scoreboard_visible: false }).catch(err => console.error(err));
  setAudioStatus('停止しました');
  applyPendingAudioRefresh();
}

function numToAudioIds(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return [];

  if (v === 1) return ['num_1'];
  if (v === 2) return ['num_2'];

  if (v >= 5 && v <= 12) return [`num_${v}`];

  console.warn('Audio: 対応していない点数です:', v);
  return [];
}

function getJudgeVoiceKey(judgeId, judgesMap) {
  const j = judgesMap[judgeId];
  if (j && j.voice_key) return j.voice_key;
  return judgeId;
}

function buildAudioSegments(match, epoch, boutLabelFull, expectedIds, judgesMap, subMap) {
  audioJudgeSegments = {};
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

    audioJudgeSegments[jid] = {
      revision: sub.revision || 1,
      clips,
    };
  });
}

function rebuildAudioQueue(match, epoch, boutLabelFull) {
  const queue = [];
  queue.push('start');
  Object.entries(audioJudgeSegments).forEach(([jid, seg]) => {
    seg.clips.forEach(id => queue.push(id));
  });
  queue.push('end');

  audioQueue = queue;
  audioQueueIndex = 0;
  setAudioStatus(`再生キューを準備しました（${queue.length}クリップ）。`);
  renderAudioQueue();
}

function renderAudioQueue(forceScroll = false) {
  if (!audioQueueListEl) return;
  if (!audioQueue.length) {
    audioQueueListEl.innerHTML = '<div class="audio-empty">(キューは空です)</div>';
    return;
  }
  audioQueueListEl.innerHTML = audioQueue.map((id, idx) => {
    let label = id;
    if (audioPhraseFiles[id]) {
      label = `[定型] ${id}`;
    } else if (id.startsWith('judge_')) {
      label = `[審査員] ${id}`;
    } else if (id.startsWith('num_')) {
      label = `[数字] ${id.replace('num_', '')}`;
    }
    const isCurrent = (idx === audioQueueIndex);
    const cls = isCurrent ? 'audio-item current' : 'audio-item';
    const marker = isCurrent ? '▶ ' : '';
    const divId = isCurrent ? 'currentAudioItem' : '';
    return `<div id="${divId}" class="${cls}">${marker}${idx + 1}. ${label}</div>`;
  }).join('');

  const currentEl = document.getElementById('currentAudioItem');
  if (currentEl) {
    if (forceScroll) {
      const itemTop = currentEl.offsetTop;
      const itemHeight = currentEl.offsetHeight;
      const containerHeight = audioQueueListEl.clientHeight;
      const targetTop = itemTop - (containerHeight / 2) + (itemHeight / 2) + 35;
      audioQueueListEl.scrollTo({ top: targetTop, behavior: 'smooth' });
    } else {
      const cRect = audioQueueListEl.getBoundingClientRect();
      const iRect = currentEl.getBoundingClientRect();
      const relativeTop = iRect.top - cRect.top;
      const containerHeight = cRect.height;
      const margin = 60;
      if (relativeTop > -margin && relativeTop < containerHeight + margin) {
        const itemTop = currentEl.offsetTop;
        const itemHeight = currentEl.offsetHeight;
        const targetTop = itemTop - (containerHeight / 2) + (itemHeight / 2) + 35;
        audioQueueListEl.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }
}

function buildAudioSuite({ match, epoch, boutLabelFull, expectedIds, judgesMap, subMap }) {
  buildAudioSegments(match, epoch, boutLabelFull, expectedIds, judgesMap, subMap);
  rebuildAudioQueue(match, epoch, boutLabelFull);
}

function scheduleAudioRefresh(data) {
  if (!data || !data.expectedIds || !data.expectedIds.length) {
    pendingAudioRefresh = null;
    audioQueue = [];
    audioQueueIndex = 0;
    setAudioStatus('再生キューが空です。');
    return;
  }
  lastExpectedIds = data.expectedIds.slice();
  if (audioPlaying) {
    pendingAudioRefresh = data;
    return;
  }
  pendingAudioRefresh = null;
  buildAudioSuite(data);
}

function applyPendingAudioRefresh() {
  if (!pendingAudioRefresh) return;
  const data = pendingAudioRefresh;
  pendingAudioRefresh = null;
  buildAudioSuite(data);
}
