/* ===================================
   Dashboard Module
   =================================== */

const Dashboard = {
  render() {
    const screen = document.getElementById('dashboard-screen');
    const profile = Storage.getCurrentProfile();
    const overall = Storage.getOverallProgress();
    const streak = Storage.getStreak();
    const level = Storage.getLevel();
    const weekly = Storage.getWeeklyStudy();
    const wrongWords = Storage.getWrongWords();
    const topMistakes = [...wrongWords].sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5);
    
    const maxWeekly = Math.max(...weekly.map(d => d.count), 1);
    
    const accuracy = this._getAccuracy();

    screen.innerHTML = `
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-top">
          <div>
            <div class="welcome-greeting">안녕! 👋</div>
            <div class="welcome-name">${profile ? profile.name : '학생'}님</div>
          </div>
          <div class="welcome-streak">
            🔥 ${streak.current}일 연속
          </div>
        </div>
        <div class="welcome-stats">
          <div class="welcome-stat">
            <div class="stat-value">${overall.totalLearned}</div>
            <div class="stat-label">학습 단어</div>
          </div>
          <div class="welcome-stat">
            <div class="stat-value">${accuracy}%</div>
            <div class="stat-label">정답률</div>
          </div>
          <div class="welcome-stat">
            <div class="stat-value">${overall.completedUnits}</div>
            <div class="stat-label">완료 유닛</div>
          </div>
        </div>
      </div>

      <!-- Level Card -->
      <div class="level-card">
        <div class="level-header">
          <div class="level-info">
            <div class="level-badge">${level.icon}</div>
            <div class="level-text">
              <h3>Lv.${level.level} ${level.name}</h3>
              <span>${level.nextLevel ? `다음: ${level.nextLevel.icon} ${level.nextLevel.name}` : '최고 레벨!'}</span>
            </div>
          </div>
          <div class="level-xp">${level.xp} XP</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${level.progress * 100}%"></div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-header">
        <div class="section-title">🚀 빠른 시작</div>
      </div>
      <div class="quick-actions">
        <div class="quick-action" onclick="App.navigate('unit-select')">
          <span class="action-icon">📚</span>
          <span class="action-label">단어 학습</span>
          <span class="action-desc">${overall.totalUnits}개 유닛</span>
        </div>
        <div class="quick-action" onclick="App.navigate('test-setup')">
          <span class="action-icon">📝</span>
          <span class="action-label">시험 보기</span>
          <span class="action-desc">실력 확인</span>
        </div>
        <div class="quick-action" onclick="App.navigate('review')">
          <span class="action-icon">📓</span>
          <span class="action-label">오답 노트</span>
          <span class="action-desc">${wrongWords.length}개 단어</span>
        </div>
        <div class="quick-action" onclick="App.navigate('profile')">
          <span class="action-icon">👤</span>
          <span class="action-label">내 프로필</span>
          <span class="action-desc">학습 기록</span>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="weekly-chart card">
        <div class="section-header">
          <div class="section-title">📈 이번 주 학습</div>
        </div>
        <div class="chart-bars">
          ${weekly.map(day => `
            <div class="chart-day">
              <div class="chart-bar-wrapper">
                <div class="chart-bar ${day.isToday ? 'today' : ''}" 
                     style="height: ${day.count > 0 ? Math.max(10, (day.count / maxWeekly) * 100) : 4}%">
                  ${day.count > 0 ? `<span class="bar-value">${day.count}</span>` : ''}
                </div>
              </div>
              <span class="chart-label ${day.isToday ? 'today' : ''}">${day.label}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Top Mistakes -->
      ${topMistakes.length > 0 ? `
        <div class="card">
          <div class="section-header">
            <div class="section-title">😅 많이 틀린 단어</div>
            <button class="section-more" onclick="App.navigate('review')">전체보기</button>
          </div>
          <div class="mistakes-list">
            ${topMistakes.map((word, i) => `
              <div class="mistake-item">
                <div class="mistake-word">
                  <span class="mistake-rank">${i + 1}</span>
                  <div>
                    <div class="mistake-english">${word.english}</div>
                    <div class="mistake-korean">${word.korean}</div>
                  </div>
                </div>
                <span class="mistake-count">${word.wrongCount}회</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  _getAccuracy() {
    const history = Storage.getTestHistory();
    if (history.length === 0) return 0;
    
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    history.forEach(test => {
      totalCorrect += test.correct;
      totalQuestions += test.total;
    });
    
    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  }
};
