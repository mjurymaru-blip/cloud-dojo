# Gemini レビューフィードバック (Phase 1)

## 1. 設計・アーキテクチャの整合性
*   **静的アセットのパス配置**: `src/data/*.json` はViteビルド時に自動ではコピーされないため、`public/data/` へ移動し、`fetch('/data/${courseId}.json')` に変更する。
*   **グローバル状態の管理**: `quiz.js` 内の変数を `QuizState` のようなオブジェクト/クラスにカプセル化し、堅牢性を高める。
*   **エラーハンドリングの安全性**: `data.js` のフェッチ失敗時を考慮し、`quiz.js` で `if (!courseData || !courseData.questions)` のように安全に評価する。

## 2. セキュリティ上の懸念
*   **XSS（クロスサイトスクリプティング）の予防**: `main.js` での `innerHTML +=` を `insertAdjacentHTML` または `createElement` に変更する。
*   **LocalStorageのスキーマバリデーション**: `storage.js` で、パース後のオブジェクトプロパティの存在チェック（`streakDays`, `courses` など）を厳格に行う。

## 3. UI/UXの改善案
*   **アクセシビリティ（カラーブラインド対応）**: 選択肢クリック時、枠線だけでなくテキストの横に「✅」「❌」アイコンを動的に追加し、視覚的なフィードバックを補強する。
*   **タップターゲットの最適化**: `app.html` 上部の「← 戻る」ボタン（`.btn-text`）のタップ領域（padding）を広げ、モバイルでの誤操作を防ぐ。
*   **フィードバックの視線誘導**: 解説ボックス（`#explanationBox`）表示時、解説が読みやすいようにボックスの先頭へスムーススクロールさせる。

## 4. パフォーマンス最適化の余地
*   **レイアウトスラッシングの回避**: `quiz.js` でアニメーションを再トリガーするための `void optionsContainer.offsetWidth;` を `requestAnimationFrame` に変更する。
*   **JSONデータのプリフェッチ**: `index.html` に `<link rel="prefetch" href="/data/clf-c02.json">` 等を追加し、オフライン動作や体感速度を向上させる。
*   **再描画（Repaint）のコスト削減**: `animations.css` の `pulse` アニメーションを `box-shadow` から、疑似要素を用いた `transform: scale()` と `opacity` の操作に変更し、GPUアクセラレーションを効かせる。
