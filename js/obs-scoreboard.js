(function () {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  let currentVenueId = null;
  let currentMatchId = null;
  let realtimeClient = null;
  let stateChannel = null;
  let matchChannel = null;
  let realtimeStarted = false;
  let realtimeAvailable = false;
  let updateTimer = null;
  let lastFallbackPollAt = 0;
  const mainCard = document.getElementById('mainCard');
  const scoreboardContainer = document.getElementById('scoreboardContainer');
  const statusBar = document.getElementById('statusBar');

  function setStatus(msg) {
    if (statusBar) statusBar.textContent = msg;
  }

  function scheduleUpdate(delayMs = 120) {
    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(updateScoreboard, delayMs);
  }

  function buildRestUrl(path, params) {
    const url = new URL(SUPABASE_URL + '/rest/v1/' + path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
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

  function createRealtimeClient() {
    const supabaseFactory = window.supabase && window.supabase.createClient;
    if (!supabaseFactory) return null;
    return supabaseFactory(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  function handleRealtimeStatus(name, status, err) {
    if (status === 'SUBSCRIBED') {
      realtimeAvailable = true;
      return;
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      console.warn(`Realtime ${name} status:`, status, err || '');
      realtimeAvailable = false;
    }
  }

  function startStateRealtime() {
    if (realtimeStarted || !currentVenueId) return;
    realtimeStarted = true;
    realtimeClient = createRealtimeClient();
    if (!realtimeClient) {
      setStatus('Realtime unavailable; polling fallback active.');
      return;
    }

    stateChannel = realtimeClient
      .channel(`obs-state-${currentVenueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'state',
        filter: `venue_id=eq.${currentVenueId}`,
      }, () => scheduleUpdate())
      .subscribe((status, err) => handleRealtimeStatus('state', status, err));
  }

  function refreshMatchRealtime(matchId) {
    if (!realtimeClient || !matchId || currentMatchId === matchId) return;
    currentMatchId = matchId;

    if (matchChannel) {
      realtimeClient.removeChannel(matchChannel);
      matchChannel = null;
    }

    matchChannel = realtimeClient
      .channel(`obs-match-${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions',
        filter: `match_id=eq.${matchId}`,
      }, () => scheduleUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expected_judges',
        filter: `match_id=eq.${matchId}`,
      }, () => scheduleUpdate())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      }, () => scheduleUpdate())
      .subscribe((status, err) => handleRealtimeStatus('match', status, err));
  }

  function clearMatchRealtime() {
    currentMatchId = null;
    if (realtimeClient && matchChannel) {
      realtimeClient.removeChannel(matchChannel);
      matchChannel = null;
    }
  }

  async function updateScoreboard() {
    try {
      const venueCode = new URLSearchParams(window.location.search).get('venue') || 'default';
      if (!currentVenueId) {
        const venueRows = await fetchJson('venues', { select: 'id', code: 'eq.' + venueCode });
        currentVenueId = venueRows[0]?.id || null;
        if (!currentVenueId) {
          setStatus(`venue not found: ${venueCode}`);
          return;
        }
        startStateRealtime();
      }

      const stateRows = await fetchJson('state', {
        select: 'epoch, current_match_id, accepting, scoreboard_visible',
        venue_id: 'eq.' + currentVenueId,
      });
      const st = stateRows[0];
      if (!st || !st.current_match_id) {
        setStatus('No active match set in state.');
        if (mainCard) mainCard.style.opacity = '0';
        clearMatchRealtime();
        return;
      }

      if (mainCard) mainCard.style.opacity = st.scoreboard_visible ? '1' : '0';
      setStatus(`Active: match=${st.current_match_id}, epoch=${st.epoch}`);
      refreshMatchRealtime(st.current_match_id);

      const [matches, expected, subs] = await Promise.all([
        fetchJson('matches', {
          select: 'code,name,red_team_name,white_team_name,num_bouts',
          id: 'eq.' + st.current_match_id,
        }),
        fetchJson('expected_judges', {
          select: 'judge_id, sort_order',
          match_id: 'eq.' + st.current_match_id,
          order: 'sort_order.asc',
        }),
        fetchJson('submissions', {
          select: '*',
          match_id: 'eq.' + st.current_match_id,
          epoch: 'eq.' + st.epoch,
        }),
      ]);

      const match = matches[0];
      if (!match) return;

      const expectedIds = expected.map(r => String(r.judge_id));
      let judgesMap = {};
      if (expectedIds.length) {
        const judgeList = await fetchJson('judges', {
          select: 'id,name',
          id: 'in.(' + expectedIds.join(',') + ')',
        });
        judgesMap = Object.fromEntries(judgeList.map(j => [String(j.id), j.name]));
      }

      const subMap = {};
      subs.forEach(s => { subMap[String(s.judge_id)] = s; });

      let boutLabelForBoard = getBoutLabel(st.epoch, match.num_bouts);
      if (boutLabelForBoard && !boutLabelForBoard.endsWith('戦')) boutLabelForBoard += '戦';

      buildScoreboard(expectedIds, judgesMap, subMap, {
        matchLabel: (match.name || match.code).replace(/　/g, '\n'),
        boutLabelFull: boutLabelForBoard,
        redTeamName: match.red_team_name || '紅',
        whiteTeamName: match.white_team_name || '白',
      }, scoreboardContainer);
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    }
  }

  window.addEventListener('beforeunload', () => {
    if (mainCard) mainCard.style.opacity = '0';
    if (realtimeClient) {
      if (stateChannel) realtimeClient.removeChannel(stateChannel);
      if (matchChannel) realtimeClient.removeChannel(matchChannel);
    }
  });

  updateScoreboard();
  setInterval(() => {
    const now = Date.now();
    const intervalMs = realtimeAvailable ? 15000 : 1000;
    if (now - lastFallbackPollAt < intervalMs) return;
    lastFallbackPollAt = now;
    updateScoreboard();
  }, 1000);
})();
