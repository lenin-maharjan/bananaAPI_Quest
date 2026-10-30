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

// Cache Game Over Modal elements
const gameOverModal = document.getElementById('game-over-modal');
const modalScoreText = document.getElementById('modal-score-text');
const modalRetryBtn = document.getElementById('modal-retry-btn');
const modalMenuBtn = document.getElementById('modal-menu-btn');

// Cache MS-DOS event stream console elements
const eventLogContainer = document.getElementById('event-log-container');
const clearStreamBtn = document.getElementById('clear-stream-btn');

// Global timer tracking variables
let timerInterval = null;
let timeLeft = 45;

// Global arcade player state
let lives = 3;
let currentScore = 0;

// AudioContext instance for real-time 8-bit sound synthesis
let audioCtx = null;

// ====================================================
// WEB AUDIO API: 8-BIT ARCADE SOUND SYNTHESIZER
// ====================================================

// Function to synthesize vintage 8-bit arcade beeps without external sound files
function playArcadeSound(type) {
  try {
    // Lazily initialize browser AudioContext on first user interaction
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if browser suspended it due to autoplay policy
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

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
      gain.connect(audioCtx.destination);
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
      gain.connect(audioCtx.destination);
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
        gain.connect(audioCtx.destination);
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
      gain.connect(audioCtx.destination);
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
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + (idx + 1) * 0.14);
      });
    }
  } catch (e) {
    // Gracefully ignore audio errors if browser blocks sound
  }
}

// ====================================================
// FINITE STATE MACHINE: VIEW-SWITCHING CONTROLLER
// ====================================================

// Helper function to transition between the 3 distinct application views
function switchView(targetView) {
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
  eventLogContainer.appendChild(entry);

  // Auto-scroll terminal to bottom
  eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
}

// Clear terminal button listener
clearStreamBtn.addEventListener('click', () => {
  eventLogContainer.innerHTML = '';
  playArcadeSound('click');
  logToEventStream('CLS', { message: 'MS-DOS event bus buffer cleared' });
});

// ====================================================
// THEME 3: EVENT-DRIVEN COUNTDOWN TIMER (CUSTOM EVENTS)
// ====================================================

// Function to start the 45-second event-driven arcade countdown timer
function startTimer() {
  // Stop any active timer interval
  clearInterval(timerInterval);
  // Reset time remaining to 45 seconds
  timeLeft = 45;
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
        detail: { status: 'TIMEOUT', message: '45-second limit reached' }
      });
      window.dispatchEvent(expiredEvent);
    }
  }, 1000);
}

// SUBSCRIBER 1: Listen for custom 'timer-tick' event
window.addEventListener('timer-tick', (event) => {
  // Update visual timer badge in DOM
  timerDisplay.textContent = `TIME: ${event.detail.seconds}s`;
  // Log real-time event to MS-DOS console
  logToEventStream('timer-tick', event.detail, 'timer-tick');
});

// SUBSCRIBER 2: Listen for custom 'timer-expired' event
window.addEventListener('timer-expired', (event) => {
  timerDisplay.textContent = 'TIME EXPIRED!';
  lives = 0;
  updateLivesDisplay();
  submitGuessBtn.disabled = true;
  guessInput.disabled = true;
  logToEventStream('timer-expired', event.detail, 'timer-expired');
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
  logToEventStream('auth-logout', event.detail);
});

// ====================================================
// THEME 2 & 3: GAMEPLAY LOOP & ARCADE SUBSCRIBERS
// ====================================================

// Helper function to request puzzle from backend proxy
async function loadPuzzle() {
  messageBox.style.color = 'var(--arcade-cyan)';
  messageBox.textContent = 'FETCHING PUZZLE FROM MARC CONRAD API...';

  try {
    const response = await fetch('/api/puzzle');
    const data = await response.json();

    // PUBLISHER: Dispatch custom 'puzzle-loaded' event with received image URL
    window.dispatchEvent(new CustomEvent('puzzle-loaded', {
      detail: { imageUrl: data.question }
    }));
  } catch (error) {
    messageBox.style.color = 'var(--arcade-red)';
    messageBox.textContent = 'ERROR LOADING PUZZLE';
  }
}

// SUBSCRIBER 6: Listen for custom 'puzzle-loaded' event
window.addEventListener('puzzle-loaded', (event) => {
  puzzleImg.src = event.detail.imageUrl;
  puzzleImg.classList.remove('hidden');
  guessContainer.classList.remove('hidden');
  submitGuessBtn.disabled = false;
  guessInput.disabled = false;
  guessInput.value = '';
  messageBox.textContent = '';
  guessInput.focus();
  logToEventStream('puzzle-loaded', { imageUrl: event.detail.imageUrl });
  startTimer();
});

// SUBSCRIBER 7: Listen for custom 'guess-evaluated' event
window.addEventListener('guess-evaluated', (event) => {
  logToEventStream('guess-evaluated', event.detail);

  // BRANCH A: Correct Answer - Play power-up chime, award score + time bonus, auto-load next puzzle
  if (event.detail.correct) {
    clearInterval(timerInterval);
    playArcadeSound('correct');

    // Score calculation: 100 base points plus 2x remaining seconds bonus
    const pointsEarned = 100 + (timeLeft * 2);
    currentScore += pointsEarned;
    updateScoreDisplay();

    submitGuessBtn.disabled = true;
    guessInput.disabled = true;
    messageBox.style.color = 'var(--arcade-green)';
    messageBox.textContent = `★ ${event.detail.message} +${pointsEarned} PTS! NEXT IN 1.5S ★`;

    setTimeout(() => {
      loadPuzzle();
    }, 1500);

  } else {
    // BRANCH B: Incorrect Answer - Play buzz, decrement life
    playArcadeSound('wrong');
    lives--;
    updateLivesDisplay();

    if (lives > 0) {
      messageBox.style.color = 'var(--arcade-red)';
      messageBox.textContent = `✖ ${event.detail.message} TRY AGAIN! (${lives} LIVES LEFT)`;
      guessInput.value = '';
      guessInput.focus();
    } else {
      // BRANCH C: Game Over - Lives depleted to zero
      clearInterval(timerInterval);
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
  logToEventStream('game-start', event.detail, 'game-start');
});

// SUBSCRIBER 9: Listen for custom 'game-over' event (Plays Sound, Persists Score, Shows Modal)
window.addEventListener('game-over', async (event) => {
  playArcadeSound('gameover');
  logToEventStream('game-over', event.detail, 'timer-expired');

  // Asynchronously record final score in SQLite database via POST /api/score
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: currentScore })
    });
    const data = await res.json();
    if (data.success) {
      logToEventStream('score-saved', { score: currentScore, dbRecord: data.scoreId });
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
    // Play button click synth sound
    playArcadeSound('click');
    // Set guess input value to button's digit
    guessInput.value = btn.dataset.val;
    // Automatically trigger submission
    submitGuessBtn.click();
  });
});

// KEYBOARD SUPPORT: Pressing digits 0-9 on physical keyboard triggers answer instantly
window.addEventListener('keydown', (event) => {
  // Only capture digits 0-9 when inside active gameplay and not in modal
  if (gameSection && !gameSection.classList.contains('hidden') && gameOverModal.classList.contains('hidden')) {
    if (event.key >= '0' && event.key <= '9' && !submitGuessBtn.disabled) {
      playArcadeSound('click');
      guessInput.value = event.key;
      submitGuessBtn.click();
    }
  }
});

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
  playArcadeSound('click');
  loadPuzzle();
});

// DOM CLICK 8: Submit Answer Guess Button
submitGuessBtn.addEventListener('click', async () => {
  const guess = guessInput.value;

  if (guess === '') {
    alert('PLEASE ENTER OR CLICK A DIGIT 0-9');
    return;
  }

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

// Execute session verification on script boot
checkExistingSession();
