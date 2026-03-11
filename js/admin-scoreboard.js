// ============================
// admin-scoreboard.js — スコアボード描画
// ============================

(() => {
const adminScoreboardDom = window.KHBAdmin?.dom || {};

function buildScoreboard_horizontal(expectedIds, judgesMap, subMap, meta) {
  if (!adminScoreboardDom.scoreboardContainer) return;
  buildScoreboard(expectedIds, judgesMap, subMap, meta, adminScoreboardDom.scoreboardContainer);
}

// ============================
// スコアボード：縦型レイアウト
// ============================
function buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta) {
  if (!adminScoreboardDom.scoreboardContainer) return;
  buildVerticalScoreboard(expectedIds, judgesMap, subMap, meta, adminScoreboardDom.scoreboardContainer, {
    anomalyJudgeIds: meta?.anomalyJudgeIds || [],
    multilineMatchLabel: true,
  });
}

window.KHBAdmin.scoreboard = Object.assign(window.KHBAdmin.scoreboard || {}, {
  buildScoreboard_horizontal,
  buildScoreboard_vertical,
});
})();
