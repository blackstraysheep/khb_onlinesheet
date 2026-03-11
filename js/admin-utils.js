// ============================
// admin-utils.js — ユーティリティ + スコアボードモード切替
// ============================

function setScoreboardMode(mode) {
  scoreboardMode = mode;
  if (scoreboardModeBtn) {
    scoreboardModeBtn.textContent = mode === 'horizontal' ? '縦型に切替' : '横型に切替';
  }
}

if (scoreboardModeBtn) {
  scoreboardModeBtn.addEventListener('click', () => {
    setScoreboardMode(scoreboardMode === 'horizontal' ? 'vertical' : 'horizontal');
  });
}

function setMsg(text, type) {
  if (!topMsg) return;
  topMsg.textContent = text || '';
  topMsg.className = 'msg';
  if (type === 'ok')   topMsg.classList.add('ok');
  if (type === 'warn') topMsg.classList.add('warn');
  if (type === 'err')  topMsg.classList.add('err');
}

function setControlsDisabled(disabled) {
  [
    toggleAcceptingBtn, btnStartMatch,
    btnAudioPlayAll, btnAudioStop, btnE5, btnE6,
    btnSaveJudgeOrder,
  ].forEach(btn => {
    if (btn) btn.disabled = disabled;
  });
  if (venueSelect) venueSelect.disabled = disabled;
  if (matchSelect) matchSelect.disabled = disabled;
}

function hasUndecidableWinner(submission) {
  if (!submission) return false;

  const redTotal = submission.red_total;
  const whiteTotal = submission.white_total;
  const redWork = submission.red_work;
  const whiteWork = submission.white_work;

  return Number.isFinite(redTotal)
    && Number.isFinite(whiteTotal)
    && Number.isFinite(redWork)
    && Number.isFinite(whiteWork)
    && redTotal === whiteTotal
    && redWork === whiteWork;
}
