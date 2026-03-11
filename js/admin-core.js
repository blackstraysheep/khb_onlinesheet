// ============================
// admin-core.js — データ読み込み、イベントリスナー、初期化
// ============================

const adminCoreDom = window.KHBAdmin?.dom || {};
const adminCoreApi = window.KHBAdmin?.api || {};
const adminCoreUi = window.KHBAdmin?.ui || {};
const adminCoreAudio = window.KHBAdmin?.audio || {};
const adminCoreConstants = window.KHBAdmin?.constants || {};
const adminCoreHelpers = window.KHBAdmin?.helpers || {};

function setStateSummaryMessage(message) {
  if (!adminCoreDom.stateSummary) return;
  adminCoreDom.stateSummary.replaceChildren();
  const span = document.createElement('span');
  span.className = 'small';
  span.textContent = message || '';
  adminCoreDom.stateSummary.appendChild(span);
}

function appendTextAndStrong(parent, prefix, strongText, suffix = '') {
  parent.appendChild(document.createTextNode(prefix));
  const strong = document.createElement('strong');
  strong.textContent = strongText ?? '';
  parent.appendChild(strong);
  if (suffix) parent.appendChild(document.createTextNode(suffix));
}

function renderStateSummary({ match, boutLabelFull, epoch, st, matchId, expectedCount, submittedCount }) {
  if (!adminCoreDom.stateSummary) return;

  const nodes = [];

  const matchSpan = document.createElement('span');
  appendTextAndStrong(matchSpan, '試合: ', match.code ?? '', ` (${match.name || ''})`);
  nodes.push(matchSpan);

  const boutSpan = document.createElement('span');
  boutSpan.textContent = boutLabelFull
    ? `第${epoch}対戦（${boutLabelFull}）`
    : `第${epoch}対戦`;
  nodes.push(boutSpan);

  if (st) {
    const epochSpan = document.createElement('span');
    appendTextAndStrong(epochSpan, 'state.epoch: ', st.epoch ?? '');
    nodes.push(epochSpan);

    const acceptingTag = document.createElement('span');
    acceptingTag.className = `tag ${st.accepting ? 'ok' : 'danger'}`;
    acceptingTag.textContent = `accepting: ${st.accepting}`;
    nodes.push(acceptingTag);

    const e3Tag = document.createElement('span');
    e3Tag.className = `tag outline ${st.e3_reached ? 'ok' : 'warn'}`;
    e3Tag.textContent = `e3_reached: ${st.e3_reached}`;
    nodes.push(e3Tag);

    const currentMatchTag = document.createElement('span');
    if (st.current_match_id) {
      currentMatchTag.className = st.current_match_id === matchId ? 'tag ok' : 'tag warn';
      currentMatchTag.textContent = st.current_match_id === matchId
        ? 'current_match_id: true'
        : 'current_match_id: false';
    } else {
      currentMatchTag.className = 'tag warn';
      currentMatchTag.textContent = 'current_match_id: 未設定';
    }
    nodes.push(currentMatchTag);
  } else {
    const stateMissingTag = document.createElement('span');
    stateMissingTag.className = 'tag warn';
    stateMissingTag.textContent = 'state が取得できません';
    nodes.push(stateMissingTag);
  }

  const expectedSpan = document.createElement('span');
  appendTextAndStrong(expectedSpan, '期待審査員: ', expectedCount, ' 人');
  nodes.push(expectedSpan);

  const submittedSpan = document.createElement('span');
  appendTextAndStrong(submittedSpan, '提出済み: ', submittedCount, ' 人');
  nodes.push(submittedSpan);

  adminCoreDom.stateSummary.replaceChildren(...nodes);
}

function buildLoadSignature({ match, epoch, st, expectedIds, judgesMap, subs, scoreboardMode }) {
  const normalizedSubs = subs
    .map(s => ({
      judge_id: String(s.judge_id),
      revision: s.revision ?? null,
      red_total: s.red_total ?? null,
      white_total: s.white_total ?? null,
      red_flag: !!s.red_flag,
      white_flag: !!s.white_flag,
    }))
    .sort((a, b) => a.judge_id.localeCompare(b.judge_id));

  const normalizedJudges = Object.entries(judgesMap)
    .map(([judgeId, judge]) => [
      judgeId,
      {
        name: judge?.name ?? '',
        voice_key: judge?.voice_key ?? '',
      },
    ])
    .sort(([a], [b]) => String(a).localeCompare(String(b)));

  return JSON.stringify({
    scoreboardMode,
    match: {
      id: match.id ?? null,
      code: match.code ?? '',
      name: match.name ?? '',
      red_team_name: match.red_team_name ?? '',
      white_team_name: match.white_team_name ?? '',
      num_bouts: match.num_bouts ?? null,
    },
    epoch,
    state: st
      ? {
          epoch: st.epoch ?? null,
          accepting: !!st.accepting,
          e3_reached: !!st.e3_reached,
          current_match_id: st.current_match_id ?? null,
          updated_at: st.updated_at ?? null,
        }
      : null,
    expectedIds: expectedIds.slice(),
    judges: normalizedJudges,
    submissions: normalizedSubs,
  });
}

async function runLoadData(isAuto = false) {
  if (!isAuto) {
    setMsg('読み込み中…', '');
    setControlsDisabled(true);
    if (adminCoreDom.scoreboardContainer) adminCoreDom.scoreboardContainer.innerHTML = '';
    setStateSummaryMessage('読み込み中…');
  }

  const matchCode = matchSelect ? matchSelect.value : '';

  if (!matchCode) {
    if (!isAuto) {
      setMsg('試合を選択してください。', 'err');
      setControlsDisabled(false);
    }
    return;
  }

  try {
    // 1. matches
    const matches = await adminCoreApi.fetchJson('matches', {
      select: 'id,code,name,red_team_name,white_team_name,num_bouts',
      code: 'eq.' + matchCode,
    });

    if (!matches.length) {
      if (!isAuto) {
        setMsg(`matches.code = "${matchCode}" の対戦が見つかりません。`, 'err');
        setStateSummaryMessage('対戦が見つかりません。');
      }
      return;
    }
    const match   = matches[0];
    const matchId = match.id;

    // 2. state（会場別）
    const stateRows = currentVenueId
      ? await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', venue_id: 'eq.' + currentVenueId })
      : [];
    const st  = stateRows[0] || null;
    lastState = st;

    // epoch は state から取得
    const epoch = st ? st.epoch : 1;
    const numBouts = Number(match.num_bouts || 0);
    const boutLabelFull = getBoutLabel(epoch, numBouts);

    // 3-4. expected_judges / submissions は独立しているので並列取得
    const [expected, subs] = await Promise.all([
      adminCoreApi.fetchJson('expected_judges', {
        select: 'judge_id, sort_order',
        match_id: 'eq.' + matchId,
        order: 'sort_order.asc',
      }),
      adminCoreApi.fetchJson('submissions', {
        select: 'judge_id,revision,red_work,red_app,red_total,red_flag,white_work,white_app,white_total,white_flag',
        match_id: 'eq.' + matchId,
        epoch: 'eq.' + epoch,
      }),
    ]);
    const expectedIds = expected.map(r => String(r.judge_id));

    // 5. judges
    let judgesMap = {};
    if (expectedIds.length) {
      const idList = expectedIds.join(',');
      const judges = await adminCoreApi.fetchJson('judges', {
        select: 'id,name,voice_key',
        id: 'in.(' + idList + ')',
      });
      judgesMap = Object.fromEntries(
        judges.map(j => [String(j.id), { name: j.name, voice_key: j.voice_key }])
      );
    }

    const loadSignature = buildLoadSignature({
      match,
      epoch,
      st,
      expectedIds,
      judgesMap,
      subs,
      scoreboardMode,
    });

    if (isAuto && lastRenderedLoadSignature === loadSignature) {
      return;
    }
    lastRenderedLoadSignature = loadSignature;

    // 6. スコアボード描画
    const subMap = {};
    subs.forEach(s => { subMap[String(s.judge_id)] = s; });
    const anomalyJudgeIds = expectedIds.filter(id => adminCoreHelpers.hasUndecidableWinner(subMap[id]));

    const matchLabel = (match.name || match.code).replace(/　/g, '\n');
    const boutLabelForBoard = boutLabelFull || '対戦名';

    const meta = {
      matchLabel:    matchLabel,
      boutLabelFull: boutLabelForBoard,
      redTeamName:   match.red_team_name  || '紅',
      whiteTeamName: match.white_team_name || '白',
      anomalyJudgeIds,
    };

    if (scoreboardMode === 'vertical') {
      buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta);
    } else {
      buildScoreboard_horizontal(expectedIds, judgesMap, subMap, meta);
    }

    // 音声読み上げ
    adminCoreAudio.scheduleAudioRefresh({ match, epoch, boutLabelFull, expectedIds, judgesMap, subMap });

    // 7. 状態サマリ
    const submittedIds  = new Set(subs.map(s => String(s.judge_id)));
    const submittedCount = submittedIds.size;
    const expectedCount  = expectedIds.length;

    if (st) {
      // epoch入力欄を現在値で更新（未入力時のみ）
      if (epochInput && !epochInput.matches(':focus')) {
        epochInput.value = st.epoch;
      }

      if (toggleAcceptingBtn) {
        if (st.accepting) {
          toggleAcceptingBtn.textContent = '受付締切（現在: 受付中）';
          toggleAcceptingBtn.className = 'small-btn btn-red';
        } else {
          toggleAcceptingBtn.textContent = '受付開始（現在: 停止中）';
          toggleAcceptingBtn.className = 'small-btn btn-green';
        }
      }
    } else {
      if (toggleAcceptingBtn) {
        toggleAcceptingBtn.textContent = 'state 不明';
        toggleAcceptingBtn.className = 'small-btn btn-grey';
      }
    }

    renderStateSummary({
      match,
      boutLabelFull,
      epoch,
      st,
      matchId,
      expectedCount,
      submittedCount,
    });

    if (anomalyJudgeIds.length > 0) {
      const anomalyNames = anomalyJudgeIds.map(id => judgesMap[id]?.name || id);
      setMsg(`勝敗判定不能: ${anomalyNames.join(', ')}。勝者音声をスキップしています。`, 'warn');
    } else if (!isAuto) {
      setMsg('読み込み完了', 'ok');
    }

  } catch (err) {
    console.error(err);
    if (!isAuto) {
      setMsg('読み込み中にエラーが発生しました: ' + err.message, 'err');
      setStateSummaryMessage('エラーが発生しました。');
    }
  } finally {
    if (!isAuto) setControlsDisabled(false);
  }
}

async function loadData(isAuto = false) {
  if (isAuto) {
    pendingAutoReload = true;
  } else {
    pendingManualReload = true;
  }

  if (loadDataInFlight && currentLoadPromise) {
    return currentLoadPromise;
  }

  currentLoadPromise = (async () => {
    loadDataInFlight = true;
    try {
      while (pendingManualReload || pendingAutoReload) {
        const runIsAuto = !pendingManualReload;
        pendingManualReload = false;
        pendingAutoReload = false;
        await runLoadData(runIsAuto);
      }
    } finally {
      loadDataInFlight = false;
      currentLoadPromise = null;
    }
  })();

  return currentLoadPromise;
}

// ============================
// イベントリスナー
// ============================

  if (adminCoreDom.toggleAcceptingBtn) {
    adminCoreDom.toggleAcceptingBtn.addEventListener('click', async () => {
    if (!lastState) {
      setE5E6Status('状態が読み込まれていません。', 'err');
      return;
    }
    const nextVal = !lastState.accepting;
    const label = nextVal ? '受付開始' : '受付締切';
    try {
      setE5E6Status(`${label}処理中…`, '');
      setControlsDisabled(true);
      const patch = { accepting: nextVal };
      if (nextVal && lastState.epoch) patch.epoch = lastState.epoch;
      await patchState(patch);
      setE5E6Status(`${label}しました（accepting=${nextVal}）。`, 'ok');
      await loadData();
    } catch (err) {
      console.error(err);
      setE5E6Status(`${label}に失敗しました: ` + err.message, 'err');
      setControlsDisabled(false);
    }
  });
}

if (adminCoreDom.venueSelect) {
  adminCoreDom.venueSelect.addEventListener('change', onVenueChange);
}
if (adminCoreDom.matchSelect) {
  adminCoreDom.matchSelect.addEventListener('change', onMatchChange);
}

if (adminCoreDom.btnStartMatch) {
  adminCoreDom.btnStartMatch.addEventListener('click', async () => {
    const adminSecret = adminCoreDom.adminSecretInput ? adminCoreDom.adminSecretInput.value.trim() : '';
    const matchCode = adminCoreDom.matchSelect ? adminCoreDom.matchSelect.value : '';
    if (!adminSecret) { setMsg('管理用シークレットを入力してください。', 'err'); return; }
    if (!matchCode) { setMsg('試合を選択してください。', 'err'); return; }

    setMsg('現在の試合を設定中…', '');
    try {
      const data = await adminCoreApi.callControlFunction(adminCoreConstants.CONTROL_SET_MATCH_URL, {
        admin_secret: adminSecret,
        venue_code: currentVenueCode || 'default',
        match_code: matchCode,
        epoch: 1,
      });
      let statusMsg = `試合を開始しました: ${data.match?.code || matchCode}, epoch=${data.epoch}`;
      const hasWarnings = data.warnings && data.warnings.length > 0;
      if (hasWarnings) {
        const names = [...new Set(data.warnings.map(w => w.judge_name || w.judge_id))];
        const matches = [...new Set(data.warnings.map(w => w.other_match_name || w.other_match_code))];
        statusMsg += `\n⚠ 警告: ${names.join(', ')} は別の試合 (${matches.join(', ')}) を審査中です`;
      }
      setMsg(statusMsg, hasWarnings ? 'warn' : 'ok');
      await adminCoreUi.populateMatches();
    } catch (err) {
      console.error(err);
      if (err.responseData?.error === 'same_timeline_conflict') {
        const conflicts = err.responseData.conflicts || [];
        const names = [...new Set(conflicts.map(c => c.judge_name || c.judge_id))];
        const matches = [...new Set(conflicts.map(c => c.other_match_name || c.other_match_code))];
        setMsg(
          `試合を開始できません: ${names.join(', ')} が同一タイムラインの試合 (${matches.join(', ')}) を審査中です`,
          'err'
        );
      } else {
        setMsg('試合開始に失敗しました: ' + (err.message || String(err)), 'err');
      }
    }
  });
}

// --- E5 / E6 ---

function setE5E6Status(message, type) {
  if (!adminCoreDom.e5e6StatusEl) return;
  adminCoreDom.e5e6StatusEl.textContent = message;
  adminCoreDom.e5e6StatusEl.className = 'msg';
  if (type === 'ok')   adminCoreDom.e5e6StatusEl.classList.add('ok');
  if (type === 'warn') adminCoreDom.e5e6StatusEl.classList.add('warn');
  if (type === 'err')  adminCoreDom.e5e6StatusEl.classList.add('err');
}

async function onClickE5() {
  const adminSecret = adminCoreDom.adminSecretInput ? adminCoreDom.adminSecretInput.value.trim() : '';
  const matchCode   = adminCoreDom.matchSelect ? adminCoreDom.matchSelect.value : '';

  if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', 'err'); return; }
  if (!matchCode)   { setE5E6Status('試合を選択してください。', 'err'); return; }

  setE5E6Status('E5 実行中…（スナップショット保存と受付停止）', '');
  try {
    const data = await adminCoreApi.callControlFunction(adminCoreConstants.CONTROL_CONFIRM_URL, {
      admin_secret: adminSecret,
      venue_code: currentVenueCode || 'default',
      match_code: matchCode,
    });
    setE5E6Status(`E5 完了: match=${matchCode}, epoch=${data.epoch}（スナップショット件数: ${data.snapshot_count}）`, 'ok');
    await loadData();
  } catch (err) {
    console.error(err);
    setE5E6Status('E5 失敗: ' + (err.message || String(err)), 'err');
  }
}

async function onClickE6() {
  const adminSecret = adminCoreDom.adminSecretInput ? adminCoreDom.adminSecretInput.value.trim() : '';
  if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', 'err'); return; }

  // E5チェック: スナップショットの存在と鮮度を確認
  const matchCode = adminCoreDom.matchSelect ? adminCoreDom.matchSelect.value : '';
  const match = matchesCache.find(m => m.code === matchCode);
  const epoch = lastState ? lastState.epoch : null;

  if (match && epoch) {
    try {
      // match_snapshots を確認
      const snapshots = await adminCoreApi.fetchJson('match_snapshots', {
        select: 'id,created_at',
        match_id: 'eq.' + match.id,
        epoch: 'eq.' + epoch,
        order: 'created_at.desc',
        limit: '1',
      });

      if (!snapshots.length) {
        // E5未実行
        if (!confirm(`⚠ E5が未実行です（epoch=${epoch}）。\nスナップショットを保存せずに次の対戦へ進みますか？`)) {
          setE5E6Status('E6 をキャンセルしました。', '');
          return;
        }
      } else {
        // E5実行済み → 最終スナップショット以降に提出の修正がないか確認
        const snapshotTime = snapshots[0].created_at;
        const newerSubs = await adminCoreApi.fetchJson('submissions', {
          select: 'id',
          match_id: 'eq.' + match.id,
          epoch: 'eq.' + epoch,
          updated_at: 'gt.' + snapshotTime,
          limit: '1',
        });

        if (newerSubs.length > 0) {
          if (!confirm(`⚠ E5確定後に提出の修正があります（epoch=${epoch}）。\n再度E5を実行してから進むことを推奨します。このまま次の対戦へ進みますか？`)) {
            setE5E6Status('E6 をキャンセルしました。', '');
            return;
          }
        }
      }
    } catch (err) {
      console.warn('E5チェック中にエラー:', err);
      if (!confirm('⚠ E5の状態を確認できませんでした。このまま次の対戦へ進みますか？')) {
        setE5E6Status('E6 をキャンセルしました。', '');
        return;
      }
    }
  }

  setE5E6Status('E6 実行中…（epoch を進めて受付再開）', '');
  try {
    const data = await adminCoreApi.callControlFunction(adminCoreConstants.CONTROL_ADVANCE_URL, {
      admin_secret: adminSecret,
      venue_code: currentVenueCode || 'default',
    });
    setE5E6Status(`E6 完了: epoch ${data.from_epoch} → ${data.to_epoch} に進めました（受付再開）`, 'ok');
    await loadData();
  } catch (err) {
    console.error(err);
    setE5E6Status('E6 失敗: ' + (err.message || String(err)), 'err');
  }
}

if (adminCoreDom.btnE5) adminCoreDom.btnE5.addEventListener('click', onClickE5);
if (adminCoreDom.btnE6) adminCoreDom.btnE6.addEventListener('click', onClickE6);

if (adminCoreDom.btnSetEpoch) {
  adminCoreDom.btnSetEpoch.addEventListener('click', async () => {
    const val = adminCoreDom.epochInput ? parseInt(adminCoreDom.epochInput.value, 10) : NaN;
    if (!val || val < 1) {
      setE5E6Status('Epochに1以上の整数を入力してください。', 'err');
      return;
    }
    if (!confirm(`Epochを ${val} に設定します（accepting=true, e3_reachedは提出状況から自動判定されます）。よろしいですか？`)) {
      return;
    }
    try {
      setE5E6Status(`Epoch を ${val} に設定中…`, '');
      await adminCoreApi.patchState({ epoch: val, accepting: true });
      setE5E6Status(`Epoch を ${val} に設定しました（accepting=true, e3_reachedは自動判定）。`, 'ok');
      await loadData();
    } catch (err) {
      console.error(err);
      setE5E6Status('Epoch設定に失敗しました: ' + (err.message || String(err)), 'err');
    }
  });
}

if (adminCoreDom.btnSaveJudgeOrder) {
  adminCoreDom.btnSaveJudgeOrder.addEventListener('click', adminCoreUi.saveJudgeOrder);
}

// 自動更新
setInterval(() => {
  if (!adminCoreDom.matchSelect || !adminCoreDom.matchSelect.value) return;
  loadData(true);
}, adminCoreConstants.ADMIN_AUTO_REFRESH_MS);

// 音声再生ボタン
if (adminCoreDom.btnAudioPlayAll) {
  adminCoreDom.btnAudioPlayAll.addEventListener('click', () => {
    if (!audioQueue.length) {
      adminCoreAudio.setAudioStatus('再生キューが空です。先に読み込みを行ってください。');
      return;
    }
    if (audioPlaying) {
      adminCoreAudio.setAudioStatus('すでに再生中です。');
      return;
    }
    audioQueueIndex = 0;
    adminCoreAudio.playAudioQueue();
  });
}
if (adminCoreDom.btnAudioStop) {
  adminCoreDom.btnAudioStop.addEventListener('click', adminCoreAudio.stopAudio);
}

// 初期化: 会場ドロップダウンを読み込み
adminCoreUi.populateVenues();

window.KHBAdmin.core = Object.assign(window.KHBAdmin.core || {}, {
  setStateSummaryMessage,
  renderStateSummary,
  buildLoadSignature,
  runLoadData,
  loadData,
  setE5E6Status,
  onClickE5,
  onClickE6,
});
