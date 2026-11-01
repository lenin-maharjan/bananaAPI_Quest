// ====================================================
// MODULE: API SERVICE LAYER (REST CLIENT)
// THEME 2: INTEROPERABILITY (BACKEND PROXY & AUTH CONSUMPTION)
// ====================================================

/**
 * Checks for an active server-side virtual identity session
 * @returns {Promise<{ loggedIn: boolean, username?: string }>}
 */
export async function checkSession() {
  const res = await fetch('/api/session');
  return await res.json();
}

/**
 * Registers a new user account with bcrypt password hashing
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function register(username, password) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

/**
 * Authenticates user credentials and establishes server session
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ success: boolean, message?: string, username?: string }>}
 */
export async function login(username, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return await res.json();
}

/**
 * Destroys current session cookie and revokes authentication
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export async function logout() {
  const res = await fetch('/api/logout', { method: 'POST' });
  return await res.json();
}

/**
 * Fetches a banana puzzle from backend pre-fetch queue or fallback bank
 * @param {boolean} [simulateOutage=false]
 * @returns {Promise<{ question: string, source: string, prefetched: boolean, nextQuestionHint?: string }>}
 */
export async function fetchPuzzle(simulateOutage = false) {
  const query = simulateOutage ? '?simulateOutage=true' : '';
  const res = await fetch('/api/puzzle' + query);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: Failed to fetch puzzle`);
  }
  return await res.json();
}

/**
 * Validates player's guess against session solution on backend
 * @param {number|string} guess
 * @returns {Promise<{ correct: boolean, message: string }>}
 */
export async function checkAnswer(guess) {
  const res = await fetch('/api/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: Failed to check answer`);
  }
  return await res.json();
}

/**
 * Persists player final score into SQLite database
 * @param {number} score
 * @returns {Promise<{ success: boolean, message?: string, scoreId?: number, username?: string, score?: number }>}
 */
export async function submitScore(score) {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score })
  });
  return await res.json();
}

/**
 * Queries top 5 high scores from SQLite database
 * @returns {Promise<{ success: boolean, leaderboard: Array<{ username: string, high_score: number }> }>}
 */
export async function fetchLeaderboard() {
  const res = await fetch('/api/leaderboard');
  return await res.json();
}
