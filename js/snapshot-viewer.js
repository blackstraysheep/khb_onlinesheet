(function () {
  function normalizeSnapshotInput(raw) {
    let value = raw;
    if (Array.isArray(value)) value = value[0];
    if (value && typeof value === 'object' && value.snapshot && typeof value.snapshot === 'object') value = value.snapshot;
    if (!value || typeof value !== 'object') throw new Error('不正なデータ形式です。snapshot JSON を入力してください。');
    if (!Array.isArray(value.items)) throw new Error('不正なデータ形式です。"items" 配列が含まれていません。');
    return value;
  }

  function toSortOrder(item, fallbackIndex) {
    const value = Number(item?.sort_order);
    return Number.isFinite(value) ? value : fallbackIndex;
  }

  function resolveDisplayName(value, fallback) {
    const text = String(value ?? '').trim();
    return text || fallback;
  }

  function renderSnapshot(rawData, redName, whiteName) {
    const data = normalizeSnapshotInput(rawData);
    const sortedItems = data.items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const leftOrder = toSortOrder(left.item, left.index);
        const rightOrder = toSortOrder(right.item, right.index);
        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return left.index - right.index;
      })
      .map(entry => entry.item);

    const expectedIds = sortedItems.map(item => String(item.judge_id));
    const judgesMap = {};
    const subMap = {};

    sortedItems.forEach(item => {
      const judgeId = String(item.judge_id);
      judgesMap[judgeId] = item.judge_name || judgeId;
      subMap[judgeId] = {
        judge_id: judgeId,
        red_work: item.red?.work_point ?? null,
        red_app: item.red?.app_point ?? null,
        red_total: item.red?.total ?? null,
        red_flag: !!item.red?.flag,
        white_work: item.white?.work_point ?? null,
        white_app: item.white?.app_point ?? null,
        white_total: item.white?.total ?? null,
        white_flag: !!item.white?.flag,
      };
    });

    buildVerticalScoreboard(expectedIds, judgesMap, subMap, {
      matchLabel: data.match?.name || data.match?.code || '試合情報なし',
      boutLabelFull: data.bout?.label || `第${data.epoch}戦`,
      redTeamName: resolveDisplayName(redName, data.teams?.red || '紅'),
      whiteTeamName: resolveDisplayName(whiteName, data.teams?.white || '白'),
    }, document.getElementById('scoreboardContainer'), { multilineMatchLabel: true });
  }

  const renderBtn = document.getElementById('renderBtn');
  const jsonInput = document.getElementById('jsonInput');
  const errorMsg = document.getElementById('errorMsg');
  const inputContainer = document.getElementById('inputContainer');
  const mainCard = document.getElementById('mainCard');
  const redTeamInput = document.getElementById('redTeamInput');
  const whiteTeamInput = document.getElementById('whiteTeamInput');

  renderBtn.addEventListener('click', () => {
    const jsonText = jsonInput.value.trim();
    if (!jsonText) {
      showError('JSONを入力してください。');
      return;
    }

    try {
      const data = JSON.parse(jsonText);
      renderSnapshot(data, redTeamInput.value.trim(), whiteTeamInput.value.trim());
      inputContainer.classList.add('hidden');
      mainCard.style.display = 'block';
    } catch (e) {
      console.error(e);
      showError('エラー: ' + (e?.message || String(e)));
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }
})();
