# セキュリティ分析レポート — KHB Online Sheet

**分析日**: 2026-05-25  
**対象**: Supabase ベースのトーナメント採点 Web アプリケーション  
**全体リスクレベル**: **HIGH**

---

## エグゼクティブサマリー

Supabase + Deno Edge Functions 構成のアプリ。タイミングセーフ比較や RLS 設計など良い点はあるが、**API キーの平文露出・HTTPS 未設定・レート制限なし** など即時対応が必要な重大問題が複数存在する。

---

## 1. 認証・認可

### 強み
- 審判トークンは `khb-` プレフィックス付きランダム hex（暗号論的乱数）
- `timingSafeEqual()` によるタイミング攻撃対策（`supabase/functions/_shared/secret.ts` L3-14）
- Supabase RLS でテーブルアクセス制御

### 脆弱性

#### CRITICAL: Supabase Anon キーのハードコード
- **場所**: `js/config.js` L3
- **内容**: `const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';`
- **影響**: Git 履歴・ブラウザ開発ツールから誰でも取得可能。`old/` 配下の HTML にも別キーが存在
- **対処**: 該当キーを即時失効・再発行。環境変数またはバックエンドプロキシ経由で提供

#### HIGH: トークンにレート制限・有効期限なし
- **場所**: `supabase/functions/judge-submit-with-token/index.ts` L73-83
- **内容**: DB に平文で保存されたトークンを直接ルックアップ。総当たり対策なし
- **対処**: トークンを DB に**ハッシュ化**して保存、有効期限カラム追加、レート制限実装

---

## 2. 入力バリデーション

### 強み
- `esc()` 関数で XSS エスケープ（`js/admin-judges.js` L337-341）— innerHTML への直接埋め込みなし
- Supabase SDK でパラメータ化クエリ — SQL インジェクションなし

### 脆弱性

#### MEDIUM: スコアが整数チェックなし
- **場所**: `supabase/functions/judge-submit-with-token/index.ts` L271-300
- **内容**: `Number.isFinite(v)` のみで浮動小数点（例: 5.5）を許容
- **対処**: `Number.isInteger(v)` に変更

#### LOW: 文字列長の上限なし
- **場所**: `supabase/functions/admin-add-judge/index.ts` L67
- **内容**: 名前・コード等に `maxLength` バリデーションなし
- **対処**: `name.length > 255` 等の上限チェック追加

---

## 3. 機密情報の扱い

### CRITICAL: Anon キーが Git 履歴に存在
- `js/config.js` 現在のコードおよび `old/` 配下の複数 HTML ファイルに露出
- Git 履歴を rewrite しても GitHub 上にキャッシュが残る可能性あり — **まず失効処理を優先**

### MEDIUM: `.env` にテスト用シークレット
- `supabase/functions/.env`: `ADMIN_SETUP_SECRET=local-test-secret`（`.gitignore` 対象 — 現状は Git 管理外）
- ローカル環境が侵害された場合にリスク

### LOW: ローカル URL のハードコード
- `js/config.js` L2: `http://127.0.0.1:54321`（本番/開発の切り替えが手動）

---

## 4. ネットワークセキュリティ

### HIGH: HTTPS 未設定
- **場所**: `docker-compose.yml`
- **内容**: `ports: "8080:80"` — 平文 HTTP のみ。審判トークンが平文で流れる
- **対処**: nginx に TLS 設定、HTTPS リダイレクト強制

### MEDIUM: CORS で HTTP オリジンを許可
- **場所**: `supabase/functions/_shared/cors.ts`
- **内容**:
  ```typescript
  if (!origin) return true;  // Origin ヘッダーなしを無条件許可
  ```
  - `http://127.0.0.1:*` と `http://localhost:*` を許可（HTTP）
  - `https://blackstraysheep.github.io` が本番コードに含まれる
- **対処**: Origin なしを拒否、本番では HTTPS オリジンのみ許可、GitHub Pages オリジンを環境変数で管理

### LOW: Content Security Policy (CSP) 未設定
- 全 HTML ファイルに CSP ヘッダーなし — XSS 成功時の被害を拡大させる
- **対処例**:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co;
  ```

---

## 5. クライアントサイドセキュリティ

### MEDIUM: 管理シークレットが DOM に残存
- **場所**: `html/admin.html` L48、`js/admin-api.js` L58
- **内容**: パスワード入力欄の値を都度読み出す設計。送信後もメモリ/DOM に残る
- **対処**: 送信後に入力をクリア、セッショントークン方式への移行を検討

### LOW: 管理セッションのタイムアウトなし
- 正しいシークレットを一度入力すれば無期限有効
- **対処**: 30-60 分でセッション失効、再入力を要求

### LOW: CDN スクリプトに SRI (Subresource Integrity) なし
- **場所**: `html/admin.html` L115
- **内容**: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">` — integrity 属性なし
- **対処**: `integrity="sha384-..."` 属性を付与

---

## 6. Docker / インフラ

### MEDIUM: root ユーザーでコンテナ実行
- デフォルト nginx イメージは root で動作。コンテナ侵害 = ホスト権限昇格リスク
- **対処**: Dockerfile に `USER nginx` を追加

### MEDIUM: ヘルスチェックなし
- `docker-compose.yml` に `healthcheck` 未設定
- **対処**:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/"]
    interval: 30s
    timeout: 10s
    retries: 3
  ```

### LOW: ルートファイルシステムが書き込み可能
- `read_only: true` を設定し、書き込みが必要なディレクトリのみボリュームマウント

---

## 7. データ露出

### MEDIUM: 試合スコア (submissions) が匿名ユーザーに公開
- **場所**: `supabase/migrations/20260304000001_enable_rls.sql` L43
- **内容**: `USING (true)` — anon ロールがすべてのスコアを閲覧可能
- **影響**: 発表前に結果が漏れる / 不正操作の温床
- **対処**: 認証済み管理者・当該審判のみに制限

### MEDIUM: 試合情報 (matches) も同様に完全公開
- **場所**: 同ファイル L75
- **内容**: `USING (true)` — 全試合スケジュール・チーム名が誰でも参照可能
- **対処**: 公開情報か非公開情報かを要件で確認し、必要なら認証必須に変更

---

## 8. レート制限 / ブルートフォース対策

### HIGH: トークン検証にレート制限なし
- 毎秒何度でもトークン投稿が可能 — DB 過負荷・トークン総当たりのリスク

### HIGH: 管理エンドポイントにレート制限なし
- 正しいシークレットがあれば無制限にリクエスト可能

**対処**: Supabase Edge Functions または上位 API Gateway でレート制限を実装（例: IP ベースで 100 req/min）

---

## 9. 監査ログ

### 強み
- `event_log` テーブルに E1-E6 イベントを記録
- `submissions` テーブルに `revision`・`updated_at` による変更追跡

### 弱点
- 審判追加・削除などの**管理操作が未ロギング**
- 認証失敗（不正トークン試行）が未記録
- 管理画面へのアクセスログなし

---

## 優先度別アクションリスト

| 優先度 | 項目 | 場所 |
|--------|------|------|
| CRITICAL | Supabase Anon キーを**即時失効・再発行** | `js/config.js` L3 |
| CRITICAL | 全 HTML ファイルから露出キーを削除 | `old/*.html` |
| HIGH | HTTPS / TLS を設定 | `docker-compose.yml` |
| HIGH | トークン総当たり対策（レート制限・有効期限・ハッシュ化） | Edge Functions |
| HIGH | CORS: HTTP オリジン削除・空 Origin を拒否 | `_shared/cors.ts` |
| MEDIUM | submissions / matches の RLS を匿名公開から制限 | RLS ポリシー |
| MEDIUM | 管理シークレット送信後に入力をクリア | `admin-api.js` |
| MEDIUM | CSP ヘッダー追加 | nginx 設定 / HTML |
| MEDIUM | コンテナを非 root ユーザーで実行 | Dockerfile |
| LOW | CDN スクリプトに SRI 属性付与 | `admin.html` L115 |
| LOW | 管理セッションタイムアウト実装 | フロント JS |
| LOW | スコアを整数バリデーションに変更 | Edge Function |
| LOW | Docker ヘルスチェック追加 | `docker-compose.yml` |

---

*このレポートは自動解析 + 手動確認を組み合わせて作成。本番デプロイ前に専門家によるペネトレーションテストを推奨。*
