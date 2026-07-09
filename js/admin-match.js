(function() {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  const TOKEN_PREFIX = CONFIG.TOKEN_PREFIX || 'khb-';
  const TOKEN_LENGTH = Number.isInteger(CONFIG.TOKEN_LENGTH) ? CONFIG.TOKEN_LENGTH : 32;
  const ADMIN_SETUP_MATCH_URL = SUPABASE_URL + '/functions/v1/admin-setup-match';
  const ADMIN_LIST_MATCHES_URL = SUPABASE_URL + '/functions/v1/admin-list-matches';
  const ADMIN_SELECT_URL = SUPABASE_URL + '/functions/v1/admin-select';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  const $ = (s) => document.querySelector(s);
  let allVenues = [];
  // venue_id(string) -> kuawase_candidates row（候補データが無い venue はキーが存在しない）
  let candidatesByVenueId = new Map();

  // admin-select 経由でテーブルを読む（admin_secret 保護下・kuawase_candidates は allowlist 済み）
  async function fetchViaAdminSelect(table, params = {}) {
    const secret = $('#adminSecret').value.trim();
    if (!secret) throw new Error('管理用シークレットを入力してください');
    const res = await fetch(ADMIN_SELECT_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ admin_secret: secret, table, params }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || res.statusText || `GET ${table} failed`);
    }
    return data.data || [];
  }

  // 候補データ（kuawase_candidates）を venue 単位で読み込む。
  // 候補データが存在しない/シークレット未入力の場合は空 map のまま（=常に手入力にフォールバック）。
  async function refreshCandidates() {
    try {
      const secret = $('#adminSecret').value.trim();
      if (!secret) {
        candidatesByVenueId = new Map();
        return;
      }
      const rows = await fetchViaAdminSelect('kuawase_candidates', { select: '*' });
      candidatesByVenueId = new Map(rows.map((r) => [String(r.venue_id), r]));
    } catch (e) {
      console.error('refreshCandidates error', e);
      candidatesByVenueId = new Map();
    }
  }

  function getVenueIdByCode(code) {
    const v = allVenues.find((v) => v.code === code);
    return v ? v.id : null;
  }

  function currentCandidate() {
    const code = $('#venueCode').value.trim() || 'default';
    const venueId = getVenueIdByCode(code);
    if (!venueId) return null;
    return candidatesByVenueId.get(String(venueId)) || null;
  }

  function populateSelect(selectEl, items) {
    const previousValue = selectEl.value;
    selectEl.innerHTML = '<option value="">-- 選択 --</option>';
    for (const item of items || []) {
      const opt = document.createElement('option');
      opt.value = item.cell;
      opt.dataset.name = item.name;
      opt.textContent = item.name;
      selectEl.appendChild(opt);
    }
    if (previousValue && Array.from(selectEl.options).some((o) => o.value === previousValue)) {
      selectEl.value = previousValue;
    }
  }

  function toggleWrap(selectWrapSel, inputWrapSel, useSelect) {
    $(selectWrapSel).classList.toggle('hidden', !useSelect);
    $(inputWrapSel).classList.toggle('hidden', useSelect);
  }

  // 選択中 venue の候補データの有無に応じて、紅白チーム・兼題の入力欄を
  // プルダウン(候補選択式)/テキスト入力(手入力)のどちらにするか切り替える。
  // 候補データが無い venue では常にテキスト入力（OES 単独使用と完全互換）。
  function updateCandidatePanel() {
    const cand = currentCandidate();
    const manual = $('#manualEntryToggle').checked;
    const infoRow = $('#candidateInfoRow');
    const useSelect = !!cand && !manual;

    if (cand) {
      infoRow.style.display = '';
      $('#candidateInfoMsg').textContent =
        `候補データ: ${cand.compe_name || '(大会名未設定)'} / インポート: ${fmtDateTime(cand.imported_at)}`;
      populateSelect($('#redTeamSelect'), cand.teams);
      populateSelect($('#whiteTeamSelect'), cand.teams);
      populateSelect($('#kendaiSelect'), cand.kendai);
    } else {
      infoRow.style.display = 'none';
      $('#manualEntryToggle').checked = false;
    }

    toggleWrap('#redTeamSelectWrap', '#redTeamInputWrap', useSelect);
    toggleWrap('#whiteTeamSelectWrap', '#whiteTeamInputWrap', useSelect);
    toggleWrap('#kendaiSelectWrap', '#kendaiInputWrap', useSelect);
  }

  function selectOptionByCellOrName(selectEl, cell, name) {
    if (cell) {
      const opt = Array.from(selectEl.options).find((o) => o.value === cell);
      if (opt) {
        selectEl.value = cell;
        return;
      }
    }
    if (name) {
      const opt = Array.from(selectEl.options).find((o) => o.dataset.name === name);
      if (opt) selectEl.value = opt.value;
    }
  }

  function fmtDateTime(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('ja-JP');
    } catch (_e) {
      return iso;
    }
  }

  $('#btnSaveMatch').addEventListener('click', async () => {
    const secret = $('#adminSecret').value.trim();
    const matchCode = $('#matchCode').value.trim();
    const matchName = $('#matchName').value.trim();
    const timeline = parseFloat($('#timeline').value);
    const numBouts = parseInt($('#numBouts').value) || 5;

    if (!secret) return showMsg('#saveMsg', '管理用シークレットを入力', true);
    if (!matchCode) return showMsg('#saveMsg', '試合コードを入力', true);
    if (!matchName) return showMsg('#saveMsg', '試合名を入力', true);
    if (!Number.isFinite(timeline)) return showMsg('#saveMsg', 'タイムラインを入力（数値）', true);

    // 候補データがあり、かつ手入力に切り替えていない場合はプルダウン選択値を使う。
    const cand = currentCandidate();
    const manual = $('#manualEntryToggle').checked;
    const useCandidates = !!cand && !manual;

    let redTeam;
    let whiteTeam;
    let kendaiName;
    let kuawaseRef;

    if (useCandidates) {
      const redOpt = $('#redTeamSelect').selectedOptions[0];
      const whiteOpt = $('#whiteTeamSelect').selectedOptions[0];
      const kendaiOpt = $('#kendaiSelect').selectedOptions[0];
      if (!redOpt || !redOpt.value) return showMsg('#saveMsg', '紅チーム（候補）を選択してください', true);
      if (!whiteOpt || !whiteOpt.value) return showMsg('#saveMsg', '白チーム（候補）を選択してください', true);

      redTeam = redOpt.dataset.name || '';
      whiteTeam = whiteOpt.dataset.name || '';
      kendaiName = (kendaiOpt && kendaiOpt.value) ? (kendaiOpt.dataset.name || '') : '';

      kuawaseRef = {
        red_cell: redOpt.value,
        white_cell: whiteOpt.value,
        excel_hash: cand.excel_hash,
      };
      if (kendaiOpt && kendaiOpt.value) kuawaseRef.kendai_cell = kendaiOpt.value;
    } else {
      redTeam = $('#redTeam').value.trim();
      whiteTeam = $('#whiteTeam').value.trim();
      kendaiName = $('#kendaiName').value.trim();
      // 手入力（または候補データなし）の場合は候補参照を明示的にクリアする。
      kuawaseRef = null;
    }

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
          kendai_name: kendaiName || undefined,
          kuawase_ref: kuawaseRef,
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
      const secret = $('#adminSecret').value.trim();
      if (!secret) {
        showMsg('#saveMsg', '管理用シークレットを入力すると一覧を表示できます。', true);
        return;
      }

      const res = await fetch(ADMIN_LIST_MATCHES_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ admin_secret: secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText || 'failed to fetch matches');
      }

      const matches = data.matches ?? [];
      const states = data.states ?? [];
      const venues = data.venues ?? [];
      const snapshots = data.snapshots ?? [];
      const stateByMatch = new Map();
      for (const s of states) {
        if (s.current_match_id) stateByMatch.set(s.current_match_id, s);
      }

      allVenues = venues;
      await refreshCandidates();
      updateCandidatePanel();
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

      refreshAccepting(states, matches, venueCodeById, snapshots);
    } catch (e) {
      console.error('refreshMatches error', e);
      showMsg('#saveMsg', '一覧取得に失敗しました: ' + e.message, true);
    }
  }

  function refreshAccepting(states, matches, venueCodeById, snapshots = []) {
    const matchById = new Map(matches.map(m => [m.id, m]));
    const tbody = $('#acceptingListBody');
    tbody.innerHTML = '';
    const accepting = states.filter(s => s.accepting);
    if (accepting.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">なし</td></tr>';
      return;
    }

    const confirmedMax = new Map();
    for (const snap of snapshots) {
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
  }

  function loadMatchForEdit(m) {
    const venue = allVenues.find(v => v.id === m.venue_id);
    $('#venueCode').value = venue?.code || 'default';
    $('#matchCode').value = m.code || '';
    $('#matchName').value = m.name || '';
    $('#timeline').value = m.timeline ?? '';
    $('#numBouts').value = m.num_bouts ?? 5;
    $('#redTeam').value = m.red_team_name || '';
    $('#whiteTeam').value = m.white_team_name || '';
    $('#kendaiName').value = m.kendai_name || '';

    // 候補データがある venue でも、この試合が手入力で設定済み（kuawase_ref なし）なら
    // 編集時は手入力モードのまま開く。候補から設定済みなら選択式で開く。
    const cand = candidatesByVenueId.get(String(m.venue_id));
    const hasRef = !!m.kuawase_ref;
    $('#manualEntryToggle').checked = !!cand && !hasRef;
    updateCandidatePanel();

    if (cand && hasRef) {
      selectOptionByCellOrName($('#redTeamSelect'), m.kuawase_ref.red_cell, m.red_team_name);
      selectOptionByCellOrName($('#whiteTeamSelect'), m.kuawase_ref.white_cell, m.white_team_name);
      if (m.kuawase_ref.kendai_cell) {
        selectOptionByCellOrName($('#kendaiSelect'), m.kuawase_ref.kendai_cell, m.kendai_name);
      }
    }

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
  $('#venueCode').addEventListener('input', updateCandidatePanel);
  $('#manualEntryToggle').addEventListener('change', updateCandidatePanel);
  refreshMatches();
})();
