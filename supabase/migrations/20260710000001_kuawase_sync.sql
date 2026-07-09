-- 20260710000001_kuawase_sync.sql
-- KHB-Kuawase (kk) 連携基盤: token・候補データ・同期状態テーブルの新設、
-- matches への兼題名/候補参照カラムの追加。
--
-- 仕様: docs/02-kuawase-integration-impl.md (v2) 「データモデル」節。
--
-- アクセス方針:
--   新設3テーブルはいずれも Edge Functions (service_role) からのみ
--   アクセスする設計のため、RLS を有効化した上でポリシーは一切作らない
--   （ポリシーなし = anon/authenticated には完全に deny。
--    service_role は RLS をバイパスするため引き続きアクセス可能）。
--   20260527000001 の token_rate_limits と同じ「ポリシーなしテーブル」の
--   流儀に合わせている。

-- ================================================================
-- kuawase_sync_tokens: kk からの同期接続に使う token（hash 保存）
-- ================================================================
CREATE TABLE IF NOT EXISTS public.kuawase_sync_tokens (
  token_hash    text        PRIMARY KEY,
  token_last4   text        NOT NULL,
  venue_id      uuid        NOT NULL REFERENCES public.venues (id),
  label         text,
  device_id     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  last_seen_at  timestamptz,
  last_event_id text
);

COMMENT ON TABLE  public.kuawase_sync_tokens IS 'kk (KHB-Kuawase) が OES と同期するための token。平文は保存せず hash のみ保持する。';
COMMENT ON COLUMN public.kuawase_sync_tokens.token_hash IS 'token の SHA-256 hex digest。lookup key。';
COMMENT ON COLUMN public.kuawase_sync_tokens.token_last4 IS 'token 末尾4文字。発行済み token を管理画面で識別表示するため（平文は保持しない）。';
COMMENT ON COLUMN public.kuawase_sync_tokens.venue_id IS 'この token が紐づく会場。venue 外のデータには一切アクセスできない。';
COMMENT ON COLUMN public.kuawase_sync_tokens.label IS '発行時に付与する識別用ラベル（任意）。';
COMMENT ON COLUMN public.kuawase_sync_tokens.device_id IS '初回接続時に自動バインドされる kk 側の端末ID。以降、別 device_id からの接続は takeover 扱い。';
COMMENT ON COLUMN public.kuawase_sync_tokens.expires_at IS 'token の有効期限。発行時に指定（既定: 発行から48時間）。';
COMMENT ON COLUMN public.kuawase_sync_tokens.revoked_at IS '管理画面から即時失効させた場合の失効日時。';
COMMENT ON COLUMN public.kuawase_sync_tokens.last_seen_at IS '直近にこの token でアクセスがあった日時。';
COMMENT ON COLUMN public.kuawase_sync_tokens.last_event_id IS '直近に処理した event_id。再送された同一 event_id は冪等に前回結果を返す。';

ALTER TABLE public.kuawase_sync_tokens ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = anon/authenticated からは deny all。service_role (Edge Functions) のみアクセス可能。

-- ================================================================
-- kuawase_candidates: kk からインポートした Excel 候補データ（venue ごとに1セット）
-- ================================================================
CREATE TABLE IF NOT EXISTS public.kuawase_candidates (
  venue_id    uuid        PRIMARY KEY REFERENCES public.venues (id),
  teams       jsonb       NOT NULL,
  kendai      jsonb       NOT NULL,
  excel_hash  text        NOT NULL,
  compe_name  text,
  imported_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.kuawase_candidates IS 'kk からインポートした Excel 候補データ（チーム一覧・兼題一覧）。venue ごとに1セットのみ保持し、再インポート時は upsert する。';
COMMENT ON COLUMN public.kuawase_candidates.venue_id IS 'この候補データが属する会場。';
COMMENT ON COLUMN public.kuawase_candidates.teams IS 'チーム候補一覧。形式: [{ "cell": "B3", "name": "○○高校" }, ...]。句は含まない。';
COMMENT ON COLUMN public.kuawase_candidates.kendai IS '兼題候補一覧。形式: [{ "cell": "H1", "name": "夏の月" }, ...]。';
COMMENT ON COLUMN public.kuawase_candidates.excel_hash IS 'kk 側 excelData の正規化ハッシュ（sha256）。kk 接続時の照合、再インポート時の変更検知に使用。';
COMMENT ON COLUMN public.kuawase_candidates.compe_name IS '大会名（kk 側 excelData の "B1" セル由来）。';
COMMENT ON COLUMN public.kuawase_candidates.imported_at IS '直近のインポート日時。';

ALTER TABLE public.kuawase_candidates ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = anon/authenticated からは deny all。service_role (Edge Functions) のみアクセス可能。

-- ================================================================
-- kuawase_sync_status: venue ごとの kk 連携有効フラグ・直近の表示状態
-- ================================================================
CREATE TABLE IF NOT EXISTS public.kuawase_sync_status (
  venue_id        uuid        PRIMARY KEY REFERENCES public.venues (id),
  enabled         boolean     NOT NULL DEFAULT false,
  source_device_id text,
  last_view       jsonb,
  last_synced_at  timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.kuawase_sync_status IS 'venue ごとの kk 連携状態。enabled=false の venue では OES は連携由来の警告・ロックを一切出さず、単独使用と完全互換に動作する。';
COMMENT ON COLUMN public.kuawase_sync_status.venue_id IS 'この連携状態が属する会場。';
COMMENT ON COLUMN public.kuawase_sync_status.enabled IS 'この venue で kk 連携が有効かどうか。false の場合は従来動作（単独使用）。';
COMMENT ON COLUMN public.kuawase_sync_status.source_device_id IS '現在バインドされている kk 側の端末ID。';
COMMENT ON COLUMN public.kuawase_sync_status.last_view IS '直近に kk から報告された表示状態（揮発扱い、admin ライブ表示専用）。形式: { "source_page": "3.html", "slot": 3, "match_code": "A-1" }。';
COMMENT ON COLUMN public.kuawase_sync_status.last_synced_at IS '直近に kk から報告/操作を受け付けた日時。';
COMMENT ON COLUMN public.kuawase_sync_status.updated_at IS 'この行の最終更新日時。';

ALTER TABLE public.kuawase_sync_status ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = anon/authenticated からは deny all。service_role (Edge Functions) のみアクセス可能。

-- ================================================================
-- matches: kk 連携用カラムの追加（すべて nullable。OES 単独使用時は null のまま）
-- ================================================================
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS kendai_name text;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS kuawase_ref jsonb;

COMMENT ON COLUMN public.matches.kendai_name IS '兼題名。候補データからの選択、または手入力（OES 単独使用時）。nullable。';
COMMENT ON COLUMN public.matches.kuawase_ref IS 'kuawase_candidates 由来のセルキー参照。候補データから試合設定した場合のみ設定され、kk へのプリセット配信に使う。nullable。形式: { "red_cell": "B3", "white_cell": "B5", "kendai_cell": "H1", "excel_hash": "..." }。';
