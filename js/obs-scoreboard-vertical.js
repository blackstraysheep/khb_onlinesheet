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

  async function fetchJson(tableName, params) {
    let url = `${SUPABASE_URL}/rest/v1/${tableName}`;
    const queryParams = [];
    if (params) {
      for (const key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key)) {
          queryParams.push(`${key}=${params[key]}`);
        }
      }
    }
    if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch ${tableName}: ${res.status} ${res.statusText} - ${errorText}`);
    }
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

      let boutLabelForBoard = typeof getBoutLabel === 'function' ? getBoutLabel(st.epoch, match.num_bouts) : `第${st.epoch}戦`;
      if (boutLabelForBoard && !boutLabelForBoard.endsWith('戦') && !boutLabelForBoard.includes('対戦')) {
        boutLabelForBoard += '戦';
      }

      buildVerticalScoreboard(expectedIds, judgesMap, subMap, {
        matchLabel: (match.name || match.code || '').replace(/　/g, '\n'),
        boutLabelFull: boutLabelForBoard,
        redTeamName: match.red_team_name || '紅',
        whiteTeamName: match.white_team_name || '白',
      }, scoreboardContainer, { multilineMatchLabel: true });
    } catch (err) {
      console.error('Update Error:', err);
      setStatus('Error: ' + err.message);
    }
  }

  window.addEventListener('beforeunload', () => {
    if (mainCard) mainCard.style.opacity = '0';
  });

  updateScoreboard();
  setInterval(updateScoreboard, 1000);
})();
