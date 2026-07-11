// supabase/functions/_shared/sanitize.ts
// KHB-Kuawase から届く Excel 由来テキスト（HTML を含みうる前提）をプレーンテキスト化する。
// 参照: docs/02-kuawase-integration-impl.md 「確定事項一覧 #12」
//
// 例外として <br> だけは「改行指定」の allowlist として保持する（正規形 "<br>" に揃える）。
// KHB-Kuawase の投影画面は DOMPurify の allowlist（br を含む）で描画するため改行として
// 効き、OES 側の各表示（表形式・審査員画面など）は表示時に全角スペースへ置換する
// （js 側の displayText 相当の置換を必ず通すこと。textContent へ直接入れると
// "<br>" が文字として見える）。

const DEFAULT_MAX_LENGTH = 200;
const CONTROL_CHAR_MAX_CODE = 31; // C0 制御文字の上限コードポイント
const DEL_CODE = 127; // DEL

// タグ除去をすり抜けさせるための一時トークン（私用領域・入力からは事前に除去する）
const BR_PLACEHOLDER = "\uE000";

/**
 * HTML タグ・制御文字を除去し、前後の空白をトリムした上で maxLength 文字に丸める。
 * <br>（<br/>, <BR > 等の表記ゆれ含む）だけは正規形 "<br>" として保持する。
 * 文字列以外が渡された場合は空文字を返す（呼び出し側で必須チェックすること）。
 * 制御文字の判定は正規表現の制御文字リテラルを避け、コードポイント比較で行う
 * （ソースファイルに実バイトの制御文字を含めないため）。
 */
export function sanitizeText(value: unknown, maxLength = DEFAULT_MAX_LENGTH): string {
  if (typeof value !== "string") return "";
  // 入力に紛れた私用領域トークンは除去（<br> 偽装の防止）
  const withoutToken = value.split(BR_PLACEHOLDER).join("");
  // <br> 系を一時トークンへ退避してからタグ除去（属性・入れ子含め粗く除去。
  // 表示名程度の想定でリッチな解析は不要）
  const withBrToken = withoutToken.replace(/<br\s*\/?\s*>/gi, BR_PLACEHOLDER);
  const withoutTags = withBrToken.replace(/<[^>]*>/g, "");

  let plain = "";
  for (const ch of withoutTags) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= CONTROL_CHAR_MAX_CODE || code === DEL_CODE) continue;
    plain += ch;
  }

  return plain
    .trim()
    .slice(0, maxLength)
    .split(BR_PLACEHOLDER)
    .join("<br>");
}

/**
 * 表示用: sanitizeText 済みテキスト中の "<br>" を全角スペースへ置換する。
 * 表形式など改行させたくない OES 側表示で使う（js 側にも同名相当の置換がある）。
 */
export function brToSpace(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<br\s*\/?\s*>/gi, "　");
}
