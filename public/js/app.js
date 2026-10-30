// ====================================================
// BANANA QUEST FRONTEND APPLICATION LOGIC
// THEME 3: EVENT-DRIVEN PROGRAMMING & CUSTOM EVENTS
// THEME 4: VIRTUAL IDENTITY INTEGRATION
// THEME 2: INTEROPERABILITY CLIENT CONSUMPTION
// ====================================================

// Grab references to all HTML elements we need to interact with
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const timerDisplay = document.getElementById('timer-display');
const puzzleImg = document.getElementById('puzzle-img');
const fetchPuzzleBtn = document.getElementById('fetch-puzzle-btn');
const guessContainer = document.getElementById('guess-container');
const guessInput = document.getElementById('guess-input');
const submitGuessBtn = document.getElementById('submit-guess-btn');
const messageBox = document.getElementById('message-box');

// Global timer interval reference and countdown variable
let timerInterval = null;
let timeLeft = 45;

// ----------------------------------------------------
// THEME 3: EVENT-DRIVEN PROGRAMMING (CUSTOM EVENTS)
// ----------------------------------------------------

// Function to start the 45-second countdown timer
function startTimer() {
  // Clear any existing active timer to prevent duplicate countdowns
  clearInterval(timerInterval);
  // Reset the time remaining to 45 seconds
  timeLeft = 45;
  // Re-enable the submit button and input field
  submitGuessBtn.disabled = false;
  guessInput.disabled = false;

  // Create an interval that executes every 1,000 milliseconds (1 second)
  timerInterval = setInterval(() => {
    // Decrement remaining seconds by 1
    timeLeft--;

    // Trigger CustomEvent: Emits a 'timer-tick' event with time remaining in detail
    const tickEvent = new CustomEvent('timer-tick', { detail: { seconds: timeLeft } });
    // Dispatch the custom event to the global window event bus
    window.dispatchEvent(tickEvent);

    // Check if countdown has reached 0
    if (timeLeft <= 0) {
      // Stop the repeating timer interval
      clearInterval(timerInterval);
      // Trigger CustomEvent: Emits a 'timer-expired' event
      const expiredEvent = new CustomEvent('timer-expired');
      // Dispatch the expired event to notify all registered listeners
      window.dispatchEvent(expiredEvent);
    }
  }, 1000);
}

// EVENT LISTENER 1: Listen for the custom 'timer-tick' event
window.addEventListener('timer-tick', (event) => {
  // Update UI timer text based on custom event payload data
  timerDisplay.textContent = `Time Left: ${event.detail.seconds}s`;
});

// EVENT LISTENER 2: Listen for the custom 'timer-expired' event
window.addEventListener('timer-expired', () => {
  // Inform the user that time has run out
  timerDisplay.textContent = 'Time Expired! Game Over.';
  // Disable player input controls because time is up
  submitGuessBtn.disabled = true;
  guessInput.disabled = true;
  // Show message in red text
  messageBox.style.color = '#e74c3c';
  messageBox.textContent = 'Out of time! Click "Load New Puzzle" to try again.';
});

// ----------------------------------------------------
// THEME 4: VIRTUAL IDENTITY (CLIENT-SIDE AUTHENTICATION)
// ----------------------------------------------------

// EVENT LISTENER 3: Handle user login click event
loginBtn.addEventListener('click', async () => {
  // Gather entered username and password
  const username = usernameInput.value;
  const password = passwordInput.value;

  // Send POST request with credentials to establish session cookie
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  // Parse JSON response from server
  const data = await response.json();

  // Check if server accepted the credentials
  if (data.success) {
    // Switch view: Hide login card and display game card
    loginSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    // Display authenticated virtual identity username
    currentUserSpan.textContent = data.username;
    messageBox.textContent = '';
  } else {
    // Show error alert on invalid login credentials
    alert(data.message || 'Login failed');
  }
});

// EVENT LISTENER 4: Handle user logout click event
logoutBtn.addEventListener('click', async () => {
  // Inform server to destroy virtual identity session and clear cookie
  await fetch('/api/logout', { method: 'POST' });
  // Stop the game timer if running
  clearInterval(timerInterval);
  // Switch view: Show login form and hide game container
  gameSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  // Reset inputs and UI states
  puzzleImg.classList.add('hidden');
  guessContainer.classList.add('hidden');
  messageBox.textContent = '';
});

// ----------------------------------------------------
// THEME 2: INTEROPERABILITY (FETCHING EXTERNAL PUZZLE)
// ----------------------------------------------------

// EVENT LISTENER 5: Handle click to load a new puzzle
fetchPuzzleBtn.addEventListener('click', async () => {
  // Show loading feedback
  messageBox.style.color = '#2980b9';
  messageBox.textContent = 'Fetching puzzle from external API...';

  // Request puzzle from our backend (which interoperates with Marc Conrad API)
  const response = await fetch('/api/puzzle');
  const data = await response.json();

  // Set the image src to the URL returned from Marc Conrad's external service
  puzzleImg.src = data.question;
  // Make image and guessing controls visible
  puzzleImg.classList.remove('hidden');
  guessContainer.classList.remove('hidden');
  // Clear input and previous message
  guessInput.value = '';
  messageBox.textContent = '';

  // Start the 45-second event-driven countdown timer for this puzzle
  startTimer();
});

// EVENT LISTENER 6: Handle guess submission click event
submitGuessBtn.addEventListener('click', async () => {
  // Read player's guess from input box
  const guess = guessInput.value;

  // Validate input exists
  if (guess === '') {
    alert('Please enter a number between 0 and 9');
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

  // Display result to player
  if (result.correct) {
    // Stop timer on success
    clearInterval(timerInterval);
    messageBox.style.color = '#27ae60';
    messageBox.textContent = result.message;
    submitGuessBtn.disabled = true;
  } else {
    messageBox.style.color = '#e74c3c';
    messageBox.textContent = result.message;
  }
});

// Check if user is already logged in on page load
async function checkExistingSession() {
  // Query backend for active virtual identity session cookie
  const res = await fetch('/api/session');
  const sessionData = await res.json();
  // If active session exists, reveal game view directly
  if (sessionData.loggedIn) {
    loginSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    currentUserSpan.textContent = sessionData.username;
  }
}

// Call session check upon initial script execution
checkExistingSession();
