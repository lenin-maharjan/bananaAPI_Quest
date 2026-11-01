// ====================================================
// BANANA QUEST: 90s RETRO ARCADE MODULAR ES6 CLIENT
// THEME 1: STRICT SEPARATION OF CONCERNS & ARCHITECTURAL COUPLING
// THEME 2: INTEROPERABILITY (REST API PROXY & FAULT TOLERANCE)
// THEME 3: EVENT-DRIVEN PROGRAMMING (PUB/SUB & WEB AUDIO SYNTH)
// THEME 4: VIRTUAL IDENTITY (SQLITE AUTH & PERSISTENT SCORES)
// ====================================================

import * as audio from './audio.js';
import * as terminal from './terminal.js';
import * as api from './api.js';
import * as ui from './ui.js';

// ====================================================
// APPLICATION STATE
// ====================================================

// Global timer tracking variables
let timerInterval = null;
let timeLeft = 45;

// Global arcade player state
let lives = 3;
let currentScore = 0;

// Game Juice & Polish State
let isMuted = false;
let simulateOutage = false;
let currentStreak = 0;

// Auto-advance timer and concurrency guards
let autoAdvanceTimeout = null;
let isLoadingPuzzle = false;
let isSubmitting = false;

// Persistent Settings State Object (LocalStorage)
const DEFAULT_SETTINGS = {
  sfxEnabled: true,
  volume: 80,
  timerDifficulty: 45,
  crtEnabled: true,
  vfxEnabled: true,
  simulateOutage: false
};
let currentSettings = { ...DEFAULT_SETTINGS };

// ====================================================
// SETTINGS & STORAGE LIFECYCLE
// ====================================================

function loadSavedSettings() {
  try {
    const saved = localStorage.getItem('banana_quest_arcade_settings');
    if (saved) {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    currentSettings = { ...DEFAULT_SETTINGS };
  }

  isMuted = !currentSettings.sfxEnabled;
  simulateOutage = Boolean(currentSettings.simulateOutage);

  // Synchronize audio module
  audio.setAudioMuted(isMuted);
  audio.setSfxEnabled(currentSettings.sfxEnabled);
  audio.setAudioVolume(currentSettings.volume);

  // Synchronize UI elements
  ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem('banana_quest_arcade_settings', JSON.stringify(currentSettings));
  } catch (e) {}
}

// ====================================================
// LEADERBOARD DATA RETRIEVAL
// ====================================================

async function refreshLeaderboard() {
  try {
    const data = await api.fetchLeaderboard();
    if (data.success) {
      ui.renderLeaderboard(data.leaderboard);
      terminal.logToEventStream('leaderboard-fetched', {
        totalEntries: data.leaderboard ? data.leaderboard.length : 0
      });
    }
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
  }
}

// ====================================================
// THEME 3: EVENT-DRIVEN COUNTDOWN TIMER (CUSTOM EVENTS)
// ====================================================

function startTimer() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  clearInterval(timerInterval);

  timeLeft = parseInt(currentSettings.timerDifficulty, 10) || 45;
  ui.submitGuessBtn.disabled = false;
  ui.guessInput.disabled = false;

  timerInterval = setInterval(() => {
    timeLeft--;

    // PUBLISHER: Dispatch custom 'timer-tick' event
    window.dispatchEvent(new CustomEvent('timer-tick', {
      detail: { seconds: timeLeft }
    }));

    if (timeLeft <= 0) {
      clearInterval(timerInterval);

      // PUBLISHER: Dispatch custom 'timer-expired' event
      window.dispatchEvent(new CustomEvent('timer-expired', {
        detail: { status: 'TIMEOUT', message: 'Time limit reached' }
      }));
    }
  }, 1000);
}

// ====================================================
// THEME 2: ASYNC PUZZLE LOADER & PRE-CACHE PIPELINE
// ====================================================

async function loadPuzzle() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }

  if (isLoadingPuzzle) return;
  isLoadingPuzzle = true;

  ui.messageBox.style.color = 'var(--arcade-cyan)';
  ui.messageBox.textContent = simulateOutage
    ? 'SIMULATING OUTAGE: ENGAGING BACKUP CACHE...'
    : 'FETCHING PUZZLE FROM FAST BUFFER...';

  try {
    const data = await api.fetchPuzzle(simulateOutage);

    // INTERCEPT ERROR / OUTAGE: Record to MS-DOS Error Dashboard if served from cache
    if (data.source === 'FALLBACK_CACHE') {
      terminal.logToErrorStream(
        'NETWORK_OUTAGE_FALLBACK',
        { source: 'FALLBACK_CACHE', simulateOutage, question: data.question },
        simulateOutage
          ? 'Manual outage simulation activated (?simulateOutage=true) - Fallback cache bank engaged'
          : 'Live API unreachable (timeout or socket drop) - Automatically engaged 10+ Fallback Cache'
      );
    }

    // PRE-CACHE: Preemptively cache the next image in the queue
    if (data.nextQuestionHint) {
      const preloadNext = new Image();
      preloadNext.src = data.nextQuestionHint;
    }

    // PUBLISHER: Dispatch custom 'puzzle-loaded' event
    window.dispatchEvent(new CustomEvent('puzzle-loaded', {
      detail: {
        imageUrl: data.question,
        source: data.source || 'LIVE_MARCCONRAD',
        prefetched: data.prefetched
      }
    }));
  } catch (error) {
    terminal.logToErrorStream(
      'API_CONNECTION_FAILURE',
      { error: error.message || String(error), simulateOutage },
      'Network fetch failed to reach backend /api/puzzle endpoint'
    );
    ui.messageBox.style.color = 'var(--arcade-red)';
    ui.messageBox.textContent = 'ERROR LOADING PUZZLE';
  } finally {
    isLoadingPuzzle = false;
  }
}

// ====================================================
// CUSTOM EVENT SUBSCRIBERS (OBSERVER PATTERN)
// ====================================================

// SUBSCRIBER 1: timer-tick
window.addEventListener('timer-tick', (event) => {
  const isPanic = event.detail.seconds <= 10 && event.detail.seconds > 0;
  ui.updateTimerDisplay(event.detail.seconds, isPanic);

  if (isPanic) {
    audio.playArcadeSound('tick');
  }

  terminal.logToEventStream('timer-tick', event.detail, 'timer-tick');
});

// SUBSCRIBER 2: timer-expired
window.addEventListener('timer-expired', (event) => {
  ui.updateTimerDisplay(0, false);
  if (ui.timerDisplay) ui.timerDisplay.textContent = 'TIME EXPIRED!';
  lives = 0;
  ui.updateLivesDisplay(lives);
  currentStreak = 0;
  ui.updateStreakDisplay(currentStreak);
  ui.submitGuessBtn.disabled = true;
  ui.guessInput.disabled = true;
  ui.triggerScreenShake(currentSettings.vfxEnabled);

  terminal.logToEventStream('timer-expired', event.detail, 'timer-expired');
  terminal.logToErrorStream('COUNTDOWN_TIMEOUT', event.detail, 'Round timer reached 00s without a submitted solution');

  window.dispatchEvent(new CustomEvent('game-over', {
    detail: { reason: 'TIME_EXPIRED', finalScore: currentScore, timestamp: Date.now() }
  }));
});

// SUBSCRIBER 3: auth-register
window.addEventListener('auth-register', (event) => {
  terminal.logToEventStream('auth-register', event.detail, 'auth-register');
});

// SUBSCRIBER 4: auth-success
window.addEventListener('auth-success', (event) => {
  ui.switchView('dashboard');
  refreshLeaderboard();
  if (ui.dashUserSpan) ui.dashUserSpan.textContent = event.detail.username;
  if (ui.currentUserSpan) ui.currentUserSpan.textContent = event.detail.username;
  if (ui.authMessage) ui.authMessage.textContent = '';
  terminal.logToEventStream('auth-success', event.detail, 'auth-success');
});

// SUBSCRIBER 5: auth-logout
window.addEventListener('auth-logout', (event) => {
  ui.switchView('login');
  if (ui.puzzleImg) ui.puzzleImg.classList.add('hidden');
  if (ui.guessContainer) ui.guessContainer.classList.add('hidden');
  if (ui.messageBox) ui.messageBox.textContent = '';
  currentStreak = 0;
  ui.updateStreakDisplay(0);
  if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');
  terminal.logToEventStream('auth-logout', event.detail);
});

// SUBSCRIBER 6: puzzle-loaded
window.addEventListener('puzzle-loaded', (event) => {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }

  if (ui.puzzleImg) {
    ui.puzzleImg.classList.remove('hidden');
    ui.puzzleImg.src = event.detail.imageUrl;
  }
  if (ui.guessContainer) ui.guessContainer.classList.remove('hidden');

  ui.submitGuessBtn.disabled = false;
  ui.guessInput.disabled = false;
  ui.guessInput.value = '';
  ui.messageBox.textContent = '';
  ui.guessInput.focus();

  if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');
  startTimer();

  ui.updateApiStatusPill(event.detail.source, simulateOutage);

  terminal.logToEventStream('puzzle-loaded', {
    imageUrl: event.detail.imageUrl,
    source: event.detail.source,
    prefetched: event.detail.prefetched
  });
});

// SUBSCRIBER 7: guess-evaluated
window.addEventListener('guess-evaluated', (event) => {
  terminal.logToEventStream('guess-evaluated', event.detail);

  if (event.detail.correct) {
    // CORRECT ANSWER
    clearInterval(timerInterval);
    if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');
    audio.playArcadeSound('correct');

    currentStreak++;
    ui.updateStreakDisplay(currentStreak);
    const streakBonus = currentStreak > 1 ? (currentStreak - 1) * 50 : 0;
    const pointsEarned = 100 + (timeLeft * 2) + streakBonus;
    currentScore += pointsEarned;
    ui.updateScoreDisplay(currentScore);

    ui.triggerScreenHeal();
    const bonusText = currentStreak > 1 ? `+${pointsEarned} PTS (${currentStreak}X COMBO!)` : `+${pointsEarned} PTS!`;
    ui.showFloatingPoints(bonusText);

    if (currentStreak >= 2) {
      audio.playArcadeSound('streak');
    }

    window.dispatchEvent(new CustomEvent('streak-updated', {
      detail: { streak: currentStreak, bonus: streakBonus, totalScore: currentScore }
    }));

    ui.submitGuessBtn.disabled = true;
    ui.guessInput.disabled = true;
    ui.messageBox.style.color = 'var(--arcade-green)';
    ui.messageBox.textContent = `★ ${event.detail.message} ${bonusText} NEXT IN 1.5S ★`;

    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    autoAdvanceTimeout = setTimeout(() => {
      loadPuzzle();
    }, 1500);

  } else {
    // INCORRECT ANSWER
    audio.playArcadeSound('wrong');
    currentStreak = 0;
    ui.updateStreakDisplay(0);
    ui.triggerScreenShake(currentSettings.vfxEnabled);

    window.dispatchEvent(new CustomEvent('streak-updated', {
      detail: { streak: 0, reset: true }
    }));

    lives--;
    ui.updateLivesDisplay(lives);

    terminal.logToErrorStream(
      'INCORRECT_GUESS',
      event.detail,
      `Incorrect solution: "${event.detail.guess !== undefined ? event.detail.guess : ui.guessInput.value}". 1 Life deducted (${lives} lives remaining)`
    );

    if (lives > 0) {
      clearInterval(timerInterval);
      if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');

      ui.submitGuessBtn.disabled = true;
      ui.guessInput.disabled = true;

      ui.messageBox.style.color = 'var(--arcade-red)';
      ui.messageBox.textContent = `✖ ${event.detail.message} (${lives} LIVES LEFT) - AUTO-RECOVERING IN 3S...`;

      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
      }
      autoAdvanceTimeout = setTimeout(() => {
        loadPuzzle();
      }, 3000);

    } else {
      // GAME OVER
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
      }
      clearInterval(timerInterval);
      if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');
      ui.submitGuessBtn.disabled = true;
      ui.guessInput.disabled = true;
      ui.messageBox.style.color = 'var(--arcade-red)';
      ui.messageBox.textContent = '💀 GAME OVER! ZERO LIVES REMAINING.';

      window.dispatchEvent(new CustomEvent('game-over', {
        detail: { reason: 'OUT_OF_LIVES', finalScore: currentScore, timestamp: Date.now() }
      }));
    }
  }
});

// SUBSCRIBER 8: game-start
window.addEventListener('game-start', (event) => {
  lives = 3;
  ui.updateLivesDisplay(lives);
  currentScore = 0;
  ui.updateScoreDisplay(currentScore);
  currentStreak = 0;
  ui.updateStreakDisplay(0);
  if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');
  terminal.logToEventStream('game-start', event.detail, 'game-start');
});

// SUBSCRIBER 9: game-over
window.addEventListener('game-over', async (event) => {
  audio.playArcadeSound('gameover');
  if (ui.timerDisplay) ui.timerDisplay.classList.remove('panic-pulse');
  currentStreak = 0;
  ui.updateStreakDisplay(0);
  terminal.logToEventStream('game-over', event.detail, 'timer-expired');
  terminal.logToErrorStream(
    'GAME_OVER',
    event.detail,
    `Game Over state triggered (${event.detail.reason || 'OUT_OF_LIVES'}) - Final Score: ${event.detail.finalScore !== undefined ? event.detail.finalScore : currentScore} PTS`
  );

  // Asynchronously record final score in SQLite database via API service
  try {
    const data = await api.submitScore(currentScore);
    if (data.success) {
      window.dispatchEvent(new CustomEvent('score-saved', {
        detail: { score: currentScore, dbRecord: data.scoreId, username: data.username }
      }));
    }
  } catch (err) {
    console.error('Failed to persist score:', err);
  }

  ui.showGameOverModal(currentScore);
});

// SUBSCRIBER 10: score-saved
window.addEventListener('score-saved', (event) => {
  terminal.logToEventStream('score-saved', event.detail, 'auth-success');
  const savedScore = event.detail.score || 0;
  const currentHigh = parseInt(ui.marqueeHigh ? ui.marqueeHigh.textContent : '0', 10) || 0;
  if (savedScore > currentHigh && ui.marqueeHigh) {
    ui.marqueeHigh.textContent = String(savedScore).padStart(4, '0');
    terminal.logToEventStream('high-score-beat', { newHighScore: savedScore });
  }
});

// SUBSCRIBER 11: streak-updated
window.addEventListener('streak-updated', (event) => {
  terminal.logToEventStream('streak-updated', event.detail, 'game-start');
});

// SUBSCRIBER 12: interop-mode-changed
window.addEventListener('interop-mode-changed', (event) => {
  terminal.logToEventStream('interop-mode-changed', event.detail, 'timer-tick');
});

// SUBSCRIBER 13: sfx-toggled
window.addEventListener('sfx-toggled', (event) => {
  terminal.logToEventStream('sfx-toggled', event.detail);
});

// SUBSCRIBER 14: settings-updated
window.addEventListener('settings-updated', (event) => {
  terminal.logToEventStream('settings-updated', event.detail, 'auth-success');
});

// ====================================================
// DOM BUTTON & INPUT LISTENERS
// ====================================================

// SFX Mute / Unmute Toggle Button
if (ui.sfxToggleBtn) {
  ui.sfxToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    currentSettings.sfxEnabled = !isMuted;
    audio.setAudioMuted(isMuted);
    audio.setSfxEnabled(currentSettings.sfxEnabled);
    saveSettingsToStorage();
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    window.dispatchEvent(new CustomEvent('sfx-toggled', { detail: { isMuted } }));
    if (!isMuted) audio.playArcadeSound('coin');
  });
}

// Interoperability Status Pill Click Listener (Simulation Outage Toggle)
if (ui.apiStatusPill) {
  ui.apiStatusPill.addEventListener('click', () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    simulateOutage = !simulateOutage;
    currentSettings.simulateOutage = simulateOutage;
    saveSettingsToStorage();
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    audio.playArcadeSound('click');
    window.dispatchEvent(new CustomEvent('interop-mode-changed', {
      detail: {
        simulatedOutage: simulateOutage,
        mode: simulateOutage ? 'SIMULATED_FALLBACK' : 'LIVE_MARCCONRAD'
      }
    }));
    loadPuzzle();
  });
}

// DIP Switches Settings Modal Listeners
if (ui.settingsBtn) {
  ui.settingsBtn.addEventListener('click', () => {
    audio.playArcadeSound('click');
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    ui.showSettingsModal();
    terminal.logToEventStream('settings-opened', { timestamp: Date.now() });
  });
}

if (ui.settingsCloseX) {
  ui.settingsCloseX.addEventListener('click', () => {
    audio.playArcadeSound('click');
    ui.hideSettingsModal();
  });
}

if (ui.settingsModal) {
  ui.settingsModal.addEventListener('click', (e) => {
    if (e.target === ui.settingsModal) {
      audio.playArcadeSound('click');
      ui.hideSettingsModal();
    }
  });
}

if (ui.settingSfxToggle) {
  ui.settingSfxToggle.addEventListener('click', () => {
    currentSettings.sfxEnabled = !currentSettings.sfxEnabled;
    isMuted = !currentSettings.sfxEnabled;
    audio.setAudioMuted(isMuted);
    audio.setSfxEnabled(currentSettings.sfxEnabled);
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    audio.playArcadeSound('click');
  });
}

if (ui.settingVolumeSlider) {
  ui.settingVolumeSlider.addEventListener('input', (e) => {
    currentSettings.volume = parseInt(e.target.value, 10);
    audio.setAudioVolume(currentSettings.volume);
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
  });
  ui.settingVolumeSlider.addEventListener('change', () => {
    audio.playArcadeSound('click');
  });
}

if (ui.settingDifficultySelect) {
  ui.settingDifficultySelect.addEventListener('change', (e) => {
    currentSettings.timerDifficulty = parseInt(e.target.value, 10);
    audio.playArcadeSound('click');
  });
}

if (ui.settingCrtToggle) {
  ui.settingCrtToggle.addEventListener('click', () => {
    currentSettings.crtEnabled = !currentSettings.crtEnabled;
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    audio.playArcadeSound('click');
  });
}

if (ui.settingVfxToggle) {
  ui.settingVfxToggle.addEventListener('click', () => {
    currentSettings.vfxEnabled = !currentSettings.vfxEnabled;
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    audio.playArcadeSound('click');
  });
}

if (ui.settingApiToggle) {
  ui.settingApiToggle.addEventListener('click', () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    currentSettings.simulateOutage = !currentSettings.simulateOutage;
    simulateOutage = currentSettings.simulateOutage;
    ui.applySettingsToUI(currentSettings, isMuted, simulateOutage);
    audio.playArcadeSound('click');
    window.dispatchEvent(new CustomEvent('interop-mode-changed', {
      detail: {
        simulatedOutage: simulateOutage,
        mode: simulateOutage ? 'SIMULATED_FALLBACK' : 'LIVE_MARCCONRAD'
      }
    }));
    if (ui.gameSection && !ui.gameSection.classList.contains('hidden')) {
      loadPuzzle();
    }
  });
}

if (ui.settingsSaveBtn) {
  ui.settingsSaveBtn.addEventListener('click', () => {
    saveSettingsToStorage();
    ui.hideSettingsModal();
    audio.playArcadeSound('coin');
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: currentSettings }));
  });
}

// Modal Retry Button
if (ui.modalRetryBtn) {
  ui.modalRetryBtn.addEventListener('click', () => {
    audio.playArcadeSound('coin');
    ui.hideGameOverModal();
    window.dispatchEvent(new CustomEvent('game-start', {
      detail: { mode: 'ARCADE_RETRY', timestamp: Date.now() }
    }));
    loadPuzzle();
  });
}

// Modal Menu Button
if (ui.modalMenuBtn) {
  ui.modalMenuBtn.addEventListener('click', () => {
    audio.playArcadeSound('click');
    ui.hideGameOverModal();
    ui.switchView('dashboard');
    refreshLeaderboard();
    terminal.logToEventStream('nav-dashboard', { action: 'RETURN_FROM_MODAL' });
  });
}

// Keypad Button Listeners
if (ui.keypadButtons) {
  ui.keypadButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (ui.submitGuessBtn.disabled || isSubmitting) return;
      audio.playArcadeSound('click');
      ui.guessInput.value = btn.dataset.val;
      ui.submitGuessBtn.click();
    });
  });
}

// Physical Keyboard Listener
window.addEventListener('keydown', (event) => {
  const inGame = ui.gameSection && !ui.gameSection.classList.contains('hidden');
  const modalOpen = (ui.gameOverModal && !ui.gameOverModal.classList.contains('hidden')) ||
                    (ui.settingsModal && !ui.settingsModal.classList.contains('hidden'));

  if (inGame && !modalOpen) {
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault(); // Prevents double-typing in input field
      if (!ui.submitGuessBtn.disabled && !isSubmitting) {
        audio.playArcadeSound('click');
        ui.guessInput.value = event.key;
        ui.submitGuessBtn.click();
      }
    } else if (event.key === 'f' || event.key === 'F') {
      if (ui.apiStatusPill) ui.apiStatusPill.click();
    }
  }
});

// Single digit input sanitization
if (ui.guessInput) {
  ui.guessInput.addEventListener('input', (event) => {
    const sanitized = event.target.value.replace(/[^0-9]/g, '');
    if (sanitized.length > 0) {
      event.target.value = sanitized.slice(-1);
      if (!ui.submitGuessBtn.disabled && !isSubmitting) {
        audio.playArcadeSound('click');
        ui.submitGuessBtn.click();
      }
    } else {
      event.target.value = '';
    }
  });

  ui.guessInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!ui.submitGuessBtn.disabled && !isSubmitting) {
        ui.submitGuessBtn.click();
      }
    }
  });
}

// Registration Button Listener
if (ui.registerBtn) {
  ui.registerBtn.addEventListener('click', async () => {
    audio.playArcadeSound('click');
    const username = ui.usernameInput.value.trim();
    const password = ui.passwordInput.value;

    if (!username || !password) {
      ui.authMessage.style.color = 'var(--arcade-red)';
      ui.authMessage.textContent = 'ENTER USERNAME & PASSWORD!';
      return;
    }

    try {
      const data = await api.register(username, password);
      if (data.success) {
        ui.authMessage.style.color = 'var(--arcade-green)';
        ui.authMessage.textContent = data.message;
        window.dispatchEvent(new CustomEvent('auth-register', {
          detail: { username, status: 'REGISTERED', timestamp: Date.now() }
        }));
      } else {
        ui.authMessage.style.color = 'var(--arcade-red)';
        ui.authMessage.textContent = data.message || 'REGISTRATION FAILED';
      }
    } catch (err) {
      ui.authMessage.style.color = 'var(--arcade-red)';
      ui.authMessage.textContent = 'NETWORK ERROR DURING REGISTRATION';
    }
  });
}

// Login Button Listener
if (ui.loginBtn) {
  ui.loginBtn.addEventListener('click', async () => {
    audio.playArcadeSound('coin');
    const username = ui.usernameInput.value.trim();
    const password = ui.passwordInput.value;

    if (!username || !password) {
      ui.authMessage.style.color = 'var(--arcade-red)';
      ui.authMessage.textContent = 'ENTER USERNAME & PASSWORD!';
      return;
    }

    try {
      const data = await api.login(username, password);
      if (data.success) {
        window.dispatchEvent(new CustomEvent('auth-success', {
          detail: { username: data.username, sessionEstablished: true }
        }));
      } else {
        ui.authMessage.style.color = 'var(--arcade-red)';
        ui.authMessage.textContent = data.message || 'INVALID CREDENTIALS';
      }
    } catch (err) {
      ui.authMessage.style.color = 'var(--arcade-red)';
      ui.authMessage.textContent = 'NETWORK ERROR DURING LOGIN';
    }
  });
}

// Start Game Button Listener
if (ui.startGameBtn) {
  ui.startGameBtn.addEventListener('click', () => {
    audio.playArcadeSound('coin');
    ui.switchView('game');
    window.dispatchEvent(new CustomEvent('game-start', {
      detail: { mode: 'ARCADE', player: ui.dashUserSpan ? ui.dashUserSpan.textContent : 'PLAYER_1', timestamp: Date.now() }
    }));
    loadPuzzle();
  });
}

// Back to Dashboard Button Listener
if (ui.backToDashBtn) {
  ui.backToDashBtn.addEventListener('click', () => {
    audio.playArcadeSound('click');
    clearInterval(timerInterval);
    ui.switchView('dashboard');
    refreshLeaderboard();
    terminal.logToEventStream('nav-dashboard', { action: 'RETURN_TO_MAIN_MENU' });
  });
}

// Reusable Logout Procedure
async function performLogout() {
  audio.playArcadeSound('click');
  try {
    await api.logout();
  } catch (err) {
    console.error('Logout request failed:', err);
  }
  clearInterval(timerInterval);
  window.dispatchEvent(new CustomEvent('auth-logout', {
    detail: { status: 'SESSION_DESTROYED' }
  }));
}

if (ui.logoutBtn) ui.logoutBtn.addEventListener('click', performLogout);
if (ui.dashLogoutBtn) ui.dashLogoutBtn.addEventListener('click', performLogout);

// Fetch New Puzzle Button
if (ui.fetchPuzzleBtn) {
  ui.fetchPuzzleBtn.addEventListener('click', () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    audio.playArcadeSound('click');
    loadPuzzle();
  });
}

// Submit Answer Guess Button
if (ui.submitGuessBtn) {
  ui.submitGuessBtn.addEventListener('click', async () => {
    if (isSubmitting || ui.submitGuessBtn.disabled) return;
    const guess = ui.guessInput.value.trim();

    if (guess === '') {
      ui.messageBox.style.color = 'var(--arcade-yellow)';
      ui.messageBox.textContent = 'PLEASE ENTER OR CLICK A DIGIT 0-9';
      return;
    }

    isSubmitting = true;
    ui.submitGuessBtn.disabled = true;
    ui.guessInput.disabled = true;

    try {
      const result = await api.checkAnswer(guess);

      window.dispatchEvent(new CustomEvent('guess-evaluated', {
        detail: { guess: parseInt(guess, 10), correct: result.correct, message: result.message }
      }));
    } catch (err) {
      console.error('Answer check error:', err);
      terminal.logToErrorStream(
        'CHECK_ANSWER_NETWORK_ERROR',
        { error: err.message || String(err), guess },
        'Failed to submit answer to /api/check-answer'
      );
      ui.submitGuessBtn.disabled = false;
      ui.guessInput.disabled = false;
    } finally {
      isSubmitting = false;
    }
  });
}

// Session Reconnection on Client Startup
async function checkExistingSession() {
  try {
    const sessionData = await api.checkSession();
    if (sessionData.loggedIn) {
      window.dispatchEvent(new CustomEvent('auth-success', {
        detail: { username: sessionData.username, reconnected: true }
      }));
    } else {
      ui.switchView('login');
    }
  } catch (err) {
    ui.switchView('login');
  }
}

// Initialize settings and session state on boot
loadSavedSettings();
checkExistingSession();
