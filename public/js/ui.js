// ====================================================
// MODULE: UI PRESENTATION & DOM MANIPULATION
// THEME 3: EVENT-DRIVEN PROGRAMMING & GAME JUICE
// ====================================================

// Cache DOM element references for all 3 view sections
export const loginSection = document.getElementById('login-section');
export const dashboardSection = document.getElementById('dashboard-section');
export const gameSection = document.getElementById('game-section');

// Cache authentication inputs and buttons
export const usernameInput = document.getElementById('username');
export const passwordInput = document.getElementById('password');
export const loginBtn = document.getElementById('login-btn');
export const registerBtn = document.getElementById('register-btn');
export const authMessage = document.getElementById('auth-message');

// Cache marquee elements
export const marquee1Up = document.getElementById('marquee-1up');
export const marqueeHigh = document.getElementById('marquee-high');

// Cache dashboard elements
export const dashUserSpan = document.getElementById('dash-user');
export const startGameBtn = document.getElementById('start-game-btn');
export const dashLogoutBtn = document.getElementById('dash-logout-btn');
export const leaderboardList = document.getElementById('leaderboard-list');

// Cache gameplay HUD elements
export const currentUserSpan = document.getElementById('current-user');
export const scoreDisplay = document.getElementById('score-display');
export const timerDisplay = document.getElementById('timer-display');
export const livesDisplay = document.getElementById('lives-display');
export const puzzleImg = document.getElementById('puzzle-img');
export const fetchPuzzleBtn = document.getElementById('fetch-puzzle-btn');
export const guessContainer = document.getElementById('guess-container');
export const guessInput = document.getElementById('guess-input');
export const submitGuessBtn = document.getElementById('submit-guess-btn');
export const messageBox = document.getElementById('message-box');
export const backToDashBtn = document.getElementById('back-to-dash-btn');
export const logoutBtn = document.getElementById('logout-btn');
export const keypadButtons = document.querySelectorAll('.keypad-btn');

// Cache Game Juice & Presentation Elements
export const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
export const settingsBtn = document.getElementById('settings-btn');
export const apiStatusPill = document.getElementById('api-status-pill');
export const streakDisplay = document.getElementById('streak-display');
export const floatingScoreContainer = document.getElementById('floating-score-container');

// Cache Settings DIP Switches Modal Elements
export const settingsModal = document.getElementById('settings-modal');
export const settingsCloseX = document.getElementById('settings-close-x');
export const settingSfxToggle = document.getElementById('setting-sfx-toggle');
export const settingVolumeSlider = document.getElementById('setting-volume-slider');
export const settingVolumeVal = document.getElementById('setting-volume-val');
export const settingDifficultySelect = document.getElementById('setting-difficulty-select');
export const settingCrtToggle = document.getElementById('setting-crt-toggle');
export const settingVfxToggle = document.getElementById('setting-vfx-toggle');
export const settingApiToggle = document.getElementById('setting-api-toggle');
export const settingsSaveBtn = document.getElementById('settings-save-btn');

// Cache Game Over Modal elements
export const gameOverModal = document.getElementById('game-over-modal');
export const modalScoreText = document.getElementById('modal-score-text');
export const modalRetryBtn = document.getElementById('modal-retry-btn');
export const modalMenuBtn = document.getElementById('modal-menu-btn');

/**
 * Transitions between the 3 distinct application views (login, dashboard, game)
 * @param {'login'|'dashboard'|'game'} targetView
 */
export function switchView(targetView) {
  if (loginSection) loginSection.classList.toggle('hidden', targetView !== 'login');
  if (dashboardSection) dashboardSection.classList.toggle('hidden', targetView !== 'dashboard');
  if (gameSection) gameSection.classList.toggle('hidden', targetView !== 'game');
}

/**
 * Updates the lives counter display in the HUD
 * @param {number} lives
 */
export function updateLivesDisplay(lives) {
  if (!livesDisplay) return;
  if (lives > 0) {
    livesDisplay.textContent = `LIVES: ${'❤️'.repeat(lives)}${'🖤'.repeat(3 - lives)}`;
  } else {
    livesDisplay.textContent = 'LIVES: 💀💀💀';
  }
}

/**
 * Updates the score display in both HUD and marquee 1UP
 * @param {number} currentScore
 */
export function updateScoreDisplay(currentScore) {
  const formatted = String(currentScore).padStart(4, '0');
  if (scoreDisplay) scoreDisplay.textContent = `SCORE: ${formatted}`;
  if (marquee1Up) marquee1Up.textContent = formatted;
}

/**
 * Updates the timer badge in the HUD
 * @param {number} seconds
 * @param {boolean} [isPanic=false]
 */
export function updateTimerDisplay(seconds, isPanic = false) {
  if (!timerDisplay) return;
  timerDisplay.textContent = `TIME: ${seconds}s`;
  if (isPanic) {
    timerDisplay.classList.add('panic-pulse');
  } else {
    timerDisplay.classList.remove('panic-pulse');
  }
}

/**
 * Updates the streak combo badge in the HUD
 * @param {number} streak
 */
export function updateStreakDisplay(streak) {
  if (!streakDisplay) return;
  streakDisplay.textContent = `STREAK: ${streak}X`;
  streakDisplay.classList.remove('streak-active', 'streak-fire');
  if (streak >= 3) {
    streakDisplay.classList.add('streak-fire');
  } else if (streak >= 1) {
    streakDisplay.classList.add('streak-active');
  }
}

/**
 * Triggers camera shake and red damage flash on viewport
 * @param {boolean} [vfxEnabled=true]
 */
export function triggerScreenShake(vfxEnabled = true) {
  if (!gameSection || !vfxEnabled) return;
  gameSection.classList.remove('screen-shake', 'damage-flash');
  void gameSection.offsetWidth; // Force DOM reflow to re-trigger CSS animation
  gameSection.classList.add('screen-shake', 'damage-flash');
  setTimeout(() => {
    gameSection.classList.remove('screen-shake', 'damage-flash');
  }, 400);
}

/**
 * Triggers green CRT victory pulse
 */
export function triggerScreenHeal() {
  if (!gameSection) return;
  gameSection.classList.remove('heal-flash');
  void gameSection.offsetWidth;
  gameSection.classList.add('heal-flash');
  setTimeout(() => {
    gameSection.classList.remove('heal-flash');
  }, 450);
}

/**
 * Renders floating "+PTS" popup animation over cabinet
 * @param {string} text
 */
export function showFloatingPoints(text) {
  if (!floatingScoreContainer) return;
  const popup = document.createElement('div');
  popup.className = 'floating-points';
  popup.textContent = text;
  floatingScoreContainer.appendChild(popup);
  setTimeout(() => {
    if (popup.parentNode) popup.parentNode.removeChild(popup);
  }, 1400);
}

/**
 * Updates the status badge pill for Interoperability
 * @param {string} source - e.g. 'FALLBACK_CACHE' or 'LIVE_MARCCONRAD'
 * @param {boolean} simulateOutage
 */
export function updateApiStatusPill(source, simulateOutage = false) {
  if (!apiStatusPill) return;
  const isFallback = source === 'FALLBACK_CACHE' || simulateOutage;
  apiStatusPill.className = isFallback ? 'api-status-pill api-fallback' : 'api-status-pill api-live';
  apiStatusPill.textContent = isFallback
    ? '[ 🟠 OFFLINE CACHE (AUTO-RECOVERING) ]'
    : '[ 🟢 LIVE API (CLICK TO TEST OFFLINE MODE) ]';
}

/**
 * Renders the top 5 scores into the leaderboard container and marquee
 * @param {Array<{ username: string, high_score?: number, best_score?: number }>} leaderboard
 */
export function renderLeaderboard(leaderboard) {
  if (!leaderboardList) return;

  if (leaderboard && leaderboard.length > 0) {
    const topScore = leaderboard[0].high_score || leaderboard[0].best_score || 0;
    if (marqueeHigh) {
      marqueeHigh.textContent = String(topScore).padStart(4, '0');
    }

    leaderboardList.innerHTML = leaderboard.map((entry, index) => {
      const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-default';
      const score = entry.high_score || entry.best_score || 0;
      return `
        <div class="leaderboard-row">
          <span class="${rankClass}">#${index + 1}</span>
          <span class="${rankClass}">${entry.username}</span>
          <span class="score-gold">${String(score).padStart(4, '0')} PTS</span>
        </div>
      `;
    }).join('');
  } else {
    leaderboardList.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 0.65rem; padding: 10px;">NO HIGH SCORES RECORDED YET</div>';
  }
}

/**
 * Synchronizes application settings to DIP switch inputs and UI indicators
 * @param {object} settings
 * @param {boolean} isMuted
 * @param {boolean} simulateOutage
 */
export function applySettingsToUI(settings, isMuted, simulateOutage) {
  // 1. Audio Mute State
  if (sfxToggleBtn) {
    sfxToggleBtn.textContent = isMuted ? '[🔇 SFX: OFF]' : '[🔊 SFX: ON]';
    sfxToggleBtn.classList.toggle('muted', isMuted);
  }
  if (settingSfxToggle) {
    settingSfxToggle.textContent = settings.sfxEnabled ? '[ 🔊 SFX: ON ]' : '[ 🔇 SFX: OFF ]';
    settingSfxToggle.classList.toggle('active-off', !settings.sfxEnabled);
  }

  // 2. Master Volume
  if (settingVolumeSlider) settingVolumeSlider.value = settings.volume;
  if (settingVolumeVal) settingVolumeVal.textContent = settings.volume + '%';

  // 3. Timer Difficulty
  if (settingDifficultySelect) {
    settingDifficultySelect.value = String(settings.timerDifficulty);
  }

  // 4. CRT Scanlines
  document.body.classList.toggle('no-scanlines', !settings.crtEnabled);
  if (settingCrtToggle) {
    settingCrtToggle.textContent = settings.crtEnabled ? '[ 📺 CRT: ON ]' : '[ 📺 CRT: OFF ]';
    settingCrtToggle.classList.toggle('active-off', !settings.crtEnabled);
  }

  // 5. Screen Shake / Damage VFX
  if (settingVfxToggle) {
    settingVfxToggle.textContent = settings.vfxEnabled ? '[ 💥 VFX: ON ]' : '[ 💥 VFX: OFF ]';
    settingVfxToggle.classList.toggle('active-off', !settings.vfxEnabled);
  }

  // 6. Outage Simulation
  if (settingApiToggle) {
    settingApiToggle.textContent = simulateOutage ? '[ 🟠 SIMULATE OUTAGE ]' : '[ 🟢 LIVE MARCCONRAD ]';
    settingApiToggle.classList.toggle('active-off', simulateOutage);
  }
  updateApiStatusPill(simulateOutage ? 'FALLBACK_CACHE' : 'LIVE_MARCCONRAD', simulateOutage);
}

/**
 * Shows the Game Over modal with formatted score
 * @param {number} finalScore
 */
export function showGameOverModal(finalScore) {
  if (modalScoreText) {
    modalScoreText.textContent = `FINAL SCORE: ${String(finalScore).padStart(4, '0')} PTS`;
  }
  if (gameOverModal) {
    gameOverModal.classList.remove('hidden');
  }
}

/**
 * Hides the Game Over modal
 */
export function hideGameOverModal() {
  if (gameOverModal) {
    gameOverModal.classList.add('hidden');
  }
}

/**
 * Shows the Settings DIP Switches modal
 */
export function showSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.remove('hidden');
  }
}

/**
 * Hides the Settings DIP Switches modal
 */
export function hideSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.add('hidden');
  }
}
