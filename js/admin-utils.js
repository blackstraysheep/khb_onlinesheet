// ============================
// admin-utils.js — ユーティリティ + スコアボードモード切替
// ============================

const adminUtilsDom = window.KHBAdmin?.dom || {};
const adminUtilsState = window.KHBAdmin?.state || {};

function setScoreboardMode(mode) {
  adminUtilsState.scoreboardMode = mode;
  if (adminUtilsDom.scoreboardModeBtn) {
    adminUtilsDom.scoreboardModeBtn.textContent = mode === 'horizontal' ? '縦型に切替' : '横型に切替';
  }
}

if (adminUtilsDom.scoreboardModeBtn) {
  adminUtilsDom.scoreboardModeBtn.addEventListener('click', () => {
    setScoreboardMode(adminUtilsState.scoreboardMode === 'horizontal' ? 'vertical' : 'horizontal');
  });
}

function setMsg(text, type) {
  if (!adminUtilsDom.topMsg) return;
  adminUtilsDom.topMsg.textContent = text || '';
  adminUtilsDom.topMsg.className = 'msg';
  if (type === 'ok')   adminUtilsDom.topMsg.classList.add('ok');
  if (type === 'warn') adminUtilsDom.topMsg.classList.add('warn');
  if (type === 'err')  adminUtilsDom.topMsg.classList.add('err');
}

function setControlsDisabled(disabled) {
  [
    adminUtilsDom.toggleAcceptingBtn, adminUtilsDom.btnStartMatch,
    adminUtilsDom.btnAudioPlayAll, adminUtilsDom.btnAudioStop, adminUtilsDom.btnE5, adminUtilsDom.btnE6,
    adminUtilsDom.btnSaveJudgeOrder,
  ].forEach(btn => {
    if (btn) btn.disabled = disabled;
  });
  if (adminUtilsDom.venueSelect) adminUtilsDom.venueSelect.disabled = disabled;
  if (adminUtilsDom.matchSelect) adminUtilsDom.matchSelect.disabled = disabled;
}
