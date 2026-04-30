# Cloud Dojo - Phase 2 実装計画 (GCPバックエンド追加)

> **引き継ぎ先**: 会社端末 (GitHub Copilot での作業)
> **前提**: Phase 1 のPWAフロントエンドは完成済み
> **元リポジトリ**: GitHub `cloud-dojo` (このリポジトリ)

---

## 1. 目的

Phase 1で構築した静的PWAフロントエンドに、GCPバックエンドを追加し、以下を実現する：

- **Google Workspace OAuth** によるチームメンバー認証
- **Firestore** による学習データの永続化・デバイス間同期
- **Cloud Run** によるAPIサーバーの構築

---

## 2. Phase 1 完了状況（引き継ぎ時点）

### 完了済みの機能
| 機能 | ステータス | ファイル |
|------|-----------|---------|
| ダークモード＋グラスモーフィズムUI | ✅ 完了 | `src/css/*.css` |
| コース選択画面 | ✅ 完了 | `index.html`, `src/js/main.js` |
| クイズ画面（1問1答形式） | ✅ 完了 | `app.html`, `src/js/quiz.js` |
| 進捗管理（localStorage） | ✅ 完了 | `src/js/storage.js` |
| 静的問題データ（CLF, SAA各セット） | ✅ 完了 | `public/data/*.json` |
| PWA対応（Service Worker + manifest） | ✅ 完了 | `src/js/pwa.js`, `vite.config.js` |
| Geminiレビューの指摘修正 | ✅ 完了 | XSS対策、バリデーション追加 |

### 現在の技術スタック
- **ビルドツール**: Vite 7.x + vite-plugin-pwa
- **フロントエンド**: Vanilla HTML/CSS/JavaScript（フレームワークなし）
- **データ保存**: localStorage（Phase 2でFirestoreに移行予定）
- **ホスティング**: 未デプロイ（ローカル開発のみ）

### ディレクトリ構成
```
cloud-dojo/
├── index.html              # コース選択画面
├── app.html                # クイズ画面
├── vite.config.js          # Vite + PWA設定
├── package.json
├── src/
│   ├── css/
│   │   ├── variables.css   # CSSカスタムプロパティ（カラー、フォント等）
│   │   ├── base.css        # リセット・基本スタイル
│   │   ├── components.css  # グラスモーフィズム、カード、ボタン
│   │   └── animations.css  # フェードイン、パルス等
│   └── js/
│       ├── main.js         # コース選択ロジック + PWAインポート
│       ├── quiz.js         # クイズ進行（QuizStateクラス）
│       ├── storage.js      # localStorage CRUD + バリデーション
│       ├── data.js         # JSONフェッチユーティリティ
│       └── pwa.js          # Service Worker登録
├── public/
│   ├── data/
│   │   ├── clf-c02.json    # Cloud Practitioner 問題
│   │   └── saa-c03.json    # SAA 問題
│   └── icons/
│       ├── pwa-192x192.png
│       └── pwa-512x512.png
└── docs/                   # 内部ドキュメント（GitHub公開時は除外）
```

---

## 3. Phase 2 で必要なGCPリソース

> [!IMPORTANT]
> 以下のGCPリソースは**会社端末**で GCP Console から作成・設定してください。

### 3.1 GCPプロジェクトの作成/選択
1. [GCP Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクトを作成、または既存のVertex AI検証用プロジェクトを使用
3. プロジェクトIDをメモしておく（例: `cloud-dojo-prod`）

### 3.2 必要なAPIの有効化
GCP Console > 「APIとサービス」> 「ライブラリ」から以下を有効化：
- **Cloud Firestore API**
- **Cloud Run Admin API**
- **Identity Platform** (または Firebase Authentication)
- **Artifact Registry API** （Cloud Runデプロイ用）

### 3.3 Firebase の設定
1. [Firebase Console](https://console.firebase.google.com/) でGCPプロジェクトを追加
2. **Authentication** を有効化し、「Google」プロバイダーを設定
   - 承認済みドメインに `localhost` と本番ドメインを追加
3. **Firestore Database** を作成（ロケーション: `asia-northeast1` 推奨）
4. Webアプリを登録し、Firebase設定情報を取得：
   ```javascript
   // この情報をフロントエンドの環境変数に設定する
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

### 3.4 サービスアカウントキーの作成
Cloud Run (バックエンド) から Firestore にアクセスするため：
1. GCP Console > 「IAMと管理」> 「サービスアカウント」
2. 新規サービスアカウントを作成（名前例: `cloud-dojo-backend`）
3. ロール: `Cloud Datastore User` を付与
4. JSONキーをダウンロード → バックエンドの環境変数に設定

---

## 4. Phase 2 実装ステップ

### Step 1: リポジトリ構成の再編（モノレポ化）
現在のフロントエンドコードを `frontend/` に移動し、`backend/` フォルダを新規追加する。

```
cloud-dojo/
├── frontend/           # 現在のコードをここに移動
│   ├── index.html
│   ├── app.html
│   ├── vite.config.js
│   ├── package.json
│   ├── src/
│   └── public/
├── backend/            # 新規作成
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   ├── middleware/
│   └── Dockerfile
└── docs/
```

### Step 2: バックエンドAPIの構築
**技術スタック**: Node.js + Express + Firebase Admin SDK

```bash
cd backend
npm init -y
npm install express firebase-admin cors helmet
```

**基本ルート設計**:
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| `GET` | `/api/health` | ヘルスチェック |
| `GET` | `/api/progress/:userId` | ユーザーの学習進捗取得 |
| `POST` | `/api/progress` | 学習結果の保存 |
| `GET` | `/api/team/progress` | チーム全体の進捗（Phase 4で拡張） |

**認証ミドルウェア**:
- フロントエンドから送信されるFirebase IDトークンを `Authorization: Bearer <token>` ヘッダーで受け取り、`firebase-admin` の `verifyIdToken()` で検証する。

### Step 3: フロントエンドの認証連携
1. Firebase JS SDK をインストール:
   ```bash
   cd frontend
   npm install firebase
   ```
2. `src/js/auth.js` を新規作成:
   - `signInWithPopup(auth, googleProvider)` でGoogleログインUI
   - ログイン成功時にIDトークンを取得し、APIリクエストのヘッダーに付与
3. `src/js/storage.js` を改修:
   - オフライン時: 従来どおりlocalStorageに保存
   - オンライン時: APIサーバーにもデータを同期（楽観的更新）

### Step 4: Cloud Run へのデプロイ
1. `backend/Dockerfile` を作成:
   ```dockerfile
   FROM node:20-slim
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY . .
   EXPOSE 8080
   CMD ["node", "server.js"]
   ```
2. Artifact Registry にイメージをプッシュ:
   ```bash
   gcloud builds submit --tag asia-northeast1-docker.pkg.dev/PROJECT_ID/cloud-dojo/backend
   ```
3. Cloud Run にデプロイ:
   ```bash
   gcloud run deploy cloud-dojo-api \
     --image asia-northeast1-docker.pkg.dev/PROJECT_ID/cloud-dojo/backend \
     --region asia-northeast1 \
     --allow-unauthenticated
   ```

### Step 5: ローカル結合テスト
```bash
# ターミナル1: バックエンド
cd backend && node server.js

# ターミナル2: フロントエンド
cd frontend && npm run dev
```

---

## 5. Firestoreデータ構造（設計案）

```
users/{userId}
  ├── email: string
  ├── displayName: string
  ├── lastActiveAt: timestamp
  └── courses/
        └── {courseId}  (例: "clf-c02")
              ├── totalCorrect: number
              ├── totalAnswered: number
              ├── lastAttemptAt: timestamp
              └── answeredQuestionIds: string[]

streaks/{userId}
  ├── currentStreak: number
  ├── longestStreak: number
  └── lastStudyDate: string (YYYY-MM-DD)
```

---

## 6. 環境変数一覧

### フロントエンド (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_API_BASE_URL=http://localhost:8080  # 開発時
# VITE_API_BASE_URL=https://cloud-dojo-api-xxx.run.app  # 本番時
```

### バックエンド (`backend/.env`)
```env
PORT=8080
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

---

## 7. セキュリティ考慮事項
- **Firebase IDトークン**: すべてのAPIリクエストでサーバーサイド検証を実施
- **CORS**: `ALLOWED_ORIGINS` で許可するオリジンを制限
- **Firestore セキュリティルール**: ユーザーは自分のデータのみ読み書き可能に設定
- **サービスアカウントキー**: `.env` に記載し、Gitには絶対にコミットしない（`.gitignore` に追加済み）
- **Google Workspace ドメイン制限**: Firebase AuthenticationでログインをGoogle Workspaceのドメインに限定する

---

## 8. 参考リンク
- [Firebase Authentication (Web)](https://firebase.google.com/docs/auth/web/google-signin)
- [Cloud Firestore (Web)](https://firebase.google.com/docs/firestore/quickstart)
- [Cloud Run デプロイガイド](https://cloud.google.com/run/docs/deploying)
- [Firebase Admin SDK (Node.js)](https://firebase.google.com/docs/admin/setup)
