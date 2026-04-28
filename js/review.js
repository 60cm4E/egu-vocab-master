/* ===================================
   Review Module - 오답노트
   =================================== */

const Review = {
  sortBy: 'recent', // recent, count, alpha

  render() {
    const screen = document.getElementById('review-screen');
    let wrongWords = Storage.getWrongWords();
    
    // Sort
    if (this.sortBy === 'count') {
      wrongWords.sort((a, b) => b.wrongCount - a.wrongCount);
    } else if (this.sortBy === 'alpha') {
      wrongWords.sort((a, b) => a.english.localeCompare(b.english));
    } else {
      wrongWords.sort((a, b) => (b.lastWrong || 0) - (a.lastWrong || 0));
    }
    
    if (wrongWords.length === 0) {
      screen.innerHTML = `
        <div class="section-header">
          <div class="section-title">📓 오답노트</div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <div class="empty-title">오답이 없어요!</div>
          <div class="empty-desc">시험을 보면 틀린 단어가 여기에 저장돼요</div>
          <button class="btn btn-primary" style="margin-top: var(--space-lg);" onclick="App.navigate('test-setup')">
            📝 시험 보러 가기
          </button>
        </div>
      `;
      return;
    }
    
    screen.innerHTML = `
      <div class="review-header">
        <div class="section-title">📓 오답노트</div>
        <div class="review-count">
          총 <span class="count-number">${wrongWords.length}</span>개
        </div>
      </div>
      
      <!-- Sort -->
      <div class="review-sort">
        <span>정렬:</span>
        <select class="sort-select" onchange="Review.sortBy = this.value; Review.render();">
          <option value="recent" ${this.sortBy === 'recent' ? 'selected' : ''}>최근 순</option>
          <option value="count" ${this.sortBy === 'count' ? 'selected' : ''}>많이 틀린 순</option>
          <option value="alpha" ${this.sortBy === 'alpha' ? 'selected' : ''}>알파벳 순</option>
        </select>
      </div>
      
      <!-- Word List -->
      <div class="review-list">
        ${wrongWords.map(word => `
          <div class="review-item" id="review-${word.english.replace(/[^a-zA-Z]/g, '')}">
            <div class="review-item-main" onclick="Audio.speak('${word.english}')">
              <div class="review-item-english">${word.english}</div>
              <div class="review-item-korean">${word.korean}</div>
              <div class="review-item-meta">
                ${word.unit ? `<span class="review-item-unit">Unit ${word.unit}</span>` : ''}
                <span class="review-item-count">❌ ${word.wrongCount}회 틀림</span>
              </div>
            </div>
            <button class="review-item-listen" onclick="Audio.speak('${word.english}')">🔊</button>
            <button class="review-item-delete" onclick="Review._removeWord('${word.english}')">✕</button>
          </div>
        `).join('')}
      </div>
      
      <!-- Actions -->
      <div class="review-actions">
        <button class="btn btn-primary" onclick="Review.startFlashcard()">
          🃏 플래시카드 복습
        </button>
        <button class="btn btn-success" onclick="Review.startTest()">
          📝 재시험
        </button>
      </div>
      
      <button class="btn btn-secondary btn-lg" style="margin-top: var(--space-md);" onclick="Review._confirmClear()">
        🗑️ 전체 삭제
      </button>
    `;
  },

  _removeWord(english) {
    Storage.removeWrongWord(english);
    
    const item = document.getElementById(`review-${english.replace(/[^a-zA-Z]/g, '')}`);
    if (item) {
      item.style.transition = 'all 0.3s ease';
      item.style.opacity = '0';
      item.style.transform = 'translateX(100px)';
      item.style.maxHeight = item.offsetHeight + 'px';
      
      setTimeout(() => {
        item.style.maxHeight = '0';
        item.style.padding = '0';
        item.style.margin = '0';
        item.style.overflow = 'hidden';
      }, 200);
      
      setTimeout(() => this.render(), 500);
    }
    
    App.showToast('단어가 삭제되었어요', 'success');
  },

  _confirmClear() {
    if (confirm('오답노트의 모든 단어를 삭제할까요?')) {
      Storage.clearWrongWords();
      this.render();
      App.showToast('오답노트가 비워졌어요', 'success');
    }
  },

  startFlashcard() {
    const wrongWords = Storage.getWrongWords();
    if (wrongWords.length === 0) {
      App.showToast('복습할 단어가 없어요!', 'error');
      return;
    }
    
    // Create a virtual unit from wrong words
    Learn.mode = 'flashcard';
    Learn.currentUnit = { unit: '오답', words: wrongWords.map(w => ({ english: w.english, korean: w.korean })) };
    Learn.currentWords = [...Learn.currentUnit.words];
    Learn.currentIndex = 0;
    Learn.knownWords = [];
    Learn.unknownWords = [];
    
    // Shuffle
    for (let i = Learn.currentWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [Learn.currentWords[i], Learn.currentWords[j]] = [Learn.currentWords[j], Learn.currentWords[i]];
    }
    
    App.navigate('learn');
    Learn._renderFlashcard();
  },

  startTest() {
    const wrongWords = Storage.getWrongWords();
    if (wrongWords.length < 4) {
      App.showToast('최소 4개 단어가 필요해요!', 'error');
      return;
    }
    
    // Set test config for wrong words
    Test.config.type = 'eng-to-kor';
    
    // Build word pool
    const wordPool = wrongWords.map(w => ({
      english: w.english,
      korean: w.korean,
      unit: w.unit
    }));
    
    // Shuffle
    for (let i = wordPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wordPool[i], wordPool[j]] = [wordPool[j], wordPool[i]];
    }
    
    const count = Math.min(20, wordPool.length);
    const selectedWords = wordPool.slice(0, count);
    
    // Need a full pool for generating wrong options
    const allWords = [];
    VOCAB_DATA.forEach(unit => {
      allWords.push(...unit.words.map(w => ({ ...w, unit: unit.unit })));
    });
    
    Test.state = {
      questions: selectedWords.map(word => Test._generateQuestion(word, allWords)),
      currentIndex: 0,
      answers: [],
      startTime: Date.now(),
      timerInterval: null
    };
    
    Test.config.units = [...new Set(selectedWords.map(w => w.unit))];
    
    App.navigate('test');
    Test._renderQuestion();
  }
};
