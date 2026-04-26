import { getProgress } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Cloud Dojo Initialized');
  
  const progress = getProgress();
  
  // コース選択ボタンのイベントリスナー
  const courseButtons = document.querySelectorAll('.course-btn');
  courseButtons.forEach((btn, index) => {
    btn.classList.add('fade-in');
    btn.classList.add(`stagger-${index + 1}`);

    const courseId = btn.getAttribute('data-course');
    
    // コース別の進捗を反映
    const courseStats = progress.courses[courseId];
    if (courseStats && courseStats.totalAnswered > 0) {
      const pBar = btn.querySelector('.progress-fill');
      const percentage = Math.min(100, Math.round((courseStats.totalCorrect / 50) * 100)); // 仮の目標として50問設定
      if (pBar) pBar.style.width = `${percentage}%`;
      
      const infoP = btn.querySelector('.course-info p');
      if (infoP) {
        infoP.innerHTML += ` &bull; <span style="color:var(--success)">正解: ${courseStats.totalCorrect}</span> / ${courseStats.totalAnswered}`;
      }
    }

    btn.addEventListener('click', () => {
      window.location.href = `/app.html?course=${courseId}`;
    });
  });

  // 進捗表示
  const userProgress = document.getElementById('userProgress');
  if (userProgress && progress.streakDays > 0) {
    userProgress.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-secondary);">連続学習: <strong style="color: var(--aws-orange);">${progress.streakDays}日</strong> 🔥</span>`;
  }
});
