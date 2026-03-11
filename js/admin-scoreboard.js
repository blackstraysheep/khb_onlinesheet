// ============================
// admin-scoreboard.js — スコアボード描画
// ============================

function setCellMultilineText(cell, text) {
  cell.replaceChildren();
  const lines = String(text ?? '').split(/[　\n]/);
  lines.forEach((line, idx) => {
    if (idx > 0) cell.appendChild(document.createElement('br'));
    cell.appendChild(document.createTextNode(line));
  });
}

function markJudgeAnomaly(cell, judgeId, anomalyJudgeIds) {
  if (cell && anomalyJudgeIds && anomalyJudgeIds.has(judgeId)) {
    cell.classList.add('score-anomaly');
  }
}

function buildScoreboard_horizontal(expectedIds, judgesMap, subMap, meta) {
  if (!scoreboardContainer) return;
  scoreboardContainer.innerHTML = '';

  if (!expectedIds || !expectedIds.length) return;

  meta = meta || {};
  const matchLabel  = meta.matchLabel  || '試合名';
  const boutLabelFull = meta.boutLabelFull || '対戦名';
  const redTeam   = meta.redTeamName  || '紅';
  const whiteTeam = meta.whiteTeamName || '白';
  const anomalyJudgeIds = new Set(meta.anomalyJudgeIds || []);

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  const createCell = (text, className) => {
    const td = document.createElement('td');
    if (className) td.className = className;
    if (text !== undefined && text !== null) td.textContent = text;
    return td;
  };

  const outerColumnPlan = {
    left: [
      [
        { start: 0, rowSpan: 4, text: '紅', className: 'outer-col side-col side-red' },
        { start: 4, rowSpan: 1, text: matchLabel, className: 'outer-col match-label' },
        { start: 5, rowSpan: 4, text: '白', className: 'outer-col side-col side-white' },
      ],
      [
        { start: 0, rowSpan: 4, text: redTeam, className: 'outer-col team-col team-red' },
        { start: 4, rowSpan: 1, text: boutLabelFull, className: 'outer-col bout-label' },
        { start: 5, rowSpan: 4, text: whiteTeam, className: 'outer-col team-col team-white' },
      ],
    ],
    right: [
      [
        { start: 0, rowSpan: 4, text: redTeam, className: 'outer-col team-col team-red' },
        { start: 4, rowSpan: 1, text: boutLabelFull, className: 'outer-col bout-label' },
        { start: 5, rowSpan: 4, text: whiteTeam, className: 'outer-col team-col team-white' },
      ],
      [
        { start: 0, rowSpan: 4, text: '紅', className: 'outer-col side-col side-red' },
        { start: 4, rowSpan: 1, text: matchLabel, className: 'outer-col match-label' },
        { start: 5, rowSpan: 4, text: '白', className: 'outer-col side-col side-white' },
      ],
    ],
  };

  const addOuterCells = (tr, rowIndex, side) => {
    const cols = outerColumnPlan[side];
    if (!cols) return;
    cols.forEach(col => {
      const def = col.find(item => item.start === rowIndex);
      if (!def) return;
      const td = createCell(def.text, def.className);
      if (def.rowSpan && def.rowSpan > 1) td.rowSpan = def.rowSpan;
      tr.appendChild(td);
    });
  };

  let rowIndex = 0;

  // 紅 旗
  let tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('旗', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'red-star');
    if (s && s.red_flag) td.textContent = '★';
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('旗', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 紅 合計
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('合計', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score-big');
    if (s && s.red_total != null) td.textContent = s.red_total;
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('合計', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 紅 鑑賞点
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.red_app != null && s.red_app !== 0) td.textContent = s.red_app;
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 紅 作品点
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('作品点', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.red_work != null) td.textContent = s.red_work;
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('作品点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 審査員名（中央）
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('審査員', 'label center-block-cell vertical'));
  expectedIds.forEach(id => {
    let name = id.slice(0, 8);
    const j = judgesMap[id];
    if (j) {
      if (typeof j === 'string') name = j;
      else if (typeof j === 'object' && j.name) name = j.name;
    }
    const td = createCell(name, 'judge-name center-block-cell vertical');
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('審査員', 'label center-block-cell vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 白 作品点
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('作品点', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.white_work != null) td.textContent = s.white_work;
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('作品点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 白 鑑賞点
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.white_app != null && s.white_app !== 0) td.textContent = s.white_app;
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 白 合計
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('合計', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score-big');
    if (s && s.white_total != null) td.textContent = s.white_total;
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('合計', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // 白 旗
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('旗', 'label vertical'));
  expectedIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'star');
    if (s && s.white_flag) td.textContent = '★';
    markJudgeAnomaly(td, id, anomalyJudgeIds);
    tr.appendChild(td);
  });
  tr.appendChild(createCell('旗', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  scoreboardContainer.appendChild(table);
}

// ============================
// スコアボード：縦型レイアウト
// ============================
function buildScoreboard_vertical(expectedIds, judgesMap, subMap, meta) {
  if (!scoreboardContainer) return;
  scoreboardContainer.innerHTML = '';

  if (!expectedIds || !expectedIds.length) return;

  meta = meta || {};
  const matchLabel  = meta.matchLabel  || '試合名';
  const boutLabelFull = meta.boutLabelFull || '対戦名';
  const redTeam   = meta.redTeamName  || '紅チーム';
  const whiteTeam = meta.whiteTeamName || '白チーム';
  const anomalyJudgeIds = new Set(meta.anomalyJudgeIds || []);

  const table = document.createElement('table');
  table.className = 'scoreboard-v';
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  const createCell = (text, className, rowSpan, colSpan) => {
    const td = document.createElement('td');
    if (className) td.className = className;
    if (text !== undefined && text !== null) td.textContent = text;
    if (rowSpan) td.rowSpan = rowSpan;
    if (colSpan) td.colSpan = colSpan;
    return td;
  };

  // ヘッダー1行目: 紅 | 試合名 | 白
  const trTop = document.createElement('tr');
  trTop.appendChild(createCell('紅', 'header-team-red', 1, 3));
  const tdMatch = createCell('', 'header-match-info', 1, 1);
  setCellMultilineText(tdMatch, matchLabel);
  trTop.appendChild(tdMatch);
  trTop.appendChild(createCell('白', 'header-team-white', 1, 3));
  tbody.appendChild(trTop);

  // ヘッダー2行目: 紅チーム名 | 対戦名 | 白チーム名
  const trTeam = document.createElement('tr');
  trTeam.appendChild(createCell(redTeam, 'team-name-red', 1, 3));
  trTeam.appendChild(createCell(boutLabelFull, 'header-match-info', 1, 1));
  trTeam.appendChild(createCell(whiteTeam, 'team-name-white', 1, 3));
  tbody.appendChild(trTeam);

  // カラムヘッダー行
  const trColHead = document.createElement('tr');
  trColHead.appendChild(createCell('旗', 'col-header', 1, 1));
  trColHead.appendChild(createCell('合計', 'col-header', 1, 1));
  const tdRedWorkApp = createCell('', 'col-header', 1, 1);
  tdRedWorkApp.innerHTML = '作品点<div class="sub-label">鑑賞点</div>';
  trColHead.appendChild(tdRedWorkApp);
  trColHead.appendChild(createCell('審査員', 'col-header', 1, 1));
  const tdWhiteWorkApp = createCell('', 'col-header', 1, 1);
  tdWhiteWorkApp.innerHTML = '作品点<div class="sub-label">鑑賞点</div>';
  trColHead.appendChild(tdWhiteWorkApp);
  trColHead.appendChild(createCell('合計', 'col-header', 1, 1));
  trColHead.appendChild(createCell('旗', 'col-header', 1, 1));
  tbody.appendChild(trColHead);

  // 審査員ごとのデータ行
  expectedIds.forEach(id => {
    const s = subMap[id] || {};
    const tr = document.createElement('tr');
    if (anomalyJudgeIds.has(id)) tr.classList.add('score-anomaly-row');

    // 紅 旗
    const tdRedFlag = createCell('', 'cell-flag red-flag');
    if (s.red_flag) tdRedFlag.textContent = '◆';
    tr.appendChild(tdRedFlag);

    // 紅 合計
    tr.appendChild(createCell(s.red_total != null ? s.red_total : '', 'cell-total'));

    // 紅 作品点/鑑賞点（スタック）
    const tdRedScores = createCell('', 'cell-scores');
    const redWorkDiv = document.createElement('div');
    redWorkDiv.className = 'score-main';
    redWorkDiv.textContent = s.red_work != null ? s.red_work : '';
    const redAppDiv = document.createElement('div');
    redAppDiv.className = 'score-sub';
    redAppDiv.textContent = (s.red_app != null && s.red_app !== 0) ? s.red_app : '';
    tdRedScores.appendChild(redWorkDiv);
    tdRedScores.appendChild(redAppDiv);
    tr.appendChild(tdRedScores);

    // 審査員名
    let name = id.slice(0, 8);
    const j = judgesMap[id];
    if (j) name = (typeof j === 'object' ? j.name : j) || name;
    tr.appendChild(createCell(name, 'cell-judge'));

    // 白 作品点/鑑賞点（スタック）
    const tdWhiteScores = createCell('', 'cell-scores');
    const whiteWorkDiv = document.createElement('div');
    whiteWorkDiv.className = 'score-main';
    whiteWorkDiv.textContent = s.white_work != null ? s.white_work : '';
    const whiteAppDiv = document.createElement('div');
    whiteAppDiv.className = 'score-sub';
    whiteAppDiv.textContent = (s.white_app != null && s.white_app !== 0) ? s.white_app : '';
    tdWhiteScores.appendChild(whiteWorkDiv);
    tdWhiteScores.appendChild(whiteAppDiv);
    tr.appendChild(tdWhiteScores);

    // 白 合計
    tr.appendChild(createCell(s.white_total != null ? s.white_total : '', 'cell-total'));

    // 白 旗
    const tdWhiteFlag = createCell('', 'cell-flag');
    if (s.white_flag) {
      tdWhiteFlag.textContent = '◆';
      tdWhiteFlag.classList.add('white-flag');
    }
    tr.appendChild(tdWhiteFlag);

    tbody.appendChild(tr);
  });

  scoreboardContainer.appendChild(table);
}
