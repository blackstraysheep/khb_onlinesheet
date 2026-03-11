function buildVerticalScoreboard(expectedIds, judgesMap, subMap, meta, container, options = {}) {
  if (!container) return;
  container.innerHTML = '';

  if (!expectedIds || !expectedIds.length) {
    return;
  }

  meta = meta || {};
  const matchLabel = meta.matchLabel || '試合名';
  const boutLabelFull = meta.boutLabelFull || '対戦名';
  const redTeam = meta.redTeamName || '紅チーム';
  const whiteTeam = meta.whiteTeamName || '白チーム';
  const anomalyJudgeIds = new Set(options.anomalyJudgeIds || meta.anomalyJudgeIds || []);
  const multilineMatchLabel = options.multilineMatchLabel !== false;

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

  const trTop = document.createElement('tr');
  trTop.appendChild(createCell('紅', 'header-team-red', 1, 3));
  const tdMatch = createCell('', 'header-match-info', 1, 1);
  if (multilineMatchLabel) {
    setScoreboardMultilineText(tdMatch, matchLabel);
  } else {
    tdMatch.textContent = matchLabel;
  }
  trTop.appendChild(tdMatch);
  trTop.appendChild(createCell('白', 'header-team-white', 1, 3));
  tbody.appendChild(trTop);

  const trTeam = document.createElement('tr');
  trTeam.appendChild(createCell(redTeam, 'team-name-red', 1, 3));
  trTeam.appendChild(createCell(boutLabelFull, 'header-match-info', 1, 1));
  trTeam.appendChild(createCell(whiteTeam, 'team-name-white', 1, 3));
  tbody.appendChild(trTeam);

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

  expectedIds.forEach(id => {
    const s = subMap[id] || {};
    const tr = document.createElement('tr');
    if (anomalyJudgeIds.has(id)) tr.classList.add('score-anomaly-row');

    const tdRedFlag = createCell('', 'cell-flag red-flag');
    if (s.red_flag) tdRedFlag.textContent = '◆';
    tr.appendChild(tdRedFlag);

    tr.appendChild(createCell(s.red_total != null ? s.red_total : '', 'cell-total'));

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

    tr.appendChild(createCell(resolveScoreboardJudgeName(id, judgesMap), 'cell-judge'));

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

    tr.appendChild(createCell(s.white_total != null ? s.white_total : '', 'cell-total'));

    const tdWhiteFlag = createCell('', 'cell-flag');
    if (s.white_flag) {
      tdWhiteFlag.textContent = '◆';
      tdWhiteFlag.classList.add('white-flag');
    }
    tr.appendChild(tdWhiteFlag);

    tbody.appendChild(tr);
  });

  container.appendChild(table);
}
