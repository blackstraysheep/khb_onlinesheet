// supabase/functions/_shared/sanitize.ts
// KHB-Kuawase から届く Excel 由来テキスト（HTML を含みうる前提）をプレーンテキスト化する。
// 参照: docs/02-kuawase-integration-impl.md 「確定事項一覧 #12」

const DEFAULT_MAX_LENGTH = 200;
const CONTROL_CHAR_MAX_CODE = 31; // C0 制御文字の上限コードポイント
const DEL_CODE = 127; // DEL

/**
 * HTML タグ・制御文字を除去し、前後の空白をトリムした上で maxLength 文字に丸める。
 * 文字列以外が渡された場合は空文字を返す（呼び出し側で必須チェックすること）。
 * 制御文字の判定は正規表現の制御文字リテラルを避け、コードポイント比較で行う
 * （ソースファイルに実バイトの制御文字を含めないため）。
 */
export function sanitizeText(value: unknown, maxLength = DEFAULT_MAX_LENGTH): string {
  if (typeof value !== "string") return "";
  // タグ除去（属性・入れ子含め粗く除去。表示名程度の想定でリッチな解析は不要）
  const withoutTags = value.replace(/<[^>]*>/g, "");

  let plain = "";
  for (const ch of withoutTags) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= CONTROL_CHAR_MAX_CODE || code === DEL_CODE) continue;
    plain += ch;
  }

  return plain.trim().slice(0, maxLength);
}
