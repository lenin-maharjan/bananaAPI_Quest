// ====================================================
// BANANA QUEST: CLIENT-SIDE EVENT-DRIVEN ARCHITECTURE
// THEME 3: EVENT-DRIVEN PROGRAMMING (PUB/SUB & CUSTOM EVENTS)
// THEME 4: VIRTUAL IDENTITY (SQLITE & BCRYPT AUTH)
// THEME 2: INTEROPERABILITY (MARC CONRAD BANANA REST API)
// ====================================================

// Cache DOM element references for high performance UI manipulation
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const timerDisplay = document.getElementById('timer-display');
const puzzleImg = document.getElementById('puzzle-img');
const fetchPuzzleBtn = document.getElementById('fetch-puzzle-btn');
const guessContainer = document.getElementById('guess-container');
const guessInput = document.getElementById('guess-input');
const submitGuessBtn = document.getElementById('submit-guess-btn');
const messageBox = document.getElementById('message-box');
const eventLogContainer = document.getElementById('event-log-container');
const clearStreamBtn = document.getElementById('clear-stream-btn');

// Timer state tracking variables
let timerInterval = null;
let timeLeft = 45;

// ====================================================
// THEME 3: PUB/SUB EVENT STREAM LOGGER (OBSERVER PATTERN)
// ====================================================

// Helper function to render dispatched events visually in the terminal console
function logToEventStream(eventName, details, customClass = '') {
  // Capture precise millisecond timestamp for real-time audit trail
  const timestamp = new Date().toISOString().substring(11, 23);

  // Create new DOM card element for this logged event
  const entry = document.createElement('div');
  entry.className = 'event-entry';

  // Construct header displaying event name and timestamp
  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.innerHTML = `
    <span class="event-name ${customClass}">${eventName}</span>
    <span>${timestamp}</span>
  `;

  // Format payload details into formatted JSON string for inspection
  const payload = document.createElement('div');
  payload.className = 'event-payload';
  payload.textContent = JSON.stringify(details);

  // Append metadata and payload into event entry container
  entry.appendChild(meta);
  entry.appendChild(payload);

  // Append entry to terminal console stream
  eventLogContainer.appendChild(entry);

  // Auto-scroll terminal to bottom to show most recent event
  eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
}

// Click event listener to clear terminal event log stream
clearStreamBtn.addEventListener('click', () => {
  // Clear all log items from container
  eventLogContainer.innerHTML = '';
  // Append fresh reset confirmation
  logToEventStream('STREAM_CLEARED', { message: 'Event bus terminal reset' });
});

// ====================================================
// THEME 3: EVENT-DRIVEN COUNTDOWN TIMER (CUSTOM EVENTS)
// ====================================================

// Function to initiate the 45-second event-driven countdown timer
function startTimer() {
  // Clear any existing active timer interval to prevent race conditions
  clearInterval(timerInterval);
  // Reset countdown to 45 seconds
  timeLeft = 45;
  // Re-enable player interactive input controls
  submitGuessBtn.disabled = false;
  guessInput.disabled = false;

  // Set repeating interval executing every 1,000ms (1 second)
  timerInterval = setInterval(() => {
    // Decrement countdown counter
    timeLeft--;

    // PUBLISHER: Dispatch custom 'timer-tick' event with remaining time payload
    const tickEvent = new CustomEvent('timer-tick', { detail: { seconds: timeLeft } });
    window.dispatchEvent(tickEvent);

    // Check if time has completely elapsed
    if (timeLeft <= 0) {
      // Clear interval to stop timer execution
      clearInterval(timerInterval);

      // PUBLISHER: Dispatch custom 'timer-expired' event
      const expiredEvent = new CustomEvent('timer-expired', {
        detail: { status: 'TIMEOUT', message: '45-second limit exceeded' }
      });
      window.dispatchEvent(expiredEvent);
    }
  }, 1000);
}

// SUBSCRIBER 1: Listen for custom 'timer-tick' events
window.addEventListener('timer-tick', (event) => {
  // Update visual DOM timer element
  timerDisplay.textContent = `Time Left: ${event.detail.seconds}s`;
  // Log real-time event firing to the Live Event Stream console
  logToEventStream('timer-tick', event.detail, 'timer-tick');
});

// SUBSCRIBER 2: Listen for custom 'timer-expired' events
window.addEventListener('timer-expired', (event) => {
  // Update UI timer text to reflect expiration
  timerDisplay.textContent = 'Time Expired! Game Over.';
  // Disable user guessing controls
  submitGuessBtn.disabled = true;
  guessInput.disabled = true;
  // Show error message
  messageBox.style.color = 'var(--accent-error)';
  messageBox.textContent = 'Out of time! Click "Load New Puzzle" to try again.';
  // Log critical timeout event to console
  logToEventStream('timer-expired', event.detail, 'timer-expired');
});

// ====================================================
// THEME 4: VIRTUAL IDENTITY CUSTOM EVENT SUBSCRIBERS
// ====================================================

// SUBSCRIBER 3: Listen for custom 'auth-register' event
window.addEventListener('auth-register', (event) => {
  // Log registration event to live console
  logToEventStream('auth-register', event.detail, 'auth-register');
});

// SUBSCRIBER 4: Listen for custom 'auth-success' event
window.addEventListener('auth-success', (event) => {
  // Transition views: Hide login card and display authenticated gameplay dashboard
  loginSection.classList.add('hidden');
  gameSection.classList.remove('hidden');
  // Update active identity display badge
  currentUserSpan.textContent = event.detail.username;
  authMessage.textContent = '';
  // Log successful identity establishment event to live console
  logToEventStream('auth-success', event.detail, 'auth-success');
});

// SUBSCRIBER 5: Listen for custom 'auth-logout' event
window.addEventListener('auth-logout', (event) => {
  // Transition views: Show login card and hide gameplay section
  gameSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  // Reset input fields and hide puzzle image
  puzzleImg.classList.add('hidden');
  guessContainer.classList.add('hidden');
  messageBox.textContent = '';
  // Log session destruction event to live console
  logToEventStream('auth-logout', event.detail);
});

// ====================================================
// THEME 2: INTEROPERABILITY CUSTOM EVENT SUBSCRIBERS
// ====================================================

// SUBSCRIBER 6: Listen for custom 'puzzle-loaded' event
window.addEventListener('puzzle-loaded', (event) => {
  // Set puzzle image src to external URL from Marc Conrad's API
  puzzleImg.src = event.detail.imageUrl;
  // Reveal puzzle image and answering form
  puzzleImg.classList.remove('hidden');
  guessContainer.classList.remove('hidden');
  // Clear previous message and input
  guessInput.value = '';
  messageBox.textContent = '';
  // Log puzzle retrieval event to live console
  logToEventStream('puzzle-loaded', { imageUrl: event.detail.imageUrl });
  // Start the 45-second event-driven countdown timer
  startTimer();
});

// SUBSCRIBER 7: Listen for custom 'guess-evaluated' event
window.addEventListener('guess-evaluated', (event) => {
  // Log evaluated guess event to live console
  logToEventStream('guess-evaluated', event.detail);

  // Check if player's submitted answer was correct
  if (event.detail.correct) {
    // Stop the active timer upon puzzle completion
    clearInterval(timerInterval);
    messageBox.style.color = 'var(--accent-success)';
    messageBox.textContent = event.detail.message;
    submitGuessBtn.disabled = true;
  } else {
    // Show incorrect feedback
    messageBox.style.color = 'var(--accent-error)';
    messageBox.textContent = event.detail.message;
  }
});

// ====================================================
// DOM EVENT HANDLERS (DISPATCHING CUSTOM EVENTS)
// ====================================================

// DOM CLICK 1: Handle User Registration Button
registerBtn.addEventListener('click', async () => {
  // Extract proposed username and plaintext password
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Validate form fields are not empty
  if (!username || !password) {
    authMessage.style.color = 'var(--accent-error)';
    authMessage.textContent = 'Please enter both a username and password.';
    return;
  }

  // Send POST request to backend registration endpoint
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  // Parse JSON response
  const data = await response.json();

  // Check if registration succeeded
  if (data.success) {
    authMessage.style.color = 'var(--accent-success)';
    authMessage.textContent = data.message;
    // PUBLISHER: Dispatch custom 'auth-register' event
    window.dispatchEvent(new CustomEvent('auth-register', {
      detail: { username, status: 'CREATED', timestamp: Date.now() }
    }));
  } else {
    authMessage.style.color = 'var(--accent-error)';
    authMessage.textContent = data.message || 'Registration failed.';
  }
});

// DOM CLICK 2: Handle User Login Button
loginBtn.addEventListener('click', async () => {
  // Extract credentials from input boxes
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Validate inputs
  if (!username || !password) {
    authMessage.style.color = 'var(--accent-error)';
    authMessage.textContent = 'Please enter both a username and password.';
    return;
  }

  // Send POST request with credentials to establish session cookie
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  // Parse JSON response
  const data = await response.json();

  // If credentials matched bcrypt hash in SQLite
  if (data.success) {
    // PUBLISHER: Dispatch custom 'auth-success' event
    window.dispatchEvent(new CustomEvent('auth-success', {
      detail: { username: data.username, sessionEstablished: true }
    }));
  } else {
    authMessage.style.color = 'var(--accent-error)';
    authMessage.textContent = data.message || 'Invalid username or password.';
  }
});

// DOM CLICK 3: Handle User Logout Button
logoutBtn.addEventListener('click', async () => {
  // Request server to destroy virtual identity session and clear cookie
  await fetch('/api/logout', { method: 'POST' });
  // Stop active timer
  clearInterval(timerInterval);
  // PUBLISHER: Dispatch custom 'auth-logout' event
  window.dispatchEvent(new CustomEvent('auth-logout', {
    detail: { status: 'SESSION_DESTROYED' }
  }));
});

// DOM CLICK 4: Handle Load New Puzzle Button (Interoperability)
fetchPuzzleBtn.addEventListener('click', async () => {
  messageBox.style.color = 'var(--accent-blue)';
  messageBox.textContent = 'Requesting puzzle from Marc Conrad external API...';

  // Fetch puzzle from backend proxy
  const response = await fetch('/api/puzzle');
  const data = await response.json();

  // PUBLISHER: Dispatch custom 'puzzle-loaded' event
  window.dispatchEvent(new CustomEvent('puzzle-loaded', {
    detail: { imageUrl: data.question }
  }));
});

// DOM CLICK 5: Handle Answer Submission Button
submitGuessBtn.addEventListener('click', async () => {
  const guess = guessInput.value;

  // Validate input
  if (guess === '') {
    alert('Please enter a digit between 0 and 9');
    return;
  }

  // Send guess to backend to verify against session-stored solution
  const response = await fetch('/api/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess })
  });

  // Parse verification response
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
    // PUBLISHER: Dispatch custom 'auth-success' event for re-authenticated session
    window.dispatchEvent(new CustomEvent('auth-success', {
      detail: { username: sessionData.username, reconnected: true }
    }));
  }
}

// Run initial session check
checkExistingSession();
