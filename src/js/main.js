import './pwa.js';
import { getProgress, getWrongQuestionIds, getCategoryStats } from './storage.js';
import { fetchQuestions } from './data.js';
import { getAiAdvice, fetchAvailableModels, generateCustomQuestions } from './ai.js';

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

  // --- Settings Modal Logic ---
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const fetchModelsBtn = document.getElementById('fetchModelsBtn');
  const geminiModelSelect = document.getElementById('geminiModel');

  // Load existing key
  const savedKey = localStorage.getItem('geminiApiKey');
  const savedModel = localStorage.getItem('geminiModel');
  if (savedKey) {
    geminiApiKeyInput.value = savedKey;
    populateModels(savedKey, savedModel);
  }

  async function populateModels(apiKey, selectedModel = '') {
    geminiModelSelect.innerHTML = '<option value="">モデルを取得中...</option>';
    geminiModelSelect.disabled = true;
    const models = await fetchAvailableModels(apiKey);
    geminiModelSelect.innerHTML = '';
    if (models && models.length > 0) {
      models.forEach(m => {
        const option = document.createElement('option');
        option.value = m.name;
        option.textContent = m.displayName;
        if (m.name === selectedModel) {
          option.selected = true;
        }
        geminiModelSelect.appendChild(option);
      });
      geminiModelSelect.disabled = false;
      // デフォルト選択
      if (!selectedModel && models.some(m => m.name === 'models/gemini-1.5-flash')) {
        geminiModelSelect.value = 'models/gemini-1.5-flash';
      }
    } else {
      geminiModelSelect.innerHTML = '<option value="">モデルの取得に失敗しました</option>';
    }
  }

  fetchModelsBtn?.addEventListener('click', () => {
    const key = geminiApiKeyInput.value.trim();
    if (!key) {
      alert('APIキーを入力してください');
      return;
    }
    populateModels(key);
  });

  settingsBtn?.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
  });

  const closeModal = () => {
    settingsModal.style.display = 'none';
  };
  closeSettingsBtn?.addEventListener('click', closeModal);
  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
  });

  saveSettingsBtn?.addEventListener('click', () => {
    const key = geminiApiKeyInput.value.trim();
    const model = geminiModelSelect.value;
    if (key) {
      localStorage.setItem('geminiApiKey', key);
      if (model) localStorage.setItem('geminiModel', model);
    } else {
      localStorage.removeItem('geminiApiKey');
      localStorage.removeItem('geminiModel');
    }
    closeModal();
    alert('設定を保存しました。画面を更新して反映します。');
    location.reload();
  });

  // --- Analytics Dashboard (Radar Chart) ---
  // SAA-C03 と CLF-C02 のうち、より多く解答しているコースのデータを表示する
  const saaStats = getCategoryStats('saa-c03');
  const clfStats = getCategoryStats('clf-c02');
  const saaTotal = saaStats.reduce((sum, stat) => sum + stat.answered, 0);
  const clfTotal = clfStats.reduce((sum, stat) => sum + stat.answered, 0);

  const targetStats = saaTotal >= clfTotal ? saaStats : clfStats;
  const targetCourseName = saaTotal >= clfTotal ? 'SAA-C03' : 'CLF-C02';

  if (targetStats.length > 0 && targetStats.some(s => s.answered > 0)) {
    const dashboardSection = document.getElementById('dashboardSection');
    dashboardSection.style.display = 'block';

    const ctx = document.getElementById('radarChart')?.getContext('2d');
    if (ctx && window.Chart) {
      const labels = targetStats.map(s => {
        // 短い名前にフォーマットする
        let name = s.categoryId;
        if(name.includes('secure')) name = 'Secure';
        else if(name.includes('resilient')) name = 'Resilient';
        else if(name.includes('perform')) name = 'Performant';
        else if(name.includes('cost')) name = 'Cost';
        else if(name.includes('concept')) name = 'Concept';
        else if(name.includes('tech')) name = 'Tech';
        else if(name.includes('billing')) name = 'Billing';
        return name;
      });
      const dataPoints = targetStats.map(s => s.rate); // 正答率

      new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: `${targetCourseName} 分野別正答率 (%)`,
            data: dataPoints,
            backgroundColor: 'rgba(255, 153, 0, 0.2)', // AWS Orange transparent
            borderColor: 'rgba(255, 153, 0, 1)',
            pointBackgroundColor: 'rgba(255, 153, 0, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255, 153, 0, 1)'
          }]
        },
        options: {
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } },
              ticks: {
                color: 'rgba(255, 255, 255, 0.5)',
                backdropColor: 'transparent',
                stepSize: 20,
                min: 0,
                max: 100
              }
            }
          },
          plugins: {
            legend: {
              labels: { color: 'rgba(255, 255, 255, 0.8)' }
            }
          }
        }
      });
    }

    // --- AI Advice Logic ---
    const aiAdviceText = document.getElementById('aiAdviceText');
    const generateAiQuestionsBtn = document.getElementById('generateAiQuestionsBtn');
    
    if (savedKey) {
      // キャッシュの確認
      const cachedAdvice = localStorage.getItem('cachedAiAdvice');
      
      const requestAdviceBtn = document.createElement('button');
      requestAdviceBtn.className = 'btn-secondary';
      requestAdviceBtn.style.marginTop = '1rem';
      requestAdviceBtn.style.width = '100%';
      requestAdviceBtn.textContent = '最新の成績でAIにアドバイスを求める';
      aiAdviceText.parentElement.insertBefore(requestAdviceBtn, generateAiQuestionsBtn);

      const aiTestBtnContainer = document.createElement('div');
      aiTestBtnContainer.style.display = 'none';
      aiTestBtnContainer.style.marginTop = '1rem';
      aiTestBtnContainer.style.gap = '0.5rem';

      const startAiTestBtn = document.createElement('button');
      startAiTestBtn.className = 'btn-primary';
      startAiTestBtn.style.flex = '1';
      startAiTestBtn.textContent = 'AI問題を受講';

      const clearAiTestBtn = document.createElement('button');
      clearAiTestBtn.className = 'btn-secondary';
      clearAiTestBtn.textContent = 'クリア';
      
      aiTestBtnContainer.appendChild(startAiTestBtn);
      aiTestBtnContainer.appendChild(clearAiTestBtn);
      aiAdviceText.parentElement.appendChild(aiTestBtnContainer);

      const checkCustomStock = () => {
        const stock = JSON.parse(localStorage.getItem('customQuestions') || '[]');
        const courseStock = stock.filter(q => q.courseId === targetCourseName);
        if (courseStock.length > 0) {
          aiTestBtnContainer.style.display = 'flex';
          startAiTestBtn.textContent = `AI問題を受講 (${courseStock.length}問)`;
          startAiTestBtn.onclick = () => {
            window.location.href = `./app.html?course=${targetCourseName}&mode=ai-custom`;
          };
          clearAiTestBtn.onclick = () => {
            if(confirm('ストックされたAI問題をすべて削除しますか？')) {
              const newStock = stock.filter(q => q.courseId !== targetCourseName);
              localStorage.setItem('customQuestions', JSON.stringify(newStock));
              checkCustomStock();
            }
          };
        } else {
          aiTestBtnContainer.style.display = 'none';
        }
      };

      checkCustomStock(); // 初回チェック

      const setupGenerateBtn = () => {
        generateAiQuestionsBtn.style.display = 'block';
        // 弱点カテゴリの特定
        let weakestCategory = targetStats[0].categoryId;
        let minRate = targetStats[0].rate;
        targetStats.forEach(s => {
          if (s.rate < minRate) {
            minRate = s.rate;
            weakestCategory = s.categoryId;
          }
        });

        // ボタン押下時の問題生成イベント
        generateAiQuestionsBtn.onclick = async () => {
          const origText = generateAiQuestionsBtn.textContent;
          generateAiQuestionsBtn.textContent = '問題生成中... 🚀 (約10〜20秒)';
          generateAiQuestionsBtn.disabled = true;

          try {
            const questions = await generateCustomQuestions(savedKey, savedModel, targetCourseName, weakestCategory, 5);
            if (questions && Array.isArray(questions)) {
              // コースIDを付与して保存
              const qsWithCourse = questions.map(q => ({ ...q, courseId: targetCourseName }));
              const existing = JSON.parse(localStorage.getItem('customQuestions') || '[]');
              const updated = [...existing, ...qsWithCourse];
              localStorage.setItem('customQuestions', JSON.stringify(updated));
              alert(`${questions.length}問の弱点（${weakestCategory}）補強問題を生成・ストックしました！`);
              checkCustomStock(); // ボタン表示を更新
            } else {
              alert('問題の生成または解析に失敗しました。時間をおいて再試行するか、モデルを変更してみてください。');
            }
          } catch (e) {
            alert('エラーが発生しました: ' + e.message);
          } finally {
            generateAiQuestionsBtn.textContent = origText;
            generateAiQuestionsBtn.disabled = false;
          }
        };
      };

      if (cachedAdvice) {
        aiAdviceText.innerHTML = cachedAdvice.replace(/\n/g, '<br>');
        setupGenerateBtn();
      } else {
        aiAdviceText.innerHTML = 'まだアドバイスがありません。下のボタンからAIに分析を依頼してください。';
      }

      requestAdviceBtn.addEventListener('click', () => {
        requestAdviceBtn.disabled = true;
        aiAdviceText.innerHTML = '<span style="color: var(--text-secondary);">AIチューターが成績を分析中... ⏳</span>';
        
        getAiAdvice(savedKey, savedModel, targetCourseName, targetStats).then(advice => {
          requestAdviceBtn.disabled = false;
          if (advice) {
            localStorage.setItem('cachedAiAdvice', advice);
            aiAdviceText.innerHTML = advice.replace(/\n/g, '<br>');
            setupGenerateBtn();
          } else {
            aiAdviceText.innerHTML = '<span style="color: var(--error);">AIアドバイスの取得に失敗しました。設定のAPIキーをご確認ください。</span>';
          }
        });
      });
    }

  }

});
