// scoreboard.js
// スコアボード描画ロジックの共通化

/**
 * 席順配列を「中心から外側へ」並び替える
 * 例: 7人 → 元の並び [1,2,3,4,5,6,7] を [6,4,2,1,3,5,7] に変換
 */
function reorderIdsForScoreboard(ids) {
  const n = ids.length;
  if (n <= 2) return ids.slice();

  const oddIdx = [];   // 元配列の「奇数インデックス」（1,3,5,...) → 右寄りグループ
  const evenIdx = [];  // 元配列の「偶数インデックス」（0,2,4,...) → 左寄りグループ

  for (let i = 0; i < n; i++) {
    if (i % 2 === 1) oddIdx.push(i);
    else evenIdx.push(i);
  }

  // 奇数インデックスを逆順にして先頭へ、その後に偶数インデックスを昇順で並べる
  oddIdx.reverse();
  const orderIdx = oddIdx.concat(evenIdx);

  const result = [];
  orderIdx.forEach(idx => {
    if (idx >= 0 && idx < n) {
      result.push(ids[idx]);
    }
  });
  return result;
}

/**
 * 対戦名ラベル生成
 */
function getBoutLabel(epoch, numBouts) {
  epoch = Number(epoch || 0);

  if (numBouts === 5) {
    const labels5 = ['先鋒', '次鋒', '中堅', '副将', '大将'];
    const base = labels5[epoch - 1];
    return base ? `${base}戦` : `第${epoch}対戦`;
  }

  if (numBouts === 3) {
    const labels3 = ['先鋒', '中堅', '大将'];
    const base = labels3[epoch - 1];
    return base ? `${base}戦` : `第${epoch}対戦`;
  }

  // 一般
  return `第${epoch}対戦`;
}


/**
 * スコアボード構築関数
 * @param {string[]} expectedIds - 表示順序調整前の審査員ID配列
 * @param {object} judgesMap - {id: name}
 * @param {object} subMap - {judgeId: submissionObject}
 * @param {object} meta - { matchLabel, boutLabelFull, redTeamName, whiteTeamName }
 * @param {HTMLElement} container - 描画先コンテナ
 */
function buildScoreboard(expectedIds, judgesMap, subMap, meta, container) {
  if (!container) return;
  container.innerHTML = '';

  if (!expectedIds || !expectedIds.length) {
    // データがない場合の表示（adminでは特に何も出さない、obsでは待機中など）
    // container.innerHTML = '<div style="padding:20px; text-align:center;">審査員情報なし</div>';
    return;
  }

  meta = meta || {};
  const matchLabel = meta.matchLabel || '';
  const boutLabelFull = meta.boutLabelFull || '';
  const redTeam = meta.redTeamName || '紅';
  const whiteTeam = meta.whiteTeamName || '白';

  // ID並び替え（中心から外側へ）
  const displayIds = reorderIdsForScoreboard(expectedIds);

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  const createCell = (text, className) => {
    const td = document.createElement('td');
    if (className) td.className = className;
    if (text !== undefined && text !== null) td.textContent = text;
    return td;
  };

  // 外枠カラム定義
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
      // CSSで改行制御しているが、明示的に書き換える場合もあるかも

      if (def.rowSpan && def.rowSpan > 1) {
        td.rowSpan = def.rowSpan;
      }
      tr.appendChild(td);
    });
  };

  let rowIndex = 0;

  // --- 1行目: 赤 旗 ---
  let tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('旗', 'label vertical'));
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'red-star');
    if (s && s.red_flag) td.textContent = '★';
    tr.appendChild(td);
  });
  tr.appendChild(createCell('旗', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 2行目: 赤 合計 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('合計', 'label vertical'));
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score-big');
    if (s && s.red_total != null) td.textContent = s.red_total;
    tr.appendChild(td);
  });
  tr.appendChild(createCell('合計', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 3行目: 赤 鑑賞 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('鑑賞点', 'label vertical')); // adminでは"鑑賞点"
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.red_app != null && s.red_app !== 0) td.textContent = s.red_app;
    tr.appendChild(td);
  });
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 4行目: 赤 作品 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('作品点', 'label vertical')); // adminでは"作品点"
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.red_work != null) td.textContent = s.red_work;
    tr.appendChild(td);
  });
  tr.appendChild(createCell('作品点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 5行目: 審査員名 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('審査員', 'label center-block-cell vertical'));
  displayIds.forEach(id => {
    let name = id.slice(0, 4);
    const j = judgesMap[id];
    if (j) {
      if (typeof j === 'string') {
        name = j;
      } else if (typeof j === 'object' && j.name) {
        name = j.name;
      }
    }
    const td = createCell(name, 'judge-name center-block-cell vertical');
    tr.appendChild(td);
  });
  tr.appendChild(createCell('審査員', 'label center-block-cell vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 6行目: 白 作品 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('作品点', 'label vertical'));
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.white_work != null) td.textContent = s.white_work;
    tr.appendChild(td);
  });
  tr.appendChild(createCell('作品点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 7行目: 白 鑑賞 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score');
    if (s && s.white_app != null && s.white_app !== 0) td.textContent = s.white_app;
    tr.appendChild(td);
  });
  tr.appendChild(createCell('鑑賞点', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 8行目: 白 合計 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('合計', 'label vertical'));
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'score-big');
    if (s && s.white_total != null) td.textContent = s.white_total;
    tr.appendChild(td);
  });
  tr.appendChild(createCell('合計', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  // --- 9行目: 白 旗 ---
  tr = document.createElement('tr');
  addOuterCells(tr, rowIndex, 'left');
  tr.appendChild(createCell('旗', 'label vertical'));
  displayIds.forEach(id => {
    const s = subMap[id];
    const td = createCell('', 'star');
    if (s && s.white_flag) td.textContent = '★';
    tr.appendChild(td);
  });
  tr.appendChild(createCell('旗', 'label vertical'));
  addOuterCells(tr, rowIndex, 'right');
  tbody.appendChild(tr);
  rowIndex++;

  container.appendChild(table);
}
