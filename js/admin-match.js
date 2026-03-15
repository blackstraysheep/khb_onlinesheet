(function() {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  const TOKEN_PREFIX = CONFIG.TOKEN_PREFIX || 'khb-';
  const TOKEN_LENGTH = Number.isInteger(CONFIG.TOKEN_LENGTH) ? CONFIG.TOKEN_LENGTH : 32;
  const ADMIN_SETUP_MATCH_URL = SUPABASE_URL + '/functions/v1/admin-setup-match';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  const $ = (s) => document.querySelector(s);

  async function fetchJson(table, params = {}) {
    const url = new URL(SUPABASE_URL + '/rest/v1/' + table);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GET ${table} failed: ${res.status} ${txt}`);
    }
    return res.json();
  }

  $('#btnSaveMatch').addEventListener('click', async () => {
    const secret = $('#adminSecret').value.trim();
    const matchCode = $('#matchCode').value.trim();
    const matchName = $('#matchName').value.trim();
    const timeline = parseFloat($('#timeline').value);
    const numBouts = parseInt($('#numBouts').value) || 5;
    const redTeam = $('#redTeam').value.trim();
    const whiteTeam = $('#whiteTeam').value.trim();

    if (!secret) return showMsg('#saveMsg', '管理用シークレットを入力', true);
    if (!matchCode) return showMsg('#saveMsg', '試合コードを入力', true);
    if (!matchName) return showMsg('#saveMsg', '試合名を入力', true);
    if (!Number.isFinite(timeline)) return showMsg('#saveMsg', 'タイムラインを入力（数値）', true);

    try {
      const res = await fetch(ADMIN_SETUP_MATCH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          venue_code: $('#venueCode').value.trim() || 'default',
          match_code: matchCode,
          match_name: matchName,
          timeline,
          num_bouts: numBouts,
          red_team_name: redTeam || undefined,
          white_team_name: whiteTeam || undefined,
          token_prefix: TOKEN_PREFIX,
          token_length: TOKEN_LENGTH,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      showMsg('#saveMsg', `保存完了: ${data.match?.code}`, false);
      refreshMatches();
    } catch (e) {
      showMsg('#saveMsg', e.message, true);
    }
  });

  async function refreshMatches() {
    try {
      const matches = await fetchJson('matches', {
        select: 'id,code,name,timeline,num_bouts,red_team_name,white_team_name,venue_id',
        order: 'timeline.asc,code.asc',
      });

      const states = await fetchJson('state', {
        select: 'current_match_id,venue_id,epoch,accepting',
      });
      const stateByMatch = new Map();
      for (const s of states) {
        if (s.current_match_id) stateByMatch.set(s.current_match_id, s);
      }

      const venues = await fetchJson('venues', { select: 'id,code' });
      const venueCodeById = new Map(venues.map(v => [v.id, v.code]));

      const tbody = $('#matchListBody');
      tbody.innerHTML = '';
      for (const m of matches) {
        const st = stateByMatch.get(m.id);
        let stateTag = '<span class="tag tag-grey">未開始</span>';
        if (st) {
          stateTag = st.accepting
            ? `<span class="tag tag-green">受付中 (ep${st.epoch})</span>`
            : `<span class="tag tag-red">停止 (ep${st.epoch})</span>`;
        }
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${esc(venueCodeById.get(m.venue_id) || '-')}</td>
          <td>${m.timeline ?? '-'}</td>
          <td>${esc(m.code)}</td>
          <td>${esc(m.name)}</td>
          <td>${esc(m.red_team_name || '')}</td>
          <td>${esc(m.white_team_name || '')}</td>
          <td>${m.num_bouts ?? '-'}</td>
          <td>${stateTag}</td>
          <td><span class="link" data-code="${esc(m.code)}">編集</span></td>
        `;
        tr.querySelector('.link').addEventListener('click', () => loadMatchForEdit(m));
        tbody.appendChild(tr);
      }

      refreshAccepting(states, matches, venueCodeById);
    } catch (e) {
      console.error('refreshMatches error', e);
    }
  }

  function refreshAccepting(states, matches, venueCodeById) {
    const matchById = new Map(matches.map(m => [m.id, m]));
    const tbody = $('#acceptingListBody');
    tbody.innerHTML = '';
    const accepting = states.filter(s => s.accepting);
    if (accepting.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">なし</td></tr>';
      return;
    }

    const acceptingMatchIds = accepting.map(s => s.current_match_id).filter(Boolean);
    fetchJson('match_snapshots', {
      select: 'match_id,epoch',
      match_id: 'in.(' + acceptingMatchIds.join(',') + ')',
    }).then(snaps => {
      const confirmedMax = new Map();
      for (const snap of (snaps || [])) {
        const cur = confirmedMax.get(snap.match_id) ?? 0;
        if (snap.epoch > cur) confirmedMax.set(snap.match_id, snap.epoch);
      }
      for (const s of accepting) {
        const m = matchById.get(s.current_match_id);
        const numBouts = m?.num_bouts ?? 5;
        const maxEp = confirmedMax.get(s.current_match_id) ?? 0;
        const e5Done = maxEp >= numBouts;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${esc(venueCodeById.get(s.venue_id) || s.venue_id)}</td>
          <td>${m?.timeline ?? '-'}</td>
          <td>${esc(m?.code || '-')}</td>
          <td>${esc(m?.name || '-')}</td>
          <td>${esc(m?.red_team_name || '-')}</td>
          <td>${esc(m?.white_team_name || '-')}</td>
          <td>${s.epoch}</td>
          <td>${e5Done ? '<span class="tag tag-green">完了</span>' : '<span class="tag tag-grey">' + maxEp + '/' + numBouts + '</span>'}</td>
        `;
        tbody.appendChild(tr);
      }
    }).catch(err => {
      console.error('match_snapshots fetch error', err);
      for (const s of accepting) {
        const m = matchById.get(s.current_match_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${esc(venueCodeById.get(s.venue_id) || s.venue_id)}</td>
          <td>${m?.timeline ?? '-'}</td>
          <td>${esc(m?.code || '-')}</td>
          <td>${esc(m?.name || '-')}</td>
          <td>${esc(m?.red_team_name || '-')}</td>
          <td>${esc(m?.white_team_name || '-')}</td>
          <td>${s.epoch}</td>
          <td>-</td>
        `;
        tbody.appendChild(tr);
      }
    });
  }

  function loadMatchForEdit(m) {
    $('#matchCode').value = m.code || '';
    $('#matchName').value = m.name || '';
    $('#timeline').value = m.timeline ?? '';
    $('#numBouts').value = m.num_bouts ?? 5;
    $('#redTeam').value = m.red_team_name || '';
    $('#whiteTeam').value = m.white_team_name || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showMsg(sel, text, isErr) {
    const el = $(sel);
    el.textContent = text;
    el.className = 'msg ' + (isErr ? 'err' : 'ok');
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  $('#btnRefreshMatches').addEventListener('click', refreshMatches);
  refreshMatches();
})();
