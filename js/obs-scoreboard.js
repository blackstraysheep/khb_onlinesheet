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
  const mainCard = document.getElementById('mainCard');
  const scoreboardContainer = document.getElementById('scoreboardContainer');
  const statusBar = document.getElementById('statusBar');

  function setStatus(msg) {
    if (statusBar) statusBar.textContent = msg;
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
      }

      const stateRows = await fetchJson('state', {
        select: 'epoch, current_match_id, accepting, scoreboard_visible',
        venue_id: 'eq.' + currentVenueId,
      });
      const st = stateRows[0];
      if (!st || !st.current_match_id) {
        setStatus('No active match set in state.');
        if (mainCard) mainCard.style.opacity = '0';
        return;
      }

      if (mainCard) mainCard.style.opacity = st.scoreboard_visible ? '1' : '0';
      setStatus(`Active: match=${st.current_match_id}, epoch=${st.epoch}`);

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
  });

  updateScoreboard();
  setInterval(updateScoreboard, 1000);
})();
