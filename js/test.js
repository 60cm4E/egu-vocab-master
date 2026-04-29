/* ===================================
   Test Module - 시험 모드
   =================================== */

const Test = {
  config: {
    type: 'eng-to-kor',  // eng-to-kor, kor-to-eng, listening, spelling
    units: [],
    questionCount: 20,
    timeLimit: 0
  },
  
  state: {
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: null,
    timerInterval: null
  },

  // --- Test Setup Screen ---
  renderSetup() {
    const screen = document.getElementById('test-setup-screen');
    
    screen.innerHTML = `
      <div class="test-setup-container">
        <div class="test-setup-header">
          <h2>📝 시험 설정</h2>
          <p>시험 유형과 범위를 선택해요</p>
        </div>
        
        <!-- Test Type -->
        <div class="test-range-section">
          <h3>📋 시험 유형</h3>
          <div class="test-type-grid">
            <div class="test-type-card selected" data-type="eng-to-kor" onclick="Test._selectType(this)">
              <div class="type-icon">🔤→🇰🇷</div>
              <div class="type-name">영→한</div>
              <div class="type-difficulty">⭐</div>
            </div>
            <div class="test-type-card" data-type="kor-to-eng" onclick="Test._selectType(this)">
              <div class="type-icon">🇰🇷→🔤</div>
              <div class="type-name">한→영</div>
              <div class="type-difficulty">⭐⭐</div>
            </div>
            <div class="test-type-card" data-type="listening" onclick="Test._selectType(this)">
              <div class="type-icon">🎧</div>
              <div class="type-name">듣고 고르기</div>
              <div class="type-difficulty">⭐⭐</div>
            </div>
            <div class="test-type-card" data-type="spelling" onclick="Test._selectType(this)">
              <div class="type-icon">⌨️</div>
              <div class="type-name">스펠링</div>
              <div class="type-difficulty">⭐⭐⭐</div>
            </div>
          </div>
        </div>
        
        <!-- Test Range -->
        <div class="test-range-section">
          <h3>📚 출제 범위</h3>
          <div class="range-chips">
            <button class="range-chip selected" data-range="all" onclick="Test._selectRange(this)">전체</button>
            <button class="range-chip" data-range="select" onclick="Test._selectRange(this)">유닛 선택</button>
            <button class="range-chip" data-range="wrong" onclick="Test._selectRange(this)">오답노트</button>
          </div>
          <div id="unit-select-container" class="hidden" style="margin-top: var(--space-md);">
            <div class="unit-select-grid" id="test-unit-grid">
              ${VOCAB_DATA.map(u => `
                <button class="unit-chip" data-unit="${u.unit}" onclick="Test._toggleUnit(this)">${u.unit}</button>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- Question Count -->
        <div class="test-range-section">
          <h3>📊 문제 수</h3>
          <div class="count-selector">
            <button class="count-option" data-count="10" onclick="Test._selectCount(this)">10문제</button>
            <button class="count-option selected" data-count="20" onclick="Test._selectCount(this)">20문제</button>
            <button class="count-option" data-count="0" onclick="Test._selectCount(this)">전체</button>
          </div>
        </div>
        
        <!-- Start Button -->
        <button class="btn btn-primary btn-lg" style="margin-top: var(--space-xl);" onclick="Test.start()">
          🚀 시험 시작!
        </button>
      </div>
    `;
  },

  _selectType(element) {
    document.querySelectorAll('.test-type-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    this.config.type = element.dataset.type;
  },

  _selectRange(element) {
    document.querySelectorAll('.range-chips .range-chip').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    
    const container = document.getElementById('unit-select-container');
    if (element.dataset.range === 'select') {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  },

  _toggleUnit(element) {
    element.classList.toggle('selected');
  },

  _selectCount(element) {
    document.querySelectorAll('.count-option').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    this.config.questionCount = parseInt(element.dataset.count);
  },

  // --- Start Test ---
  start() {
    // Determine word pool
    let wordPool = [];
    
    const rangeSelected = document.querySelector('.range-chips .range-chip.selected');
    const range = rangeSelected ? rangeSelected.dataset.range : 'all';
    
    if (range === 'wrong') {
      const wrongWords = Storage.getWrongWords();
      if (wrongWords.length === 0) {
        App.showToast('오답노트에 단어가 없어요!', 'error');
        return;
      }
      wordPool = wrongWords.map(w => ({
        english: w.english,
        korean: w.korean,
        unit: w.unit
      }));
    } else if (range === 'select') {
      const selectedUnits = Array.from(document.querySelectorAll('.unit-chip.selected'))
        .map(el => parseInt(el.dataset.unit));
      
      if (selectedUnits.length === 0) {
        App.showToast('유닛을 선택해주세요!', 'error');
        return;
      }
      
      selectedUnits.forEach(unitNum => {
        const unit = VOCAB_DATA.find(u => u.unit === unitNum);
        if (unit) {
          wordPool.push(...unit.words.map(w => ({ ...w, unit: unitNum })));
        }
      });
    } else {
      VOCAB_DATA.forEach(unit => {
        wordPool.push(...unit.words.map(w => ({ ...w, unit: unit.unit })));
      });
    }
    
    // Shuffle
    for (let i = wordPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordPool[i], wordPool[j]] = [wordPool[j], wordPool[i]];
    }
    
    // Limit question count
    const count = this.config.questionCount > 0 
      ? Math.min(this.config.questionCount, wordPool.length) 
      : wordPool.length;
    
    const selectedWords = wordPool.slice(0, count);
    
    // Generate questions
    this.state = {
      questions: selectedWords.map(word => this._generateQuestion(word, wordPool)),
      currentIndex: 0,
      answers: [],
      startTime: Date.now(),
      timerInterval: null
    };
    
    this.config.units = [...new Set(selectedWords.map(w => w.unit))];
    
    App.navigate('test');
    this._renderQuestion();
  },

  _generateQuestion(word, pool) {
    const type = this.config.type;
    
    // Generate wrong options from pool
    const wrongOptions = pool
      .filter(w => w.english !== word.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    if (type === 'eng-to-kor') {
      const options = [word, ...wrongOptions].sort(() => Math.random() - 0.5);
      return {
        word,
        question: word.english,
        questionType: 'english',
        answer: word.korean,
        options: options.map(o => o.korean),
        correctIndex: options.findIndex(o => o.english === word.english)
      };
    } else if (type === 'kor-to-eng') {
      const options = [word, ...wrongOptions].sort(() => Math.random() - 0.5);
      return {
        word,
        question: word.korean,
        questionType: 'korean',
        answer: word.english,
        options: options.map(o => o.english),
        correctIndex: options.findIndex(o => o.english === word.english)
      };
    } else if (type === 'listening') {
      const options = [word, ...wrongOptions].sort(() => Math.random() - 0.5);
      return {
        word,
        question: word.english,
        questionType: 'listening',
        answer: word.korean,
        options: options.map(o => o.korean),
        correctIndex: options.findIndex(o => o.english === word.english)
      };
    } else { // spelling
      return {
        word,
        question: word.korean,
        questionType: 'spelling',
        answer: word.english,
        options: null,
        correctIndex: null
      };
    }
  },

  // --- Render Question ---
  _renderQuestion() {
    const screen = document.getElementById('test-screen');
    const q = this.state.questions[this.state.currentIndex];
    const current = this.state.currentIndex + 1;
    const total = this.state.questions.length;
    const pct = Math.round((current / total) * 100);
    
    let questionHTML = '';
    let optionsHTML = '';
    
    if (q.questionType === 'listening') {
      questionHTML = `
        <div class="test-question">
          <div class="question-label">듣고 뜻을 골라요 🎧</div>
          <button class="question-listen-btn" onclick="Audio.speak('${q.question}')">🔊</button>
        </div>
      `;
      
      optionsHTML = `
        <div class="test-options" id="test-options">
          ${q.options.map((opt, i) => `
            <button class="test-option" onclick="Test._answer(${i})">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
      `;
      
      setTimeout(() => Audio.speak(q.question), 300);
    } else if (q.questionType === 'spelling') {
      questionHTML = `
        <div class="test-question">
          <div class="question-label">한국어 뜻을 보고 영어를 써요 ⌨️</div>
          <div class="question-text">${q.question}</div>
        </div>
      `;
      
      const hint = q.answer[0] + '_'.repeat(q.answer.length - 1);
      
      optionsHTML = `
        <div class="spelling-input-container">
          <input type="text" class="spelling-input" id="spelling-input" 
                 placeholder="영어 단어를 입력하세요" autocomplete="off" autocapitalize="none"
                 onkeydown="if(event.key==='Enter') Test._checkSpelling()">
          <div class="spelling-hint">
            힌트: <span class="hint-text">${hint}</span> (${q.answer.length}글자)
          </div>
          <button class="btn btn-primary btn-lg spelling-submit" onclick="Test._checkSpelling()">
            ✅ 확인
          </button>
          <div class="spelling-feedback" id="spelling-feedback"></div>
        </div>
      `;
      
      setTimeout(() => {
        const input = document.getElementById('spelling-input');
        if (input) input.focus();
      }, 300);
    } else {
      const isEnglish = q.questionType === 'english';
      questionHTML = `
        <div class="test-question">
          <div class="question-label">${isEnglish ? '이 단어의 뜻은? 🤔' : '이 뜻의 영어 단어는? 🤔'}</div>
          <div class="question-text ${isEnglish ? 'english' : ''}">${q.question}</div>
          ${isEnglish ? `<button style="margin-top: 12px; font-size: 20px;" onclick="Audio.speak('${q.question}')">🔊 듣기</button>` : ''}
        </div>
      `;
      
      optionsHTML = `
        <div class="test-options" id="test-options">
          ${q.options.map((opt, i) => `
            <button class="test-option" onclick="Test._answer(${i})">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text ${q.questionType === 'korean' ? 'english' : ''}">${opt}</span>
            </button>
          `).join('')}
        </div>
      `;
      
      if (isEnglish) {
        setTimeout(() => Audio.speak(q.question), 300);
      }
    }
    
    screen.innerHTML = `
      <div class="test-container">
        <div class="test-header">
          <span class="test-counter">Q${current} / ${total}</span>
        </div>
        <div class="test-progress">
          <div class="progress-bar progress-bar-lg">
            <div class="progress-fill" style="width: ${pct}%"></div>
          </div>
        </div>
        ${questionHTML}
        ${optionsHTML}
      </div>
    `;
    
    App.showBackButton(true);
  },

  // --- Answer (Multiple Choice) ---
  _answer(selectedIndex) {
    const q = this.state.questions[this.state.currentIndex];
    const options = document.querySelectorAll('#test-options .test-option');
    const isCorrect = selectedIndex === q.correctIndex;
    
    // Disable all options
    options.forEach(opt => opt.classList.add('disabled'));
    
    // Show correct/wrong
    options[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
      options[q.correctIndex].classList.add('correct');
    }
    
    // Record answer
    this.state.answers.push({
      word: q.word,
      correct: isCorrect,
      selected: q.options ? q.options[selectedIndex] : null,
      correctAnswer: q.answer
    });
    
    if (isCorrect) {
      Audio.playCorrect();
      Storage.addXP(10);
    } else {
      Audio.playWrong();
      Storage.addWrongWord({ ...q.word });
    }
    
    Storage.logStudy(1);
    
    // Next question after delay
    setTimeout(() => {
      this.state.currentIndex++;
      if (this.state.currentIndex >= this.state.questions.length) {
        this._showResult();
      } else {
        this._renderQuestion();
      }
    }, 1000);
  },

  // --- Check Spelling ---
  _checkSpelling() {
    const input = document.getElementById('spelling-input');
    const feedback = document.getElementById('spelling-feedback');
    if (!input || !feedback) return;
    
    const q = this.state.questions[this.state.currentIndex];
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = q.answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;
    
    input.disabled = true;
    input.classList.add(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      feedback.innerHTML = `<span style="color: var(--success);">🎉 정답이에요!</span>`;
      Audio.playCorrect();
      Storage.addXP(15);
    } else {
      feedback.innerHTML = `
        <span style="color: var(--error);">정답: </span>
        <span class="correct-answer">${q.answer}</span>
      `;
      Audio.playWrong();
      Storage.addWrongWord({ ...q.word });
    }
    
    this.state.answers.push({
      word: q.word,
      correct: isCorrect,
      selected: userAnswer,
      correctAnswer: q.answer
    });
    
    Storage.logStudy(1);
    
    // Hide submit button
    const submitBtn = document.querySelector('.spelling-submit');
    if (submitBtn) submitBtn.style.display = 'none';
    
    setTimeout(() => {
      this.state.currentIndex++;
      if (this.state.currentIndex >= this.state.questions.length) {
        this._showResult();
      } else {
        this._renderQuestion();
      }
    }, 1500);
  },

  // --- Show Result ---
  _showResult() {
    const screen = document.getElementById('test-result-screen');
    const correctCount = this.state.answers.filter(a => a.correct).length;
    const totalCount = this.state.answers.length;
    const score = Math.round((correctCount / totalCount) * 100);
    const wrongAnswers = this.state.answers.filter(a => !a.correct);
    const elapsed = Math.round((Date.now() - this.state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    // Stars
    let stars = '';
    if (score >= 90) stars = '⭐⭐⭐⭐⭐';
    else if (score >= 80) stars = '⭐⭐⭐⭐☆';
    else if (score >= 70) stars = '⭐⭐⭐☆☆';
    else if (score >= 50) stars = '⭐⭐☆☆☆';
    else stars = '⭐☆☆☆☆';
    
    // Message
    let message = '';
    if (score >= 90) message = '완벽에 가까워요! 🎉';
    else if (score >= 80) message = '아주 잘했어요! 👏';
    else if (score >= 70) message = '잘했어요! 💪';
    else if (score >= 50) message = '조금만 더 노력해요! 📖';
    else message = '다시 학습하고 도전해요! 🔥';
    
    // Save test result
    Storage.addTestResult({
      type: this.config.type,
      units: this.config.units,
      correct: correctCount,
      total: totalCount,
      score,
      elapsed
    });
    
    // Bonus XP for completion
    const bonusXP = score >= 90 ? 50 : score >= 70 ? 30 : 15;
    Storage.addXP(bonusXP);
    
    if (score >= 80) {
      setTimeout(() => Animations.confetti(3000), 300);
      Audio.playLevelUp();
    }
    
    // SVG score circle
    const circumference = 2 * Math.PI * 70; // radius = 70
    const offset = circumference - (score / 100) * circumference;
    
    App.navigate('test-result');
    
    screen.innerHTML = `
      <div class="test-result-container">
        <div class="result-score-circle">
          <svg viewBox="0 0 160 160">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6C5CE7" />
                <stop offset="100%" style="stop-color:#A29BFE" />
              </linearGradient>
            </defs>
            <circle class="score-bg" cx="80" cy="80" r="70" />
            <circle class="score-fill" cx="80" cy="80" r="70" 
                    style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};" />
          </svg>
          <div class="result-score-text">
            <div class="result-score-number" id="score-number">0</div>
            <div class="result-score-label">점</div>
          </div>
        </div>
        
        <div class="result-stars">${stars}</div>
        <div class="result-message">${message}</div>
        
        <div class="result-summary">
          <div class="result-stat correct">
            <div class="stat-number">${correctCount}</div>
            <div class="stat-label">✅ 맞은 문제</div>
          </div>
          <div class="result-stat wrong">
            <div class="stat-number">${wrongAnswers.length}</div>
            <div class="stat-label">❌ 틀린 문제</div>
          </div>
        </div>
        
        <p style="color: var(--text-secondary); margin-bottom: var(--space-md);">
          ⏱️ 소요 시간: ${minutes}분 ${seconds}초 &nbsp;|&nbsp; +${bonusXP} XP
        </p>
        
        ${wrongAnswers.length > 0 ? `
          <div class="result-wrong-words">
            <h3>❌ 틀린 단어</h3>
            ${wrongAnswers.map(a => `
              <div class="wrong-word-item">
                <div class="wrong-word-info">
                  <span class="wrong-word-english">${a.word.english}</span>
                  <span class="wrong-word-korean">${a.word.korean}</span>
                </div>
                <span class="wrong-word-answer">내 답: ${a.selected || '-'}</span>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-danger btn-lg" onclick="Test._saveWrongToReview()" id="save-wrong-btn" style="margin-bottom: var(--space-md);">
            📓 오답노트에 저장
          </button>
        ` : ''}
        
        <div class="result-actions">
          <button class="btn btn-primary btn-lg" onclick="Test.start()">
            🔄 다시 풀기
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('test-setup')">
            ⚙️ 설정 변경
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('dashboard')">
            🏠 홈으로
          </button>
        </div>
      </div>
    `;
    
    // Animate score number
    setTimeout(() => {
      const scoreEl = document.getElementById('score-number');
      if (scoreEl) Animations.countUp(scoreEl, score, 1000);
    }, 300);
    
    App.showBackButton(false);
  },

  _saveWrongToReview() {
    const wrongAnswers = this.state.answers.filter(a => !a.correct);
    wrongAnswers.forEach(a => {
      Storage.addWrongWord({ ...a.word });
    });
    
    const btn = document.getElementById('save-wrong-btn');
    if (btn) {
      btn.textContent = '✅ 저장 완료!';
      btn.disabled = true;
      btn.style.opacity = '0.6';
    }
    
    App.showToast(`${wrongAnswers.length}개 단어가 오답노트에 저장되었어요!`, 'success');
  }
};
