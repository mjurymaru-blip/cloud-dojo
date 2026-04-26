# Cloud Dojo - Phase 1 実装計画 (PWAフロントエンド + 静的問題セット)

## 1. 目的
「今日から使える」最小限の学習アプリとして、Cloud Practitioner および Solutions Architect Associate 向けの静的問題セットを持つPWAフロントエンドを構築する。

## 2. スコープ
- モダンでプレミアムなUIデザイン（ダークモード、グラスモーフィズム）
- 資格別コース選択画面（Cloud Practitioner, SAA）
- クイズ実行画面（1問1答形式、選択肢）
- 正答率・学習進捗の記録（`localStorage`）
- オフライン対応（Service Worker）
- ホーム画面へのインストール対応（`manifest.json`）

## 3. 技術スタック
- HTML5 / Vanilla CSS / Vanilla JavaScript (フレームワークなしの構成をベースとするが、Viteを利用したビルド環境を導入してPWA化を容易にする)
- Vite (開発サーバー、PWAプラグイン `vite-plugin-pwa`)

## 4. ディレクトリ構成予定
```
cloud-dojo/
├── index.html            # メインのエントリポイント（ログイン/コース選択）
├── app.html              # クイズ画面
├── src/
│   ├── css/
│   │   ├── variables.css # カラーパレット、フォントなど
│   │   ├── base.css      # リセット、基本スタイル
│   │   ├── components.css# ボタン、カード、グラスモーフィズム等
│   │   └── animations.css# マイクロインタラクション
│   ├── js/
│   │   ├── main.js       # 全体ロジック
│   │   ├── quiz.js       # クイズ進行ロジック
│   │   ├── storage.js    # localStorage管理
│   │   └── data.js       # 問題セットの読み込み
│   └── data/
│       ├── clf-c02.json  # Cloud Practitioner 問題セット
│       └── saa-c03.json  # SAA 問題セット
├── public/
│   ├── icons/            # PWAアイコン
│   └── manifest.json     # PWAマニフェスト
├── package.json
└── vite.config.js
```

## 5. ステップバイステップの実装手順

### Step 1: プロジェクト基盤のセットアップ
- Vite の初期化 (`npm create vite@latest . -- --template vanilla`)
- 必要なPWAプラグインのインストール
- `vite.config.js` の設定 (PWA, マニフェスト)

### Step 2: UIデザインシステムの構築 (CSS)
- ダークモードのカラーパレット定義 (`variables.css`)
- グラスモーフィズムのユーティリティクラス作成
- 基本的なタイポグラフィとボタンコンポーネント

### Step 3: 静的問題データの作成
- `clf-c02.json` と `saa-c03.json` にサンプル問題を5問ずつ作成（AIによる事前生成を想定した構造）
- 問題構造：問題文、選択肢リスト、正解インデックス、解説文

### Step 4: アプリケーションロジックの実装
- `storage.js`: 連続学習日数、正答率、クリア済みの問題IDを `localStorage` に保存・取得する処理
- `main.js`: コース選択と進捗表示（ゲーミフィケーション要素）
- `quiz.js`: 問題の表示、選択肢のクリックハンドリング、正誤判定、解説表示

### Step 5: オフライン・PWA対応
- Service Workerの登録
- `manifest.json` の設定
- PWAインストールプロンプトの対応

## 6. デザイン詳細（プレミアム感の演出）
- **Background**: 深いネイビーまたは黒に近いグレー (#0B0F19 など) をベースとし、ほのかにAWSカラー（オレンジ）やVertex AIカラー（青/紫）のグラデーションオーブを配置。
- **Cards**: `backdrop-filter: blur(10px)` と半透明の白/グレーのボーダーを用いたグラスモーフィズム。
- **Typography**: `Inter` または `Outfit` フォントを採用し、クリーンでモダンな印象に。
- **Animations**: ボタンのホバー時や正解時の微細なスケールアップ、フェードインによる滑らかな画面遷移。

## 7. 次のタスク
この計画に基づき、Step 1（Viteによるプロジェクト基盤セットアップ）とStep 2（デザインシステムの基礎）を開始する。
