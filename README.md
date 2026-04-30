# Cloud Dojo ☁️🥋

チーム全体のAWSスキル底上げを目的とした、AI搭載クラウド資格学習プラットフォーム（PWA）です。

## 特徴

- 📱 **モバイルファースト PWA** — 通勤中にスマホで手軽にAWS資格学習
- 🌙 **プレミアムダークモードUI** — グラスモーフィズム + スムーズアニメーション
- 📊 **学習進捗トラッキング** — 正答率・連続学習日数の記録
- 🔌 **オフライン対応** — Service Workerによるオフライン学習

## 対応資格

- AWS Certified Cloud Practitioner (CLF-C02)
- AWS Certified Solutions Architect - Associate (SAA-C03)

## クイックスタート

```bash
npm install
npm run dev
```

開発サーバーが `http://localhost:5173` で起動します。

## ビルド

```bash
npm run build
npm run preview  # ビルド結果のプレビュー
```

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | HTML5, Vanilla CSS, Vanilla JavaScript |
| ビルドツール | Vite 7.x |
| PWA | vite-plugin-pwa |
| データ保存 | localStorage (Phase 1) |

## プロジェクト構成

```
├── index.html          # コース選択画面
├── app.html            # クイズ画面
├── vite.config.js      # Vite + PWA設定
├── src/
│   ├── css/            # デザインシステム
│   └── js/             # アプリロジック
└── public/
    └── data/           # 問題セット (JSON)
```

## 開発フェーズ

| フェーズ | 内容 | ステータス |
|---------|------|-----------|
| Phase 1 | PWAフロントエンド + 静的問題セット | ✅ 完了 |
| Phase 2 | GCPバックエンド (OAuth + Firestore + Cloud Run) | 🔜 次 |
| Phase 3 | Vertex AI 統合 (動的問題生成) | 📋 計画中 |
| Phase 4 | チーム管理ダッシュボード | 📋 計画中 |

## ライセンス

ISC
