// ====================================================
// BANANA QUEST: RETRO ARCADE EVENT-DRIVEN CLIENT
// THEME 3: EVENT-DRIVEN PROGRAMMING (PUB/SUB & STATE MACHINE)
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
      // Check if leaderboard contains score records
      if (data.leaderboard && data.leaderboard.length > 0) {
        // Construct HTML markup for each high score row
        leaderboardList.innerHTML = data.leaderboard.map((entry, index) => `
          <div class="leaderboard-row">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${entry.username}</span>
            <span class="leaderboard-score">${entry.best_score} PTS</span>
          </div>
        `).join('');
      } else {
        // Fallback display when no scores exist yet
        leaderboardList.innerHTML = '<div style="text-align: center; color: var(--text-dim); font-size: 0.65rem; padding: 10px;">NO HIGH SCORES RECORDED YET</div>';
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

// Helper function to update score display
function updateScoreDisplay() {
  scoreDisplay.textContent = `SCORE: ${currentScore}`;
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
  // Display game over status on timer badge
  timerDisplay.textContent = 'TIME EXPIRED!';
  // Deplete remaining lives to zero
  lives = 0;
  updateLivesDisplay();
  // Disable user input controls
  submitGuessBtn.disabled = true;
  guessInput.disabled = true;
  // Log timeout event to MS-DOS console
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
  // Log registration audit to live console
  logToEventStream('auth-register', event.detail, 'auth-register');
});

// SUBSCRIBER 4: Listen for custom 'auth-success' event
window.addEventListener('auth-success', (event) => {
  // Transition state: Navigate user to the Main Menu Dashboard
  switchView('dashboard');
  // Update active username across both dashboard and game views
  dashUserSpan.textContent = event.detail.username;
  currentUserSpan.textContent = event.detail.username;
  authMessage.textContent = '';
  // Log successful identity establishment to MS-DOS console
  logToEventStream('auth-success', event.detail, 'auth-success');
});

// SUBSCRIBER 5: Listen for custom 'auth-logout' event
window.addEventListener('auth-logout', (event) => {
  // Transition state: Return to login view
  switchView('login');
  // Reset gameplay elements
  puzzleImg.classList.add('hidden');
  guessContainer.classList.add('hidden');
  messageBox.textContent = '';
  // Log logout event to MS-DOS console
  logToEventStream('auth-logout', event.detail);
});

// ====================================================
// THEME 2 & 3: GAMEPLAY LOOP & ARCADE SUBSCRIBERS
// ====================================================

// Helper function to request puzzle from backend proxy
async function loadPuzzle() {
  messageBox.style.color = 'var(--neon-cyan)';
  messageBox.textContent = 'FETCHING PUZZLE FROM MARC CONRAD API...';

  try {
    // Send request to our backend interoperability endpoint
    const response = await fetch('/api/puzzle');
    const data = await response.json();

    // PUBLISHER: Dispatch custom 'puzzle-loaded' event with received image URL
    window.dispatchEvent(new CustomEvent('puzzle-loaded', {
      detail: { imageUrl: data.question }
    }));
  } catch (error) {
    messageBox.style.color = 'var(--neon-red)';
    messageBox.textContent = 'ERROR LOADING PUZZLE';
  }
}

// SUBSCRIBER 6: Listen for custom 'puzzle-loaded' event
window.addEventListener('puzzle-loaded', (event) => {
  // Set image src to the URL retrieved from Marc Conrad's external API
  puzzleImg.src = event.detail.imageUrl;
  // Reveal puzzle image and answer form
  puzzleImg.classList.remove('hidden');
  guessContainer.classList.remove('hidden');
  // Re-enable answer button and input
  submitGuessBtn.disabled = false;
  guessInput.disabled = false;
  // Reset guess input and clear message box
  guessInput.value = '';
  messageBox.textContent = '';
  // Automatically focus the input for fast keyboard play
  guessInput.focus();
  // Log puzzle event to MS-DOS console
  logToEventStream('puzzle-loaded', { imageUrl: event.detail.imageUrl });
  // Start the 45-second event-driven countdown timer
  startTimer();
});

// SUBSCRIBER 7: Listen for custom 'guess-evaluated' event
window.addEventListener('guess-evaluated', (event) => {
  // Log guess evaluation event to MS-DOS console
  logToEventStream('guess-evaluated', event.detail);

  // BRANCH A: Correct Answer - Increment score & auto-progression
  if (event.detail.correct) {
    // Stop countdown timer upon correct solution
    clearInterval(timerInterval);
    // Award 100 points per puzzle solved
    currentScore += 100;
    updateScoreDisplay();
    // Disable submit button during transition delay
    submitGuessBtn.disabled = true;
    guessInput.disabled = true;
    // Display victorious feedback message
    messageBox.style.color = 'var(--neon-green)';
    messageBox.textContent = `★ ${event.detail.message} +100 PTS! NEXT PUZZLE IN 1.5S... ★`;

    // Seamless auto-progression loop: load next puzzle after 1.5 seconds
    setTimeout(() => {
      loadPuzzle();
    }, 1500);

  } else {
    // BRANCH B: Incorrect Answer - Deduct 1 life
    lives--;
    updateLivesDisplay();

    // Check if player still has remaining lives
    if (lives > 0) {
      // Display incorrect feedback with remaining attempts
      messageBox.style.color = 'var(--neon-red)';
      messageBox.textContent = `✖ ${event.detail.message} TRY AGAIN! (${lives} LIVES LEFT)`;
      // Clear input and refocus so user can retry instantly
      guessInput.value = '';
      guessInput.focus();

    } else {
      // BRANCH C: Game Over - Lives depleted to zero
      clearInterval(timerInterval);
      submitGuessBtn.disabled = true;
      guessInput.disabled = true;
      messageBox.style.color = 'var(--neon-red)';
      messageBox.textContent = '💀 GAME OVER! ZERO LIVES REMAINING.';

      // PUBLISHER: Dispatch custom 'game-over' event to trigger score persistence and modal
      window.dispatchEvent(new CustomEvent('game-over', {
        detail: { reason: 'OUT_OF_LIVES', finalScore: currentScore, timestamp: Date.now() }
      }));
    }
  }
});

// SUBSCRIBER 8: Listen for custom 'game-start' event
window.addEventListener('game-start', (event) => {
  // Reset lives state to 3 at start of new arcade session
  lives = 3;
  updateLivesDisplay();
  // Reset score state to 0 at start of new session
  currentScore = 0;
  updateScoreDisplay();
  // Log session initiation to MS-DOS console
  logToEventStream('game-start', event.detail, 'game-start');
});

// SUBSCRIBER 9: Listen for custom 'game-over' event (Persists Score & Opens Modal)
window.addEventListener('game-over', async (event) => {
  // Log game over audit to MS-DOS console
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

  // Update Game Over modal with player's final score
  modalScoreText.textContent = `FINAL SCORE: ${currentScore} PTS`;

  // Display modal popup by removing hidden class
  gameOverModal.classList.remove('hidden');
});

// ====================================================
// MODAL BUTTON CONTROLLERS (RETRY & MAIN MENU)
// ====================================================

// Modal Retry Button: Instantly restart arcade mode
modalRetryBtn.addEventListener('click', () => {
  // Dismiss modal
  gameOverModal.classList.add('hidden');
  // Dispatch game-start event to reset lives and score
  window.dispatchEvent(new CustomEvent('game-start', {
    detail: { mode: 'ARCADE_RETRY', timestamp: Date.now() }
  }));
  // Fetch fresh puzzle immediately
  loadPuzzle();
});

// Modal Menu Button: Return to main menu dashboard
modalMenuBtn.addEventListener('click', () => {
  // Dismiss modal
  gameOverModal.classList.add('hidden');
  // Switch view to dashboard
  switchView('dashboard');
  // Log navigation event
  logToEventStream('nav-dashboard', { action: 'RETURN_FROM_MODAL' });
});

// ====================================================
// DOM EVENT HANDLERS (KEYBOARD & BUTTON CLICKS)
// ====================================================

// KEYBOARD SUPPORT: Submit answer instantly when pressing 'Enter' inside guess input
guessInput.addEventListener('keypress', (event) => {
  // Check if Enter key was pressed and submit button is enabled
  if (event.key === 'Enter' && !submitGuessBtn.disabled) {
    // Prevent default form behavior and simulate submit button click
    event.preventDefault();
    submitGuessBtn.click();
  }
});

// DOM CLICK 1: User Registration Button
registerBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    authMessage.style.color = 'var(--neon-red)';
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
    authMessage.style.color = 'var(--neon-green)';
    authMessage.textContent = data.message;
    // PUBLISHER: Dispatch custom 'auth-register' event
    window.dispatchEvent(new CustomEvent('auth-register', {
      detail: { username, status: 'REGISTERED', timestamp: Date.now() }
    }));
  } else {
    authMessage.style.color = 'var(--neon-red)';
    authMessage.textContent = data.message || 'REGISTRATION FAILED';
  }
});

// DOM CLICK 2: User Login Button
loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    authMessage.style.color = 'var(--neon-red)';
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
    // PUBLISHER: Dispatch custom 'auth-success' event
    window.dispatchEvent(new CustomEvent('auth-success', {
      detail: { username: data.username, sessionEstablished: true }
    }));
  } else {
    authMessage.style.color = 'var(--neon-red)';
    authMessage.textContent = data.message || 'INVALID CREDENTIALS';
  }
});

// DOM CLICK 3: Start Arcade Mode Button (Transitions Dashboard -> Game)
startGameBtn.addEventListener('click', () => {
  // Transition view to gameplay card
  switchView('game');

  // PUBLISHER: Dispatch custom 'game-start' event to initialize lives, score, and session
  window.dispatchEvent(new CustomEvent('game-start', {
    detail: { mode: 'ARCADE', player: dashUserSpan.textContent, timestamp: Date.now() }
  }));

  // Automatically trigger the first puzzle load
  loadPuzzle();
});

// DOM CLICK 4: Back to Main Menu Button
backToDashBtn.addEventListener('click', () => {
  // Stop active countdown timer
  clearInterval(timerInterval);
  // Transition back to main menu dashboard
  switchView('dashboard');
  // Log navigation event
  logToEventStream('nav-dashboard', { action: 'RETURN_TO_MAIN_MENU' });
});

// Reusable Logout Handler
async function performLogout() {
  await fetch('/api/logout', { method: 'POST' });
  clearInterval(timerInterval);
  // PUBLISHER: Dispatch custom 'auth-logout' event
  window.dispatchEvent(new CustomEvent('auth-logout', {
    detail: { status: 'SESSION_DESTROYED' }
  }));
}

// DOM CLICK 5: Gameplay Logout Button
logoutBtn.addEventListener('click', performLogout);

// DOM CLICK 6: Dashboard Logout Button
dashLogoutBtn.addEventListener('click', performLogout);

// DOM CLICK 7: Load New Puzzle Button
fetchPuzzleBtn.addEventListener('click', loadPuzzle);

// DOM CLICK 8: Submit Answer Guess Button
submitGuessBtn.addEventListener('click', async () => {
  const guess = guessInput.value;

  if (guess === '') {
    alert('PLEASE ENTER A DIGIT BETWEEN 0 AND 9');
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
    // Auto-login into dashboard on existing session cookie
    window.dispatchEvent(new CustomEvent('auth-success', {
      detail: { username: sessionData.username, reconnected: true }
    }));
  } else {
    switchView('login');
  }
}

// Execute session verification on script boot
checkExistingSession();
