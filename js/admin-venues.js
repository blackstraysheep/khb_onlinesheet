// ============================
// admin-venues.js — 会場の作成・名称変更と一覧表示（admin-venues.html）
// ============================
// 会場は venue 単位のセットアップ(大会前に一度)なので、毎試合触る
// 試合管理ページとは分離してこのページに置く。連携トークン管理
// (admin-kuawase-tokens.js)も同じページに同居する。
(function () {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('設定ファイル(config.js)の読み込みに失敗しました。');
  }

  const ADMIN_UPSERT_VENUE_URL = SUPABASE_URL + '/functions/v1/admin-upsert-venue';
  const ADMIN_SELECT_URL = SUPABASE_URL + '/functions/v1/admin-select';

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  const $ = (s) => document.querySelector(s);

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function showMsg(sel, text, type) {
    const el = $(sel);
    if (!el) return;
    el.textContent = text || '';
    el.className = 'msg' + (type === 'err' ? ' err' : type === 'ok' ? ' ok' : type === 'warn' ? ' warn' : '');
  }

  function getSecret() {
    return $('#adminSecret')?.value.trim() || '';
  }

  async function refreshVenueList() {
    const secret = getSecret();
    if (!secret) {
      showMsg('#venueListMsg', '管理用シークレットを入力すると会場一覧を表示できます。', 'warn');
      return;
    }
    try {
      const res = await fetch(ADMIN_SELECT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          admin_secret: secret,
          table: 'venues',
          params: { select: 'id,code,name', order: 'code.asc' },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || 'failed to fetch venues');
      renderVenueList(data.data || []);
      showMsg('#venueListMsg', '', 'ok');
    } catch (e) {
      showMsg('#venueListMsg', '会場一覧の取得に失敗しました: ' + e.message, 'err');
    }
  }

  function renderVenueList(venues) {
    const tbody = $('#venueListBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!venues.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="table-empty">会場がありません</td></tr>';
      return;
    }
    for (const v of venues) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(v.code)}</td>
        <td>${esc(v.name || '-')}</td>
        <td><span class="link" data-action="edit-venue">編集</span></td>
      `;
      tr.querySelector('[data-action="edit-venue"]').addEventListener('click', () => {
        $('#newVenueCode').value = v.code || '';
        $('#newVenueName').value = v.name || '';
        showMsg('#venueMsg', `会場 ${v.code} を読み込みました（名称を変更して保存できます）`, 'ok');
      });
      tbody.appendChild(tr);
    }
  }

  // 会場の作成・名称変更(state 行もサーバ側で自動作成される)
  $('#btnSaveVenue')?.addEventListener('click', async () => {
    const secret = getSecret();
    const code = $('#newVenueCode').value.trim();
    const name = $('#newVenueName').value.trim();
    if (!secret) return showMsg('#venueMsg', '管理用シークレットを入力', 'err');
    if (!code) return showMsg('#venueMsg', '会場コードを入力（半角英数字・ハイフン・アンダースコア）', 'err');
    if (!name) return showMsg('#venueMsg', '会場名を入力', 'err');

    try {
      const res = await fetch(ADMIN_UPSERT_VENUE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ admin_secret: secret, venue_code: code, venue_name: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || res.statusText);
      showMsg('#venueMsg', `${data.created ? '会場を作成しました' : '会場名を更新しました'}: ${data.venue.code}（${data.venue.name}）`, 'ok');
      await refreshVenueList();
      // 連携トークンカードの会場プルダウンにも新しい会場を反映させる
      document.dispatchEvent(new CustomEvent('khb:venues-updated'));
    } catch (e) {
      showMsg('#venueMsg', '会場の保存に失敗しました: ' + e.message, 'err');
    }
  });

  $('#btnRefreshVenues')?.addEventListener('click', refreshVenueList);

  // シークレット入力(復元含む)後に一覧を読めるよう、変更時にも更新する
  let reloadTimer = null;
  $('#adminSecret')?.addEventListener('input', () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(refreshVenueList, 400);
  });

  refreshVenueList();
})();
