import { fetchQuestions } from './data.js';
import { saveQuizResult } from './storage.js';

let currentCourseId = '';
let courseData = null;
let currentQuestionIndex = 0;
let correctCount = 0;
let isAnswered = false;

// DOM Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const quizContainer = document.getElementById('quizContainer');
const resultContainer = document.getElementById('resultContainer');
const courseTitle = document.getElementById('courseTitle');
const questionCounter = document.getElementById('questionCounter');
const scoreTracker = document.getElementById('scoreTracker');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const explanationBox = document.getElementById('explanationBox');
const explanationText = document.getElementById('explanationText');
const nextBtn = document.getElementById('nextBtn');
const homeBtn = document.getElementById('homeBtn');

async function initQuiz() {
  const params = new URLSearchParams(window.location.search);
  currentCourseId = params.get('course');

  if (!currentCourseId) {
    window.location.href = '/';
    return;
  }

  courseData = await fetchQuestions(currentCourseId);
  loadingIndicator.style.display = 'none';

  if (!courseData || !courseData.questions || courseData.questions.length === 0) {
    quizContainer.innerHTML = '<p>問題データの読み込みに失敗しました。</p>';
    quizContainer.classList.add('active');
    return;
  }

  courseTitle.textContent = courseData.title;
  showQuestion();
}

function showQuestion() {
  isAnswered = false;
  explanationBox.classList.remove('active');
  nextBtn.disabled = true;
  quizContainer.classList.add('active');
  
  const q = courseData.questions[currentQuestionIndex];
  questionCounter.textContent = `Q ${currentQuestionIndex + 1} / ${courseData.questions.length}`;
  scoreTracker.textContent = `正解: ${correctCount}`;
  questionText.textContent = q.question;
  
  optionsContainer.innerHTML = '';
  q.options.forEach((optText, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn stagger-' + ((index % 3) + 1);
    btn.textContent = optText;
    btn.onclick = () => handleAnswer(index, btn);
    optionsContainer.appendChild(btn);
  });
  
  // Trigger reflow to restart animation
  void optionsContainer.offsetWidth;
  Array.from(optionsContainer.children).forEach(child => child.classList.add('fade-in'));
}

function handleAnswer(selectedIndex, selectedBtn) {
  if (isAnswered) return;
  isAnswered = true;
  
  const q = courseData.questions[currentQuestionIndex];
  const isCorrect = (selectedIndex === q.answerIndex);
  
  // Update button styles
  Array.from(optionsContainer.children).forEach((btn, index) => {
    btn.disabled = true;
    if (index === q.answerIndex) {
      btn.classList.add('correct');
    } else if (index === selectedIndex && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  if (isCorrect) {
    correctCount++;
    scoreTracker.textContent = `正解: ${correctCount}`;
  }

  // Show explanation
  explanationText.textContent = q.explanation;
  explanationBox.classList.add('active');
  
  // Enable next button
  nextBtn.disabled = false;
  
  // Change next button text if it's the last question
  if (currentQuestionIndex === courseData.questions.length - 1) {
    nextBtn.textContent = '結果を見る';
  }
}

nextBtn.addEventListener('click', () => {
  currentQuestionIndex++;
  if (currentQuestionIndex < courseData.questions.length) {
    showQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  quizContainer.classList.remove('active');
  resultContainer.classList.add('active');
  
  const total = courseData.questions.length;
  const percentage = Math.round((correctCount / total) * 100);
  
  document.getElementById('finalScore').textContent = `${correctCount} / ${total} 正解 (${percentage}%)`;
  
  // Save progress
  saveQuizResult(currentCourseId, correctCount, total);
}

homeBtn.addEventListener('click', () => {
  window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', initQuiz);
