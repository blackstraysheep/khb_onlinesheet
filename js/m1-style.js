(function () {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

  const POLL_INTERVAL_MS = 1200;
  const STEP_INTERVAL_MS = 1200;
  const FINISH_DELAY_MS = 1600;

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
    activeTimers.forEach(timerId => clearTimeout(timerId));
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
    if (!res.ok) {
      throw new Error(`GET ${path} failed: ${res.status}`);
    }
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

  function resolveFlagTeamName(submission, redTeamName, whiteTeamName) {
    if (!submission) return '判定なし';
    const hasRed = !!submission.red_flag;
    const hasWhite = !!submission.white_flag;

    if (hasRed && !hasWhite) return redTeamName;
    if (hasWhite && !hasRed) return whiteTeamName;
    if (hasRed && hasWhite) return '両チーム';
    return '判定なし';
  }

  function renderRows(entries) {
    if (!revealListEl) return [];
    revealListEl.innerHTML = '';

    const rowElements = entries.map(entry => {
      const row = document.createElement('div');
      row.className = 'm1-row';

      const judgeEl = document.createElement('div');
      judgeEl.className = 'm1-judge';
      judgeEl.textContent = entry.judgeName;

      const teamEl = document.createElement('div');
      teamEl.className = 'm1-team';
      teamEl.textContent = entry.teamName;

      row.appendChild(judgeEl);
      row.appendChild(teamEl);
      revealListEl.appendChild(row);
      return row;
    });

    return rowElements;
  }

  function startRevealSequence(payload) {
    const runId = ++currentRunId;
    clearTimers();

    setViewState('performing');
    setStatus('E5検知: 判定表示を開始します。');

    const rows = renderRows(payload.entries);
    if (!rows.length) {
      setViewState('done');
      setStatus('表示対象の判定がありません。');
      return;
    }

    rows.forEach((row, idx) => {
      schedule(() => {
        if (runId !== currentRunId) return;
        row.classList.add('is-shown', 'is-active');
        if (idx > 0) rows[idx - 1].classList.remove('is-active');
      }, idx * STEP_INTERVAL_MS);
    });

    schedule(() => {
      if (runId !== currentRunId) return;
      rows[rows.length - 1].classList.remove('is-active');
      setViewState('done');
      setStatus('判定表示が完了しました。');
    }, rows.length * STEP_INTERVAL_MS + FINISH_DELAY_MS);
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
    if (!st || !st.current_match_id || !st.epoch) {
      return null;
    }

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
    if (matchLabelEl) {
      matchLabelEl.textContent = `${redTeamName} vs ${whiteTeamName}`;
    }
    if (epochLabelEl) {
      epochLabelEl.textContent = `epoch ${st.epoch}`;
    }

    const expectedIds = expectedRows.map(row => String(row.judge_id));
    let judgesMap = {};
    if (expectedIds.length > 0) {
      const judgeRows = await fetchJson('judges', {
        select: 'id,name',
        id: 'in.(' + expectedIds.join(',') + ')',
      });
      judgesMap = Object.fromEntries(judgeRows.map(row => [String(row.id), row]));
    }

    const subMap = Object.fromEntries(subsRows.map(sub => [String(sub.judge_id), sub]));
    const entries = expectedRows.map(row => {
      const judgeId = String(row.judge_id);
      const sub = subMap[judgeId];
      return {
        judgeName: resolveJudgeName(judgeId, judgesMap),
        teamName: resolveFlagTeamName(sub, redTeamName, whiteTeamName),
      };
    });

    const snapshot = snapshotRows[0] || null;
    const triggerKey = snapshot
      ? `${st.current_match_id}:${st.epoch}:${snapshot.id}:${snapshot.created_at}`
      : null;

    return {
      triggerKey,
      entries,
      state: st,
      match,
    };
  }

  async function pollOnce() {
    try {
      const payload = await collectPayload();
      if (!payload) {
        setViewState('waiting');
        setStatus('試合情報待機中...');
        return;
      }

      if (!payload.triggerKey) {
        setViewState('waiting');
        setStatus('E5の確定を待っています。');
        return;
      }

      if (payload.triggerKey !== lastTriggerKey) {
        lastTriggerKey = payload.triggerKey;
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

