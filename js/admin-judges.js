(function() {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  const TOKEN_PREFIX = CONFIG.TOKEN_PREFIX || 'khb-';
  const TOKEN_LENGTH = Number.isInteger(CONFIG.TOKEN_LENGTH) ? CONFIG.TOKEN_LENGTH : 32;
  const ADMIN_UPSERT_JUDGE_URL = SUPABASE_URL + '/functions/v1/admin-upsert-judge';
  const ADMIN_LIST_JUDGE_TOKENS_URL = SUPABASE_URL + '/functions/v1/admin-list-judge-tokens';
  const ADMIN_REGENERATE_JUDGE_TOKEN_URL = SUPABASE_URL + '/functions/v1/admin-regenerate-judge-token';
  const ADMIN_SET_MATCH_JUDGES_URL = SUPABASE_URL + '/functions/v1/admin-set-match-judges';
  const ADMIN_SELECT_URL = SUPABASE_URL + '/functions/v1/admin-select';
  const ADMIN_ISSUE_KUAWASE_TOKEN_URL = SUPABASE_URL + '/functions/v1/admin-issue-kuawase-token';
  const ADMIN_LIST_KUAWASE_TOKENS_URL = SUPABASE_URL + '/functions/v1/admin-list-kuawase-tokens';
  const ADMIN_REVOKE_KUAWASE_TOKEN_URL = SUPABASE_URL + '/functions/v1/admin-revoke-kuawase-token';
  const ADMIN_DELETE_JUDGE_URL = SUPABASE_URL + '/functions/v1/admin-delete-judge';

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
  let allKuawaseTokens = [];
  let tokenStatus = { text: '管理用シークレットを入力するとTOKENを表示できます。', type: 'warn' };
  let kuawaseTokenStatus = { text: '管理用シークレットを入力すると連携トークンを表示できます。', type: 'warn' };

  async function fetchJson(table, params = {}) {
    const secret = $('#adminSecret')?.value?.trim() || '';
    if (secret) {
      const res = await fetch(ADMIN_SELECT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          table,
          params: Object.fromEntries(
            Object.entries(params).map(([key, value]) => [key, String(value)])
          ),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText || `GET ${table} failed`);
      }
      return data.data || [];
    }

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
    tokenStatus = { text: `TOKEN状態を表示中 (${(data.tokens || []).length}件)`, type: 'ok' };
    return data.tokens ?? [];
  }

  async function fetchKuawaseTokens(secret) {
    if (!secret) {
      kuawaseTokenStatus = { text: '管理用シークレットを入力すると連携トークンを表示できます。', type: 'warn' };
      return [];
    }

    const res = await fetch(ADMIN_LIST_KUAWASE_TOKENS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ admin_secret: secret }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || res.statusText || 'failed to fetch kuawase tokens');
    }
    kuawaseTokenStatus = { text: `連携トークン一覧を表示中 (${(data.tokens || []).length}件)`, type: 'ok' };
    return data.tokens ?? [];
  }

  function renderKuawaseVenueSelect() {
    const select = $('#kuawaseVenueSelect');
    if (!select) return;
    const previousValue = select.value;
    select.innerHTML = '';
    for (const v of allVenues) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name ? `${v.code} - ${v.name}` : v.code;
      select.appendChild(opt);
    }
    if (previousValue && allVenues.some(v => String(v.id) === String(previousValue))) {
      select.value = previousValue;
    }
  }

  function kuawaseTokenState(t) {
    if (t.revoked_at) return { label: '失効', cls: 'tag-warn' };
    if (t.expires_at && new Date(t.expires_at).getTime() <= Date.now()) return { label: '期限切れ', cls: 'tag-warn' };
    return { label: '有効', cls: '' };
  }

  function fmtDateTime(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('ja-JP');
    } catch (_e) {
      return iso;
    }
  }

  function renderKuawaseTokenList() {
    const tbody = $('#kuawaseTokenListBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const t of allKuawaseTokens) {
      const state = kuawaseTokenState(t);
      const venueLabel = t.venue_name ? `${t.venue_code || ''} - ${t.venue_name}` : (t.venue_code || '-');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="token-text">...${esc(t.token_last4 || '')}</td>
        <td>${esc(t.label || '-')}</td>
        <td>${esc(venueLabel)}</td>
        <td>${esc(fmtDateTime(t.expires_at))}</td>
        <td>${esc(fmtDateTime(t.last_seen_at))}</td>
        <td>${esc(t.device_id || '-')}</td>
        <td><span class="tag ${state.cls}">${state.label}</span></td>
        <td>
          <span class="action-links">
            <span class="link" data-action="revoke-kuawase-token" data-token-hash="${esc(t.token_hash)}">失効</span>
          </span>
        </td>
      `;
      const revokeLink = tr.querySelector('[data-action="revoke-kuawase-token"]');
      if (t.revoked_at) {
        revokeLink.classList.add('text-muted');
        revokeLink.style.pointerEvents = 'none';
        revokeLink.textContent = '失効済み';
      } else {
        revokeLink.addEventListener('click', () => revokeKuawaseToken(t));
      }
      tbody.appendChild(tr);
    }
  }

  async function issueKuawaseToken() {
    const secret = $('#adminSecret').value.trim();
    if (!secret) return showMsg('#kuawaseIssueMsg', '管理用シークレットを入力', 'err');

    const venueId = $('#kuawaseVenueSelect')?.value || '';
    if (!venueId) return showMsg('#kuawaseIssueMsg', '会場を選択してください', 'err');

    const label = $('#kuawaseTokenLabel')?.value.trim() || '';
    const expiresInHoursRaw = $('#kuawaseExpiresHours')?.value.trim() || '';
    const expiresInHours = expiresInHoursRaw ? Number(expiresInHoursRaw) : undefined;

    try {
      const res = await fetch(ADMIN_ISSUE_KUAWASE_TOKEN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          venue_id: venueId,
          label: label || undefined,
          expires_in_hours: expiresInHours,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg('#kuawaseIssueMsg', data.error || res.statusText, 'err');
        return;
      }

      showKuawaseIssuedToken(data);
      await refreshKuawaseTokens();
    } catch (e) {
      showMsg('#kuawaseIssueMsg', e.message, 'err');
    }
  }

  function showKuawaseIssuedToken(data) {
    const box = $('#kuawaseIssuedTokenBox');
    if (!box) return;
    box.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'msg ok';
    wrap.textContent = `発行完了: 会場 ${data.venue_code} / 期限 ${fmtDateTime(data.expires_at)}（このトークンは今だけ表示されます。再表示はできません）`;

    const tokenRow = document.createElement('div');
    tokenRow.className = 'row mb-8';
    const tokenField = document.createElement('input');
    tokenField.type = 'text';
    tokenField.readOnly = true;
    tokenField.value = data.token;
    tokenField.className = 'input-lg token-text';
    tokenField.style.width = '100%';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-blue';
    copyBtn.textContent = 'コピー';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(tokenField.value);
        copyBtn.textContent = 'コピー済み';
        setTimeout(() => { copyBtn.textContent = 'コピー'; }, 1500);
      } catch (_e) {
        tokenField.select();
      }
    });
    tokenRow.appendChild(tokenField);
    tokenRow.appendChild(copyBtn);

    box.appendChild(wrap);
    box.appendChild(tokenRow);

    $('#kuawaseTokenLabel').value = '';
    showMsg('#kuawaseIssueMsg', '', 'ok');
  }

  async function revokeKuawaseToken(t) {
    const secret = $('#adminSecret').value.trim();
    if (!secret) return showMsg('#kuawaseTokenListMsg', '管理用シークレットを入力', 'err');

    const label = t.label ? `「${t.label}」` : '';
    const ok = window.confirm(`会場 ${t.venue_code || ''} の連携トークン${label}(...${t.token_last4}) を失効します。よろしいですか？`);
    if (!ok) return;

    try {
      const res = await fetch(ADMIN_REVOKE_KUAWASE_TOKEN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          token_hash: t.token_hash,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg('#kuawaseTokenListMsg', data.error || res.statusText, 'err');
        return;
      }
      showMsg('#kuawaseTokenListMsg', `失効しました (...${t.token_last4})`, 'ok');
      await refreshKuawaseTokens();
    } catch (e) {
      showMsg('#kuawaseTokenListMsg', e.message, 'err');
    }
  }

  async function refreshKuawaseTokens() {
    try {
      const secret = $('#adminSecret').value.trim();
      allKuawaseTokens = await fetchKuawaseTokens(secret);
      renderKuawaseTokenList();
      showMsg('#kuawaseTokenListMsg', kuawaseTokenStatus.text, kuawaseTokenStatus.type);
    } catch (e) {
      kuawaseTokenStatus = { text: `連携トークン取得失敗: ${e.message}`, type: 'err' };
      showMsg('#kuawaseTokenListMsg', kuawaseTokenStatus.text, 'err');
    }
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
      const tokenText = data.token
        ? `TOKEN: ${data.token}`
        : 'TOKEN: 発行済み（再表示不可）';
      showMsg('#addMsg', `${modeLabel}完了: ${data.judge_name} (${tokenText})`, 'ok');
      resetJudgeForm();
      await refreshAll();
    } catch (e) {
      showMsg('#addMsg', e.message, 'err');
    }
  }

  async function regenerateJudgeToken(judge) {
    const secret = $('#adminSecret').value.trim();
    if (!secret) return showMsg('#judgeListMsg', '管理用シークレットを入力', 'err');

    const ok = window.confirm(`${judge.name} のTOKENを再発行します。古いTOKENは使えなくなります。`);
    if (!ok) return;

    try {
      const res = await fetch(ADMIN_REGENERATE_JUDGE_TOKEN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          judge_id: judge.id,
          token_prefix: TOKEN_PREFIX,
          token_length: TOKEN_LENGTH,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg('#judgeListMsg', data.error || res.statusText, 'err');
        return;
      }

      const judgeUrl = new URL('judge.html', window.location.href);
      judgeUrl.searchParams.set('token', data.token);
      await refreshAll();
      showMsg(
        '#judgeListMsg',
        `TOKEN再発行完了: ${data.judge_name} / TOKEN: ${data.token} / URL: ${judgeUrl.toString()}`,
        'ok'
      );
    } catch (e) {
      showMsg('#judgeListMsg', e.message, 'err');
    }
  }

  // 審査員の削除。試合への割当・送信済み採点がある場合はサーバ側で拒否される。
  async function deleteJudge(judge) {
    const secret = $('#adminSecret').value.trim();
    if (!secret) return showMsg('#judgeListMsg', '管理用シークレットを入力', 'err');

    const ok = window.confirm(`審査員「${judge.name}」を削除します。TOKENも失効します。よろしいですか？`);
    if (!ok) return;

    try {
      const res = await fetch(ADMIN_DELETE_JUDGE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ admin_secret: secret, judge_id: judge.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        if (data.error === 'judge_in_use') {
          const d = data.detail || {};
          showMsg(
            '#judgeListMsg',
            `削除できません: ${judge.name} は使用中です（割当試合 ${d.assigned_matches ?? '?'} 件 / 送信済み採点 ${d.submissions ?? '?'} 件）。試合の割当を外してから削除してください。`,
            'err'
          );
          return;
        }
        showMsg('#judgeListMsg', '削除失敗: ' + (data.error || res.statusText), 'err');
        return;
      }
      await refreshAll();
      showMsg('#judgeListMsg', `審査員「${data.deleted?.judge_name || judge.name}」を削除しました`, 'ok');
    } catch (e) {
      showMsg('#judgeListMsg', '削除に失敗しました: ' + e.message, 'err');
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
        fetchJson('venues', { select: 'id,code,name', order: 'code.asc' }),
      ]);
      allJudges = judges;
      allMatches = matches;
      allExpectedJudges = expectedJudges;
      allTokens = tokensResult;
      allVenues = venues;
      renderJudgeList();
      renderMatchSelect();
      renderMatchJudgeList();
      renderKuawaseVenueSelect();
      showMsg('#judgeListMsg', tokenStatus.text, tokenStatus.type);
      await refreshKuawaseTokens();
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
        <td>
          <span class="action-links">
            <span class="link" data-action="edit" data-judge-id="${esc(j.id)}">編集</span>
            <span class="link" data-action="regenerate-token" data-judge-id="${esc(j.id)}">TOKEN再発行</span>
            <span class="link link-delete" data-action="delete" data-judge-id="${esc(j.id)}">削除</span>
          </span>
        </td>
      `;
      tr.querySelector('[data-action="edit"]').addEventListener('click', () => loadJudgeForEdit(j));
      tr.querySelector('[data-action="regenerate-token"]').addEventListener('click', () => regenerateJudgeToken(j));
      tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteJudge(j));
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
      opt.textContent = `[TL${m.timeline}] ${m.code} - ${String(m.name ?? '').replace(/<br\s*\/?\s*>/gi, '　')}`;
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

    warn.textContent = conflicts.length > 0 ? '同一タイムライン重複: ' + conflicts.join(', ') : '';
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
  $('#btnIssueKuawaseToken')?.addEventListener('click', issueKuawaseToken);
  $('#btnRefreshKuawaseTokens')?.addEventListener('click', refreshKuawaseTokens);
  refreshAll();
})();
