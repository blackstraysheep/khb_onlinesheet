(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const CONFIG = window.KHB_APP_CONFIG || {};
  const FUNCTION_URL = CONFIG.JUDGE_FUNCTION_URL;
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
  const CONFIG_ERROR = '設定ファイル(config.js)の読み込みに失敗しました。';
  const FLAG_SYMBOL = '◆';

  function parseOrZero(s) {
    if (!s) return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  function hasSelectedValue(el) {
    return !!(el && el.value !== '');
  }

  // DOM要素をキャッシュ
  const redElems = {
    works: $(`.works[data-side="red"]`),
    app: $(`.app[data-side="red"]`),
    total: $(`.total[data-side="red"]`),
    flag: $(`.flag[data-side="red"]`),
  };

  const whiteElems = {
    works: $(`.works[data-side="white"]`),
    app: $(`.app[data-side="white"]`),
    total: $(`.total[data-side="white"]`),
    flag: $(`.flag[data-side="white"]`),
  };

  function getSideElems(side) {
    return side === 'red' ? redElems : whiteElems;
  }

  function updateTotals() {
    ['red', 'white'].forEach(side => {
      const elems = getSideElems(side);
      const w = parseOrZero(elems.works && elems.works.value);
      const a = parseOrZero(elems.app && elems.app.value);
      const total = w + a;
      if (elems.total) elems.total.textContent = String(total);
    });
    updateFlagsAuto();
  }

  function enforceAppExclusion(changedSide) {
    const r = getSideElems('red');
    const w = getSideElems('white');
    const hasPoint = (el) => el && (el.value === '1' || el.value === '2');
    const lockOther = (other) => {
      if (!other) return;
      other.value = '0';
      other.disabled = true;
    };
    const unlock = (el) => {
      if (!el) return;
      el.disabled = false;
    };

    const redHas = hasPoint(r.app);
    const whiteHas = hasPoint(w.app);
    const prefer = changedSide || (redHas ? 'red' : (whiteHas ? 'white' : null));

    if (prefer === 'red') {
      if (redHas) {
        lockOther(w.app);
        unlock(r.app);
      } else {
        unlock(w.app);
      }
    } else if (prefer === 'white') {
      if (whiteHas) {
        lockOther(r.app);
        unlock(w.app);
      } else {
        unlock(r.app);
      }
    } else {
      unlock(r.app);
      unlock(w.app);
    }
  }

  function updateFlagsAuto() {
    const r = getSideElems('red');
    const w = getSideElems('white');
    const rTotal = parseOrZero(r.total && r.total.textContent);
    const wTotal = parseOrZero(w.total && w.total.textContent);

    if (r.flag) r.flag.textContent = '';
    if (w.flag) w.flag.textContent = '';

    if (rTotal > wTotal) {
      if (r.flag) r.flag.textContent = FLAG_SYMBOL;
    } else if (wTotal > rTotal) {
      if (w.flag) w.flag.textContent = FLAG_SYMBOL;
    } else {
      const rWork = parseOrZero(r.works && r.works.value);
      const wWork = parseOrZero(w.works && w.works.value);
      if (rWork > wWork) {
        if (r.flag) r.flag.textContent = FLAG_SYMBOL;
      } else if (wWork > rWork) {
        if (w.flag) w.flag.textContent = FLAG_SYMBOL;
      }
    }
  }

  const submitBtn = $('#submitBtn');
  const result = $('#result');
  let initialSent = false;
  let inEdit = true;
  let editCount = 0;
  let isSubmitting = false;
  let prevBtnLabel = '';
  let currentMatchId = null;
  let currentEpoch = null;
  let hasLoadedSubmission = false;
  let currentMatchComplete = false;

  function setInputsEditable(editable) {
    $$('.ipt').forEach(i => { i.disabled = !editable; });
    document.body.classList.toggle('inputs-locked', !editable);
  }

  function setResult(msg, ok) {
    if (!result) return;
    result.textContent = msg;
    result.classList.toggle('ok', !!ok);
    result.classList.toggle('ng', ok === false);
  }

  function beginLoading(label) {
    if (!submitBtn) return;
    prevBtnLabel = submitBtn.textContent;
    submitBtn.textContent = label || '送信中…';
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
  }

  function endLoading() {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
    submitBtn.textContent = prevBtnLabel || '送信';
  }

  function resetForNewContext() {
    $$('.ipt').forEach(el => {
      el.disabled = false;
      if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
        el.value = '';
      }
    });
    $$('.total').forEach(el => { el.textContent = '0'; });
    $$('.flag').forEach(el => { el.textContent = ''; });
    document.body.classList.remove('inputs-locked');

    initialSent = false;
    inEdit = true;
    editCount = 0;
    hasLoadedSubmission = false;
    currentMatchComplete = false;
    if (submitBtn) submitBtn.textContent = '送信';

    if (result) {
      result.textContent = '';
      result.classList.remove('ok', 'ng');
    }

    enforceAppExclusion();
    updateTotals();
    updateFlagsAuto();
  }

  function applySubmissionFromServer(submission) {
    if (!submission || !submission.red || !submission.white) return;

    const red = getSideElems('red');
    const white = getSideElems('white');
    const toInputValue = (n) => (typeof n === 'number' && Number.isFinite(n)) ? String(n) : '';

    if (red.works) red.works.value = toInputValue(submission.red.work);
    if (red.app) red.app.value = toInputValue(submission.red.app);
    if (white.works) white.works.value = toInputValue(submission.white.work);
    if (white.app) white.app.value = toInputValue(submission.white.app);

    enforceAppExclusion();
    updateTotals();
    updateFlagsAuto();

    initialSent = true;
    inEdit = false;
    editCount = Math.max(0, (submission.revision || 1) - 1);
    setInputsEditable(false);
    if (submitBtn) submitBtn.textContent = '修正する';

    const revMessage = editCount > 0 ? `（サーバ上では修正送信が ${editCount} 回行われています）` : '';
    setResult(`前回送信済みの内容を読み込みました${revMessage}`, true);
  }

  function getToken() {
    const params = new URLSearchParams(location.search);
    return params.get('token') || '';
  }

  async function loadMatchInfo() {
    const token = getToken();
    const labelEl = document.getElementById('match-label');
    if (labelEl) labelEl.classList.remove('text-error');

    const judgeEl = document.querySelector('.judge');
    const midLabelEl = document.getElementById('grid-match-title');
    const boutLabelEl = document.getElementById('match-header');
    if (!labelEl) return;

    if (!FUNCTION_URL || !SUPABASE_ANON_KEY) {
      labelEl.textContent = CONFIG_ERROR;
      labelEl.classList.add('text-error');
      return;
    }

    if (!token) {
      labelEl.textContent = 'URL に token パラメータがありません。';
      labelEl.classList.add('text-error');
      return;
    }

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token, mode: 'info' }),
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok || !data.ok) {
        const msg = data.error || data.message || res.status;
        labelEl.textContent = '対戦情報取得失敗: ' + msg;
        labelEl.classList.add('text-error');
        return;
      }

      const match = data.match || {};
      const epoch = data.epoch;
      const accepting = data.accepting;
      const matchComplete = data.match_complete || false;
      const bout = data.bout || null;
      const judgeName = data.judge_name || null;
      const submission = data.submission || null;
      const venue = data.venue || null;
      const multipleVenues = data.multiple_venues || false;
      const newMatchId = match.id || null;

      if (newMatchId && currentMatchId !== null && currentMatchId !== newMatchId) {
        currentMatchId = newMatchId;
        currentEpoch = (typeof epoch === 'number') ? epoch : null;
        resetForNewContext();
      } else if (currentMatchId === null && newMatchId) {
        currentMatchId = newMatchId;
        currentEpoch = (typeof epoch === 'number') ? epoch : null;
      }

      if (typeof epoch === 'number') {
        if (currentEpoch !== null && currentEpoch !== epoch) {
          currentEpoch = epoch;
          resetForNewContext();
        } else if (currentEpoch === null) {
          currentEpoch = epoch;
        }
      }

      const parts = [];
      if (multipleVenues && venue && venue.name) parts.push(venue.name);
      if (match.name) parts.push(match.name);
      if (bout && bout.label) {
        parts.push(bout.label);
      } else if (typeof epoch === 'number') {
        parts.push(`第${epoch}対戦`);
      }

      if (judgeName && judgeEl) {
        judgeEl.textContent = `審査員名：${judgeName} 先生`;
      }

      const statusEl = document.getElementById('match-status');
      if (statusEl) {
        if (matchComplete) {
          statusEl.textContent = '試合終了（講評中）';
        } else if (accepting === false) {
          statusEl.textContent = '現在は受付停止中です';
        } else {
          statusEl.textContent = '';
        }
      }
      currentMatchComplete = matchComplete;
      labelEl.textContent = parts.join(' ／ ');

      const matchTitle = (match.name && match.name.trim() !== '') ? match.name : (match.code || '試合');
      if (midLabelEl) midLabelEl.textContent = matchTitle;

      const boutTitleCell = document.querySelector('#teams .cell.mid.label');
      if (boutTitleCell) {
        if (bout && bout.label) {
          boutTitleCell.textContent = bout.label;
          boutTitleCell.classList.add('text-ink');
        } else if (typeof epoch === 'number') {
          boutTitleCell.textContent = `第${epoch}対戦`;
        } else {
          boutTitleCell.textContent = '対戦名';
        }
      }

      const redTeamEl = document.getElementById('team-red-name');
      const whiteTeamEl = document.getElementById('team-white-name');
      if (redTeamEl) {
        redTeamEl.textContent = (match.red_team_name && match.red_team_name.trim() !== '') ? match.red_team_name : '紅チーム';
      }
      if (whiteTeamEl) {
        whiteTeamEl.textContent = (match.white_team_name && match.white_team_name.trim() !== '') ? match.white_team_name : '白チーム';
      }

      if (boutLabelEl) {
        const segs = [];
        if (multipleVenues && venue) segs.push(`会場: ${venue.name || ''} (venue_code=${venue.code || ''})`);
        if (match.code || match.name) {
          const matchDisp = match.name || match.code;
          segs.push(`試合: ${matchDisp} (match_code=${match.code || ''})`);
        }
        if (typeof epoch === 'number') {
          const boutDisp = (bout && bout.label) ? bout.label : `第${epoch}対戦`;
          segs.push(`対戦: ${boutDisp} (epoch=${epoch})`);
        }
        if (match.timeline != null) {
          segs.push(`タイムライン: ${match.timeline} (timeline=${match.timeline})`);
        }
        boutLabelEl.textContent = segs.length > 0 ? '［技術情報］' + segs.join(' ／ ') : '';
      }

      if (submission && !hasLoadedSubmission) {
        applySubmissionFromServer(submission);
        hasLoadedSubmission = true;
      }

      if (submitBtn && !isSubmitting) {
        submitBtn.disabled = !!matchComplete;
      }
    } catch (err) {
      console.error('loadMatchInfo error', err);
      labelEl.textContent = '対戦情報の取得中にエラーが発生しました。';
      labelEl.classList.add('text-error');
    }
  }

  async function sendToServer(isEdit) {
    const token = getToken();
    if (!FUNCTION_URL || !SUPABASE_ANON_KEY) {
      setResult(CONFIG_ERROR, false);
      return false;
    }
    if (!token) {
      setResult('URL に token パラメータがありません', false);
      return false;
    }

    const red = getSideElems('red');
    const white = getSideElems('white');
    const payload = {
      red: {
        work: parseOrZero(red.works && red.works.value),
        app: parseOrZero(red.app && red.app.value),
        total: parseOrZero(red.total && red.total.textContent),
        flag: !!(red.flag && red.flag.textContent === FLAG_SYMBOL),
      },
      white: {
        work: parseOrZero(white.works && white.works.value),
        app: parseOrZero(white.app && white.app.value),
        total: parseOrZero(white.total && white.total.textContent),
        flag: !!(white.flag && white.flag.textContent === FLAG_SYMBOL),
      },
      isEdit: !!isEdit,
    };

    if (!hasSelectedValue(red.works) || !hasSelectedValue(white.works)) {
      setResult('作品点を両チームとも選択してください。', false);
      return false;
    }
    if (payload.red.work < 0 || payload.white.work < 0) {
      setResult('作品点は 0 以上で入力してください。', false);
      return false;
    }
    if (payload.red.app < 0 || payload.white.app < 0) {
      setResult('鑑賞点は 0 以上で入力してください。', false);
      return false;
    }
    if (payload.red.app === 0 && payload.white.app === 0) {
      setResult('鑑賞点はいずれかのチームに1点または2点を入れてください。', false);
      return false;
    }

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token, payload }),
      });

      const text = await res.text();

      let data = {};
      try { data = JSON.parse(text); } catch (_) {}

      if (!res.ok || !data.ok) {
        const msg = data.error || data.message || res.status;
        const detail = data.detail ? ` (${data.detail})` : '';
        setResult(`送信失敗: ${msg}${detail}`, false);
        return false;
      }

      return true;
    } catch (err) {
      console.error('sendToServer error', err);
      setResult('送信中にエラーが発生しました。', false);
      return false;
    }
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      if (isSubmitting || currentMatchComplete) return;

      if (!initialSent) {
        isSubmitting = true;
        beginLoading('送信中…');
        const ok = await sendToServer(false);
        endLoading();
        isSubmitting = false;
        if (!ok) return;

        initialSent = true;
        inEdit = false;
        editCount = 0;
        setInputsEditable(false);
        submitBtn.textContent = '修正する';
        setResult('送信成功', true);
        return;
      }

      if (!inEdit) {
        inEdit = true;
        setInputsEditable(true);
        submitBtn.textContent = '修正を送信する';
        setResult('点数を修正して「修正を送信する」を押してください。', null);
        return;
      }

      isSubmitting = true;
      beginLoading('修正送信中…');
      const ok = await sendToServer(true);
      endLoading();
      isSubmitting = false;
      if (!ok) return;

      inEdit = false;
      editCount++;
      setInputsEditable(false);
      submitBtn.textContent = '修正する';
      setResult(`修正送信しました（修正回数: ${editCount}回）`, true);
    });
  }

  function onValueChange(e) {
    const t = e.target;
    if (!t.classList.contains('ipt')) return;

    const side = t.getAttribute('data-side');
    if (t.classList.contains('app')) {
      enforceAppExclusion(side);
    }

    updateTotals();
    if (initialSent && !inEdit) {
      inEdit = true;
      setInputsEditable(true);
      if (submitBtn) submitBtn.textContent = '修正を送信する';
      setResult('点数を修正して「修正を送信する」を押してください。', null);
    }
  }

  $$('.ipt').forEach(el => {
    el.addEventListener('input', onValueChange);
    if (el.tagName === 'SELECT') el.addEventListener('change', onValueChange);
  });

  enforceAppExclusion();
  updateTotals();
  updateFlagsAuto();
  loadMatchInfo();

  setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadMatchInfo();
    }
  }, 5000);
})();
