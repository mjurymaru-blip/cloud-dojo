/**
 * LocalStorageを使用した進捗データの管理
 */

const STORAGE_KEY = 'cloud_dojo_progress';

export function getProgress() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed.streakDays === 'number' && parsed.courses && typeof parsed.courses === 'object') {
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
      'clf-c02': { completedQuizzes: 0, totalCorrect: 0, totalAnswered: 0 },
      'saa-c03': { completedQuizzes: 0, totalCorrect: 0, totalAnswered: 0 }
    }
  };
}

export function saveQuizResult(courseId, correctCount, totalCount) {
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
    progress.courses[courseId] = { completedQuizzes: 0, totalCorrect: 0, totalAnswered: 0 };
  }
  progress.courses[courseId].completedQuizzes += 1;
  progress.courses[courseId].totalCorrect += correctCount;
  progress.courses[courseId].totalAnswered += totalCount;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}
