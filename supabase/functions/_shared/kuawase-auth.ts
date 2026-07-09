// supabase/functions/_shared/kuawase-auth.ts
// KHB-Kuawase 連携用 sync token の共通認可処理。
// 参照: docs/02-kuawase-integration-impl.md 「API」「確定事項一覧 #7,#8,#10,#13」
import { sha256Hex } from "./token.ts";
import { isAllowedOrigin } from "./cors.ts";

// deno-lint-ignore no-explicit-any
type SupabaseClientLike = any;

export type KuawaseSyncTokenRow = {
  token_hash: string;
  venue_id: string;
  token_last4: string | null;
  label: string | null;
  device_id: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
  last_event_id: string | null;
};

export type KuawaseDeviceWarning = {
  code: "TAKEN_OVER";
  detail: string;
  previous_device_id: string | null;
};

export type KuawaseAuthFailure = {
  ok: false;
  status: number;
  error: string;
};

export type KuawaseAuthSuccess = {
  ok: true;
  tokenRow: KuawaseSyncTokenRow;
  deviceWarning?: KuawaseDeviceWarning;
};

export type KuawaseAuthResult = KuawaseAuthFailure | KuawaseAuthSuccess;

/**
 * KHB-Kuawase (Electron main プロセス) からのリクエスト向け Origin 判定。
 *
 * kk の main プロセスからの fetch は Origin ヘッダを送らない。この系統の関数では
 * 「Origin ヘッダが無いリクエストは無条件で許可する（認可は sync token 自体が担う）」
 * 「Origin がある場合は既存の isAllowedOrigin（allowlist）で判定する」とする。
 * ALLOW_NO_ORIGIN_REQUESTS 環境変数には依存しない（既存 isAllowedOrigin 経由での
 * 無条件許可判定を使わないよう、ここで独自に Origin 有無を先に見る）。
 */
export function isAllowedKuawaseOrigin(req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!origin) return true;
  return isAllowedOrigin(req);
}

/**
 * `x-kuawase-sync-token` ヘッダを検証し、対応する venue の token 行を返す。
 * 併せて device_id のバインド処理（初回自動バインド／takeover）を行う。
 *
 * - token 不備・無効・失効・期限切れ: 401
 * - device_id 不備: 400
 * - 別端末が既にバインド済みで takeover 指定なし: 409 (`device_conflict`)
 *
 * 成功時は last_seen_at を更新した token 行（venue_id 含む）を返す。
 * takeover が成立した場合は `deviceWarning` に `TAKEN_OVER` を付与する
 * （呼び出し側はこれをレスポンスの warnings に積む）。
 */
export async function authorizeKuawaseSync(
  supabase: SupabaseClientLike,
  req: Request,
  body: { device_id?: unknown; takeover?: unknown } | null,
): Promise<KuawaseAuthResult> {
  const rawToken = req.headers.get("x-kuawase-sync-token");
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!token) {
    return { ok: false, status: 401, error: "missing sync token" };
  }

  const tokenHash = await sha256Hex(token);
  const { data: tokenRow, error } = await supabase
    .from("kuawase_sync_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("kuawase_sync_tokens select error", error);
    return { ok: false, status: 500, error: "failed to verify sync token" };
  }
  if (!tokenRow) {
    return { ok: false, status: 401, error: "invalid sync token" };
  }
  if (tokenRow.revoked_at) {
    return { ok: false, status: 401, error: "sync token revoked" };
  }
  if (
    !tokenRow.expires_at ||
    new Date(tokenRow.expires_at).getTime() <= Date.now()
  ) {
    return { ok: false, status: 401, error: "sync token expired" };
  }

  const deviceId = typeof body?.device_id === "string"
    ? body.device_id.trim()
    : "";
  if (!deviceId) {
    return { ok: false, status: 400, error: "device_id is required" };
  }
  const takeover = body?.takeover === true;

  const nowIso = new Date().toISOString();
  const updatePatch: Record<string, unknown> = { last_seen_at: nowIso };
  let deviceWarning: KuawaseDeviceWarning | undefined;

  if (!tokenRow.device_id) {
    // 初回接続: device_id を自動バインドする
    updatePatch.device_id = deviceId;
  } else if (tokenRow.device_id !== deviceId) {
    if (!takeover) {
      // 別端末が既にバインド済み。明示的な takeover が無ければ拒否する
      return { ok: false, status: 409, error: "device_conflict" };
    }
    // takeover: 旧バインドを上書きし、警告として記録する
    updatePatch.device_id = deviceId;
    deviceWarning = {
      code: "TAKEN_OVER",
      detail: `device ${tokenRow.device_id} was replaced by ${deviceId}`,
      previous_device_id: tokenRow.device_id,
    };
  }

  const { error: updateError } = await supabase
    .from("kuawase_sync_tokens")
    .update(updatePatch)
    .eq("token_hash", tokenHash);
  if (updateError) {
    // last_seen_at / device_id の更新失敗は致命的ではないため処理は続行する
    console.error("kuawase_sync_tokens update error", updateError);
  }

  const resultRow: KuawaseSyncTokenRow = {
    ...tokenRow,
    device_id: typeof updatePatch.device_id === "string"
      ? updatePatch.device_id
      : tokenRow.device_id,
    last_seen_at: nowIso,
  };

  return { ok: true, tokenRow: resultRow, deviceWarning };
}
