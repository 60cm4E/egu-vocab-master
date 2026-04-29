/* ===================================
   Storage Manager - 학습 데이터 저장/관리
   =================================== */

const Storage = {
  PREFIX: 'egu_vocab_',

  // --- Profile Management ---
  getProfiles() {
    const data = localStorage.getItem(this.PREFIX + 'profiles');
    return data ? JSON.parse(data) : [];
  },

  saveProfile(profile) {
    const profiles = this.getProfiles();
    const existing = profiles.findIndex(p => p.id === profile.id);
    if (existing >= 0) {
      profiles[existing] = { ...profiles[existing], ...profile, lastLogin: Date.now() };
    } else {
      profiles.push({ ...profile, createdAt: Date.now(), lastLogin: Date.now() });
    }
    localStorage.setItem(this.PREFIX + 'profiles', JSON.stringify(profiles));
  },

  removeProfile(profileId) {
    const profiles = this.getProfiles().filter(p => p.id !== profileId);
    localStorage.setItem(this.PREFIX + 'profiles', JSON.stringify(profiles));
    // Clear profile-specific data
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.PREFIX + profileId + '_'));
    keys.forEach(k => localStorage.removeItem(k));
  },

  getCurrentProfile() {
    const id = sessionStorage.getItem(this.PREFIX + 'current_profile');
    if (!id) return null;
    return this.getProfiles().find(p => p.id === id) || null;
  },

  setCurrentProfile(profileId) {
    sessionStorage.setItem(this.PREFIX + 'current_profile', profileId);
  },

  generateProfileId(name, classCode) {
    return `${classCode}_${name}`.replace(/\s+/g, '_').toLowerCase();
  },

  // --- Profile-specific data helpers ---
  _key(key) {
    const profile = this.getCurrentProfile();
    if (!profile) return this.PREFIX + key;
    return this.PREFIX + profile.id + '_' + key;
  },

  _get(key, defaultVal = null) {
    const data = localStorage.getItem(this._key(key));
    if (data === null) return defaultVal;
    try { return JSON.parse(data); } catch { return data; }
  },

  _set(key, value) {
    localStorage.setItem(this._key(key), JSON.stringify(value));
    this._syncToFirebase();
  },

  _syncToFirebase() {
    const profile = this.getCurrentProfile();
    if (!profile || !window.db) return;
    
    // Collect all data for this profile
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(this.PREFIX + profile.id + '_')) {
        const shortKey = k.replace(this.PREFIX + profile.id + '_', '');
        try { data[shortKey] = JSON.parse(localStorage.getItem(k)); } 
        catch { data[shortKey] = localStorage.getItem(k); }
      }
    }
    
    // Save to Firestore asynchronously
    window.db.collection('users').doc(profile.id).set({
      profile: profile,
      data: data,
      lastUpdated: new Date()
    }, { merge: true }).catch(err => console.error("Firebase sync error", err));
  },

  async syncFromFirebase(profileId) {
    if (!window.db) return false;
    try {
      const doc = await window.db.collection('users').doc(profileId).get();
      if (doc.exists) {
        const docData = doc.data();
        if (docData.data) {
          // Restore all data to local storage
          Object.keys(docData.data).forEach(k => {
            const val = docData.data[k];
            localStorage.setItem(this.PREFIX + profileId + '_' + k, JSON.stringify(val));
          });
          return true;
        }
      }
    } catch (err) {
      console.error("Firebase fetch error", err);
    }
    return false;
  },

  // --- Learning Progress ---
  getUnitProgress(unitNum) {
    return this._get(`unit_${unitNum}_progress`, {
      learned: [],       // words marked as "know"
      unknown: [],       // words marked as "don't know"
      flashcardDone: false,
      matchingDone: false,
      lastStudied: null
    });
  },

  setUnitProgress(unitNum, progress) {
    this._set(`unit_${unitNum}_progress`, progress);
  },

  markWordLearned(unitNum, word, known) {
    const progress = this.getUnitProgress(unitNum);
    if (known) {
      if (!progress.learned.includes(word)) progress.learned.push(word);
      progress.unknown = progress.unknown.filter(w => w !== word);
    } else {
      if (!progress.unknown.includes(word)) progress.unknown.push(word);
      progress.learned = progress.learned.filter(w => w !== word);
    }
    progress.lastStudied = Date.now();
    this.setUnitProgress(unitNum, progress);
  },

  getOverallProgress() {
    let totalLearned = 0;
    let totalUnits = VOCAB_DATA.length;
    let completedUnits = 0;
    
    for (const unit of VOCAB_DATA) {
      const progress = this.getUnitProgress(unit.unit);
      totalLearned += progress.learned.length;
      if (progress.learned.length >= unit.words.length) {
        completedUnits++;
      }
    }
    
    return {
      totalLearned,
      totalWords: VOCAB_DATA.reduce((sum, u) => sum + u.words.length, 0),
      completedUnits,
      totalUnits
    };
  },

  // --- Wrong Answer Notebook ---
  getWrongWords() {
    return this._get('wrong_words', []);
  },

  addWrongWord(word) {
    const words = this.getWrongWords();
    const existing = words.find(w => w.english === word.english);
    if (existing) {
      existing.wrongCount = (existing.wrongCount || 1) + 1;
      existing.lastWrong = Date.now();
    } else {
      words.push({
        english: word.english,
        korean: word.korean,
        unit: word.unit,
        wrongCount: 1,
        addedAt: Date.now(),
        lastWrong: Date.now()
      });
    }
    this._set('wrong_words', words);
  },

  addWrongWords(wordsList) {
    wordsList.forEach(w => this.addWrongWord(w));
  },

  removeWrongWord(english) {
    const words = this.getWrongWords().filter(w => w.english !== english);
    this._set('wrong_words', words);
  },

  clearWrongWords() {
    this._set('wrong_words', []);
  },

  // --- Test History ---
  getTestHistory() {
    return this._get('test_history', []);
  },

  addTestResult(result) {
    const history = this.getTestHistory();
    history.unshift({
      ...result,
      timestamp: Date.now()
    });
    // Keep last 50 results
    if (history.length > 50) history.length = 50;
    this._set('test_history', history);
  },

  // --- Streak ---
  getStreak() {
    return this._get('streak', { current: 0, lastDate: null, best: 0 });
  },

  updateStreak() {
    const streak = this.getStreak();
    const today = new Date().toDateString();
    
    if (streak.lastDate === today) return streak;
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streak.lastDate === yesterday) {
      streak.current++;
    } else {
      streak.current = 1;
    }
    
    streak.lastDate = today;
    if (streak.current > streak.best) streak.best = streak.current;
    
    this._set('streak', streak);
    return streak;
  },

  // --- Daily Study Log ---
  getDailyLog() {
    return this._get('daily_log', {});
  },

  logStudy(count = 1) {
    const log = this.getDailyLog();
    const today = new Date().toISOString().slice(0, 10);
    log[today] = (log[today] || 0) + count;
    this._set('daily_log', log);
    this.updateStreak();
  },

  getWeeklyStudy() {
    const log = this.getDailyLog();
    const days = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const key = date.toISOString().slice(0, 10);
      days.push({
        label: dayNames[date.getDay()],
        count: log[key] || 0,
        isToday: i === 0
      });
    }
    return days;
  },

  // --- Level System ---
  getXP() {
    return this._get('xp', 0);
  },

  addXP(amount) {
    const xp = this.getXP() + amount;
    this._set('xp', xp);
    return xp;
  },

  getLevel(xp) {
    if (xp === undefined) xp = this.getXP();
    const levels = [
      { level: 1, name: '새싹', icon: '🌱', min: 0 },
      { level: 2, name: '풀잎', icon: '🌿', min: 100 },
      { level: 3, name: '나무', icon: '🌳', min: 300 },
      { level: 4, name: '동메달', icon: '🥉', min: 600 },
      { level: 5, name: '은메달', icon: '🥈', min: 1000 },
      { level: 6, name: '금메달', icon: '🥇', min: 1500 },
      { level: 7, name: '다이아', icon: '💎', min: 2500 },
      { level: 8, name: '왕관', icon: '👑', min: 4000 },
      { level: 9, name: '스타', icon: '⭐', min: 6000 },
      { level: 10, name: '마스터', icon: '🏆', min: 10000 }
    ];
    
    let current = levels[0];
    let next = levels[1];
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (xp >= levels[i].min) {
        current = levels[i];
        next = levels[i + 1] || null;
        break;
      }
    }
    
    return {
      ...current,
      xp,
      nextLevel: next,
      progress: next ? (xp - current.min) / (next.min - current.min) : 1
    };
  },

  // --- Settings ---
  getSettings() {
    return this._get('settings', {
      soundEffects: true,
      ttsSpeed: 0.8,
      showHints: true
    });
  },

  setSettings(settings) {
    this._set('settings', settings);
  }
};
