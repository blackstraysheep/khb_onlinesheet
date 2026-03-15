(function() {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  const TOKEN_PREFIX = CONFIG.TOKEN_PREFIX || 'khb-';
  const TOKEN_LENGTH = Number.isInteger(CONFIG.TOKEN_LENGTH) ? CONFIG.TOKEN_LENGTH : 32;
  const ADMIN_UPSERT_JUDGE_URL = SUPABASE_URL + '/functions/v1/admin-upsert-judge';
  const ADMIN_LIST_JUDGE_TOKENS_URL = SUPABASE_URL + '/functions/v1/admin-list-judge-tokens';
  const ADMIN_SET_MATCH_JUDGES_URL = SUPABASE_URL + '/functions/v1/admin-set-match-judges';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  const $ = (s) => document.querySelector(s);
  let allJudges = [];
  let allMatches = [];
  let allExpectedJudges = [];
  let allTokens = [];
  let allVenues = [];
  let tokenStatus = { text: '管理用シークレットを入力するとTOKENを表示できます。', type: 'warn' };

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

  async function fetchJudgeTokens(secret) {
    if (!secret) {
      tokenStatus = { text: '管理用シークレットを入力するとTOKENを表示できます。', type: 'warn' };
      return [];
    }

    const res = await fetch(ADMIN_LIST_JUDGE_TOKENS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ admin_secret: secret }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || res.statusText || 'failed to fetch judge tokens');
    }
    tokenStatus = { text: `TOKENを表示中 (${(data.tokens || []).length}件)`, type: 'ok' };
    return data.tokens ?? [];
  }

  function resetJudgeForm() {
    $('#judgeId').value = '';
    $('#judgeName').value = '';
    $('#voiceKey').value = '';
    $('#judgeFormHint').textContent = '一覧の「編集」で既存審査員の情報を読み込めます。';
  }

  function loadJudgeForEdit(judge) {
    $('#judgeId').value = judge.id || '';
    $('#judgeName').value = judge.name || '';
    $('#voiceKey').value = judge.voice_key || '';
    $('#judgeFormHint').textContent = `編集中: ${judge.name}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveJudge() {
    const secret = $('#adminSecret').value.trim();
    const judgeId = $('#judgeId').value.trim();
    const judgeNameInput = $('#judgeName');
    const voiceKeyInput = $('#voiceKey');
    const name = judgeNameInput.value.trim();
    const voiceKey = voiceKeyInput.value.trim();

    if (!secret) return showMsg('#addMsg', '管理用シークレットを入力', 'err');
    if (!name) return showMsg('#addMsg', '審査員名を入力', 'err');

    try {
      const res = await fetch(ADMIN_UPSERT_JUDGE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          judge_id: judgeId || undefined,
          name,
          voice_key: voiceKey || null,
          token_prefix: TOKEN_PREFIX,
          token_length: TOKEN_LENGTH,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg('#addMsg', data.error || res.statusText, 'err');
        return;
      }
      const modeLabel = judgeId ? '更新' : '作成';
      showMsg('#addMsg', `${modeLabel}完了: ${data.judge_name} (TOKEN: ${data.token})`, 'ok');
      resetJudgeForm();
      await refreshAll();
    } catch (e) {
      showMsg('#addMsg', e.message, 'err');
    }
  }

  async function refreshAll() {
    try {
      const secret = $('#adminSecret').value.trim();
      let tokensResult;
      try {
        tokensResult = await fetchJudgeTokens(secret);
      } catch (tokenError) {
        tokenStatus = { text: `TOKEN取得失敗: ${tokenError.message}`, type: 'err' };
        tokensResult = [];
      }

      const [judges, matches, expectedJudges, venues] = await Promise.all([
        fetchJson('judges', { select: 'id,name,voice_key', order: 'name.asc' }),
        fetchJson('matches', { select: 'id,code,name,timeline,num_bouts,venue_id', order: 'timeline.asc,code.asc' }),
        fetchJson('expected_judges', { select: 'match_id,judge_id' }),
        fetchJson('venues', { select: 'id,code' }),
      ]);
      allJudges = judges;
      allMatches = matches;
      allExpectedJudges = expectedJudges;
      allTokens = tokensResult;
      allVenues = venues;
      renderJudgeList();
      renderMatchSelect();
      renderMatchJudgeList();
      showMsg('#judgeListMsg', tokenStatus.text, tokenStatus.type);
    } catch (e) {
      console.error('refreshAll error', e);
      showMsg('#judgeListMsg', '一覧取得に失敗しました: ' + e.message, 'err');
    }
  }

  function renderJudgeList() {
    const tokenByJudge = new Map();
    for (const t of allTokens) tokenByJudge.set(String(t.judge_id), t.token);

    const matchesByJudge = new Map();
    const matchById = new Map(allMatches.map(m => [m.id, m]));
    for (const ej of allExpectedJudges) {
      const judgeId = String(ej.judge_id);
      if (!matchesByJudge.has(judgeId)) matchesByJudge.set(judgeId, []);
      const m = matchById.get(ej.match_id);
      if (m) matchesByJudge.get(judgeId).push(m);
    }
    for (const [, matches] of matchesByJudge) {
      matches.sort((a, b) => (a.timeline ?? 0) - (b.timeline ?? 0));
    }

    const tbody = $('#judgeListBody');
    tbody.innerHTML = '';
    for (const j of allJudges) {
      const token = tokenByJudge.get(String(j.id)) || (allTokens.length ? '-' : '非表示');
      const assigned = matchesByJudge.get(String(j.id)) || [];
      const assignedStr = assigned.map(m => `${esc(m.code)}(TL${m.timeline})`).join(', ') || '-';

      const tlGroups = new Map();
      for (const m of assigned) {
        const tl = m.timeline;
        if (!tlGroups.has(tl)) tlGroups.set(tl, []);
        tlGroups.get(tl).push(m.code);
      }
      let conflictHtml = '';
      for (const [tl, codes] of tlGroups) {
        if (codes.length > 1) {
          conflictHtml += ` <span class="tag tag-warn">TL${tl}重複: ${codes.join(',')}</span>`;
        }
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(j.name)}</td>
        <td>${esc(j.voice_key || '')}</td>
        <td><span class="token-text">${esc(token)}</span></td>
        <td>${assignedStr}${conflictHtml}</td>
        <td><span class="link" data-judge-id="${esc(j.id)}">編集</span></td>
      `;
      tr.querySelector('.link').addEventListener('click', () => loadJudgeForEdit(j));
      tbody.appendChild(tr);
    }
  }

  function renderMatchJudgeList() {
    const judgeById = new Map(allJudges.map(j => [j.id, j]));
    const tbody = $('#matchJudgeListBody');
    tbody.innerHTML = '';
    for (const m of allMatches) {
      const judges = allExpectedJudges
        .filter(e => e.match_id === m.id)
        .map(e => judgeById.get(e.judge_id))
        .filter(Boolean)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.timeline ?? '-'}</td>
        <td>${esc(m.code)}</td>
        <td>${esc(m.name || '')}</td>
        <td>${judges.length ? judges.map(j => esc(j.name)).join(', ') : '<span class="text-muted">未設定</span>'}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  const assignMatchSelect = $('#assignMatch');
  const assignCheckboxes = $('#assignCheckboxes');
  let selectedMatchId = null;
  let selectedMatchTimeline = null;

  function renderMatchSelect() {
    const previousValue = assignMatchSelect.value;
    assignMatchSelect.innerHTML = '<option value="">-- 試合を選択 --</option>';
    for (const m of allMatches) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `[TL${m.timeline}] ${m.code} - ${m.name}`;
      assignMatchSelect.appendChild(opt);
    }
    if (previousValue && allMatches.some(m => String(m.id) === String(previousValue))) {
      assignMatchSelect.value = previousValue;
      loadAssignForMatch();
    }
  }

  assignMatchSelect.addEventListener('change', loadAssignForMatch);

  function loadAssignForMatch() {
    selectedMatchId = assignMatchSelect.value;
    if (!selectedMatchId) {
      assignCheckboxes.innerHTML = '';
      $('#assignConflictWarn').textContent = '';
      return;
    }
    const match = allMatches.find(m => String(m.id) === String(selectedMatchId));
    selectedMatchTimeline = match?.timeline;
    const assigned = new Set(
      allExpectedJudges
        .filter(e => String(e.match_id) === String(selectedMatchId))
        .map(e => String(e.judge_id))
    );

    assignCheckboxes.innerHTML = '';
    for (const j of allJudges) {
      const lbl = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = j.id;
      cb.checked = assigned.has(String(j.id));
      cb.addEventListener('change', checkConflicts);
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(' ' + j.name));
      assignCheckboxes.appendChild(lbl);
    }
    checkConflicts();
  }

  function checkConflicts() {
    if (!selectedMatchId || selectedMatchTimeline == null) return;
    const warn = $('#assignConflictWarn');
    const checkedIds = new Set(Array.from(assignCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value));

    const sameTimelineMatches = allMatches.filter(m => m.timeline === selectedMatchTimeline && String(m.id) !== String(selectedMatchId));
    const conflicts = [];
    for (const m of sameTimelineMatches) {
      const judgesInMatch = allExpectedJudges.filter(e => String(e.match_id) === String(m.id)).map(e => String(e.judge_id));
      for (const jid of judgesInMatch) {
        if (checkedIds.has(jid)) {
          const j = allJudges.find(x => String(x.id) === jid);
          conflicts.push(`${j?.name || jid} → ${m.code}`);
        }
      }
    }

    warn.textContent = conflicts.length > 0 ? '⚠ 同一タイムライン重複: ' + conflicts.join(', ') : '';
  }

  $('#btnSaveAssign').addEventListener('click', async () => {
    if (!selectedMatchId) return showMsg('#assignMsg', '試合を選択してください', 'err');
    const secret = $('#adminSecret').value.trim();
    if (!secret) return showMsg('#assignMsg', '管理用シークレットを入力', 'err');

    const match = allMatches.find(m => String(m.id) === String(selectedMatchId));
    if (!match) return;

    const judgeIds = Array.from(assignCheckboxes.querySelectorAll('input:checked')).map(cb => cb.value).filter(Boolean);
    if (!judgeIds.length) {
      return showMsg('#assignMsg', '審査員を1名以上選択してください', 'err');
    }

    const venue = allVenues.find(v => v.id === match.venue_id);
    const venueCode = venue ? venue.code : 'default';

    try {
      const res = await fetch(ADMIN_SET_MATCH_JUDGES_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          venue_code: venueCode,
          match_code: match.code,
          match_name: match.name,
          timeline: match.timeline,
          num_bouts: match.num_bouts,
          judge_ids: judgeIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg('#assignMsg', data.error || res.statusText, 'err');
        return;
      }
      showMsg('#assignMsg', `アサイン保存完了 (${judgeIds.length}名)`, 'ok');
      await refreshAll();
    } catch (e) {
      showMsg('#assignMsg', e.message, 'err');
    }
  });

  function showMsg(sel, text, type) {
    const el = $(sel);
    el.textContent = text;
    el.className = 'msg';
    if (type === 'ok') el.classList.add('ok');
    if (type === 'warn') el.classList.add('warn');
    if (type === 'err') el.classList.add('err');
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  $('#btnSaveJudge').addEventListener('click', saveJudge);
  $('#btnResetJudgeForm').addEventListener('click', resetJudgeForm);
  $('#btnRefresh').addEventListener('click', refreshAll);
  refreshAll();
})();
