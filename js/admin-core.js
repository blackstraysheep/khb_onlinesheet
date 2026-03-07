// ============================
// admin-core.js — データ読み込み、イベントリスナー、初期化
// ============================

async function loadData(isAuto = false) {
  if (isAuto && autoLoading) return;
  if (isAuto) {
    autoLoading = true;
  } else {
    setMsg('読み込み中…', '');
    setControlsDisabled(true);
    if (scoreboardContainer) scoreboardContainer.innerHTML = '';
    stateSummary.innerHTML = '<span class="small">読み込み中…</span>';
  }

  const matchCode = matchSelect ? matchSelect.value : '';

  if (!matchCode) {
    if (!isAuto) {
      setMsg('試合を選択してください。', 'err');
      setControlsDisabled(false);
    }
    if (isAuto) autoLoading = false;
    return;
  }

  try {
    // 1. matches
    const matches = await fetchJson('matches', {
      select: 'id,code,name,red_team_name,white_team_name,num_bouts',
      code: 'eq.' + matchCode,
    });

    if (!matches.length) {
      if (!isAuto) {
        setMsg(`matches.code = "${matchCode}" の対戦が見つかりません。`, 'err');
        stateSummary.innerHTML = '<span class="small">対戦が見つかりません。</span>';
      }
      if (isAuto) autoLoading = false;
      return;
    }
    const match   = matches[0];
    const matchId = match.id;

    // 2. state（会場別）
    const stateRows = currentVenueId
      ? await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', venue_id: 'eq.' + currentVenueId })
      : await fetchJson('state', { select: 'epoch,accepting,e3_reached,updated_at,current_match_id', id: 'eq.1' });
    const st  = stateRows[0] || null;
    lastState = st;

    // epoch は state から取得
    const epoch = st ? st.epoch : 1;
    const numBouts = Number(match.num_bouts || 0);
    const boutLabelFull = getBoutLabel(epoch, numBouts);

    // 3. expected_judges
    const expected    = await fetchJson('expected_judges', {
      select: 'judge_id, sort_order',
      match_id: 'eq.' + matchId,
      order: 'sort_order.asc',
    });
    const expectedIds = expected.map(r => String(r.judge_id));

    // 4. submissions
    const subs = await fetchJson('submissions', {
      select: 'judge_id,revision,red_work,red_app,red_total,red_flag,white_work,white_app,white_total,white_flag',
      match_id: 'eq.' + matchId,
      epoch: 'eq.' + epoch,
    });

    // 5. judges
    let judgesMap = {};
    if (expectedIds.length) {
      const idList = expectedIds.join(',');
      const judges = await fetchJson('judges', {
        select: 'id,name,voice_key',
        id: 'in.(' + idList + ')',
      });
      judgesMap = Object.fromEntries(
        judges.map(j => [String(j.id), { name: j.name, voice_key: j.voice_key }])
      );
    }

    // 6. スコアボード描画
    const subMap = {};
    subs.forEach(s => { subMap[String(s.judge_id)] = s; });

    const matchLabel = (match.name || match.code).replace(/　/g, '\n');
    let boutLabelForBoard = boutLabelFull || '対戦名';
    if (boutLabelForBoard && !boutLabelForBoard.endsWith('戦')) {
      boutLabelForBoard = boutLabelForBoard + '戦';
    }

    const meta = {
      matchLabel:    matchLabel,
      boutLabelFull: boutLabelForBoard,
      redTeamName:   match.red_team_name  || '紅',
      whiteTeamName: match.white_team_name || '白',
    };

    if (scoreboardMode === 'vertical') {
      buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta);
    } else {
      const displayIds = reorderIdsForScoreboard(expectedIds);
      buildScoreboard_horizontal(displayIds, judgesMap, subMap, meta);
    }

    // 音声読み上げ
    scheduleAudioRefresh({ match, epoch, boutLabelFull, expectedIds, judgesMap, subMap });

    // 7. 状態サマリ
    const submittedIds  = new Set(subs.map(s => String(s.judge_id)));
    const submittedCount = submittedIds.size;
    const expectedCount  = expectedIds.length;

    const parts = [];
    parts.push(`<span>試合: <strong>${match.code}</strong> (${match.name || ''})</span>`);
    if (boutLabelFull) {
      parts.push(`<span>第${epoch}対戦（${boutLabelFull}）</span>`);
    } else {
      parts.push(`<span>第${epoch}対戦</span>`);
    }

    if (st) {
      parts.push(`<span>state.epoch: <strong>${st.epoch}</strong></span>`);
      parts.push(`<span class="tag ${st.accepting ? 'ok' : 'danger'}">accepting: ${st.accepting}</span>`);
      parts.push(`<span class="tag outline ${st.e3_reached ? 'ok' : 'warn'}">e3_reached: ${st.e3_reached}</span>`);

      if (st.current_match_id) {
        parts.push(st.current_match_id === matchId
          ? '<span class="tag ok">current_match_id: true</span>'
          : '<span class="tag warn">current_match_id: false</span>');
      } else {
        parts.push('<span class="tag warn">current_match_id: 未設定</span>');
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
      parts.push('<span class="tag warn">state が取得できません</span>');
      if (toggleAcceptingBtn) {
        toggleAcceptingBtn.textContent = 'state 不明';
        toggleAcceptingBtn.className = 'small-btn btn-grey';
      }
    }

    parts.push(`<span>期待審査員: <strong>${expectedCount}</strong> 人</span>`);
    parts.push(`<span>提出済み: <strong>${submittedCount}</strong> 人</span>`);
    stateSummary.innerHTML = parts.join('');

    if (!isAuto) setMsg('読み込み完了', 'ok');

  } catch (err) {
    console.error(err);
    if (!isAuto) {
      setMsg('読み込み中にエラーが発生しました: ' + err.message, 'err');
      stateSummary.innerHTML = '<span class="small">エラーが発生しました。</span>';
    }
  } finally {
    if (isAuto) {
      autoLoading = false;
    } else {
      setControlsDisabled(false);
    }
  }
}

// ============================
// イベントリスナー
// ============================

toggleAcceptingBtn.addEventListener('click', async () => {
  if (!lastState) {
    setMsg('状態が読み込まれていません。', 'err');
    return;
  }
  const nextVal = !lastState.accepting;
  const label = nextVal ? '受付開始' : '受付締切';
  try {
    setMsg(`${label}処理中…`, '');
    setControlsDisabled(true);
    const patch = { accepting: nextVal };
    if (nextVal && lastState.epoch) patch.epoch = lastState.epoch;
    await patchState(patch);
    setMsg(`${label}しました（accepting=${nextVal}）。`, 'ok');
    await loadData();
  } catch (err) {
    console.error(err);
    setMsg(`${label}に失敗しました: ` + err.message, 'err');
    setControlsDisabled(false);
  }
});

if (venueSelect) {
  venueSelect.addEventListener('change', onVenueChange);
}
if (matchSelect) {
  matchSelect.addEventListener('change', onMatchChange);
}

if (btnStartMatch) {
  btnStartMatch.addEventListener('click', async () => {
    const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
    const matchCode = matchSelect ? matchSelect.value : '';
    if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }
    if (!matchCode) { setE5E6Status('試合を選択してください。', false); return; }

    setE5E6Status('現在の試合を設定中…', true);
    try {
      const data = await callControlFunction(CONTROL_SET_MATCH_URL, {
        admin_secret: adminSecret,
        venue_code: currentVenueCode || 'default',
        match_code: matchCode,
        epoch: 1,
      });
      let statusMsg = `試合を開始しました: ${data.match?.code || matchCode}, epoch=${data.epoch}`;
      if (data.warnings && data.warnings.length > 0) {
        const names = [...new Set(data.warnings.map(w => w.judge_name || w.judge_id))];
        const matches = [...new Set(data.warnings.map(w => w.other_match_name || w.other_match_code))];
        statusMsg += `\n⚠ 警告: ${names.join(', ')} は別の試合 (${matches.join(', ')}) を審査中です`;
      }
      setE5E6Status(statusMsg, true);
      await populateMatches();
    } catch (err) {
      console.error(err);
      if (err.responseData?.error === 'same_timeline_conflict') {
        const conflicts = err.responseData.conflicts || [];
        const names = [...new Set(conflicts.map(c => c.judge_name || c.judge_id))];
        const matches = [...new Set(conflicts.map(c => c.other_match_name || c.other_match_code))];
        setE5E6Status(
          `試合を開始できません: ${names.join(', ')} が同一タイムラインの試合 (${matches.join(', ')}) を審査中です`,
          false
        );
      } else {
        setE5E6Status('試合開始に失敗しました: ' + (err.message || String(err)), false);
      }
    }
  });
}

// --- E5 / E6 ---

function setE5E6Status(message, isOk) {
  if (!e5e6StatusEl) return;
  e5e6StatusEl.textContent = message;
  e5e6StatusEl.className = 'msg';
  if (isOk === true)  e5e6StatusEl.classList.add('ok');
  if (isOk === false) e5e6StatusEl.classList.add('err');
}

async function onClickE5() {
  const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
  const matchCode   = matchSelect ? matchSelect.value : '';

  if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }
  if (!matchCode)   { setE5E6Status('試合を選択してください。', false); return; }

  setE5E6Status('E5 実行中…（スナップショット保存と受付停止）', true);
  try {
    const data = await callControlFunction(CONTROL_CONFIRM_URL, {
      admin_secret: adminSecret,
      venue_code: currentVenueCode || 'default',
      match_code: matchCode,
    });
    setE5E6Status(`E5 完了: match=${matchCode}, epoch=${data.epoch}（スナップショット件数: ${data.snapshot_count}）`, true);
    await loadData();
  } catch (err) {
    console.error(err);
    setE5E6Status('E5 失敗: ' + (err.message || String(err)), false);
  }
}

async function onClickE6() {
  const adminSecret = adminSecretInput ? adminSecretInput.value.trim() : '';
  if (!adminSecret) { setE5E6Status('管理用シークレットを入力してください。', false); return; }

  setE5E6Status('E6 実行中…（epoch を進めて受付再開）', true);
  try {
    const data = await callControlFunction(CONTROL_ADVANCE_URL, {
      admin_secret: adminSecret,
      venue_code: currentVenueCode || 'default',
    });
    setE5E6Status(`E6 完了: epoch ${data.from_epoch} → ${data.to_epoch} に進めました（受付再開）`, true);
    await loadData();
  } catch (err) {
    console.error(err);
    setE5E6Status('E6 失敗: ' + (err.message || String(err)), false);
  }
}

if (btnE5) btnE5.addEventListener('click', onClickE5);
if (btnE6) btnE6.addEventListener('click', onClickE6);

if (btnSaveJudgeOrder) {
  btnSaveJudgeOrder.addEventListener('click', saveJudgeOrder);
}

// 自動更新
setInterval(() => {
  if (!matchSelect || !matchSelect.value) return;
  loadData(true);
}, 2000);

// 音声再生ボタン
if (btnAudioPlayAll) {
  btnAudioPlayAll.addEventListener('click', () => {
    if (!audioQueue.length) {
      setAudioStatus('再生キューが空です。先に読み込みを行ってください。');
      return;
    }
    if (audioPlaying) {
      setAudioStatus('すでに再生中です。');
      return;
    }
    audioQueueIndex = 0;
    playAudioQueue();
  });
}
if (btnAudioStop) {
  btnAudioStop.addEventListener('click', stopAudio);
}

// 初期化: 会場ドロップダウンを読み込み
populateVenues();
