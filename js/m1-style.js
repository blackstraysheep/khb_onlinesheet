(function () {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

  const POLL_INTERVAL_MS = 1200;
  const START_DELAY_MS = 900;
  const STEP_INTERVAL_MS = 1300;
  const FINISH_DELAY_MS = 1200;
  const HIGHLIGHT_ADVANCE_MS = 500;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
  }

  const appEl = document.getElementById('app');
  const matchLabelEl = document.getElementById('matchLabel');
  const epochLabelEl = document.getElementById('epochLabel');
  const phaseLabelEl = document.getElementById('phaseLabel');
  const revealListEl = document.getElementById('revealList');
  const statusTextEl = document.getElementById('statusText');

  let venueId = null;
  let lastTriggerKey = null;
  let lastWaitingEntriesKey = null;
  let currentRunId = 0;
  let activeTimers = [];

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  function setStatus(message) {
    if (statusTextEl) statusTextEl.textContent = message;
  }

  function setViewState(nextState) {
    if (!appEl) return;
    appEl.classList.remove('is-waiting', 'is-performing', 'is-done');
    appEl.classList.add('is-' + nextState);
    if (phaseLabelEl) {
      if (nextState === 'waiting') phaseLabelEl.textContent = 'E5確定待ち';
      if (nextState === 'performing') phaseLabelEl.textContent = '判定発表';
      if (nextState === 'done') phaseLabelEl.textContent = '判定出そろい';
    }
  }

  function clearTimers() {
    activeTimers.forEach((timerId) => clearTimeout(timerId));
    activeTimers = [];
  }

  function schedule(fn, delayMs) {
    const id = setTimeout(fn, delayMs);
    activeTimers.push(id);
  }

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
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }

  async function resolveVenueId() {
    const venueCode = new URLSearchParams(window.location.search).get('venue') || 'default';
    const rows = await fetchJson('venues', { select: 'id', code: 'eq.' + venueCode });
    return rows[0]?.id || null;
  }

  function resolveJudgeName(judgeId, judgesMap) {
    const fallback = String(judgeId).slice(0, 8);
    const judge = judgesMap[String(judgeId)];
    if (!judge) return fallback;
    if (typeof judge === 'string') return judge;
    if (judge.name) return judge.name;
    return fallback;
  }

  function resolveWinner(submission) {
    if (!submission) return 'none';
    const hasRed = !!submission.red_flag;
    const hasWhite = !!submission.white_flag;
    if (hasRed && !hasWhite) return 'red';
    if (hasWhite && !hasRed) return 'white';
    return 'none';
  }

  // 横型スコアボードと同じ席順表示（中央寄せ並び）に合わせる。
  function reorderIdsForScoreboard(ids) {
    const n = ids.length;
    if (n <= 2) return ids.slice();

    const oddIdx = [];
    const evenIdx = [];
    for (let i = 0; i < n; i += 1) {
      if (i % 2 === 1) oddIdx.push(i);
      else evenIdx.push(i);
    }

    oddIdx.reverse();
    const orderIdx = oddIdx.concat(evenIdx);
    const result = [];
    orderIdx.forEach((idx) => {
      if (idx >= 0 && idx < n) result.push(ids[idx]);
    });
    return result;
  }

  function faceToRotation(face) {
    // 回転方向は常に同一（負方向）にし、1回転分を加えて演出を強調する。
    if (face === 'red') return -480;   // 1 + 1/3 回転
    if (face === 'white') return -600; // 1 + 2/3 回転
    return 0;
  }

  function resolveMatchWinner(entries) {
    let red = 0;
    let white = 0;
    (entries || []).forEach((entry) => {
      if (!entry) return;
      if (entry.winner === 'red') red += 1;
      else if (entry.winner === 'white') white += 1;
    });
    if (red > white) return 'red';
    if (white > red) return 'white';
    return 'none';
  }

  function clearWinnerHighlight() {
    if (appEl) {
      appEl.classList.remove('is-win-red', 'is-win-white');
    }
    if (!revealListEl) return;
    revealListEl.querySelectorAll('.m1-pillar').forEach((el) => {
      el.classList.remove('is-win-red', 'is-win-white');
    });
  }

  function applyWinnerHighlight(matchWinner, pillars) {
    clearWinnerHighlight();
    if (matchWinner !== 'red' && matchWinner !== 'white') return;

    if (appEl) appEl.classList.add(matchWinner === 'red' ? 'is-win-red' : 'is-win-white');
    (pillars || []).forEach((p) => {
      if (p.winner === matchWinner) {
        p.pillar.classList.add(matchWinner === 'red' ? 'is-win-red' : 'is-win-white');
      }
    });
  }

  function renderPillars(entries) {
    if (!revealListEl) return [];
    revealListEl.innerHTML = '';

    return entries.map((entry) => {
      const pillar = document.createElement('div');
      pillar.className = 'm1-pillar';

      const core = document.createElement('div');
      core.className = 'm1-pillar-core';
      core.style.transform = 'rotateY(0deg)';

      const judgeFace = document.createElement('div');
      judgeFace.className = 'm1-face m1-face-judge';
      judgeFace.innerHTML = `<span>${entry.judgeName}</span>`;

      const redFace = document.createElement('div');
      redFace.className = 'm1-face m1-face-red';
      redFace.innerHTML = `<span>${entry.redTeamName}</span>`;

      const whiteFace = document.createElement('div');
      whiteFace.className = 'm1-face m1-face-white';
      whiteFace.innerHTML = `<span>${entry.whiteTeamName}</span>`;

      core.appendChild(judgeFace);
      core.appendChild(redFace);
      core.appendChild(whiteFace);
      pillar.appendChild(core);
      revealListEl.appendChild(pillar);

      return { pillar, core, winner: entry.winner };
    });
  }

  function startRevealSequence(payload) {
    const runId = ++currentRunId;
    clearTimers();

    setViewState('performing');
    setStatus('E5検知: 右端から判定表示を開始します。');

    const pillars = renderPillars(payload.entries);
    const matchWinner = resolveMatchWinner(payload.entries);
    if (!pillars.length) {
      setViewState('done');
      setStatus('表示対象の判定がありません。');
      return;
    }

    clearWinnerHighlight();

    const order = [];
    for (let i = pillars.length - 1; i >= 0; i -= 1) order.push(i);

    order.forEach((pillarIndex, step) => {
      schedule(() => {
        if (runId !== currentRunId) return;

        pillars.forEach((p) => p.pillar.classList.remove('is-active'));

        const p = pillars[pillarIndex];
        p.pillar.classList.add('is-active');

        const deg = faceToRotation(p.winner);
        p.core.style.transform = `rotateY(${deg}deg)`;
      }, START_DELAY_MS + step * STEP_INTERVAL_MS);
    });

    const highlightDelay = Math.max(
      START_DELAY_MS,
      START_DELAY_MS + order.length * STEP_INTERVAL_MS - HIGHLIGHT_ADVANCE_MS
    );

    schedule(() => {
      if (runId !== currentRunId) return;
      applyWinnerHighlight(matchWinner, pillars);
    }, highlightDelay);

    schedule(() => {
      if (runId !== currentRunId) return;
      pillars.forEach((p) => p.pillar.classList.remove('is-active'));
      setViewState('done');
      if (matchWinner === 'red') setStatus('判定表示が完了しました。勝利: 紅');
      else if (matchWinner === 'white') setStatus('判定表示が完了しました。勝利: 白');
      else setStatus('判定表示が完了しました。引き分け/判定保留');
    }, START_DELAY_MS + order.length * STEP_INTERVAL_MS + FINISH_DELAY_MS);
  }

  function renderWaitingPillars(payload) {
    const entriesKey = payload && payload.entriesKey ? payload.entriesKey : '';
    if (entriesKey && entriesKey === lastWaitingEntriesKey) return;
    lastWaitingEntriesKey = entriesKey || null;

    const pillars = renderPillars((payload && payload.entries) || []);
    clearWinnerHighlight();
    pillars.forEach((p) => {
      p.pillar.classList.remove('is-active');
      p.core.style.transform = 'rotateY(0deg)';
    });
  }

  async function collectPayload() {
    if (!venueId) {
      venueId = await resolveVenueId();
      if (!venueId) throw new Error('venue not found');
    }

    const stateRows = await fetchJson('state', {
      select: 'epoch,current_match_id',
      venue_id: 'eq.' + venueId,
    });

    const st = stateRows[0];
    if (!st || !st.current_match_id || !st.epoch) return null;

    const [matchRows, expectedRows, subsRows, snapshotRows] = await Promise.all([
      fetchJson('matches', {
        select: 'id,code,name,red_team_name,white_team_name',
        id: 'eq.' + st.current_match_id,
      }),
      fetchJson('expected_judges', {
        select: 'judge_id,sort_order',
        match_id: 'eq.' + st.current_match_id,
        order: 'sort_order.asc',
      }),
      fetchJson('submissions', {
        select: 'judge_id,red_flag,white_flag',
        match_id: 'eq.' + st.current_match_id,
        epoch: 'eq.' + st.epoch,
      }),
      fetchJson('match_snapshots', {
        select: 'id,created_at',
        match_id: 'eq.' + st.current_match_id,
        epoch: 'eq.' + st.epoch,
        order: 'created_at.desc',
        limit: '1',
      }),
    ]);

    const match = matchRows[0];
    if (!match) return null;

    const redTeamName = match.red_team_name || '紅';
    const whiteTeamName = match.white_team_name || '白';

    if (matchLabelEl) matchLabelEl.textContent = `${redTeamName} vs ${whiteTeamName}`;
    if (epochLabelEl) epochLabelEl.textContent = `epoch ${st.epoch}`;

    const expectedIds = expectedRows.map((row) => String(row.judge_id));
    let judgesMap = {};

    if (expectedIds.length > 0) {
      const judgeRows = await fetchJson('judges', {
        select: 'id,name',
        id: 'in.(' + expectedIds.join(',') + ')',
      });
      judgesMap = Object.fromEntries(judgeRows.map((row) => [String(row.id), row]));
    }

    const subMap = Object.fromEntries(subsRows.map((sub) => [String(sub.judge_id), sub]));
    const displayIds = reorderIdsForScoreboard(expectedIds);

    const entries = displayIds.map((judgeId) => {
      const sub = subMap[judgeId];
      return {
        judgeName: resolveJudgeName(judgeId, judgesMap),
        redTeamName,
        whiteTeamName,
        winner: resolveWinner(sub),
      };
    });

    const snapshot = snapshotRows[0] || null;
    const triggerKey = snapshot
      ? `${st.current_match_id}:${st.epoch}:${snapshot.id}:${snapshot.created_at}`
      : null;

    return {
      triggerKey,
      entries,
      entriesKey: `${st.current_match_id}:${st.epoch}:${displayIds.join(',')}`,
    };
  }

  async function pollOnce() {
    try {
      const payload = await collectPayload();

      if (!payload) {
        setViewState('waiting');
        clearWinnerHighlight();
        setStatus('試合情報待機中...');
        return;
      }

      if (!payload.triggerKey) {
        setViewState('waiting');
        renderWaitingPillars(payload);
        setStatus('E5の確定を待っています。');
        return;
      }

      if (payload.triggerKey !== lastTriggerKey) {
        lastTriggerKey = payload.triggerKey;
        lastWaitingEntriesKey = null;
        startRevealSequence(payload);
      }
    } catch (error) {
      console.error(error);
      setStatus('通信エラー: ' + error.message);
    }
  }

  setViewState('waiting');
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
})();
