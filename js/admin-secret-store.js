// ============================
// admin-secret-store.js — 管理用シークレットのタブ内保持
// ============================
// 再読み込み(Ctrl+R)や管理ページ間の移動のたびに ADMIN_SETUP_SECRET を
// 再入力しなくて済むよう、sessionStorage に保存して復元する。
// - sessionStorage はタブを閉じると消える(端末への恒久保存はしない)
// - 各管理ページで #adminSecret より後・他の管理スクリプトより前に読み込むこと
//   (復元後に各スクリプトの初期化が走り、保存済みシークレットで一覧が読める)
(() => {
  const STORAGE_KEY = 'khbAdminSecret';
  const input = document.getElementById('adminSecret');
  if (!input) return;

  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && !input.value) input.value = saved;
  } catch (_) { /* sessionStorage 不可の環境では単に保持しない */ }

  input.addEventListener('input', () => {
    try { sessionStorage.setItem(STORAGE_KEY, input.value); } catch (_) { }
  });
})();
