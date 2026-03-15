# 将来の改善項目

このドキュメントでは、現在のコードベースで検討すべき改善項目について説明します。

---

## 1. マニュアル類の状況

### 現状

- ✅ `user-guide.md`: 最新の状態
- ✅ `developer-guide.md`: 最新の状態
- ✅ `codebase-audit-todo.md`: 2026-03-13 の修正まで反映済み

### 結論

今回の修正（M15-M18, L16）は内部実装の改善のため、ユーザー向けマニュアルへの影響はありません。
マニュアル類の更新は不要です。

---

## 2. current_match=false 時の進行操作を禁止する

### 問題の詳細

**対象:** `admin.html` の進行操作（受付開始/停止、E5、E6、Epoch 手動設定）

管理画面では選択中の試合を閲覧できる一方で、進行操作の実体は会場ごとの `state.current_match_id` に対して行われる。
このため、選択中試合が `current_match=false` の状態でも `accepting=true` や `epoch` の操作ができてしまい、
「見ている試合」と「実際に更新される state」がずれる。

### 問題点

- 操作者には選択中の試合を操作しているように見える
- 実際には別の `current_match_id` を持つ試合の `state` が更新されうる
- `accepting` / `epoch` の手動操作は試合進行に直結するため、運用事故の影響が大きい

### 推奨方針

最も安全なのは、`current_match=false` のときは state 操作を全面的に禁止すること。

- `受付開始/停止`
- `E5`
- `E6`
- `Epoch設定`

を disabled にし、「現在の試合に切り替えてから操作してください」と明示する。

### 代替案

1. state 操作前に、選択中試合を自動で current match に同期する
2. 閲覧用 UI と進行操作用 UI を明確に分離する

ただし 1 は暗黙の対象切替で分かりにくく、2 は UI 変更量が大きい。
短期的には「current_match=false なら操作禁止」が妥当。

---

## 3. L14: 設定ファイルのハードコード問題

### 問題の詳細

**ファイル:** `js/config.js`

```javascript
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
```

**問題点:**
- localhost URLがハードコードされている
- 本番環境にデプロイすると動作しない
- ローカル開発用のanon keyが本番環境で使われてしまう

---

### 解決策の選択肢

#### 方法1: 手動置換

**デプロイ前:**
```bash
cp js/config.js js/config.prod.js
# config.prod.js を手動で編集
```

**デプロイ時:**
```bash
cp js/config.prod.js js/config.js
git add js/config.js
git commit -m "chore: use production config"
git push production main
git reset --hard HEAD~1  # ローカル用に戻す
```

**メリット:** シンプル、追加ツール不要
**デメリット:** 手動操作でミスしやすい、Gitに本番keyが残る

---

#### 方法2: .gitignore + テンプレート（推奨）

**初期セットアップ:**

1. `js/config.example.js` を作成:

```javascript
const SUPABASE_URL = '%%SUPABASE_URL%%';
const SUPABASE_ANON_KEY = '%%SUPABASE_ANON_KEY%%';

const appConfig = Object.freeze({
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  JUDGE_FUNCTION_URL: SUPABASE_URL + '/functions/v1/judge-submit-with-token',
});

window.KHB_APP_CONFIG = appConfig;
```

2. `.gitignore` に追加:

```gitignore
# 環境固有の設定ファイル
js/config.js
```

3. README に記載:

```markdown
## セットアップ

1. `js/config.example.js` を `js/config.js` にコピー
2. Supabaseの認証情報（URL, anon key）を設定
```

**デプロイスクリプト（deploy.sh）:**

```bash
#!/bin/bash
set -e

# 環境変数から本番設定を注入
cp js/config.example.js js/config.js
sed -i "s|%%SUPABASE_URL%%|$PROD_SUPABASE_URL|g" js/config.js
sed -i "s|%%SUPABASE_ANON_KEY%%|$PROD_SUPABASE_ANON_KEY|g" js/config.js

# デプロイ処理
# ...
```

**GitHub Actions例:**

```yaml
- name: Configure production settings
  run: |
    cp js/config.example.js js/config.js
    sed -i "s|%%SUPABASE_URL%%|${{ secrets.SUPABASE_URL }}|g" js/config.js
    sed -i "s|%%SUPABASE_ANON_KEY%%|${{ secrets.SUPABASE_ANON_KEY }}|g" js/config.js
```

**メリット:**
- 本番keyがGitに入らない（セキュア）
- CI/CDで自動化しやすい
- 環境ごとの設定を明確に分離

**デメリット:**
- 初回セットアップが少し面倒
- デプロイスクリプトが必要

---

#### 方法3: ビルドツール（Vite等）で環境変数注入

**package.json:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

**js/config.js:**

```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**.env.development:**

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

**.env.production:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**デプロイ時:**

```bash
npm run build  # dist/ に本番用のファイルが生成される
```

**メリット:**
- 環境ごとの切り替えが完全自動
- モダンな開発環境
- ホットリロード等の開発体験向上

**デメリット:**
- ビルドステップが必須（静的HTMLではなくなる）
- プロジェクトが複雑化
- Node.js環境が必要

---

### 推奨アプローチ

**現時点では「方法2」（.gitignore + テンプレート）が最適です：**

1. ✅ シンプル（ビルドツール不要）
2. ✅ 安全（本番keyがGitに入らない）
3. ✅ 自動化可能（CIパイプラインで対応可）
4. ✅ 既存のプロジェクト構造を維持

---

## 3. L17: `parseOrZero` の型安全性不足

### 問題の詳細

**ファイル:** `js/judge.js:11-15`

**現在の実装:**

```javascript
function parseOrZero(s) {
  if (!s) return 0;  // 空文字列、null、undefined すべて0になる
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
```

**問題点:**

セレクト要素の未選択状態（`value=""`）も0として扱われるため、「未選択」と「0点」を区別できません。

---

### 問題が起きる具体的なシナリオ

#### シナリオ1: セレクト要素の未選択

**HTML:**

```html
<select class="works" data-side="red">
  <option value="">-- 選択してください --</option>
  <option value="5">5点</option>
  <option value="6">6点</option>
  <option value="7">7点</option>
</select>
```

**ユーザー操作:**
1. 審査員が「-- 選択してください --」のまま（`value=""`）
2. 「送信」ボタンを押す

**現在の挙動:**

```javascript
const redWork = parseOrZero(redElems.works.value);
// redElems.works.value === "" → parseOrZero("") → 0
```

→ **0点として送信されてしまう**

---

#### シナリオ2: 将来のコード変更でバグが再発

誰かが以下のように変更すると：

```javascript
// 悪い例：M6の検証を削除
async function sendToServer(isEdit) {
  // ... hasSelectedValue チェックを削除 ...
  const payload = {
    red: {
      work: parseOrZero(red.works && red.works.value),  // 未選択でも0になる
      // ...
    }
  };
}
```

→ 未選択が0点として送信される脆弱性が復活

---

### 修正案: `parseOrNull` 関数を追加

```javascript
function parseOrNull(s) {
  if (!s || s === '') return null;  // 明示的にnullを返す
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseOrZero(s) {
  const result = parseOrNull(s);
  return result !== null ? result : 0;
}
```

#### 使用例: より厳密なバリデーション

```javascript
async function sendToServer(isEdit) {
  const red = {
    work: parseOrNull(redElems.works.value),
    app: parseOrNull(redElems.app.value),
  };

  const white = {
    work: parseOrNull(whiteElems.works.value),
    app: parseOrNull(whiteElems.app.value),
  };

  // nullチェックで未選択を検出
  if (red.work === null || white.work === null) {
    setResult('作品点を両チームとも選択してください。', false);
    return false;
  }

  // 0点と未選択を区別できる
  if (red.app === null) red.app = 0;  // 鑑賞点は0でもOK
  if (white.app === null) white.app = 0;

  const payload = { red, white, isEdit };
  // ...
}
```

---

### メリット・デメリット

#### メリット:
- ✅ 未選択と0点を明確に区別できる
- ✅ 将来のバグ（M6の検証削除など）を防げる
- ✅ TypeScript導入時に型安全性が向上

#### デメリット:
- ❌ 既存コードの多くの箇所（20箇所以上）で`parseOrZero`を使っているため、変更の影響範囲が大きい
- ❌ テストが不十分だとバグを埋め込むリスク
- ❌ **現状ではM6の検証があるため、修正の実益が少ない**

---

### 結論

**L17は現時点で修正不要です：**

1. ✅ M6で入力検証が入っているため、未選択の送信は既に防止されている
2. ✅ 修正の実益よりもリスクの方が大きい
3. ✅ 将来TypeScript化する際に型システムで解決できる

**ただし、以下の場合は修正を検討すべき:**
- TypeScript へ移行する
- フォームバリデーションを大幅に変更する
- バックエンドAPIが`null`と`0`を区別する必要がある

---

## 4. Supabase Realtime への移行

### 現在のポーリング方式の問題点

**現状（`js/admin-core.js`, `js/obs-scoreboard.js`等）:**

```javascript
// 2秒ごとにデータを取得
setInterval(() => {
  loadData(true);
}, 2000);
```

**問題:**

1. **ネットワーク負荷**: 2秒ごとに5〜6個のREST APIリクエスト
2. **遅延**: データ変更から最大2秒の遅延
3. **無駄な通信**: 変更がなくても毎回取得
4. **バッテリー消費**: モバイル端末で不利

**具体例:**

- 管理画面（admin.html）が10台開いている
- 10台 × 6リクエスト/2秒 = **毎秒30リクエスト**
- 1時間で **108,000リクエスト**

---

### Supabase Realtime とは

Supabase が提供する WebSocket ベースのリアルタイム通信機能。
データベースの変更を **PostgreSQL の LISTEN/NOTIFY** 機能で検知し、接続中のクライアントに即座に通知します。

**仕組み:**

```
PostgreSQL
  ↓ (INSERT/UPDATE/DELETE)
  ↓ WAL (Write-Ahead Log)
  ↓
Realtime Server (Elixir)
  ↓ WebSocket
  ↓
Browser (JavaScript)
```

---

### コード比較

#### 現在のコード（ポーリング）:

```javascript
// js/admin-core.js
setInterval(async () => {
  const matches = await fetchJson('matches', { ... });
  const subs = await fetchJson('submissions', { ... });
  updateUI(matches, subs);
}, 2000);
```

#### Realtime移行後:

```javascript
// js/admin-core.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 初回読み込み
const { data: initialData } = await supabase
  .from('submissions')
  .select('*')
  .eq('match_id', matchId)
  .eq('epoch', epoch);

updateUI(initialData);

// リアルタイム購読
const channel = supabase
  .channel('submissions-changes')
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'submissions',
      filter: `match_id=eq.${matchId}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // payload.new にデータが入っている
      updateUI(payload.new);
    }
  )
  .subscribe();

// クリーンアップ
// supabase.removeChannel(channel);
```

---

### 移行に必要な作業

#### 1. Supabase側の設定（Realtime有効化）

Supabase ダッシュボード → Database → Replication:

```sql
-- 対象テーブルでReplicationを有効化
ALTER TABLE submissions REPLICA IDENTITY FULL;
ALTER TABLE state REPLICA IDENTITY FULL;
ALTER TABLE expected_judges REPLICA IDENTITY FULL;
```

#### 2. RLSポリシーの確認

Realtime は `anon` ロールで動作するため、SELECT ポリシーが必要です（既に設定済み）。

#### 3. フロントエンドコードの書き換え

**対象ファイル:**

- `js/admin-core.js` (管理画面の自動更新)
- `js/obs-scoreboard.js` (OBSスコアボード)
- `js/obs-scoreboard-vertical.js`
- `js/winnum-obs-overlay.js`

**作業量:** 各ファイル 50〜100行の修正

#### 4. テスト

- 複数ブラウザで同時に開いて、片方で変更したときに即座に反映されるか
- ネットワーク切断→再接続時の挙動
- 大量の変更が連続した場合のパフォーマンス

---

### メリット・デメリット比較

| 項目 | ポーリング | Realtime |
|------|-----------|----------|
| 遅延 | 0〜2秒 | **即座（<100ms）** |
| ネットワーク | 6 req/2秒 | **WebSocket 1本** |
| CPU使用率 | setInterval常時実行 | **イベント駆動** |
| バッテリー | 高 | **低** |
| UX | 遅れて更新 | **リアルタイム更新** |
| 複雑性 | 低 | **中〜高** |
| デバッグ難易度 | 低 | **中〜高** |
| Supabase依存 | 低 | **高** |

**具体的な改善効果:**

- 審査員Aが採点送信 → 管理画面に**即座に**表示
- 管理者がE5確定 → OBSスコアボードが**即座に**更新
- ネットワークトラフィックが **90%削減**

---

### 移行の優先度

#### 高優先度の箇所:

1. **OBSスコアボード** (`obs-scoreboard.js`) → 配信に即座に反映させたい
2. **管理画面** (`admin-core.js`) → 審査員の提出を即座に確認したい

#### 低優先度の箇所:

- 審査員画面 (`judge.html`) → 5秒ポーリングで十分（自分の採点しか見ない）

---

### 実装ステップ

#### Phase 1: OBSスコアボード（最小限の変更）

1. `obs-scoreboard.js` でRealtime購読を実装
2. ローカル環境でテスト
3. 本番環境で試験運用

#### Phase 2: 管理画面

1. `admin-core.js` でRealtime購読を実装
2. 複数の管理者が同時に操作する場合のテスト

#### Phase 3: その他の画面

1. `winnum-obs-overlay.js`
2. `snapshot_viewer.js`（必要に応じて）

---

## まとめ

| 項目 | 優先度 | 推奨アクション |
|------|--------|--------------|
| **マニュアル** | - | ✅ 更新不要（最新） |
| **L14: config.js** | 中 | デプロイ前に対応（方法2推奨） |
| **L17: parseOrZero** | 低 | 現状維持（TypeScript化時に対応） |
| **Realtime移行** | 高 | Phase 1（OBS）から段階的に実施 |

---

## 次のステップ

1. **即座に対応:** なし（コードベースは安定）
2. **デプロイ前に対応:** L14（config.example.js作成）
3. **中長期で検討:** Realtime移行（大きなUX改善効果）
