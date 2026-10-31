// ====================================================
// BANANA QUEST: 90s RETRO ARCADE EVENT-DRIVEN CLIENT
// THEME 3: EVENT-DRIVEN PROGRAMMING (PUB/SUB & WEB AUDIO SYNTH)
// THEME 4: VIRTUAL IDENTITY (SQLITE AUTH & PERSISTENT SCORES)
// THEME 2: INTEROPERABILITY (MARC CONRAD BANANA REST API)
// ====================================================

// Cache DOM element references for all 3 view sections
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const gameSection = document.getElementById('game-section');

// Cache authentication inputs and buttons
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authMessage = document.getElementById('auth-message');

// Cache marquee elements
const marquee1Up = document.getElementById('marquee-1up');
const marqueeHigh = document.getElementById('marquee-high');

// Cache dashboard elements
const dashUserSpan = document.getElementById('dash-user');
const startGameBtn = document.getElementById('start-game-btn');
const dashLogoutBtn = document.getElementById('dash-logout-btn');
const leaderboardList = document.getElementById('leaderboard-list');

// Cache gameplay HUD elements
const currentUserSpan = document.getElementById('current-user');
const scoreDisplay = document.getElementById('score-display');
const timerDisplay = document.getElementById('timer-display');
const livesDisplay = document.getElementById('lives-display');
const puzzleImg = document.getElementById('puzzle-img');
const fetchPuzzleBtn = document.getElementById('fetch-puzzle-btn');
const guessContainer = document.getElementById('guess-container');
const guessInput = document.getElementById('guess-input');
const submitGuessBtn = document.getElementById('submit-guess-btn');
const messageBox = document.getElementById('message-box');
const backToDashBtn = document.getElementById('back-to-dash-btn');
const logoutBtn = document.getElementById('logout-btn');
const keypadButtons = document.querySelectorAll('.keypad-btn');

// Cache Game Juice & Presentation Elements
const sfxToggleBtn = document.getElementById('sfx-toggle-btn');
const settingsBtn = document.getElementById('settings-btn');
const apiStatusPill = document.getElementById('api-status-pill');
const streakDisplay = document.getElementById('streak-display');
const floatingScoreContainer = document.getElementById('floating-score-container');

// Cache Settings DIP Switches Modal Elements
const settingsModal = document.getElementById('settings-modal');
const settingsCloseX = document.getElementById('settings-close-x');
const settingSfxToggle = document.getElementById('setting-sfx-toggle');
const settingVolumeSlider = document.getElementById('setting-volume-slider');
const settingVolumeVal = document.getElementById('setting-volume-val');
const settingDifficultySelect = document.getElementById('setting-difficulty-select');
const settingCrtToggle = document.getElementById('setting-crt-toggle');
const settingVfxToggle = document.getElementById('setting-vfx-toggle');
const settingApiToggle = document.getElementById('setting-api-toggle');
const settingsSaveBtn = document.getElementById('settings-save-btn');

// Cache Game Over Modal elements
const gameOverModal = document.getElementById('game-over-modal');
const modalScoreText = document.getElementById('modal-score-text');
const modalRetryBtn = document.getElementById('modal-retry-btn');
const modalMenuBtn = document.getElementById('modal-menu-btn');

// Cache MS-DOS event stream & error dashboard elements
const terminalTitle = document.getElementById('terminal-title');
const tabBusBtn = document.getElementById('tab-bus-btn');
const tabErrorsBtn = document.getElementById('tab-errors-btn');
const eventLogContainer = document.getElementById('event-log-container');
const errorLogContainer = document.getElementById('error-log-container');
const clearStreamBtn = document.getElementById('clear-stream-btn');
let currentTerminalTab = 'bus';
let unreadErrorCount = 0;

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

// Persistent Settings State Object (Localstorage)
const DEFAULT_SETTINGS = {
  sfxEnabled: true,
  volume: 80,
  timerDifficulty: 45,
  crtEnabled: true,
  vfxEnabled: true,
  simulateOutage: false
};
let currentSettings = { ...DEFAULT_SETTINGS };

// AudioContext & Master Gain Node instance for real-time 8-bit sound synthesis
let audioCtx = null;
let masterGainNode = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioCtx.createGain();
    masterGainNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const vol = (currentSettings.volume / 100);
  masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
}

// ====================================================
// WEB AUDIO API: 8-BIT ARCADE SOUND SYNTHESIZER
// ====================================================

// Function to synthesize vintage 8-bit arcade beeps with master volume control
function playArcadeSound(type) {
  // If player toggled SFX mute or disabled SFX in settings, silence immediately
  if (isMuted || !currentSettings.sfxEnabled) return;

  try {
    ensureAudioContext();
    const now = audioCtx.currentTime;

    // TYPE 1: CLICK / TACTILE KEYPAD BUTTON
    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start(now);
      osc.stop(now + 0.04);
    }

    // TYPE 2: COIN INSERT CHIME (Two-tone high pitch)
    else if (type === 'coin') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGainNode);
      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    }

    // TYPE 3: CORRECT ANSWER (Triumphant power-up arpeggio)
    else if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.07);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now + idx * 0.07);
        osc.stop(now + (idx + 1) * 0.07);
      });
    }

    // TYPE 4: WRONG ANSWER (Low-pitched hurt buzz)
    else if (type === 'wrong') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    // TYPE 5: GAME OVER (Classic descending sad chords)
    else if (type === 'gameover') {
      const pitches = [440, 370, 311, 220];
      pitches.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.2, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.14);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now + idx * 0.14);
        osc.stop(now + (idx + 1) * 0.14);
      });
    }

    // TYPE 6: PANIC TICK (< 10s Timer Warning Beep)
    else if (type === 'tick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start(now);
      osc.stop(now + 0.04);
    }

    // TYPE 7: COMBO STREAK FANFARE (High ascending celebratory chime)
    else if (type === 'streak') {
      const streakPitches = [784, 988, 1175, 1568]; // G5, B5, D6, G6
      streakPitches.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.05);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now + idx * 0.05);
        osc.stop(now + (idx + 1) * 0.05);
      });
    }
  } catch (e) {
    // Gracefully ignore audio errors if browser blocks sound
  }
}

// ====================================================
// GAME JUICE: VISUAL FEEDBACK & POPUP ANIMATIONS
// ====================================================

// Helper function to trigger violent camera shake and red damage flash (respects VFX setting)
function triggerScreenShake() {
  if (!gameSection || !currentSettings.vfxEnabled) return;
  gameSection.classList.remove('screen-shake', 'damage-flash');
  void gameSection.offsetWidth; // Force DOM reflow to re-trigger CSS animation
  gameSection.classList.add('screen-shake', 'damage-flash');
  setTimeout(() => {
    gameSection.classList.remove('screen-shake', 'damage-flash');
  }, 400);
}

// Helper function to trigger green CRT victory pulse
function triggerScreenHeal() {
  if (!gameSection) return;
  gameSection.classList.remove('heal-flash');
  void gameSection.offsetWidth; // Force DOM reflow
  gameSection.classList.add('heal-flash');
  setTimeout(() => {
    gameSection.classList.remove('heal-flash');
  }, 450);
}

// Helper function to render floating "+PTS" popup animation over the cabinet
function showFloatingPoints(text) {
  if (!floatingScoreContainer) return;
  const popup = document.createElement('div');
  popup.className = 'floating-points';
  popup.textContent = text;
  floatingScoreContainer.appendChild(popup);
  setTimeout(() => {
    if (popup.parentNode) popup.parentNode.removeChild(popup);
  }, 1400);
}

// Helper function to update the streak badge in the arcade HUD
function updateStreakDisplay() {
  if (!streakDisplay) return;
  streakDisplay.textContent = `STREAK: ${currentStreak}X`;
  streakDisplay.classList.remove('streak-active', 'streak-fire');
  if (currentStreak >= 3) {
    streakDisplay.classList.add('streak-fire');
  } else if (currentStreak >= 1) {
    streakDisplay.classList.add('streak-active');
  }
}

// ====================================================
// SYSTEM SETTINGS // DIP SWITCHES HARDWARE MANAGER
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
  applySettingsToUI();
}

function saveSettingsToStorage() {
  try {
    localStorage.setItem('banana_quest_arcade_settings', JSON.stringify(currentSettings));
  } catch (e) {}
}

function applySettingsToUI() {
  // 1. Audio Mute State
  isMuted = !currentSettings.sfxEnabled;
  if (sfxToggleBtn) {
    sfxToggleBtn.textContent = isMuted ? '[🔇 SFX: OFF]' : '[🔊 SFX: ON]';
    sfxToggleBtn.classList.toggle('muted', isMuted);
  }
  if (settingSfxToggle) {
    settingSfxToggle.textContent = currentSettings.sfxEnabled ? '[ 🔊 SFX: ON ]' : '[ 🔇 SFX: OFF ]';
    settingSfxToggle.classList.toggle('active-off', !currentSettings.sfxEnabled);
  }

  // 2. Master Volume
  if (settingVolumeSlider) settingVolumeSlider.value = currentSettings.volume;
  if (settingVolumeVal) settingVolumeVal.textContent = currentSettings.volume + '%';
  if (audioCtx && masterGainNode) {
    masterGainNode.gain.setValueAtTime(currentSettings.volume / 100, audioCtx.currentTime);
  }

  // 3. Timer Difficulty
  if (settingDifficultySelect) {
    settingDifficultySelect.value = String(currentSettings.timerDifficulty);
  }

  // 4. CRT Scanlines
  document.body.classList.toggle('no-scanlines', !currentSettings.crtEnabled);
  if (settingCrtToggle) {
    settingCrtToggle.textContent = currentSettings.crtEnabled ? '[ 📺 CRT: ON ]' : '[ 📺 CRT: OFF ]';
    settingCrtToggle.classList.toggle('active-off', !currentSettings.crtEnabled);
  }

  // 5. Screen Shake / Damage VFX
  if (settingVfxToggle) {
    settingVfxToggle.textContent = currentSettings.vfxEnabled ? '[ 💥 VFX: ON ]' : '[ 💥 VFX: OFF ]';
    settingVfxToggle.classList.toggle('active-off', !currentSettings.vfxEnabled);
  }

  // 6. Outage Simulation
  simulateOutage = currentSettings.simulateOutage;
  if (settingApiToggle) {
    settingApiToggle.textContent = simulateOutage ? '[ 🟠 SIMULATE OUTAGE ]' : '[ 🟢 LIVE MARCCONRAD ]';
    settingApiToggle.classList.toggle('active-off', simulateOutage);
  }
  if (apiStatusPill) {
    apiStatusPill.className = simulateOutage ? 'api-status-pill api-fallback' : 'api-status-pill api-live';
    apiStatusPill.textContent = simulateOutage 
      ? '[ 🟠 OFFLINE CACHE (AUTO-RECOVERING) ]' 
      : '[ 🟢 LIVE API (CLICK TO TEST OFFLINE MODE) ]';
  }
}

// ====================================================
// FINITE STATE MACHINE: VIEW-SWITCHING CONTROLLER
// ====================================================

// Helper function to transition between the 3 distinct application views
function switchView(targetView) {
  // Clear any pending round auto-advance timer to prevent view collisions
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  clearInterval(timerInterval);

  // Show or hide login card depending on active state
  loginSection.classList.toggle('hidden', targetView !== 'login');
  // Show or hide arcade main menu dashboard card
  dashboardSection.classList.toggle('hidden', targetView !== 'dashboard');
  // Show or hide gameplay puzzle card
  gameSection.classList.toggle('hidden', targetView !== 'game');

  // If navigating into dashboard, fetch latest high scores from database
  if (targetView === 'dashboard') {
    fetchLeaderboard();
  }
}

// ====================================================
// PERSISTENT LEADERBOARD: SQLITE FETCH & RENDER
// ====================================================

// Function to query backend for top 5 scores from SQLite database
async function fetchLeaderboard() {
  try {
    // Send authenticated GET request to retrieve top aggregated scores
    const res = await fetch('/api/leaderboard');
    const data = await res.json();

    // Check if query succeeded
    if (data.success) {
      if (data.leaderboard && data.leaderboard.length > 0) {
        // Update top marquee high score with #1 player's record
        marqueeHigh.textContent = String(data.leaderboard[0].high_score || data.leaderboard[0].best_score).padStart(4, '0');

        // Construct HTML markup for each high score row with retro arcade rank colors
        leaderboardList.innerHTML = data.leaderboard.map((entry, index) => {
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
        // Fallback display when no scores exist yet
        leaderboardList.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 0.65rem; padding: 10px;">NO HIGH SCORES RECORDED YET</div>';
      }

      // Log successful leaderboard retrieval to MS-DOS terminal
      logToEventStream('leaderboard-fetched', { totalEntries: data.leaderboard ? data.leaderboard.length : 0 });
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
  }
}

// ====================================================
// LIVES & SCORE: HUD STATE RENDERERS
// ====================================================

// Helper function to render active hearts in the arcade HUD
function updateLivesDisplay() {
  if (lives > 0) {
    livesDisplay.textContent = `LIVES: ${'❤️'.repeat(lives)}${'🖤'.repeat(3 - lives)}`;
  } else {
    livesDisplay.textContent = 'LIVES: 💀💀💀';
  }
}

// Helper function to update score display across HUD and marquee
function updateScoreDisplay() {
  const formatted = String(currentScore).padStart(4, '0');
  scoreDisplay.textContent = `SCORE: ${formatted}`;
  marquee1Up.textContent = formatted;
}

// ====================================================
// THEME 3: MS-DOS EVENT STREAM LOGGER (OBSERVER PATTERN)
// ====================================================

// Helper function to switch between MS-DOS [BUS] and [ERRORS] tabs
function switchTerminalTab(tab) {
  currentTerminalTab = tab;
  if (tab === 'errors') {
    if (terminalTitle) terminalTitle.textContent = 'C:\\BANANA_QUEST\\ERROR_LOG.DAT';
    if (eventLogContainer) eventLogContainer.classList.add('hidden');
    if (errorLogContainer) errorLogContainer.classList.remove('hidden');
    if (tabBusBtn) tabBusBtn.classList.remove('active-tab');
    if (tabErrorsBtn) {
      tabErrorsBtn.classList.add('active-tab');
      tabErrorsBtn.classList.remove('tab-has-errors');
      unreadErrorCount = 0;
      tabErrorsBtn.textContent = '[ERRORS]';
    }
    if (errorLogContainer) errorLogContainer.scrollTop = errorLogContainer.scrollHeight;
  } else {
    if (terminalTitle) terminalTitle.textContent = 'C:\\BANANA_QUEST\\EVENT_BUS.EXE';
    if (errorLogContainer) errorLogContainer.classList.add('hidden');
    if (eventLogContainer) eventLogContainer.classList.remove('hidden');
    if (tabErrorsBtn) tabErrorsBtn.classList.remove('active-tab');
    if (tabBusBtn) tabBusBtn.classList.add('active-tab');
    if (eventLogContainer) eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
  }
}

if (tabBusBtn) {
  tabBusBtn.addEventListener('click', () => {
    playArcadeSound('click');
    switchTerminalTab('bus');
  });
}

if (tabErrorsBtn) {
  tabErrorsBtn.addEventListener('click', () => {
    playArcadeSound('click');
    switchTerminalTab('errors');
  });
}

// Dedicated Error Logging Subsystem: Intercepts runtime faults, timeouts, wrong answers & API network drops
function logToErrorStream(errorType, details, description = '') {
  const timestamp = new Date().toISOString().substring(11, 23);
  const entry = document.createElement('div');
  entry.className = 'error-entry';

  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.innerHTML = `
    <span class="error-title">&gt; [FAULT: ${errorType}]</span>
    <span style="color: #cbd5e1;">${timestamp}</span>
  `;

  const descDiv = document.createElement('div');
  descDiv.style.color = '#fecaca';
  descDiv.style.fontSize = '1.05rem';
  descDiv.style.marginBottom = '2px';
  descDiv.textContent = description || errorType;

  const payload = document.createElement('div');
  payload.className = 'error-payload';
  payload.textContent = typeof details === 'object' ? JSON.stringify(details) : String(details);

  entry.appendChild(meta);
  entry.appendChild(descDiv);
  entry.appendChild(payload);

  if (errorLogContainer) {
    errorLogContainer.appendChild(entry);
    errorLogContainer.scrollTop = errorLogContainer.scrollHeight;
  }

  // Update badge alert if user is currently looking at [BUS] tab
  if (currentTerminalTab !== 'errors' && tabErrorsBtn) {
    unreadErrorCount++;
    tabErrorsBtn.textContent = `[ERRORS (${unreadErrorCount})]`;
    tabErrorsBtn.classList.add('tab-has-errors');
  }
}

// Helper function to log dispatched CustomEvents to the MS-DOS terminal
function logToEventStream(eventName, details, customClass = '') {
  // Capture precise timestamp in HH:MM:SS.mmm format
  const timestamp = new Date().toISOString().substring(11, 23);

  // Create new DOM container for log entry
  const entry = document.createElement('div');
  entry.className = 'event-entry';

  // Construct header with event name and timestamp
  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.innerHTML = `
    <span class="event-name ${customClass}">&gt; [${eventName}]</span>
    <span>${timestamp}</span>
  `;

  // Format payload as JSON text
  const payload = document.createElement('div');
  payload.className = 'event-payload';
  payload.textContent = JSON.stringify(details);

  // Append meta and payload into entry container
  entry.appendChild(meta);
  entry.appendChild(payload);

  // Append entry to MS-DOS terminal stream
  if (eventLogContainer) {
    eventLogContainer.appendChild(entry);
    eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
  }
}

// Clear terminal button listener
clearStreamBtn.addEventListener('click', () => {
  playArcadeSound('click');
  if (currentTerminalTab === 'errors') {
    if (errorLogContainer) errorLogContainer.innerHTML = '';
    unreadErrorCount = 0;
    if (tabErrorsBtn) {
      tabErrorsBtn.textContent = '[ERRORS]';
      tabErrorsBtn.classList.remove('tab-has-errors');
    }
    logToErrorStream('CLS', { message: 'Error log buffer cleared' }, 'C:\\BANANA_QUEST\\ERROR_LOG.DAT initialized');
  } else {
    if (eventLogContainer) eventLogContainer.innerHTML = '';
    logToEventStream('CLS', { message: 'MS-DOS event bus buffer cleared' });
  }
});

// ====================================================
// THEME 3: EVENT-DRIVEN COUNTDOWN TIMER (CUSTOM EVENTS)
// ====================================================

// Function to start the event-driven arcade countdown timer
function startTimer() {
  // Clear any pending round auto-advance timer
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  // Stop any active timer interval
  clearInterval(timerInterval);
  // Set timer to configured difficulty DIP switch (default 45s, 60s easy, 20s hard)
  timeLeft = parseInt(currentSettings.timerDifficulty, 10) || 45;
  // Enable interactive answering buttons
  submitGuessBtn.disabled = false;
  guessInput.disabled = false;

  // Set repeating interval executing every 1,000ms (1 second)
  timerInterval = setInterval(() => {
    // Decrement remaining seconds
    timeLeft--;

    // PUBLISHER: Dispatch custom 'timer-tick' event with time remaining in payload
    const tickEvent = new CustomEvent('timer-tick', { detail: { seconds: timeLeft } });
    window.dispatchEvent(tickEvent);

    // Check if countdown timer has elapsed
    if (timeLeft <= 0) {
      // Clear interval to stop repeating
      clearInterval(timerInterval);

      // PUBLISHER: Dispatch custom 'timer-expired' event
      const expiredEvent = new CustomEvent('timer-expired', {
        detail: { status: 'TIMEOUT', message: 'Time limit reached' }
      });
      window.dispatchEvent(expiredEvent);
    }
  }, 1000);
}

// SUBSCRIBER 1: Listen for custom 'timer-tick' event
window.addEventListener('timer-tick', (event) => {
  // Update visual timer badge in DOM
  timerDisplay.textContent = `TIME: ${event.detail.seconds}s`;

  // THEME 3: PANIC MODE (< 10s Timer Warning Beeps & Pulse)
  if (event.detail.seconds <= 10 && event.detail.seconds > 0) {
    timerDisplay.classList.add('panic-pulse');
    playArcadeSound('tick');
  } else {
    timerDisplay.classList.remove('panic-pulse');
  }

  // Log real-time event to MS-DOS console
  logToEventStream('timer-tick', event.detail, 'timer-tick');
});

// SUBSCRIBER 2: Listen for custom 'timer-expired' event
window.addEventListener('timer-expired', (event) => {
  timerDisplay.textContent = 'TIME EXPIRED!';
  timerDisplay.classList.remove('panic-pulse');
  lives = 0;
  updateLivesDisplay();
  currentStreak = 0;
  updateStreakDisplay();
  submitGuessBtn.disabled = true;
  guessInput.disabled = true;
  triggerScreenShake();
  logToEventStream('timer-expired', event.detail, 'timer-expired');
  logToErrorStream('COUNTDOWN_TIMEOUT', event.detail, 'Round timer reached 00s without a submitted solution');
  // Dispatch game-over event with final score metadata
  window.dispatchEvent(new CustomEvent('game-over', {
    detail: { reason: 'TIME_EXPIRED', finalScore: currentScore, timestamp: Date.now() }
  }));
});

// ====================================================
// THEME 4: VIRTUAL IDENTITY CUSTOM EVENT SUBSCRIBERS
// ====================================================

// SUBSCRIBER 3: Listen for custom 'auth-register' event
window.addEventListener('auth-register', (event) => {
  logToEventStream('auth-register', event.detail, 'auth-register');
});

// SUBSCRIBER 4: Listen for custom 'auth-success' event
window.addEventListener('auth-success', (event) => {
  switchView('dashboard');
  dashUserSpan.textContent = event.detail.username;
  currentUserSpan.textContent = event.detail.username;
  authMessage.textContent = '';
  logToEventStream('auth-success', event.detail, 'auth-success');
});

// SUBSCRIBER 5: Listen for custom 'auth-logout' event
window.addEventListener('auth-logout', (event) => {
  switchView('login');
  puzzleImg.classList.add('hidden');
  guessContainer.classList.add('hidden');
  messageBox.textContent = '';
  currentStreak = 0;
  updateStreakDisplay();
  timerDisplay.classList.remove('panic-pulse');
  logToEventStream('auth-logout', event.detail);
});

// ====================================================
// THEME 2 & 3: GAMEPLAY LOOP & ARCADE SUBSCRIBERS
// ====================================================

// Helper function to request puzzle from backend proxy (supports background pre-fetching & simulated outages)
async function loadPuzzle() {
  // Clear any pending round auto-advance timer to prevent double-load collisions
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }

  // Guard against rapid duplicate clicks
  if (isLoadingPuzzle) return;
  isLoadingPuzzle = true;

  messageBox.style.color = 'var(--arcade-cyan)';
  messageBox.textContent = simulateOutage ? 'SIMULATING OUTAGE: ENGAGING BACKUP CACHE...' : 'FETCHING PUZZLE FROM FAST BUFFER...';

  try {
    const query = simulateOutage ? '?simulateOutage=true' : '';
    const response = await fetch('/api/puzzle' + query);
    const data = await response.json();

    // INTERCEPT ERROR / OUTAGE: If served from fallback cache, record to Error Dashboard
    if (data.source === 'FALLBACK_CACHE') {
      logToErrorStream(
        'NETWORK_OUTAGE_FALLBACK',
        { source: 'FALLBACK_CACHE', simulateOutage, question: data.question },
        simulateOutage
          ? 'Manual outage simulation activated (?simulateOutage=true) - Fallback cache bank engaged'
          : 'Live API unreachable (timeout or socket drop) - Automatically engaged 10+ Fallback Cache'
      );
    }

    // OPTIMIZATION: If backend provided a hint of the next puzzle in the queue, pre-cache the image!
    if (data.nextQuestionHint) {
      const preloadNext = new Image();
      preloadNext.src = data.nextQuestionHint;
    }

    // PUBLISHER: Dispatch custom 'puzzle-loaded' event with received image URL and source provenance
    window.dispatchEvent(new CustomEvent('puzzle-loaded', {
      detail: {
        imageUrl: data.question,
        source: data.source || 'LIVE_MARCCONRAD',
        prefetched: data.prefetched
      }
    }));
  } catch (error) {
    logToErrorStream(
      'API_CONNECTION_FAILURE',
      { error: error.message || String(error), simulateOutage },
      'Network fetch failed to reach backend /api/puzzle endpoint'
    );
    messageBox.style.color = 'var(--arcade-red)';
    messageBox.textContent = 'ERROR LOADING PUZZLE';
  } finally {
    isLoadingPuzzle = false;
  }
}

// SUBSCRIBER 6: Listen for custom 'puzzle-loaded' event (Instant Display & Non-Blocking Play)
window.addEventListener('puzzle-loaded', (event) => {
  // Clear any lingering auto-advance timer
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }

  // Ensure gameplay elements are visible
  puzzleImg.classList.remove('hidden');
  guessContainer.classList.remove('hidden');

  // NON-BLOCKING: Immediately enable input and buttons so game NEVER locks up
  submitGuessBtn.disabled = false;
  guessInput.disabled = false;
  guessInput.value = '';
  messageBox.textContent = '';
  guessInput.focus();

  // Set puzzle image URL
  puzzleImg.src = event.detail.imageUrl;

  // Clear panic mode and immediately start round timer
  timerDisplay.classList.remove('panic-pulse');
  startTimer();

  // Update Interoperability Health Status Pill in HUD
  if (apiStatusPill) {
    if (event.detail.source === 'FALLBACK_CACHE') {
      apiStatusPill.className = 'api-status-pill api-fallback';
      apiStatusPill.textContent = '[ 🟠 OFFLINE CACHE (AUTO-RECOVERING) ]';
    } else {
      apiStatusPill.className = 'api-status-pill api-live';
      apiStatusPill.textContent = '[ 🟢 LIVE API (CLICK TO TEST OFFLINE MODE) ]';
    }
  }

  logToEventStream('puzzle-loaded', {
    imageUrl: event.detail.imageUrl,
    source: event.detail.source,
    prefetched: event.detail.prefetched
  });
});

// SUBSCRIBER 7: Listen for custom 'guess-evaluated' event
window.addEventListener('guess-evaluated', (event) => {
  logToEventStream('guess-evaluated', event.detail);

  // BRANCH A: Correct Answer - Play power-up chime, award score + time bonus + combo bonus
  if (event.detail.correct) {
    clearInterval(timerInterval);
    timerDisplay.classList.remove('panic-pulse');
    playArcadeSound('correct');

    // Combo Streak Multiplier Calculation
    currentStreak++;
    updateStreakDisplay();
    const streakBonus = currentStreak > 1 ? (currentStreak - 1) * 50 : 0;
    const pointsEarned = 100 + (timeLeft * 2) + streakBonus;
    currentScore += pointsEarned;
    updateScoreDisplay();

    // Game Juice: Screen victory pulse & floating "+PTS" popup
    triggerScreenHeal();
    const bonusText = currentStreak > 1 ? `+${pointsEarned} PTS (${currentStreak}X COMBO!)` : `+${pointsEarned} PTS!`;
    showFloatingPoints(bonusText);

    if (currentStreak >= 2) {
      playArcadeSound('streak');
    }

    // Publish streak-updated CustomEvent
    window.dispatchEvent(new CustomEvent('streak-updated', {
      detail: { streak: currentStreak, bonus: streakBonus, totalScore: currentScore }
    }));

    submitGuessBtn.disabled = true;
    guessInput.disabled = true;
    messageBox.style.color = 'var(--arcade-green)';
    messageBox.textContent = `★ ${event.detail.message} ${bonusText} NEXT IN 1.5S ★`;

    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    autoAdvanceTimeout = setTimeout(() => {
      loadPuzzle();
    }, 1500);

  } else {
    // BRANCH B: Incorrect Answer - Play buzz, decrement life, reset combo streak, shake camera
    playArcadeSound('wrong');
    currentStreak = 0;
    updateStreakDisplay();
    triggerScreenShake();

    window.dispatchEvent(new CustomEvent('streak-updated', {
      detail: { streak: 0, reset: true }
    }));

    lives--;
    updateLivesDisplay();

    // INTERCEPT ERROR: Log wrong guess to Error Dashboard
    logToErrorStream(
      'INCORRECT_GUESS',
      event.detail,
      `Incorrect solution: "${event.detail.guess !== undefined ? event.detail.guess : guessInput.value}". 1 Life deducted (${lives} lives remaining)`
    );

    if (lives > 0) {
      // 3-SECOND AUTOMATIC PROGRESSION ON ERROR:
      // Halt round countdown timer and clear panic pulse
      clearInterval(timerInterval);
      timerDisplay.classList.remove('panic-pulse');

      // Disable inputs during 3-second transition delay to prevent spamming
      submitGuessBtn.disabled = true;
      guessInput.disabled = true;

      messageBox.style.color = 'var(--arcade-red)';
      messageBox.textContent = `✖ ${event.detail.message} (${lives} LIVES LEFT) - AUTO-RECOVERING IN 3S...`;

      // Clear any pending timeout and auto-advance after 3 seconds
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
      }
      autoAdvanceTimeout = setTimeout(() => {
        loadPuzzle();
      }, 3000);

    } else {
      // BRANCH C: Game Over - Lives depleted to zero
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
      }
      clearInterval(timerInterval);
      timerDisplay.classList.remove('panic-pulse');
      submitGuessBtn.disabled = true;
      guessInput.disabled = true;
      messageBox.style.color = 'var(--arcade-red)';
      messageBox.textContent = '💀 GAME OVER! ZERO LIVES REMAINING.';

      window.dispatchEvent(new CustomEvent('game-over', {
        detail: { reason: 'OUT_OF_LIVES', finalScore: currentScore, timestamp: Date.now() }
      }));
    }
  }
});

// SUBSCRIBER 8: Listen for custom 'game-start' event
window.addEventListener('game-start', (event) => {
  lives = 3;
  updateLivesDisplay();
  currentScore = 0;
  updateScoreDisplay();
  currentStreak = 0;
  updateStreakDisplay();
  timerDisplay.classList.remove('panic-pulse');
  logToEventStream('game-start', event.detail, 'game-start');
});

// SUBSCRIBER 9: Listen for custom 'game-over' event (Plays Sound, Persists Score, Shows Modal)
window.addEventListener('game-over', async (event) => {
  playArcadeSound('gameover');
  timerDisplay.classList.remove('panic-pulse');
  currentStreak = 0;
  updateStreakDisplay();
  logToEventStream('game-over', event.detail, 'timer-expired');
  logToErrorStream(
    'GAME_OVER',
    event.detail,
    `Game Over state triggered (${event.detail.reason || 'OUT_OF_LIVES'}) - Final Score: ${event.detail.finalScore !== undefined ? event.detail.finalScore : currentScore} PTS`
  );

  // Asynchronously record final score in SQLite database via POST /api/score
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: currentScore })
    });
    const data = await res.json();
    if (data.success) {
      // PUBLISHER: Dispatch custom 'score-saved' event
      window.dispatchEvent(new CustomEvent('score-saved', {
        detail: { score: currentScore, dbRecord: data.scoreId, username: data.username }
      }));
    }
  } catch (err) {
    console.error('Failed to persist score:', err);
  }

  // Format final score into retro 4-digit layout
  modalScoreText.textContent = `FINAL SCORE: ${String(currentScore).padStart(4, '0')} PTS`;

  // Display 90s Game Over modal popup
  gameOverModal.classList.remove('hidden');
});

// ====================================================
// GAME JUICE & INTEROP CUSTOM EVENT SUBSCRIBERS
// ====================================================

// SUBSCRIBER 10: Listen for custom 'score-saved' event (Updates MS-DOS terminal & Marquee High Score)
window.addEventListener('score-saved', (event) => {
  logToEventStream('score-saved', event.detail, 'auth-success');
  const savedScore = event.detail.score || 0;
  const currentHigh = parseInt(marqueeHigh.textContent, 10) || 0;
  if (savedScore > currentHigh) {
    marqueeHigh.textContent = String(savedScore).padStart(4, '0');
    logToEventStream('high-score-beat', { newHighScore: savedScore });
  }
});

// SUBSCRIBER 11: Listen for custom 'streak-updated' event
window.addEventListener('streak-updated', (event) => {
  logToEventStream('streak-updated', event.detail, 'game-start');
});

// SUBSCRIBER 12: Listen for custom 'interop-mode-changed' event
window.addEventListener('interop-mode-changed', (event) => {
  logToEventStream('interop-mode-changed', event.detail, 'timer-tick');
});

// SUBSCRIBER 13: Listen for custom 'sfx-toggled' event
window.addEventListener('sfx-toggled', (event) => {
  logToEventStream('sfx-toggled', event.detail);
});

// SUBSCRIBER 14: Listen for custom 'settings-updated' event
window.addEventListener('settings-updated', (event) => {
  logToEventStream('settings-updated', event.detail, 'auth-success');
});

// ====================================================
// GAME JUICE CONTROLS: SFX MUTE & INTEROP SIMULATION
// ====================================================

// SFX Mute / Unmute Toggle Button Listener
if (sfxToggleBtn) {
  sfxToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    currentSettings.sfxEnabled = !isMuted;
    saveSettingsToStorage();
    applySettingsToUI();
    window.dispatchEvent(new CustomEvent('sfx-toggled', { detail: { isMuted } }));
    if (!isMuted) playArcadeSound('coin');
  });
}

// Interoperability Status Pill Click Listener (Simulation Outage Toggle)
if (apiStatusPill) {
  apiStatusPill.addEventListener('click', () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    simulateOutage = !simulateOutage;
    currentSettings.simulateOutage = simulateOutage;
    saveSettingsToStorage();
    applySettingsToUI();
    playArcadeSound('click');
    window.dispatchEvent(new CustomEvent('interop-mode-changed', {
      detail: {
        simulatedOutage: simulateOutage,
        mode: simulateOutage ? 'SIMULATED_FALLBACK' : 'LIVE_MARCCONRAD'
      }
    }));
    loadPuzzle();
  });
}

// ====================================================
// SYSTEM DIP SWITCHES // SETTINGS MODAL CONTROLLERS
// ====================================================

if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    playArcadeSound('click');
    applySettingsToUI();
    settingsModal.classList.remove('hidden');
    logToEventStream('settings-opened', { timestamp: Date.now() });
  });
}

if (settingsCloseX) {
  settingsCloseX.addEventListener('click', () => {
    playArcadeSound('click');
    settingsModal.classList.add('hidden');
  });
}

if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      playArcadeSound('click');
      settingsModal.classList.add('hidden');
    }
  });
}

if (settingSfxToggle) {
  settingSfxToggle.addEventListener('click', () => {
    currentSettings.sfxEnabled = !currentSettings.sfxEnabled;
    applySettingsToUI();
    playArcadeSound('click');
  });
}

if (settingVolumeSlider) {
  settingVolumeSlider.addEventListener('input', (e) => {
    currentSettings.volume = parseInt(e.target.value, 10);
    applySettingsToUI();
  });
  settingVolumeSlider.addEventListener('change', () => {
    playArcadeSound('click');
  });
}

if (settingDifficultySelect) {
  settingDifficultySelect.addEventListener('change', (e) => {
    currentSettings.timerDifficulty = parseInt(e.target.value, 10);
    playArcadeSound('click');
  });
}

if (settingCrtToggle) {
  settingCrtToggle.addEventListener('click', () => {
    currentSettings.crtEnabled = !currentSettings.crtEnabled;
    applySettingsToUI();
    playArcadeSound('click');
  });
}

if (settingVfxToggle) {
  settingVfxToggle.addEventListener('click', () => {
    currentSettings.vfxEnabled = !currentSettings.vfxEnabled;
    applySettingsToUI();
    playArcadeSound('click');
  });
}

if (settingApiToggle) {
  settingApiToggle.addEventListener('click', () => {
    if (autoAdvanceTimeout) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    currentSettings.simulateOutage = !currentSettings.simulateOutage;
    applySettingsToUI();
    playArcadeSound('click');
    window.dispatchEvent(new CustomEvent('interop-mode-changed', {
      detail: {
        simulatedOutage: simulateOutage,
        mode: simulateOutage ? 'SIMULATED_FALLBACK' : 'LIVE_MARCCONRAD'
      }
    }));
    if (gameSection && !gameSection.classList.contains('hidden')) {
      loadPuzzle();
    }
  });
}

if (settingsSaveBtn) {
  settingsSaveBtn.addEventListener('click', () => {
    saveSettingsToStorage();
    settingsModal.classList.add('hidden');
    playArcadeSound('coin');
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: currentSettings }));
  });
}

// ====================================================
// MODAL BUTTON CONTROLLERS (RETRY & EXIT TO LOBBY)
// ====================================================

// Modal Retry Button: Play coin chime and restart arcade mode immediately
modalRetryBtn.addEventListener('click', () => {
  playArcadeSound('coin');
  gameOverModal.classList.add('hidden');
  window.dispatchEvent(new CustomEvent('game-start', {
    detail: { mode: 'ARCADE_RETRY', timestamp: Date.now() }
  }));
  loadPuzzle();
});

// Modal Menu Button: Return to main menu dashboard and refresh leaderboard
modalMenuBtn.addEventListener('click', () => {
  playArcadeSound('click');
  gameOverModal.classList.add('hidden');
  switchView('dashboard');
  logToEventStream('nav-dashboard', { action: 'RETURN_FROM_MODAL' });
});

// ====================================================
// TACTILE ARCADE BUTTON KEYPAD (0-9) CONTROLLER
// ====================================================

// Attach click listener to each on-screen arcade keypad button
keypadButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (submitGuessBtn.disabled || isSubmitting) return;
    // Play button click synth sound
    playArcadeSound('click');
    // Set guess input strictly to button's single digit
    guessInput.value = btn.dataset.val;
    // Automatically trigger submission
    submitGuessBtn.click();
  });
});

// KEYBOARD SUPPORT: Pressing digits 0-9 on physical keyboard triggers answer instantly; 'F' toggles outage simulation
window.addEventListener('keydown', (event) => {
  // Only capture keys when inside active gameplay and not in any modal
  const inGame = gameSection && !gameSection.classList.contains('hidden');
  const modalOpen = !gameOverModal.classList.contains('hidden') || (settingsModal && !settingsModal.classList.contains('hidden'));

  if (inGame && !modalOpen) {
    if (event.key >= '0' && event.key <= '9') {
      // PREVENT BROWSER DEFAULT: Stops double typing ("55") into focused input field!
      event.preventDefault();
      if (!submitGuessBtn.disabled && !isSubmitting) {
        playArcadeSound('click');
        guessInput.value = event.key; // Overwrite strictly with single digit
        submitGuessBtn.click();
      }
    } else if (event.key === 'f' || event.key === 'F') {
      if (apiStatusPill) apiStatusPill.click();
    }
  }
});

// Input Sanitization: Guarantee only a single digit (0-9) can ever be entered into guessInput
if (guessInput) {
  guessInput.addEventListener('input', (event) => {
    const sanitized = event.target.value.replace(/[^0-9]/g, '');
    if (sanitized.length > 0) {
      // Overwrite strictly with the single most recently entered digit
      const singleDigit = sanitized.slice(-1);
      event.target.value = singleDigit;
      if (!submitGuessBtn.disabled && !isSubmitting) {
        playArcadeSound('click');
        submitGuessBtn.click();
      }
    } else {
      event.target.value = '';
    }
  });

  guessInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!submitGuessBtn.disabled && !isSubmitting) {
        submitGuessBtn.click();
      }
    }
  });
}

// ====================================================
// DOM EVENT HANDLERS (LOGIN, REGISTER, NAVIGATION)
// ====================================================

// DOM CLICK 1: User Registration Button
registerBtn.addEventListener('click', async () => {
  playArcadeSound('click');
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    authMessage.style.color = 'var(--arcade-red)';
    authMessage.textContent = 'ENTER USERNAME & PASSWORD!';
    return;
  }

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (data.success) {
    authMessage.style.color = 'var(--arcade-green)';
    authMessage.textContent = data.message;
    window.dispatchEvent(new CustomEvent('auth-register', {
      detail: { username, status: 'REGISTERED', timestamp: Date.now() }
    }));
  } else {
    authMessage.style.color = 'var(--arcade-red)';
    authMessage.textContent = data.message || 'REGISTRATION FAILED';
  }
});

// DOM CLICK 2: User Login Button
loginBtn.addEventListener('click', async () => {
  playArcadeSound('coin');
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    authMessage.style.color = 'var(--arcade-red)';
    authMessage.textContent = 'ENTER USERNAME & PASSWORD!';
    return;
  }

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (data.success) {
    window.dispatchEvent(new CustomEvent('auth-success', {
      detail: { username: data.username, sessionEstablished: true }
    }));
  } else {
    authMessage.style.color = 'var(--arcade-red)';
    authMessage.textContent = data.message || 'INVALID CREDENTIALS';
  }
});

// DOM CLICK 3: Start Arcade Mode Button
startGameBtn.addEventListener('click', () => {
  playArcadeSound('coin');
  switchView('game');
  window.dispatchEvent(new CustomEvent('game-start', {
    detail: { mode: 'ARCADE', player: dashUserSpan.textContent, timestamp: Date.now() }
  }));
  loadPuzzle();
});

// DOM CLICK 4: Back to Main Menu Button
backToDashBtn.addEventListener('click', () => {
  playArcadeSound('click');
  clearInterval(timerInterval);
  switchView('dashboard');
  logToEventStream('nav-dashboard', { action: 'RETURN_TO_MAIN_MENU' });
});

// Reusable Logout Handler
async function performLogout() {
  playArcadeSound('click');
  await fetch('/api/logout', { method: 'POST' });
  clearInterval(timerInterval);
  window.dispatchEvent(new CustomEvent('auth-logout', {
    detail: { status: 'SESSION_DESTROYED' }
  }));
}

// DOM CLICK 5: Gameplay Logout Button
logoutBtn.addEventListener('click', performLogout);

// DOM CLICK 6: Dashboard Logout Button
dashLogoutBtn.addEventListener('click', performLogout);

// DOM CLICK 7: Load New Puzzle Button
fetchPuzzleBtn.addEventListener('click', () => {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  playArcadeSound('click');
  loadPuzzle();
});

// DOM CLICK 8: Submit Answer Guess Button
submitGuessBtn.addEventListener('click', async () => {
  if (isSubmitting || submitGuessBtn.disabled) return;
  const guess = guessInput.value.trim();

  if (guess === '') {
    messageBox.style.color = 'var(--arcade-yellow)';
    messageBox.textContent = 'PLEASE ENTER OR CLICK A DIGIT 0-9';
    return;
  }

  isSubmitting = true;
  submitGuessBtn.disabled = true;
  guessInput.disabled = true;

  try {
    const response = await fetch('/api/check-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess })
    });

    const result = await response.json();

    // PUBLISHER: Dispatch custom 'guess-evaluated' event
    window.dispatchEvent(new CustomEvent('guess-evaluated', {
      detail: { guess: parseInt(guess, 10), correct: result.correct, message: result.message }
    }));
  } catch (err) {
    console.error('Answer check error:', err);
    logToErrorStream(
      'CHECK_ANSWER_NETWORK_ERROR',
      { error: err.message || String(err), guess },
      'Failed to submit answer to /api/check-answer'
    );
    submitGuessBtn.disabled = false;
    guessInput.disabled = false;
  } finally {
    isSubmitting = false;
  }
});

// Initial startup: Query backend for active virtual identity session
async function checkExistingSession() {
  const res = await fetch('/api/session');
  const sessionData = await res.json();
  if (sessionData.loggedIn) {
    window.dispatchEvent(new CustomEvent('auth-success', {
      detail: { username: sessionData.username, reconnected: true }
    }));
  } else {
    switchView('login');
  }
}

// Execute settings initialization and session verification on script boot
loadSavedSettings();
checkExistingSession();
