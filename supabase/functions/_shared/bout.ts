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
