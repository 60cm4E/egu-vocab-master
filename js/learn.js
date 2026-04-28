/* ===================================
   Learn Module - Flashcard & Matching
   =================================== */

const Learn = {
  currentUnit: null,
  currentWords: [],
  currentIndex: 0,
  knownWords: [],
  unknownWords: [],
  mode: null, // 'flashcard', 'matching', 'listening'

  // --- Unit Select ---
  renderUnitSelect() {
    const screen = document.getElementById('unit-select-screen');
    
    const unitThemes = {
      1: '집과 생활 🏠', 2: '욕실/주방 🚿', 3: '침실/서재 🛏️',
      4: '의류/패션 👔', 5: '가족/사람 👨‍👩‍👦', 6: '학교 🏫',
      7: '학용품 ✏️', 8: '공부/시험 📖', 9: '운동/스포츠 ⚽',
      10: '경기/대회 🏆', 11: '얼굴/외모 👤', 12: '신체/색상 🎨',
      13: '몸/건강 💪', 14: '감정/기분 😊', 15: '아기/성장 👶',
      16: '성격/시간 ⏰', 17: '요일/계절 📅', 18: '달/날짜 🗓️',
      19: '생일/숫자 🎂', 20: '하루 일과 🌅', 21: '가게/건물 🏪',
      22: '위치/방향 📍', 23: '시장/쇼핑 🛒', 24: '은행/돈 💰',
      25: '요리/음식 🍳', 26: '취미/활동 🎮', 27: '음악/공연 🎵',
      28: '나라/여행 ✈️', 29: '교통/이동 🚗', 30: '캠핑/자연 ⛺',
      31: '영화/엔터 🎬', 32: '행사/축제 🎉', 33: '놀이공원 🎢',
      34: '이동/방향 🧭', 35: '편지/통신 ✉️', 36: '곡물/음식 🍚',
      37: '수량/크기 📐', 38: '과일/채소 🍎', 39: '농장/곤충 🐛',
      40: '야생동물 🦁', 41: '자연/환경 🌍', 42: '바다/해양 🌊',
      43: '하늘/우주 🌤️', 44: '날씨/계절 🌈', 45: '지구/에너지 ⚡',
      46: '감각/느낌 👁️', 47: '도형/모양 🔷', 48: '동작/움직임 🏃',
      49: '수리/교통 🔧', 50: '직업 💼', 51: '사무실/일 🖥️',
      52: '문제/해결 🧩', 53: '생각/의견 💭', 54: '세계/문화 🌐',
      55: '미래/기술 🤖'
    };

    screen.innerHTML = `
      <div class="section-header">
        <div class="section-title">📚 유닛 선택</div>
      </div>
      <div class="unit-grid">
        ${VOCAB_DATA.map(unit => {
          const progress = Storage.getUnitProgress(unit.unit);
          const learnedCount = progress.learned.length;
          const totalCount = unit.words.length;
          const pct = Math.round((learnedCount / totalCount) * 100);
          
          let statusClass = 'not-started';
          let statusIcon = '📖';
          if (learnedCount >= totalCount) {
            statusClass = 'completed';
            statusIcon = '✅';
          } else if (learnedCount > 0) {
            statusClass = 'in-progress';
            statusIcon = '⏳';
          }
          
          const theme = unitThemes[unit.unit] || `Unit ${unit.unit}`;
          
          return `
            <div class="unit-card" onclick="Learn.selectUnit(${unit.unit})">
              <div class="unit-number ${statusClass}">${unit.unit}</div>
              <div class="unit-info">
                <div class="unit-title">${theme}</div>
                <div class="unit-meta">
                  <span>${totalCount}단어</span>
                  <span>•</span>
                  <span>${learnedCount}/${totalCount} 학습</span>
                </div>
                <div class="progress-bar" style="margin-top:6px">
                  <div class="progress-fill" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="unit-status">${statusIcon}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // --- Select Unit ---
  selectUnit(unitNum) {
    this.currentUnit = VOCAB_DATA.find(u => u.unit === unitNum);
    if (!this.currentUnit) return;
    
    const screen = document.getElementById('unit-select-screen');
    const progress = Storage.getUnitProgress(unitNum);
    
    screen.innerHTML = `
      <div class="section-header">
        <div class="section-title">Unit ${unitNum}</div>
        <span class="badge badge-primary">${this.currentUnit.words.length}단어</span>
      </div>
      <div class="learn-modes">
        <button class="learn-mode-btn" onclick="Learn.startFlashcard(${unitNum})">
          <div class="learn-mode-icon">🃏</div>
          <div class="learn-mode-text">
            <h3>플래시카드</h3>
            <p>카드를 넘기며 단어를 외워요</p>
          </div>
        </button>
        <button class="learn-mode-btn" onclick="Learn.startMatching(${unitNum})">
          <div class="learn-mode-icon">🔗</div>
          <div class="learn-mode-text">
            <h3>매칭 게임</h3>
            <p>영어와 한국어를 짝지어요</p>
          </div>
        </button>
        <button class="learn-mode-btn" onclick="Learn.startListening(${unitNum})">
          <div class="learn-mode-icon">🎧</div>
          <div class="learn-mode-text">
            <h3>듣고 맞추기</h3>
            <p>발음을 듣고 뜻을 골라요</p>
          </div>
        </button>
      </div>
      
      <!-- Word List Preview -->
      <div class="card" style="margin-top: var(--space-lg)">
        <div class="section-header">
          <div class="section-title">📋 단어 목록</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${this.currentUnit.words.map(w => {
            const isLearned = progress.learned.includes(w.english);
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: ${isLearned ? 'var(--success-bg)' : 'var(--bg)'}; border-radius: var(--radius-sm);">
                <div>
                  <span style="font-family: var(--font-en); font-weight: 600;">${w.english}</span>
                  <span style="color: var(--text-secondary); margin-left: 8px;">${w.korean}</span>
                </div>
                <button onclick="Audio.speak('${w.english}')" style="font-size: 18px; padding: 4px;">🔊</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    App.showBackButton(true);
  },

  // --- Flashcard Mode ---
  startFlashcard(unitNum) {
    this.mode = 'flashcard';
    this.currentUnit = VOCAB_DATA.find(u => u.unit === unitNum);
    this.currentWords = [...this.currentUnit.words];
    this.currentIndex = 0;
    this.knownWords = [];
    this.unknownWords = [];
    
    // Shuffle
    for (let i = this.currentWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.currentWords[i], this.currentWords[j]] = [this.currentWords[j], this.currentWords[i]];
    }
    
    App.navigate('learn');
    this._renderFlashcard();
  },

  _renderFlashcard() {
    const screen = document.getElementById('learn-screen');
    const word = this.currentWords[this.currentIndex];
    const total = this.currentWords.length;
    const current = this.currentIndex + 1;
    const pct = Math.round((current / total) * 100);
    
    screen.innerHTML = `
      <div class="flashcard-progress">
        <span class="current-count">${current} / ${total}</span>
        <span>Unit ${this.currentUnit.unit}</span>
      </div>
      <div class="progress-bar progress-bar-lg">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      
      <div class="flashcard-container">
        <div class="flashcard" id="flashcard" onclick="Learn._flipCard()">
          <div class="flashcard-face flashcard-front">
            <div class="flashcard-word">${word.english}</div>
            <button class="flashcard-listen-btn" onclick="event.stopPropagation(); Audio.speak('${word.english}')">🔊</button>
            <div class="flashcard-hint">탭하면 뜻을 확인해요</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="flashcard-meaning">${word.korean}</div>
            <div class="flashcard-word" style="font-size: var(--font-size-xl); margin-top: 8px; opacity: 0.8;">${word.english}</div>
          </div>
        </div>
      </div>
      
      <div class="flashcard-actions">
        <button class="btn btn-dont-know" onclick="Learn._markWord(false)">
          😅 몰라요
        </button>
        <button class="btn btn-know" onclick="Learn._markWord(true)">
          😊 알아요
        </button>
      </div>
    `;
    
    App.showBackButton(true);
  },

  _flipCard() {
    const card = document.getElementById('flashcard');
    if (card) card.classList.toggle('flipped');
    Audio.playClick();
  },

  _markWord(known) {
    const word = this.currentWords[this.currentIndex];
    
    if (known) {
      this.knownWords.push(word);
      Audio.playCorrect();
    } else {
      this.unknownWords.push(word);
      Audio.playWrong();
    }
    
    Storage.markWordLearned(this.currentUnit.unit, word.english, known);
    Storage.logStudy(1);
    Storage.addXP(known ? 5 : 2);
    
    if (!known) {
      Storage.addWrongWord({ ...word, unit: this.currentUnit.unit });
    }
    
    this.currentIndex++;
    
    if (this.currentIndex >= this.currentWords.length) {
      this._renderFlashcardComplete();
    } else {
      this._renderFlashcard();
    }
  },

  _renderFlashcardComplete() {
    const screen = document.getElementById('learn-screen');
    const total = this.currentWords.length;
    const knownCount = this.knownWords.length;
    
    // Mark unit flashcard as done
    const progress = Storage.getUnitProgress(this.currentUnit.unit);
    progress.flashcardDone = true;
    Storage.setUnitProgress(this.currentUnit.unit, progress);
    
    // Add bonus XP
    Storage.addXP(20);
    
    if (knownCount === total) {
      Animations.confetti(3000);
      Audio.playLevelUp();
    }
    
    screen.innerHTML = `
      <div class="learn-complete">
        <div class="complete-icon">${knownCount === total ? '🎉' : '💪'}</div>
        <h2 class="complete-title">
          ${knownCount === total ? '완벽해요!' : '잘했어요!'}
        </h2>
        <div class="complete-stats">
          <p>알아요: <strong style="color: var(--success);">${knownCount}개</strong></p>
          <p>몰라요: <strong style="color: var(--error);">${this.unknownWords.length}개</strong></p>
          <p style="margin-top: 8px; color: var(--primary);">+${total * 5 + 20} XP 획득!</p>
        </div>
        <div class="complete-actions">
          ${this.unknownWords.length > 0 ? `
            <button class="btn btn-primary btn-lg" onclick="Learn._retryUnknown()">
              😅 모르는 단어 다시 학습
            </button>
          ` : ''}
          <button class="btn btn-success btn-lg" onclick="Learn.startMatching(${this.currentUnit.unit})">
            🔗 매칭 게임 하기
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('unit-select')">
            📚 유닛 목록으로
          </button>
        </div>
      </div>
    `;
  },

  _retryUnknown() {
    this.currentWords = [...this.unknownWords];
    this.currentIndex = 0;
    this.knownWords = [];
    this.unknownWords = [];
    
    // Shuffle
    for (let i = this.currentWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.currentWords[i], this.currentWords[j]] = [this.currentWords[j], this.currentWords[i]];
    }
    
    this._renderFlashcard();
  },

  // --- Matching Game ---
  matchingState: {
    pairs: [],
    selected: null,
    matched: [],
    attempts: 0
  },

  startMatching(unitNum) {
    this.mode = 'matching';
    this.currentUnit = VOCAB_DATA.find(u => u.unit === unitNum);
    
    // Pick 5 random words
    const shuffled = [...this.currentUnit.words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    this.matchingState = {
      pairs: shuffled.slice(0, 5),
      selected: null,
      matched: [],
      attempts: 0,
      round: 1,
      totalRounds: Math.ceil(this.currentUnit.words.length / 5)
    };
    
    App.navigate('learn');
    this._renderMatching();
  },

  _renderMatching() {
    const screen = document.getElementById('learn-screen');
    const state = this.matchingState;
    
    // Shuffle English and Korean separately
    const englishCards = state.pairs.map((w, i) => ({ text: w.english, index: i, type: 'english' }));
    const koreanCards = state.pairs.map((w, i) => ({ text: w.korean, index: i, type: 'korean' }));
    
    // Shuffle each column
    for (let arr of [englishCards, koreanCards]) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    
    screen.innerHTML = `
      <div class="flashcard-progress">
        <span class="current-count">라운드 ${state.round}/${state.totalRounds}</span>
        <span>Unit ${this.currentUnit.unit}</span>
      </div>
      
      <div class="matching-score">
        매칭: <strong>${state.matched.length}</strong> / ${state.pairs.length} | 시도: ${state.attempts}
      </div>
      
      <div class="matching-container">
        <div class="matching-grid">
          <div class="matching-column">
            <div class="matching-column-label">🔤 영어</div>
            ${englishCards.map(card => `
              <div class="match-card english ${state.matched.includes(card.index) ? 'matched' : ''}" 
                   data-index="${card.index}" data-type="english"
                   onclick="Learn._selectMatch(this, ${card.index}, 'english')">
                ${card.text}
              </div>
            `).join('')}
          </div>
          <div class="matching-column">
            <div class="matching-column-label">🇰🇷 한국어</div>
            ${koreanCards.map(card => `
              <div class="match-card korean ${state.matched.includes(card.index) ? 'matched' : ''}" 
                   data-index="${card.index}" data-type="korean"
                   onclick="Learn._selectMatch(this, ${card.index}, 'korean')">
                ${card.text}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    App.showBackButton(true);
  },

  _selectMatch(element, index, type) {
    const state = this.matchingState;
    
    if (state.matched.includes(index) && state.selected && state.selected.index === index) return;
    
    if (!state.selected) {
      state.selected = { index, type, element };
      element.classList.add('selected');
      Audio.playClick();
    } else {
      if (state.selected.type === type) {
        // Same column, change selection
        state.selected.element.classList.remove('selected');
        state.selected = { index, type, element };
        element.classList.add('selected');
        Audio.playClick();
      } else {
        // Different column, check match
        state.attempts++;
        
        if (state.selected.index === index) {
          // Correct match!
          state.matched.push(index);
          element.classList.add('matched');
          state.selected.element.classList.remove('selected');
          state.selected.element.classList.add('matched');
          state.selected = null;
          Audio.playCorrect();
          
          Storage.logStudy(1);
          Storage.addXP(10);
          
          if (state.matched.length === state.pairs.length) {
            setTimeout(() => this._matchingRoundComplete(), 500);
          }
        } else {
          // Wrong match
          element.classList.add('wrong');
          state.selected.element.classList.add('wrong');
          Audio.playWrong();
          
          const prev = state.selected.element;
          state.selected = null;
          
          setTimeout(() => {
            element.classList.remove('wrong');
            prev.classList.remove('wrong', 'selected');
          }, 500);
        }
      }
    }
  },

  _matchingRoundComplete() {
    const state = this.matchingState;
    const unitWords = this.currentUnit.words;
    const nextStart = state.round * 5;
    
    if (nextStart < unitWords.length) {
      // Next round
      const nextPairs = unitWords.slice(nextStart, nextStart + 5);
      this.matchingState = {
        pairs: nextPairs,
        selected: null,
        matched: [],
        attempts: 0,
        round: state.round + 1,
        totalRounds: state.totalRounds
      };
      this._renderMatching();
    } else {
      // All rounds done
      Storage.addXP(30);
      
      const progress = Storage.getUnitProgress(this.currentUnit.unit);
      progress.matchingDone = true;
      Storage.setUnitProgress(this.currentUnit.unit, progress);
      
      Animations.confetti(2000);
      
      const screen = document.getElementById('learn-screen');
      screen.innerHTML = `
        <div class="learn-complete">
          <div class="complete-icon">🎊</div>
          <h2 class="complete-title">매칭 게임 완료!</h2>
          <div class="complete-stats">
            <p>총 시도: <strong>${state.attempts}회</strong></p>
            <p style="margin-top: 8px; color: var(--primary);">+30 XP 획득!</p>
          </div>
          <div class="complete-actions">
            <button class="btn btn-primary btn-lg" onclick="App.navigate('test-setup')">
              📝 시험 보기
            </button>
            <button class="btn btn-secondary btn-lg" onclick="App.navigate('unit-select')">
              📚 유닛 목록으로
            </button>
          </div>
        </div>
      `;
    }
  },

  // --- Listening Mode ---
  listeningState: {
    words: [],
    currentIndex: 0,
    correct: 0,
    total: 0
  },

  startListening(unitNum) {
    this.mode = 'listening';
    this.currentUnit = VOCAB_DATA.find(u => u.unit === unitNum);
    
    const shuffled = [...this.currentUnit.words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    this.listeningState = {
      words: shuffled,
      currentIndex: 0,
      correct: 0,
      total: shuffled.length
    };
    
    App.navigate('learn');
    this._renderListening();
  },

  _renderListening() {
    const screen = document.getElementById('learn-screen');
    const state = this.listeningState;
    const word = state.words[state.currentIndex];
    const current = state.currentIndex + 1;
    const pct = Math.round((current / state.total) * 100);
    
    // Generate 4 options (1 correct + 3 random)
    const allWords = this.currentUnit.words.filter(w => w.english !== word.english);
    const shuffledAll = [...allWords];
    for (let i = shuffledAll.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledAll[i], shuffledAll[j]] = [shuffledAll[j], shuffledAll[i]];
    }
    
    const options = [word, ...shuffledAll.slice(0, 3)];
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    
    screen.innerHTML = `
      <div class="flashcard-progress">
        <span class="current-count">${current} / ${state.total}</span>
        <span>Unit ${this.currentUnit.unit} · 듣기</span>
      </div>
      <div class="progress-bar progress-bar-lg">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      
      <div class="test-question" style="margin-top: var(--space-xl);">
        <div class="question-label">듣고 뜻을 골라요! 🎧</div>
        <button class="question-listen-btn" onclick="Audio.speak('${word.english}')">🔊</button>
      </div>
      
      <div class="test-options" id="listening-options">
        ${options.map((opt, i) => `
          <button class="test-option" onclick="Learn._answerListening(this, '${opt.english}', '${word.english}')">
            <span class="option-letter">${String.fromCharCode(65 + i)}</span>
            <span class="option-text">${opt.korean}</span>
          </button>
        `).join('')}
      </div>
    `;
    
    // Auto play sound
    setTimeout(() => Audio.speak(word.english), 300);
    App.showBackButton(true);
  },

  _answerListening(element, selected, correct) {
    const options = document.querySelectorAll('#listening-options .test-option');
    options.forEach(opt => opt.classList.add('disabled'));
    
    if (selected === correct) {
      element.classList.add('correct');
      this.listeningState.correct++;
      Audio.playCorrect();
      Storage.addXP(5);
    } else {
      element.classList.add('wrong');
      // Show correct
      options.forEach(opt => {
        if (opt.querySelector('.option-text').textContent === 
            this.currentUnit.words.find(w => w.english === correct).korean) {
          opt.classList.add('correct');
        }
      });
      Audio.playWrong();
      
      const word = this.currentUnit.words.find(w => w.english === correct);
      Storage.addWrongWord({ ...word, unit: this.currentUnit.unit });
    }
    
    Storage.logStudy(1);
    
    setTimeout(() => {
      this.listeningState.currentIndex++;
      if (this.listeningState.currentIndex >= this.listeningState.total) {
        this._renderListeningComplete();
      } else {
        this._renderListening();
      }
    }, 1000);
  },

  _renderListeningComplete() {
    const screen = document.getElementById('learn-screen');
    const state = this.listeningState;
    const pct = Math.round((state.correct / state.total) * 100);
    
    Storage.addXP(20);
    
    if (pct >= 80) Animations.confetti(2000);
    
    screen.innerHTML = `
      <div class="learn-complete">
        <div class="complete-icon">${pct >= 80 ? '🎉' : '💪'}</div>
        <h2 class="complete-title">듣기 학습 완료!</h2>
        <div class="complete-stats">
          <p>정답: <strong style="color: var(--success);">${state.correct}</strong> / ${state.total}</p>
          <p>정답률: <strong style="color: var(--primary);">${pct}%</strong></p>
          <p style="margin-top: 8px; color: var(--primary);">+20 XP 획득!</p>
        </div>
        <div class="complete-actions">
          <button class="btn btn-primary btn-lg" onclick="Learn.startListening(${this.currentUnit.unit})">
            🎧 다시 듣기
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('unit-select')">
            📚 유닛 목록으로
          </button>
        </div>
      </div>
    `;
  }
};
