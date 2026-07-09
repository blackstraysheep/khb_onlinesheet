// KHB-Kuawase の slot(ページ番号 1-5)を OES の epoch に変換する。
// 5番勝負: slot = epoch。3番勝負: slot 1,3,5 → epoch 1,2,3。
// 変換できない slot(3番勝負の 2,4 など)は null を返す。
export function slotToEpoch(slot: number, numBouts: number): number | null {
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) return null;
  if (numBouts === 5) return slot;
  if (numBouts === 3) {
    const map: Record<number, number> = { 1: 1, 3: 2, 5: 3 };
    return map[slot] ?? null;
  }
  return null;
}

export function getBoutLabel(epoch: number, numBouts: number): string {
  if (numBouts === 5) {
    const labels = ["先鋒", "次鋒", "中堅", "副将", "大将"];
    const base = labels[epoch - 1];
    return base ? `${base}戦` : `第${epoch}対戦`;
  }

  if (numBouts === 3) {
    const labels = ["先鋒", "中堅", "大将"];
    const base = labels[epoch - 1];
    return base ? `${base}戦` : `第${epoch}対戦`;
  }

  return `第${epoch}対戦`;
}
