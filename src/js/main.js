import './pwa.js';
import { getProgress, getWrongQuestionIds, getCategoryStats } from './storage.js';
import { fetchQuestions } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Cloud Dojo Initialized');
  
  const progress = getProgress();
  
  // 進捗表示
  const userProgress = document.getElementById('userProgress');
  if (userProgress && progress.streakDays > 0) {
    userProgress.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-secondary);">連続学習: <strong style="color: var(--aws-orange);">${progress.streakDays}日</strong> 🔥</span>`;
  }

  // コース選択カードの処理
  const courseCards = document.querySelectorAll('.course-card');
  for (let index = 0; index < courseCards.length; index++) {
    const card = courseCards[index];
    card.classList.add('fade-in');
    card.classList.add(`stagger-${index + 1}`);

    const courseId = card.getAttribute('data-course');
    const courseStats = progress.courses[courseId];
    
    // 全体プログレスの反映
    if (courseStats && courseStats.totalAnswered > 0) {
      const pBar = card.querySelector('.progress-fill');
      const percentage = Math.min(100, Math.round((courseStats.totalCorrect / Math.max(courseStats.totalAnswered, 50)) * 100));
      if (pBar) pBar.style.width = `${percentage}%`;
      
      const statsText = card.querySelector('.stats-text');
      if (statsText) {
        statsText.innerHTML = ` &bull; <span style="color:var(--success)">正解: ${courseStats.totalCorrect}</span> / ${courseStats.totalAnswered}`;
      }
    }

    // データ非同期取得とアコーディオンUIの構築
    const courseData = await fetchQuestions(courseId);
    if (!courseData) continue;

    const header = card.querySelector('.course-header');
    const container = card.querySelector('.categories-container');
    const catStatsList = getCategoryStats(courseId);
    const wrongIds = getWrongQuestionIds(courseId);

    // アコーディオンの開閉トグル
    header.addEventListener('click', () => {
      const isExpanded = card.classList.toggle('expanded');
      container.style.display = isExpanded ? 'flex' : 'none';
    });

    // 「全分野ランダム」や「全体弱点克服」用のトップレベルアクション
    const topActions = document.createElement('div');
    topActions.className = 'category-item';
    topActions.innerHTML = `
      <div class="category-header">
        <span class="category-title">🌐 コース全体からランダム学習</span>
      </div>
      <div class="category-actions">
        <button class="btn-primary" onclick="window.location.href='./app.html?course=${courseId}&limit=10'">10問テスト</button>
        ${wrongIds.length > 0 ? `<button class="btn-secondary" onclick="window.location.href='./app.html?course=${courseId}&mode=review'">弱点克服 (${wrongIds.length}問)</button>` : ''}
      </div>
    `;
    container.appendChild(topActions);

    // カテゴリ別のレンダリング
    if (courseData.categories) {
      courseData.categories.forEach(cat => {
        // カテゴリの正答率と間違えた問題数を計算
        const catStat = catStatsList.find(s => s.categoryId === cat.id);
        const rateText = catStat && catStat.answered > 0 ? `正答率: ${catStat.rate}% (${catStat.correct}/${catStat.answered})` : '未学習';
        
        // このカテゴリに属する弱点問題をカウント
        const categoryWrongCount = courseData.questions.filter(q => q.category === cat.id && wrongIds.includes(q.id)).length;

        const catItem = document.createElement('div');
        catItem.className = 'category-item';
        catItem.innerHTML = `
          <div class="category-header">
            <span class="category-title">${cat.name}</span>
            <span class="category-stats-text">${rateText}</span>
          </div>
          <div class="category-actions">
            <button class="btn-primary" onclick="window.location.href='./app.html?course=${courseId}&category=${cat.id}&limit=10'">学習スタート</button>
            ${categoryWrongCount > 0 ? `<button class="btn-secondary" onclick="window.location.href='./app.html?course=${courseId}&category=${cat.id}&mode=review'">弱点復習 (${categoryWrongCount})</button>` : ''}
          </div>
        `;
        container.appendChild(catItem);
      });
    }
  }
});
