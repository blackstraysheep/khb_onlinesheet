// ============================
// admin-kuawase.js — KHB-Kuawase 連携状態パネル
// ============================
// 参照: docs/02-kuawase-integration-impl.md 「OES 側実装」> admin.html
//
// - kuawase_sync_status は admin-select 経由（RLS はポリシーなしのため
//   anon からは deny。admin_secret 認証済みの admin-select のみが読める）。
// - enabled=false または行が無い venue では折りたたみ「未連携」の1行表示に留め、
//   OES 単独運用の見た目を邪魔しない。
// - 句・試合コードなど kk 由来のテキストは必ず textContent で挿入する。

(() => {
const kuawaseDom = window.KHBAdmin?.dom || {};
const kuawaseApi = window.KHBAdmin?.api || {};
const kuawaseConstants = window.KHBAdmin?.constants || {};
const kuawaseState = window.KHBAdmin?.state || {};

const SLOT_LABELS = {
  1: '先鋒戦',
  2: '次鋒戦',
  3: '中堅戦',
  4: '副将戦',
  5: '大将戦',
};

const STALE_SYNC_MS = 10 * 60 * 1000;

// KHB-Kuawase の slot(1-5)を OES の epoch に変換する。
// 5番勝負: slot = epoch。3番勝負: slot 1,3,5 → epoch 1,2,3。
// 参照: supabase/functions/_shared/bout.ts の slotToEpoch と同一ロジック。
function slotToEpoch(slot, numBouts) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) return null;
  if (numBouts === 5) return slot;
  if (numBouts === 3) {
    const map = { 1: 1, 3: 2, 5: 3 };
    return map[slot] ?? null;
  }
  return null;
}

function hasAdminSecret() {
  return !!(kuawaseDom.adminSecretInput && kuawaseDom.adminSecretInput.value.trim());
}

function setKuawaseMsg(text, type) {
  if (!kuawaseDom.kuawaseStatusMsg) return;
  kuawaseDom.kuawaseStatusMsg.textContent = text || '';
  kuawaseDom.kuawaseStatusMsg.className = 'msg';
  if (type === 'ok')   kuawaseDom.kuawaseStatusMsg.classList.add('ok');
  if (type === 'warn') kuawaseDom.kuawaseStatusMsg.classList.add('warn');
  if (type === 'err')  kuawaseDom.kuawaseStatusMsg.classList.add('err');
}

function renderCollapsed(message) {
  if (kuawaseDom.kuawasePanel) kuawaseDom.kuawasePanel.open = false;
  if (kuawaseDom.kuawaseSummary) kuawaseDom.kuawaseSummary.textContent = `KHB-Kuawase 連携: ${message}`;
  if (kuawaseDom.kuawaseBody) {
    kuawaseDom.kuawaseBody.replaceChildren();
    const placeholder = document.createElement('div');
    placeholder.className = 'small placeholder-muted';
    placeholder.textContent = `(${message})`;
    kuawaseDom.kuawaseBody.appendChild(placeholder);
  }
  if (kuawaseDom.btnKuawaseDisable) kuawaseDom.btnKuawaseDisable.style.display = 'none';
}

function buildRow(...children) {
  const row = document.createElement('div');
  row.className = 'state-summary-row';
  row.append(...children);
  return row;
}

function labeledSpan(label, value) {
  const span = document.createElement('span');
  span.appendChild(document.createTextNode(label + ': '));
  const strong = document.createElement('strong');
  strong.textContent = value ?? '';
  span.appendChild(strong);
  return span;
}

function tagSpan(text, cls) {
  const span = document.createElement('span');
  span.className = `tag ${cls}`;
  span.textContent = text;
  return span;
}

function formatDateTime(iso) {
  if (!iso) return '(なし)';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '(不明)';
  return d.toLocaleString('ja-JP');
}

function computeWarnings(row) {
  const warnings = [];
  const lastView = row.last_view || {};
  const matchCode = typeof lastView.match_code === 'string' ? lastView.match_code : null;
  const slot = Number.isInteger(lastView.slot) ? lastView.slot : null;

  const st = kuawaseState.lastState;
  const currentMatch = st && st.current_match_id
    ? (kuawaseState.matchesCache || []).find(m => m.id === st.current_match_id)
    : null;

  if (matchCode && currentMatch) {
    if (currentMatch.code !== matchCode) {
      warnings.push('kk は別の試合を表示しています。');
    } else if (slot !== null && st && Number.isInteger(st.epoch)) {
      const numBouts = Number(currentMatch.num_bouts || 5);
      const reportedEpoch = slotToEpoch(slot, numBouts);
      if (reportedEpoch !== null && reportedEpoch !== st.epoch) {
        warnings.push('kk の表示対戦と OES の受付対戦がズレています（E5/E6忘れの可能性）。');
      }
    }
  }

  if (row.last_synced_at) {
    const elapsedMs = Date.now() - new Date(row.last_synced_at).getTime();
    if (Number.isFinite(elapsedMs) && elapsedMs > STALE_SYNC_MS) {
      warnings.push('kk から一定時間同期がありません。');
    }
  }

  return warnings;
}

function renderEnabled(row) {
  if (kuawaseDom.kuawasePanel) kuawaseDom.kuawasePanel.open = true;
  if (kuawaseDom.kuawaseSummary) kuawaseDom.kuawaseSummary.textContent = 'KHB-Kuawase 連携: 接続中';
  if (kuawaseDom.btnKuawaseDisable) kuawaseDom.btnKuawaseDisable.style.display = '';

  const lastView = row.last_view || {};
  const matchCode = typeof lastView.match_code === 'string' ? lastView.match_code : null;
  const slot = Number.isInteger(lastView.slot) ? lastView.slot : null;
  const reveal = lastView.reveal || {};

  const rows = [];

  rows.push(buildRow(
    labeledSpan('接続端末', row.source_device_id || '(不明)'),
    labeledSpan('最終同期', formatDateTime(row.last_synced_at)),
  ));

  const slotLabel = slot ? (SLOT_LABELS[slot] || `slot ${slot}`) : '対戦外（TOP表示中）';
  rows.push(buildRow(
    labeledSpan('kk 表示中', matchCode || '(なし)'),
    labeledSpan('対戦', slotLabel),
  ));

  rows.push(buildRow(
    tagSpan(`紅 披講: ${reveal.red ? '済' : '未'}`, reveal.red ? 'ok' : 'muted'),
    tagSpan(`白 披講: ${reveal.white ? '済' : '未'}`, reveal.white ? 'ok' : 'muted'),
  ));

  if (reveal.red || reveal.white) {
    const haikuRow = document.createElement('div');
    haikuRow.className = 'state-summary-row small';
    if (reveal.red) haikuRow.appendChild(labeledSpan('紅の句', reveal.red));
    if (reveal.white) haikuRow.appendChild(labeledSpan('白の句', reveal.white));
    rows.push(haikuRow);
  }

  const warnings = computeWarnings(row);
  if (warnings.length) {
    const warnRow = document.createElement('div');
    warnRow.className = 'state-summary-row';
    warnings.forEach(w => warnRow.appendChild(tagSpan(w, 'warn')));
    rows.push(warnRow);
  }

  if (kuawaseDom.kuawaseBody) kuawaseDom.kuawaseBody.replaceChildren(...rows);
}

async function refreshKuawasePanel() {
  if (!kuawaseDom.kuawaseBody) return;
  if (!hasAdminSecret()) {
    renderCollapsed('管理用シークレットを入力');
    return;
  }
  if (!kuawaseState.currentVenueId) {
    renderCollapsed('会場未選択');
    return;
  }
  try {
    const rows = await kuawaseApi.fetchJson('kuawase_sync_status', {
      select: 'venue_id,enabled,source_device_id,last_view,last_synced_at',
      venue_id: 'eq.' + kuawaseState.currentVenueId,
    });
    const row = rows[0] || null;
    if (!row || !row.enabled) {
      renderCollapsed('未連携');
      return;
    }
    renderEnabled(row);
  } catch (err) {
    console.error('kuawase_sync_status fetch error', err);
    renderCollapsed('取得エラー');
  }
}

async function onClickDisable() {
  const adminSecret = kuawaseDom.adminSecretInput ? kuawaseDom.adminSecretInput.value.trim() : '';
  if (!adminSecret) {
    setKuawaseMsg('管理用シークレットを入力してください。', 'err');
    return;
  }
  if (!kuawaseState.currentVenueCode) {
    setKuawaseMsg('会場を選択してください。', 'err');
    return;
  }
  if (!window.confirm('KHB-Kuawase 連携を解除します。よろしいですか？')) {
    return;
  }
  try {
    setKuawaseMsg('解除中…', '');
    if (kuawaseDom.btnKuawaseDisable) kuawaseDom.btnKuawaseDisable.disabled = true;
    await kuawaseApi.callControlFunction(kuawaseConstants.ADMIN_TOGGLE_KUAWASE_SYNC_URL, {
      admin_secret: adminSecret,
      venue_code: kuawaseState.currentVenueCode,
      enabled: false,
    });
    setKuawaseMsg('連携を解除しました。', 'ok');
    await refreshKuawasePanel();
  } catch (err) {
    console.error('admin-toggle-kuawase-sync error', err);
    setKuawaseMsg('解除に失敗しました: ' + (err.message || String(err)), 'err');
  } finally {
    if (kuawaseDom.btnKuawaseDisable) kuawaseDom.btnKuawaseDisable.disabled = false;
  }
}

if (kuawaseDom.btnKuawaseDisable) {
  kuawaseDom.btnKuawaseDisable.addEventListener('click', onClickDisable);
}

// 既存の自動更新サイクルと同じ間隔で相乗り取得する（試合未選択でも会場が
// 選ばれていれば更新されるよう、独立したタイマーを持つ）。
setInterval(refreshKuawasePanel, kuawaseConstants.ADMIN_AUTO_REFRESH_MS || 2000);
refreshKuawasePanel();

window.KHBAdmin.kuawase = Object.assign(window.KHBAdmin.kuawase || {}, {
  refreshKuawasePanel,
  slotToEpoch,
});
})();
