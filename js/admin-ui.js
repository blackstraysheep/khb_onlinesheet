// ============================
// admin-ui.js — 会場・試合ドロップダウン、審査員並び替え
// ============================

(() => {
const adminUiNamespace = window.KHBAdmin || (window.KHBAdmin = {});
adminUiNamespace.core = adminUiNamespace.core || {};
const adminUiDom = window.KHBAdmin?.dom || {};
const adminUiApi = window.KHBAdmin?.api || {};
const adminUiConstants = window.KHBAdmin?.constants || {};
const adminUiState = window.KHBAdmin?.state || {};
const adminUiCore = adminUiNamespace.core;

async function populateVenues() {
  try {
    const venues = await adminUiApi.fetchJson('venues', { select: 'id,code,name', order: 'code.asc' });
    if (!adminUiDom.venueSelect) return;
    adminUiDom.venueSelect.innerHTML = '';
    if (!venues.length) {
      adminUiDom.venueSelect.innerHTML = '<option value="">-- 会場なし --</option>';
      return;
    }
    venues.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.code;
      opt.dataset.venueId = v.id;
      opt.textContent = v.name ? `${v.code} (${v.name})` : v.code;
      adminUiDom.venueSelect.appendChild(opt);
    });
    adminUiDom.venueSelect.selectedIndex = 0;
    await onVenueChange();
  } catch (err) {
    console.error('populateVenues error', err);
    if (adminUiDom.venueSelect) adminUiDom.venueSelect.innerHTML = '<option value="">-- 読込失敗 --</option>';
  }
}

async function onVenueChange() {
  if (!adminUiDom.venueSelect) return;
  const opt = adminUiDom.venueSelect.selectedOptions[0];
  if (!opt || !opt.value) {
    adminUiState.currentVenueId = null;
    adminUiState.currentVenueCode = null;
    if (adminUiDom.matchSelect) adminUiDom.matchSelect.innerHTML = '<option value="">-- 会場を選択 --</option>';
    return;
  }
  adminUiState.currentVenueCode = opt.value;
  adminUiState.currentVenueId = opt.dataset.venueId || null;
  if (!adminUiState.currentVenueId) {
    const vRows = await adminUiApi.fetchJson('venues', { select: 'id', code: 'eq.' + adminUiState.currentVenueCode });
    if (vRows[0]) adminUiState.currentVenueId = vRows[0].id;
  }
  await populateMatches();
}

async function populateMatches() {
  if (!adminUiDom.matchSelect) return;
  if (!adminUiState.currentVenueId) {
    adminUiDom.matchSelect.innerHTML = '<option value="">-- 会場を選択 --</option>';
    return;
  }
  try {
    const matches = await adminUiApi.fetchJson('matches', {
      select: 'id,code,name,red_team_name,white_team_name,num_bouts,timeline,venue_id',
      venue_id: 'eq.' + adminUiState.currentVenueId,
      order: 'timeline.asc.nullslast,code.asc',
    });
    adminUiState.matchesCache = matches;

    const stateRows = await adminUiApi.fetchJson('state', {
      select: 'epoch,accepting,e3_reached,updated_at,current_match_id',
      venue_id: 'eq.' + adminUiState.currentVenueId,
    });
    const st = stateRows[0] || null;
    adminUiState.lastState = st;

    const previousSelection = adminUiDom.matchSelect.value;
    adminUiDom.matchSelect.innerHTML = '';
    if (!matches.length) {
      adminUiDom.matchSelect.innerHTML = '<option value="">-- 試合なし --</option>';
      return;
    }
    let currentMatchCode = null;
    matches.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.code;
      opt.dataset.matchId = m.id;
      const isCurrent = st && st.current_match_id === m.id;
      opt.textContent = (m.name || m.code) + (isCurrent ? ' ★' : '');
      if (isCurrent) currentMatchCode = m.code;
      adminUiDom.matchSelect.appendChild(opt);
    });

    // ユーザーが手動選択していた場合はその選択を維持
    if (previousSelection && matches.some(m => m.code === previousSelection)) {
      adminUiDom.matchSelect.value = previousSelection;
    } else if (currentMatchCode) {
      adminUiDom.matchSelect.value = currentMatchCode;
    }
    await onMatchChange();
  } catch (err) {
    console.error('populateMatches error', err);
    adminUiDom.matchSelect.innerHTML = '<option value="">-- 読込失敗 --</option>';
  }
}

async function onMatchChange() {
  const matchCode = adminUiDom.matchSelect ? adminUiDom.matchSelect.value : '';
  if (!matchCode) return;
  await adminUiCore.loadData(false);
  await loadJudgeOrder();
}

// ============================
// 審査員の並び替え
// ============================
function getDragAfterElement(container, y) {
  const items = [...container.querySelectorAll('.judge-reorder-item:not(.dragging)')];
  let closest = { offset: Number.POSITIVE_INFINITY, element: null };
  items.forEach(item => {
    const box = item.getBoundingClientRect();
    const offset = y - (box.top + box.height / 2);
    if (offset < 0 && Math.abs(offset) < closest.offset) {
      closest = { offset: Math.abs(offset), element: item };
    }
  });
  return closest.element;
}

async function loadJudgeOrder() {
  if (!adminUiDom.judgeReorderList) return;
  const matchCode = adminUiDom.matchSelect ? adminUiDom.matchSelect.value : '';
  if (!matchCode) {
    adminUiDom.judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(試合を選択してください)</div>';
    return;
  }
  const match = adminUiState.matchesCache.find(m => m.code === matchCode);
  if (!match) {
    adminUiDom.judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(試合が見つかりません)</div>';
    return;
  }
  try {
    const expected = await adminUiApi.fetchJson('expected_judges', {
      select: 'judge_id,sort_order',
      match_id: 'eq.' + match.id,
      order: 'sort_order.asc',
    });
    if (!expected.length) {
      adminUiDom.judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(この試合に期待審査員が設定されていません)</div>';
      return;
    }
    const judgeIds = expected.map(e => String(e.judge_id));
    const judges = await adminUiApi.fetchJson('judges', {
      select: 'id,name',
      id: 'in.(' + judgeIds.join(',') + ')',
    });
    const judgesMap_local = Object.fromEntries(judges.map(j => [String(j.id), j.name || '(名前未設定)']));

    // TL重複検出: 全会場横断で同一タイムラインの他試合を検索
    const currentTimeline = match.timeline;
    let tlConflicts = {}; // judgeId -> [conflicting match codes]
    if (currentTimeline != null) {
      // 全会場から同じtimelineの他試合を取得
      const sameTimelineMatches = await adminUiApi.fetchJson('matches', {
        select: 'id,code',
        timeline: 'eq.' + currentTimeline,
        id: 'neq.' + match.id,
      });
      if (sameTimelineMatches.length > 0) {
        const allExpected = await adminUiApi.fetchJson('expected_judges', {
          select: 'judge_id,match_id',
          match_id: 'in.(' + sameTimelineMatches.map(m => m.id).join(',') + ')',
        });
        const matchIdToCode = Object.fromEntries(sameTimelineMatches.map(m => [m.id, m.code]));
        allExpected.forEach(e => {
          const jid = String(e.judge_id);
          if (judgeIds.includes(jid)) {
            if (!tlConflicts[jid]) tlConflicts[jid] = [];
            tlConflicts[jid].push(matchIdToCode[e.match_id] || e.match_id);
          }
        });
      }
    }

    adminUiDom.judgeReorderList.innerHTML = '';
    judgeIds.forEach(jid => {
      const div = document.createElement('div');
      div.className = 'judge-reorder-item';
      div.dataset.judgeId = jid;
      div.draggable = true;
      const nameSpan = document.createElement('span');
      nameSpan.textContent = judgesMap_local[jid] || jid;
      div.appendChild(nameSpan);
      if (tlConflicts[jid]) {
        const badge = document.createElement('span');
        badge.className = 'tag tag-warn';
        badge.textContent = `TL${currentTimeline}重複: ${tlConflicts[jid].join(',')}`;
        div.appendChild(badge);
      }
      div.addEventListener('dragstart', e => {
        div.classList.add('dragging');
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      div.addEventListener('dragend', () => div.classList.remove('dragging'));
      adminUiDom.judgeReorderList.appendChild(div);
    });

    if (!adminUiDom.judgeReorderList._dndInitialized) {
      adminUiDom.judgeReorderList.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = adminUiDom.judgeReorderList.querySelector('.judge-reorder-item.dragging');
        if (!dragging) return;
        const afterElement = getDragAfterElement(adminUiDom.judgeReorderList, e.clientY);
        if (afterElement == null) adminUiDom.judgeReorderList.appendChild(dragging);
        else adminUiDom.judgeReorderList.insertBefore(dragging, afterElement);
      });
      adminUiDom.judgeReorderList._dndInitialized = true;
    }
    setJudgeReorderStatus('');
  } catch (err) {
    console.error('loadJudgeOrder error', err);
    adminUiDom.judgeReorderList.innerHTML = '<div class="small" style="color:#aaa;">(読込失敗)</div>';
  }
}

function setJudgeReorderStatus(text, type) {
  if (!adminUiDom.judgeReorderStatus) return;
  adminUiDom.judgeReorderStatus.textContent = text || '';
  adminUiDom.judgeReorderStatus.className = 'msg';
  if (type === 'ok')   adminUiDom.judgeReorderStatus.classList.add('ok');
  if (type === 'warn') adminUiDom.judgeReorderStatus.classList.add('warn');
  if (type === 'err')  adminUiDom.judgeReorderStatus.classList.add('err');
}

async function saveJudgeOrder() {
  const matchCode = adminUiDom.matchSelect ? adminUiDom.matchSelect.value : '';
  if (!matchCode) {
    setJudgeReorderStatus('試合が選択されていません。', 'err');
    return;
  }
  const adminSec = adminUiDom.adminSecretInput ? adminUiDom.adminSecretInput.value.trim() : '';
  if (!adminSec) {
    setJudgeReorderStatus('管理用シークレットを入力してください。', 'err');
    return;
  }
  const items = adminUiDom.judgeReorderList ? [...adminUiDom.judgeReorderList.querySelectorAll('.judge-reorder-item')] : [];
  const judgeIds = items.map(el => el.dataset.judgeId).filter(Boolean);
  if (!judgeIds.length) {
    setJudgeReorderStatus('並び替える審査員がいません。', 'err');
    return;
  }
  try {
    setJudgeReorderStatus('保存中…');
    await adminUiApi.callControlFunction(adminUiConstants.ADMIN_SET_MATCH_JUDGES_URL, {
      admin_secret: adminSec,
      venue_code: adminUiState.currentVenueCode || 'default',
      match_code: matchCode,
      judge_ids: judgeIds,
    });
    setJudgeReorderStatus('並び順を保存しました。', 'ok');
    await adminUiCore.loadData(false);
  } catch (err) {
    console.error('saveJudgeOrder error', err);
    setJudgeReorderStatus('保存に失敗しました: ' + (err.message || String(err)), 'err');
  }
}

window.KHBAdmin.ui = Object.assign(window.KHBAdmin.ui || {}, {
  populateVenues,
  onVenueChange,
  populateMatches,
  onMatchChange,
  loadJudgeOrder,
  saveJudgeOrder,
  setJudgeReorderStatus,
});
})();
