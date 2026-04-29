/* ===================================
   App Module - Main Router & Controller
   =================================== */

const App = {
  currentScreen: 'dashboard',
  screenHistory: [],
  
  init() {
    Animations.init();
    this._setupLogin();
    this._setupNavigation();
    this._setupProfileModal();
    
    // Check if already logged in
    const profile = Storage.getCurrentProfile();
    if (profile) {
      this._enterApp();
    }
  },

  // --- Login ---
  _setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const nameInput = document.getElementById('student-name');
    const codeInput = document.getElementById('class-code');
    
    loginBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const code = codeInput.value.trim();
      
      if (!name) {
        nameInput.focus();
        this.showToast('이름을 입력해주세요!', 'error');
        return;
      }
      if (!code) {
        codeInput.focus();
        this.showToast('반 코드를 입력해주세요!', 'error');
        return;
      }
      
      loginBtn.disabled = true;
      loginBtn.innerHTML = '로딩 중...';
      
      const profileId = Storage.generateProfileId(name, code);
      await Storage.syncFromFirebase(profileId); // Try to fetch from server
      
      Storage.saveProfile({ id: profileId, name, classCode: code });
      Storage.setCurrentProfile(profileId);
      
      loginBtn.disabled = false;
      loginBtn.innerHTML = '🚀 시작하기';
      
      this._enterApp();
    });
    
    // Enter key
    [nameInput, codeInput].forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loginBtn.click();
      });
    });
    
    // Show saved profiles
    this._renderSavedProfiles();
  },

  _renderSavedProfiles() {
    const container = document.getElementById('saved-profiles');
    const profiles = Storage.getProfiles();
    
    if (profiles.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = `
      <h3>👥 저장된 프로필</h3>
      <div>
        ${profiles.map(p => `
          <button class="profile-chip" onclick="App._quickLogin('${p.id}')">
            😊 ${p.name} (${p.classCode})
          </button>
        `).join('')}
      </div>
    `;
  },

  async _quickLogin(profileId) {
    const profile = Storage.getProfiles().find(p => p.id === profileId);
    if (profile) {
      this.showToast('로딩 중...', 'success');
      await Storage.syncFromFirebase(profileId); // Try to fetch from server
      Storage.saveProfile(profile); // Update lastLogin
      Storage.setCurrentProfile(profileId);
      this._enterApp();
    }
  },

  _enterApp() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Update profile avatar
    const profile = Storage.getCurrentProfile();
    if (profile) {
      document.getElementById('header-title').textContent = 'EGU 영단어';
    }
    
    // Update streak
    Storage.updateStreak();
    
    this.navigate('dashboard');
  },

  // --- Navigation ---
  _setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        this.navigate(screen);
      });
    });
    
    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      this.goBack();
    });
    
    // Profile button
    document.getElementById('profile-btn').addEventListener('click', () => {
      this.navigate('profile');
    });
  },

  navigate(screenName) {
    // Save history
    if (this.currentScreen !== screenName) {
      this.screenHistory.push(this.currentScreen);
    }
    
    // Hide all screens
    document.querySelectorAll('#main-content .screen').forEach(s => {
      s.classList.remove('active');
    });
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenName);
    });
    
    // Render and show target screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    
    // Render content based on screen
    switch(screenName) {
      case 'dashboard':
        Dashboard.render();
        this.showBackButton(false);
        break;
      case 'unit-select':
        Learn.renderUnitSelect();
        this.showBackButton(false);
        break;
      case 'test-setup':
        Test.renderSetup();
        this.showBackButton(false);
        break;
      case 'review':
        Review.render();
        this.showBackButton(false);
        break;
      case 'profile':
        this._renderProfile();
        this.showBackButton(true);
        break;
      case 'learn':
      case 'test':
      case 'test-result':
        this.showBackButton(true);
        break;
    }
    
    if (targetScreen) {
      targetScreen.classList.add('active');
    }
    
    this.currentScreen = screenName;
    
    // Scroll to top
    window.scrollTo(0, 0);
  },

  goBack() {
    if (this.screenHistory.length > 0) {
      const prev = this.screenHistory.pop();
      this.navigate(prev);
      this.screenHistory.pop(); // Remove the re-added entry
    } else {
      this.navigate('dashboard');
    }
  },

  showBackButton(show) {
    const btn = document.getElementById('back-btn');
    btn.classList.toggle('hidden', !show);
  },

  // --- Profile Screen ---
  _renderProfile() {
    const screen = document.getElementById('profile-screen');
    const profile = Storage.getCurrentProfile();
    const overall = Storage.getOverallProgress();
    const streak = Storage.getStreak();
    const level = Storage.getLevel();
    const wrongWords = Storage.getWrongWords();
    const testHistory = Storage.getTestHistory();
    
    const totalTests = testHistory.length;
    const avgScore = totalTests > 0 
      ? Math.round(testHistory.reduce((sum, t) => sum + t.score, 0) / totalTests) 
      : 0;
    
    screen.innerHTML = `
      <div class="profile-container">
        <div class="profile-card">
          <div class="profile-avatar-large">😊</div>
          <div class="profile-name">${profile ? profile.name : '학생'}</div>
          <div class="profile-class">${profile ? `반 코드: ${profile.classCode}` : ''}</div>
          
          <div class="profile-stats-grid">
            <div class="profile-stat-item">
              <div class="profile-stat-value">${level.icon} Lv.${level.level}</div>
              <div class="profile-stat-label">${level.name}</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-value">${level.xp}</div>
              <div class="profile-stat-label">총 XP</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-value">${streak.current}일</div>
              <div class="profile-stat-label">연속 학습</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-value">${streak.best}일</div>
              <div class="profile-stat-label">최고 연속</div>
            </div>
          </div>
        </div>
        
        <div class="card" style="margin-bottom: var(--space-lg);">
          <div class="section-title" style="margin-bottom: var(--space-md);">📊 학습 통계</div>
          <div class="profile-stats-grid">
            <div class="profile-stat-item">
              <div class="profile-stat-value">${overall.totalLearned}</div>
              <div class="profile-stat-label">학습 단어</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-value">${overall.completedUnits}/${overall.totalUnits}</div>
              <div class="profile-stat-label">완료 유닛</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-value">${totalTests}회</div>
              <div class="profile-stat-label">시험 횟수</div>
            </div>
            <div class="profile-stat-item">
              <div class="profile-stat-value">${avgScore}점</div>
              <div class="profile-stat-label">평균 점수</div>
            </div>
          </div>
        </div>
        
        <div class="card" style="margin-bottom: var(--space-lg);">
          <div class="section-title" style="margin-bottom: var(--space-md);">📋 오답노트 현황</div>
          <p style="font-size: var(--font-size-md); color: var(--text-secondary);">
            현재 <strong style="color: var(--accent-red);">${wrongWords.length}개</strong> 단어가 오답노트에 있어요
          </p>
        </div>
        
        <div class="profile-actions">
          <button class="btn btn-danger btn-lg" onclick="App._logout()">
            🚪 로그아웃
          </button>
        </div>
      </div>
    `;
  },

  // --- Profile Modal ---
  _setupProfileModal() {
    const modal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('close-profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this._logout();
      });
    }
    
    // Close on overlay click
    const overlay = modal?.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
  },

  _logout() {
    if (confirm('로그아웃하면 다시 로그인해야 해요. 로그아웃할까요?')) {
      sessionStorage.removeItem(Storage.PREFIX + 'current_profile');
      document.getElementById('app-container').classList.add('hidden');
      document.getElementById('login-screen').classList.add('active');
      this._renderSavedProfiles();
      this.screenHistory = [];
      this.currentScreen = 'dashboard';
    }
  },

  // --- Toast ---
  showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type ? 'toast-' + type : ''}`;
    
    // Show
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Hide after 2.5s
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.className = 'toast hidden';
      }, 300);
    }, 2500);
  },
  _toastTimeout: null
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
