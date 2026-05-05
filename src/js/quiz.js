import './pwa.js';
import { fetchQuestions } from './data.js';
import { saveQuizResult } from './storage.js';

class QuizState {
  constructor() {
    this.courseId = '';
    this.data = null;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.isAnswered = false;
    this.questionResults = []; // Phase 2: 問題ごとの結果を蓄積
  }

  get currentQuestion() {
    return this.data?.questions[this.currentIndex];
  }

  get isFinished() {
    return this.currentIndex >= (this.data?.questions.length || 0);
  }

  /**
   * 問題ごとの回答結果を記録する
   */
  recordAnswer(questionId, category, isCorrect, selectedIndex) {
    this.questionResults.push({ questionId, category, isCorrect, selectedIndex });
  }
}

const state = new QuizState();

// DOM Elements
const elements = {
  loadingIndicator: document.getElementById('loadingIndicator'),
  quizContainer: document.getElementById('quizContainer'),
  resultContainer: document.getElementById('resultContainer'),
  courseTitle: document.getElementById('courseTitle'),
  questionCounter: document.getElementById('questionCounter'),
  scoreTracker: document.getElementById('scoreTracker'),
  questionText: document.getElementById('questionText'),
  optionsContainer: document.getElementById('optionsContainer'),
  explanationBox: document.getElementById('explanationBox'),
  explanationText: document.getElementById('explanationText'),
  nextBtn: document.getElementById('nextBtn'),
  homeBtn: document.getElementById('homeBtn'),
  finalScore: document.getElementById('finalScore')
};

async function initQuiz() {
  const params = new URLSearchParams(window.location.search);
  state.courseId = params.get('course');
  const mode = params.get('mode'); // 'review' で弱点克服モード
  const categoryFilter = params.get('category'); // 分野指定
  const limit = params.get('limit') ? parseInt(params.get('limit'), 10) : null;

  if (!state.courseId) {
    window.location.href = './';
    return;
  }

  state.data = await fetchQuestions(state.courseId);
  elements.loadingIndicator.style.display = 'none';

  if (!state.data || !state.data.questions || state.data.questions.length === 0) {
    elements.quizContainer.innerHTML = '<p>問題データの読み込みに失敗しました。</p>';
    elements.quizContainer.classList.add('active');
    return;
  }

  let filteredQuestions = [...state.data.questions];

  // 1. 弱点克服モード: 間違えた問題だけにフィルタリング
  if (mode === 'review') {
    const { getWrongQuestionIds } = await import('./storage.js');
    const wrongIds = getWrongQuestionIds(state.courseId);
    filteredQuestions = filteredQuestions.filter(q => wrongIds.includes(q.id));
    state.data.title += '【復習モード】';
  }

  // 2. カテゴリフィルタリング
  if (categoryFilter) {
    filteredQuestions = filteredQuestions.filter(q => q.category === categoryFilter);
    const catObj = state.data.categories?.find(c => c.id === categoryFilter);
    if (catObj) {
      state.data.title += ` - ${catObj.name}`;
    }
  }

  // 3. シャッフルとリミット（ミニテスト化）
  // 復習モード以外、またはlimitが指定されている場合はシャッフルして抽出
  if (limit && filteredQuestions.length > limit) {
    // Fisher-Yates shuffle
    for (let i = filteredQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredQuestions[i], filteredQuestions[j]] = [filteredQuestions[j], filteredQuestions[i]];
    }
    filteredQuestions = filteredQuestions.slice(0, limit);
  }

  state.data.questions = filteredQuestions;

  if (state.data.questions.length === 0) {
    elements.quizContainer.innerHTML = '<p>出題する問題がありません。ホームに戻ってください。</p>';
    elements.quizContainer.classList.add('active');
    return;
  }

  elements.courseTitle.textContent = state.data.title;
  showQuestion();
}

function showQuestion() {
  state.isAnswered = false;
  elements.explanationBox.classList.remove('active');
  elements.nextBtn.disabled = true;
  elements.quizContainer.classList.add('active');
  
  const q = state.currentQuestion;
  elements.questionCounter.textContent = `Q ${state.currentIndex + 1} / ${state.data.questions.length}`;
  elements.scoreTracker.textContent = `正解: ${state.correctCount}`;
  elements.questionText.textContent = q.question;
  
  elements.optionsContainer.innerHTML = '';
  q.options.forEach((optText, index) => {
    const btn = document.createElement('button');
    btn.className = `option-btn stagger-${(index % 3) + 1}`;
    btn.textContent = optText;
    btn.onclick = () => handleAnswer(index, btn);
    elements.optionsContainer.appendChild(btn);
  });
  
  // Use requestAnimationFrame to safely trigger animations
  requestAnimationFrame(() => {
    Array.from(elements.optionsContainer.children).forEach(child => child.classList.add('fade-in'));
  });
}

function handleAnswer(selectedIndex, selectedBtn) {
  if (state.isAnswered) return;
  state.isAnswered = true;
  
  const q = state.currentQuestion;
  const isCorrect = (selectedIndex === q.answerIndex);
  
  // Update button styles and add visual feedback icons
  Array.from(elements.optionsContainer.children).forEach((btn, index) => {
    btn.disabled = true;
    if (index === q.answerIndex) {
      btn.classList.add('correct');
      if (index === selectedIndex) btn.textContent += ' ✅';
    } else if (index === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
      btn.textContent += ' ❌';
    }
  });

  if (isCorrect) {
    state.correctCount++;
    elements.scoreTracker.textContent = `正解: ${state.correctCount}`;
  }

  // Phase 2: 問題ごとの結果を記録
  state.recordAnswer(q.id, q.category || '', isCorrect, selectedIndex);

  // Show explanation
  elements.explanationText.textContent = q.explanation;
  elements.explanationBox.classList.add('active');
  
  // Smooth scroll to explanation
  elements.explanationBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Enable next button
  elements.nextBtn.disabled = false;
  
  // Change next button text if it's the last question
  if (state.currentIndex === state.data.questions.length - 1) {
    elements.nextBtn.textContent = '結果を見る';
  }
}

elements.nextBtn.addEventListener('click', () => {
  state.currentIndex++;
  if (!state.isFinished) {
    showQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  elements.quizContainer.classList.remove('active');
  elements.resultContainer.classList.add('active');
  
  const total = state.data.questions.length;
  const percentage = Math.round((state.correctCount / total) * 100);
  
  elements.finalScore.textContent = `${state.correctCount} / ${total} 正解 (${percentage}%)`;
  
  // Save progress with detailed question results
  saveQuizResult(state.courseId, state.correctCount, total, state.questionResults);
}

elements.homeBtn.addEventListener('click', () => {
  window.location.href = './';
});

document.addEventListener('DOMContentLoaded', initQuiz);
