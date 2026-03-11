// ============================
// admin-scoreboard.js — スコアボード描画
// ============================

function buildScoreboard_horizontal(expectedIds, judgesMap, subMap, meta) {
  if (!scoreboardContainer) return;
  buildScoreboard(expectedIds, judgesMap, subMap, meta, scoreboardContainer);
}

// ============================
// スコアボード：縦型レイアウト
// ============================
function buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta) {
  if (!scoreboardContainer) return;
  buildVerticalScoreboard(expectedIds, judgesMap, subMap, meta, scoreboardContainer, {
    anomalyJudgeIds: meta?.anomalyJudgeIds || [],
    multilineMatchLabel: true,
  });
}
