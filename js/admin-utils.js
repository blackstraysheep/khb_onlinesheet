// ============================
// admin-utils.js — ユーティリティ + スコアボードモード切替
// ============================

(() => {
const adminUtilsDom = window.KHBAdmin?.dom || {};
const adminUtilsState = window.KHBAdmin?.state || {};
const adminUtilsCore = window.KHBAdmin?.core || {};
const controlLockState = {
  loading: false,
  matchLocked: false,
};

function applyControlDisabledState() {
  const loadingDisabled = controlLockState.loading;
  const operationDisabled = loadingDisabled || controlLockState.matchLocked;

  // 受付・確定操作はcurrent_matchでない場合はロック
  [
    adminUtilsDom.toggleAcceptingBtn,
    adminUtilsDom.btnE5,
    adminUtilsDom.btnE6,
    adminUtilsDom.btnSetEpoch,
  ].forEach(el => {
    if (el) el.disabled = operationDisabled;
  });

  // epochInputは表示用のため常に編集可能（読込中のみ無効化）
  if (adminUtilsDom.epochInput) {
    adminUtilsDom.epochInput.readOnly = false;
    adminUtilsDom.epochInput.disabled = loadingDisabled;
  }

  [
    adminUtilsDom.btnStartMatch,
    adminUtilsDom.btnAudioPlayAll,
    adminUtilsDom.btnAudioStop,
    adminUtilsDom.btnSaveJudgeOrder,
    adminUtilsDom.venueSelect,
    adminUtilsDom.matchSelect,
  ].forEach(el => {
    if (el) el.disabled = loadingDisabled;
  });
}

function setScoreboardMode(mode) {
  adminUtilsState.scoreboardMode = mode;
  if (adminUtilsDom.scoreboardModeBtn) {
    adminUtilsDom.scoreboardModeBtn.textContent = mode === 'horizontal' ? '縦型に切替' : '横型に切替';
  }
}

function toggleScoreboardMode() {
  const newMode = adminUtilsState.scoreboardMode === 'horizontal' ? 'vertical' : 'horizontal';
  setScoreboardMode(newMode);
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
  controlLockState.loading = !!disabled;
  applyControlDisabledState();
}

function setMatchOperationLocked(locked) {
  controlLockState.matchLocked = !!locked;
  applyControlDisabledState();
}

window.KHBAdmin.utils = Object.assign(window.KHBAdmin.utils || {}, {
  setScoreboardMode,
  toggleScoreboardMode,
  setMsg,
  setControlsDisabled,
  setMatchOperationLocked,
});
})();
