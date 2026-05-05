/**
 * LocalStorageを使用した進捗データの管理
 * Phase 2: 分野別正答率・間違えた問題の記録に対応
 */

const STORAGE_KEY = 'cloud_dojo_progress';

/**
 * デフォルトのコース進捗データ構造を生成する
 */
function createDefaultCourseData() {
  return {
    completedQuizzes: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    categoryStats: {},    // { [categoryId]: { correct: number, answered: number } }
    wrongQuestions: []     // [{ questionId, answeredAt, selectedIndex }]
  };
}

/**
 * 保存データが有効な構造かを検証する
 */
function isValidProgress(parsed) {
  return (
    typeof parsed.streakDays === 'number' &&
    parsed.courses &&
    typeof parsed.courses === 'object'
  );
}

/**
 * コースデータを正規化する（古い構造からの移行サポート）
 */
function normalizeCourseData(courseData) {
  return {
    completedQuizzes: courseData.completedQuizzes || 0,
    totalCorrect: courseData.totalCorrect || 0,
    totalAnswered: courseData.totalAnswered || 0,
    categoryStats: courseData.categoryStats || {},
    wrongQuestions: courseData.wrongQuestions || []
  };
}

export function getProgress() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (isValidProgress(parsed)) {
        // 既存コースデータに新しいフィールドがない場合は補完する
        for (const courseId of Object.keys(parsed.courses)) {
          parsed.courses[courseId] = normalizeCourseData(parsed.courses[courseId]);
        }
        return parsed;
      }
      console.warn('Invalid storage schema, resetting.');
    } catch (e) {
      console.error('Failed to parse progress data', e);
    }
  }
  
  // 初期データ構造
  return {
    lastStudyDate: null,
    streakDays: 0,
    courses: {
      'clf-c02': createDefaultCourseData(),
      'saa-c03': createDefaultCourseData()
    }
  };
}

/**
 * クイズ結果を保存する（分野別・問題別の詳細データ付き）
 * @param {string} courseId - コースID
 * @param {number} correctCount - 正解数
 * @param {number} totalCount - 出題数
 * @param {Array} questionResults - 問題ごとの結果 [{ questionId, category, isCorrect, selectedIndex }]
 */
export function saveQuizResult(courseId, correctCount, totalCount, questionResults = []) {
  const progress = getProgress();
  
  // 学習日と連続ストリークの更新ロジック
  const today = new Date().toISOString().split('T')[0];
  if (progress.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (progress.lastStudyDate === yesterdayStr) {
      progress.streakDays += 1;
    } else {
      progress.streakDays = 1; // 途切れたら1日から
    }
    progress.lastStudyDate = today;
  }
  
  // コースごとのスコア更新
  if (!progress.courses[courseId]) {
    progress.courses[courseId] = createDefaultCourseData();
  }
  const course = progress.courses[courseId];
  course.completedQuizzes += 1;
  course.totalCorrect += correctCount;
  course.totalAnswered += totalCount;

  // 分野別正答率と間違えた問題の記録
  for (const result of questionResults) {
    // カテゴリ統計の更新
    if (result.category) {
      if (!course.categoryStats[result.category]) {
        course.categoryStats[result.category] = { correct: 0, answered: 0 };
      }
      course.categoryStats[result.category].answered += 1;
      if (result.isCorrect) {
        course.categoryStats[result.category].correct += 1;
      }
    }

    // 間違えた問題を記録（重複は最新データで上書き）
    if (!result.isCorrect) {
      const existingIndex = course.wrongQuestions.findIndex(
        wq => wq.questionId === result.questionId
      );
      const wrongEntry = {
        questionId: result.questionId,
        category: result.category || '',
        selectedIndex: result.selectedIndex,
        answeredAt: today
      };
      if (existingIndex >= 0) {
        course.wrongQuestions[existingIndex] = wrongEntry;
      } else {
        course.wrongQuestions.push(wrongEntry);
      }
    } else {
      // 正解したら間違えた問題リストから除外する
      course.wrongQuestions = course.wrongQuestions.filter(
        wq => wq.questionId !== result.questionId
      );
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

/**
 * 特定コースの間違えた問題IDリストを返す
 */
export function getWrongQuestionIds(courseId) {
  const progress = getProgress();
  const course = progress.courses[courseId];
  if (!course || !course.wrongQuestions) return [];
  return course.wrongQuestions.map(wq => wq.questionId);
}

/**
 * 特定コースの分野別正答率を返す
 * @returns {Array<{ categoryId: string, correct: number, answered: number, rate: number }>}
 */
export function getCategoryStats(courseId) {
  const progress = getProgress();
  const course = progress.courses[courseId];
  if (!course || !course.categoryStats) return [];
  
  return Object.entries(course.categoryStats).map(([categoryId, stats]) => ({
    categoryId,
    correct: stats.correct,
    answered: stats.answered,
    rate: stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0
  }));
}
