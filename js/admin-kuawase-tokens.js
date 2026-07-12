// ============================
// admin-kuawase-tokens.js — KHB-Kuawase 連携トークン管理（発行・一覧・失効）
// ============================
// 自己完結モジュール。以下の DOM がある管理ページに読み込むと動く
// （現在は会場・連携設定ページ admin-venues.html）:
//   #adminSecret #kuawaseVenueSelect #kuawaseTokenLabel #kuawaseExpiresHours
//   #btnIssueKuawaseToken #btnRefreshKuawaseTokens
//   #kuawaseIssueMsg #kuawaseIssuedTokenBox #kuawaseTokenListMsg #kuawaseTokenListBody
(function () {
  const CONFIG = window.KHB_APP_CONFIG || {};
  const SUPABASE_URL = CONFIG.SUPABASE_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  const ADMIN_ISSUE_KUAWASE_TOKEN_URL = SUPABASE_URL + '/functions/v1/admin-issue-kuawase-token';
  const ADMIN_LIST_KUAWASE_TOKENS_URL = SUPABASE_URL + '/functions/v1/admin-list-kuawase-tokens';
  const ADMIN_REVOKE_KUAWASE_TOKEN_URL = SUPABASE_URL + '/functions/v1/admin-revoke-kuawase-token';
  const ADMIN_SELECT_URL = SUPABASE_URL + '/functions/v1/admin-select';

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };

  const $ = (s) => document.querySelector(s);
  // このモジュールの必須 DOM が無いページでは何もしない
  if (!$('#kuawaseTokenListBody')) return;

  let allTokens = [];
  let venues = [];

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }

  function fmtDateTime(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString('ja-JP');
    } catch (_e) {
      return iso;
    }
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

  async function refreshVenues() {
    const secret = getSecret();
    if (!secret) return;
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
      if (!res.ok) throw new Error(data.error || res.statusText);
      venues = data.data || [];
      renderVenueSelect();
    } catch (e) {
      console.error('kuawase-tokens: venues fetch error', e);
    }
  }

  function renderVenueSelect() {
    const select = $('#kuawaseVenueSelect');
    if (!select) return;
    const previousValue = select.value;
    select.innerHTML = '';
    for (const v of venues) {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name ? `${v.code} - ${v.name}` : v.code;
      select.appendChild(opt);
    }
    if (previousValue && venues.some((v) => String(v.id) === String(previousValue))) {
      select.value = previousValue;
    }
  }

  function tokenState(t) {
    if (t.revoked_at) return { label: '失効', cls: 'tag-warn' };
    if (t.expires_at && new Date(t.expires_at).getTime() <= Date.now()) return { label: '期限切れ', cls: 'tag-warn' };
    return { label: '有効', cls: '' };
  }

  function renderTokenList() {
    const tbody = $('#kuawaseTokenListBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const t of allTokens) {
      const state = tokenState(t);
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
            <span class="link" data-action="revoke-kuawase-token">失効</span>
          </span>
        </td>
      `;
      const revokeLink = tr.querySelector('[data-action="revoke-kuawase-token"]');
      if (t.revoked_at) {
        revokeLink.classList.add('text-muted');
        revokeLink.style.pointerEvents = 'none';
        revokeLink.textContent = '失効済み';
      } else {
        revokeLink.addEventListener('click', () => revokeToken(t));
      }
      tbody.appendChild(tr);
    }
  }

  async function refreshTokens() {
    const secret = getSecret();
    if (!secret) {
      showMsg('#kuawaseTokenListMsg', '管理用シークレットを入力すると連携トークンを表示できます。', 'warn');
      return;
    }
    try {
      const res = await fetch(ADMIN_LIST_KUAWASE_TOKENS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ admin_secret: secret }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText || 'failed to fetch kuawase tokens');
      allTokens = data.tokens ?? [];
      renderTokenList();
      showMsg('#kuawaseTokenListMsg', `連携トークン一覧を表示中 (${allTokens.length}件)`, 'ok');
    } catch (e) {
      showMsg('#kuawaseTokenListMsg', `連携トークン取得失敗: ${e.message}`, 'err');
    }
  }

  async function issueToken() {
    const secret = getSecret();
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
      showIssuedToken(data);
      await refreshTokens();
    } catch (e) {
      showMsg('#kuawaseIssueMsg', e.message, 'err');
    }
  }

  function showIssuedToken(data) {
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

    const labelInput = $('#kuawaseTokenLabel');
    if (labelInput) labelInput.value = '';
    showMsg('#kuawaseIssueMsg', '', 'ok');
  }

  async function revokeToken(t) {
    const secret = getSecret();
    if (!secret) return showMsg('#kuawaseTokenListMsg', '管理用シークレットを入力', 'err');

    const label = t.label ? `「${t.label}」` : '';
    const ok = window.confirm(`会場 ${t.venue_code || ''} の連携トークン${label}(...${t.token_last4}) を失効します。よろしいですか？`);
    if (!ok) return;

    try {
      const res = await fetch(ADMIN_REVOKE_KUAWASE_TOKEN_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ admin_secret: secret, token_hash: t.token_hash }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showMsg('#kuawaseTokenListMsg', data.error || res.statusText, 'err');
        return;
      }
      showMsg('#kuawaseTokenListMsg', `失効しました (...${t.token_last4})`, 'ok');
      await refreshTokens();
    } catch (e) {
      showMsg('#kuawaseTokenListMsg', e.message, 'err');
    }
  }

  async function refreshAll() {
    await refreshVenues();
    await refreshTokens();
  }

  $('#btnIssueKuawaseToken')?.addEventListener('click', issueToken);
  $('#btnRefreshKuawaseTokens')?.addEventListener('click', refreshAll);

  // 会場カード(admin-venues.js)で会場を保存したら、会場プルダウンにも反映する
  document.addEventListener('khb:venues-updated', refreshVenues);

  // シークレット入力(復元含む)後に一覧を読めるよう、変更時にも更新する
  let reloadTimer = null;
  $('#adminSecret')?.addEventListener('input', () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(refreshAll, 400);
  });

  refreshAll();
})();
