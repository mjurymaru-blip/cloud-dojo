# Phase 1 修正タスクリスト (Review Feedback対応)

- [x] **Task 1: データパスとプリフェッチの修正**
  - `src/data/` ディレクトリを `public/data/` に移動する
  - `src/js/data.js` の fetch パスを `/data/${courseId}.json` に変更する
  - `index.html` の `<head>` 内に各コースデータの `<link rel="prefetch">` を追加する

- [x] **Task 2: quiz.js の堅牢化とリファクタリング**
  - 状態（`currentCourseId`, `courseData`, `currentQuestionIndex`, `correctCount`, `isAnswered`）を `QuizState` クラスにカプセル化する
  - `initQuiz` 内のエラーハンドリングを `!courseData || !courseData.questions` に修正する
  - アニメーションの再トリガーを `requestAnimationFrame` に変更する
  - 解説表示時、`#explanationBox` へスムーススクロールする処理を追加する
  - 選択肢の正誤判定時にテキストへ「✅」「❌」アイコンを追加する処理を実装する

- [x] **Task 3: セキュリティと堅牢性の向上**
  - `src/js/main.js` の DOM 操作 (`innerHTML +=`) を `insertAdjacentHTML` に変更してXSSリスクを低減する
  - `src/js/storage.js` で `JSON.parse` 後に期待されるプロパティ（`streakDays`, `courses`）が存在するかバリデーションを追加する

- [x] **Task 4: UI/UXとパフォーマンスの最適化**
  - `src/css/components.css` で `.btn-text` の `padding` を増やし、タップターゲットを拡大する
  - `src/css/animations.css` の `pulse` アニメーションを `box-shadow` から疑似要素の `transform: scale` + `opacity` に変更する
