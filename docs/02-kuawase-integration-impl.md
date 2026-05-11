# 実装計画：kuawase 連携（2026-05-11）

## 概要

kuawase（オフライン動作の投句・句表示管理）とOES（採点管理）を連携させ、kuawase側で試合進行を操作してOES側に自動反映させます。

## 要件確定

- **kuawase ランタイム**: オフライン動作を維持（オンライン時のみ連携）
- **トークン方式**: OES側で連携トークンを発行 → kuawaseに入力
- **反映モード**: 自動反映（即座にstatを更新）、提案は初期段階では不要
- **UIレイアウト**: kuawaseのadmin窓にOES状態パネル + 簡略版UIを埋め込み

---

## API エンドポイント（新規 5個）

### 1. kuawase-generate-sync-token

**用途**: OES管理画面でトークンを生成 → kuawaseに入力させる

**リクエスト**:
```typescript
POST /functions/v1/kuawase-generate-sync-token
{
  "admin_secret": "...",
  "tournament_id": "khb26-uuid"
}
```

**レスポンス**:
```json
{
  "ok": true,
  "token": "khb26-sync-a1b2c3d4e5f6g7h8",
  "expires_at": "2026-05-12T...",
  "expires_in_hours": 24
}
```

**実装**:
- トークン形式: `{tournament_code}-sync-{hex16}`
- 有効期限: 24時間（デフォルト）
- `kuawase_sync_tokens` テーブルに保存
- 監査ログ: KUAWASE_TOKEN_GENERATED

---

### 2. kuawase-state-check

**用途**: kuawaseがOES状態をreadonly取得

**リクエスト**:
```
GET /functions/v1/kuawase-state-check
Header: x-kuawase-sync-token: khb26-sync-xxxx
```

**レスポンス**:
```json
{
  "ok": true,
  "tournament": { "id": "...", "code": "khb26", "name": "2026本大会" },
  "states": [
    { "venue_id": "...", "epoch": 3, "accepting": true, "e3_reached": false }
  ],
  "matches": [
    { "id": "...", "code": "A-1", "name": "...", "red_team_name": "紅", "white_team_name": "白", "num_bouts": 5 }
  ]
}
```

**実装**:
- トークン検証（有効期限、revoked_at チェック）
- tournament_id で state と matches をフィルタ
- 監査ログ: KUAWASE_STATE_CHECK（トークンhashのみ記録）
- last_used_at を更新

---

### 3. kuawase-sync-event

**用途**: kuawaseがOES側にイベント送信（試合進行の反映）

**リクエスト**:
```typescript
POST /functions/v1/kuawase-sync-event
Header: x-kuawase-sync-token: khb26-sync-xxxx
{
  "event_type": "BOUT_CHANGED",
  "payload": {
    "bout": "中堅",
    "bout_slot": 3,
    "match_code": "A-1"
  }
}
```

**イベント種類**:
- `BOUT_CHANGED`: 対戦変更（kuawaseで「中堅戦」に切替 → OESでepoch=3に変更）
- `MATCH_CHANGED`: 試合変更（kuawaseで別試合に切替 → `event_log`記録のみ）

**レスポンス**:
```json
{ "ok": true }
```

**実装（BOUT_CHANGED）**:
```typescript
const match = await db.from('matches')
  .select('id, num_bouts')
  .eq('code', payload.match_code)
  .eq('tournament_id', tournament_id)
  .single();

const newEpoch = payload.bout_slot;

const states = await db.from('state')
  .select('*')
  .eq('tournament_id', tournament_id);

for (const st of states.data) {
  // E6実行と同等：epoch + accepting + e3_reached reset
  await db.from('state')
    .update({
      epoch: newEpoch,
      accepting: true,
      e3_reached: false,
      updated_at: new Date().toISOString()
    })
    .eq('venue_id', st.venue_id);
}

// 監査ログ
await db.from('event_log').insert({
  event_type: 'KUAWASE_SYNC_BOUT_CHANGED',
  tournament_id,
  detail: {
    token_hash: token.slice(0, 12) + '***',
    payload,
    received_at: new Date().toISOString()
  }
});
```

---

### 4. kuawase-admin-widget

**用途**: kuawaseのadmin窓に埋め込むOES状態表示UI（readonly）

**リクエスト**:
```
GET /functions/v1/kuawase-admin-widget?token=khb26-sync-xxxx
```

**レスポンス**: HTML（readonly状態表示パネル）

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .widget { ... }
    .state-item { ... }
  </style>
</head>
<body>
  <div class="widget">
    <h3>OES 状態</h3>
    <div id="content">読み込み中...</div>
  </div>
  <script>
    // kuawase-state-checkを呼び出し
    // 5秒ごと更新
  </script>
</body>
</html>
```

**表示内容**:
- 会場別のcurrent epoch
- accepting/受付停止 状態
- 試合コード・チーム名

---

### 5. kuawase_sync_tokens テーブル（新規）

```sql
CREATE TABLE kuawase_sync_tokens (
  token text PRIMARY KEY,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  created_by text,                         -- 管理者ID
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  CONSTRAINT not_double_revoke CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX idx_kuawase_sync_tokens_active ON kuawase_sync_tokens(tournament_id)
  WHERE revoked_at IS NULL AND expires_at > now();
```

---

## 管理画面UI（admin.html / admin.js）

### kuawase 連携パネル

```html
<div class="card">
  <h2>kuawase 連携</h2>
  <div id="kuawaseSyncPanel">
    <p>現在の大会: <strong id="syncTournamentName">（未選択）</strong></p>
    <div class="button-group">
      <button id="btnGenerateSyncToken" class="btn-blue" onclick="generateSyncToken()">
        連携トークンを生成
      </button>
      <button id="btnRevokeSyncToken" class="btn-grey" onclick="revokeSyncToken()" style="display: none;">
        トークンを取り消す
      </button>
    </div>
    <div id="tokenDisplay" style="display: none;">
      <p><strong>連携トークン（kuawaseに入力してください）:</strong></p>
      <div class="token-box">
        <input id="tokenValue" type="text" readonly />
        <button onclick="copyToClipboard(document.getElementById('tokenValue'))">コピー</button>
      </div>
      <p>有効期限: <span id="tokenExpiry">24時間</span></p>
      <p class="small-text">ハッシュ: <code id="tokenHash"></code></p>
    </div>
  </div>
</div>
```

**JavaScript**:

```javascript
async function generateSyncToken() {
  if (!currentTournamentId) {
    alert('大会を選択してください');
    return;
  }

  try {
    const resp = await fetch(`${EDGE_FUNCTION_URL}/kuawase-generate-sync-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_secret: ADMIN_SECRET,
        tournament_id: currentTournamentId
      })
    });

    const data = await resp.json();
    if (!data.ok) throw new Error(data.error);

    document.getElementById('tokenValue').value = data.token;
    document.getElementById('tokenHash').textContent = data.token.slice(0, 16) + '***';
    document.getElementById('tokenExpiry').textContent = `${data.expires_in_hours}時間`;
    document.getElementById('tokenDisplay').style.display = 'block';
    document.getElementById('btnGenerateSyncToken').style.display = 'none';
    document.getElementById('btnRevokeSyncToken').style.display = 'inline-block';

  } catch (err) {
    alert('トークン生成エラー: ' + err.message);
  }
}

async function revokeSyncToken() {
  if (confirm('このトークンを取り消しますか？')) {
    // API呼び出し（実装省略）
    document.getElementById('tokenDisplay').style.display = 'none';
    document.getElementById('btnGenerateSyncToken').style.display = 'inline-block';
    document.getElementById('btnRevokeSyncToken').style.display = 'none';
  }
}
```

---

## kuawase側の実装例

### admin窓に OES連携パネル追加

```html
<div id="oes-sync-section" class="section">
  <h3>OES連携</h3>
  
  <!-- トークン入力 -->
  <div class="input-section">
    <label>OES連携トークン:</label>
    <input id="oesToken" type="password" placeholder="khb26-sync-..." />
    <button onclick="connectOES()">接続テスト</button>
  </div>

  <!-- OES状態パネル（iframe）-->
  <div id="oesStatePanel" style="display: none;">
    <iframe id="oesWidget" src="" style="width: 100%; height: 300px; border: 1px solid #ccc;"></iframe>
  </div>

  <!-- 同期ボタン -->
  <div class="button-section" style="display: none;" id="syncButtons">
    <button onclick="syncBoutToOES()">この対戦をOESに反映</button>
    <button onclick="refreshOESState()">OES状態を更新</button>
  </div>
</div>
```

**JavaScript**:

```javascript
const oesConfig = {
  token: null,
  edgeFunctionUrl: 'https://khb-oes.example/functions/v1'
};

async function connectOES() {
  const token = document.getElementById('oesToken').value.trim();
  
  try {
    // 状態確認のため state-check を呼び出し
    const resp = await fetch(`${oesConfig.edgeFunctionUrl}/kuawase-state-check`, {
      headers: { 'x-kuawase-sync-token': token }
    });

    if (!resp.ok) {
      alert('接続失敗: ' + resp.status);
      return;
    }

    oesConfig.token = token;
    
    // widgetロード
    const widgetSrc = `${oesConfig.edgeFunctionUrl}/kuawase-admin-widget?token=${token}`;
    document.getElementById('oesWidget').src = widgetSrc;
    document.getElementById('oesStatePanel').style.display = 'block';
    document.getElementById('syncButtons').style.display = 'block';

    alert('接続成功！');
  } catch (err) {
    alert('エラー: ' + err.message);
  }
}

async function syncBoutToOES() {
  if (!oesConfig.token) {
    alert('先に接続してください');
    return;
  }

  const currentBout = kuawaseGetCurrentBout(); // kuawase内部メソッド
  const currentMatch = kuawaseGetCurrentMatch();

  try {
    const resp = await fetch(`${oesConfig.edgeFunctionUrl}/kuawase-sync-event`, {
      method: 'POST',
      headers: {
        'x-kuawase-sync-token': oesConfig.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'BOUT_CHANGED',
        payload: {
          bout: currentBout,
          bout_slot: boutToSlot(currentBout),
          match_code: currentMatch.code
        }
      })
    });

    if (!resp.ok) {
      alert('同期失敗: ' + resp.status);
      return;
    }

    alert('対戦情報をOESに送信しました');
  } catch (err) {
    alert('エラー: ' + err.message);
  }
}
```

---

## 段階実装

### Phase 1: トークン基盤（1週間）
- [ ] kuawase_sync_tokens テーブル新設
- [ ] kuawase-generate-sync-token API実装
- [ ] 管理画面に連携パネル追加
- [ ] トークン生成・管理UI

### Phase 2: 状態参照API（1週間）
- [ ] kuawase-state-check API実装
- [ ] kuawase-admin-widget 実装（readonly UI）
- [ ] kuawase側のtoken入力UI + widget埋め込み

### Phase 3: 同期イベント（2週間）
- [ ] kuawase-sync-event API実装（BOUT_CHANGED）
- [ ] 自動反映ロジック（epoch + accepting + e3_reached更新）
- [ ] kuawase側の同期ボタン実装
- [ ] 監査ログ完全記録

### Phase 4: 拡張（後追い）
- [ ] MATCH_CHANGED イベント
- [ ] トークン無効化API
- [ ] 同期ログビューア

---

## 監査ログ

全kuawase連携は event_log に記録：

```json
{
  "event_type": "KUAWASE_SYNC_BOUT_CHANGED",
  "tournament_id": "khb26",
  "detail": {
    "token_hash": "khb26-sync-xxxx***",
    "payload": { "bout": "中堅", "bout_slot": 3 },
    "received_at": "2026-05-11T10:30:00Z"
  }
}
```

---

## セキュリティ

- **トークン有効期限**: 24時間（デフォルト）
- **トークン無効化**: revoked_at でマーク
- **トークンハッシュ記録**: ログには最初の12文字+*** で記録（本体は記録しない）
- **HTTPS必須**: 本番環境でのみ動作

---

## 次ステップ

- Phase 1 実装スタート（トークン生成UI）
- kuawase側との連携プロトタイプ


