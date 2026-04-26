document.addEventListener('DOMContentLoaded', () => {
  console.log('Cloud Dojo Initialized');
  
  // コース選択ボタンのイベントリスナー
  const courseButtons = document.querySelectorAll('.course-btn');
  courseButtons.forEach((btn, index) => {
    // Stagger animation classes (for aesthetic loading)
    btn.classList.add('fade-in');
    btn.classList.add(`stagger-${index + 1}`);

    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-course');
      console.log(`Course selected: ${courseId}`);
      // 今後: app.html?course=courseId へ遷移する処理を記述
      alert(`${courseId.toUpperCase()} コースを選択しました。クイズ画面は開発中です。`);
    });
  });

  // モックの進捗表示
  const userProgress = document.getElementById('userProgress');
  if (userProgress) {
    userProgress.innerHTML = `<span style="font-size: 0.85rem; color: var(--text-secondary);">連続学習: <strong style="color: var(--aws-orange);">3日</strong> 🔥</span>`;
  }
});
