// ====================================================
// CONTROLLER: BANANA GAME, SCORES & LEADERBOARD
// THEME 2: INTEROPERABILITY (EXTERNAL REST API CONSUMPTION)
// THEME 4: VIRTUAL IDENTITY & PERSISTENT LEADERBOARD
// ====================================================

// Import SQLite database instance for leaderboard persistence
const db = require('../models/db');

// Hardcoded fallback puzzle cache to ensure High Availability when remote API is down
const FALLBACK_PUZZLE = {
  // Pre-cached puzzle question image URL guaranteed to render in browser
  question: 'https://www.sanfoh.com/uob/banana/data/t58beac222e7adb19012264c235n78.png',
  // Solution value associated with the pre-cached fallback puzzle
  solution: 5
};

// ====================================================
// PRODUCER-CONSUMER PRE-FETCH QUEUE (INSTANT PUZZLES)
// ====================================================
const TARGET_POOL_SIZE = 3;
const puzzlePool = [];
let isRefilling = false;

// Asynchronous background worker to maintain a buffer of pre-fetched puzzles
async function refillPuzzlePool() {
  if (isRefilling || puzzlePool.length >= TARGET_POOL_SIZE) {
    return;
  }
  isRefilling = true;

  while (puzzlePool.length < TARGET_POOL_SIZE) {
    try {
      const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) break;
      const data = await response.json();
      if (data && data.question && data.solution !== undefined) {
        puzzlePool.push({ question: data.question, solution: data.solution });
      }
    } catch (err) {
      // If external network fails or times out, stop gracefully without crashing
      break;
    }
  }

  isRefilling = false;
}

// Initial background fill on controller initialization
refillPuzzlePool();

// Controller method to fetch puzzle with pre-fetch queue & fallback resilience
exports.getPuzzle = async (req, res) => {
  try {
    // 1. Simulated Outage Demonstration
    if (req.query.simulateOutage === 'true') {
      req.session.solution = FALLBACK_PUZZLE.solution;
      return res.json({
        question: FALLBACK_PUZZLE.question,
        source: 'FALLBACK_CACHE',
        prefetched: false,
        nextQuestionHint: null
      });
    }

    // 2. Instant Pre-Fetch Pool Consumption (< 5ms response time)
    if (puzzlePool.length > 0) {
      const puzzle = puzzlePool.shift();
      req.session.solution = puzzle.solution;

      // Asynchronously refill the pool in background (non-blocking)
      refillPuzzlePool();

      return res.json({
        question: puzzle.question,
        source: 'LIVE_MARCCONRAD',
        prefetched: true,
        nextQuestionHint: puzzlePool[0]?.question || null
      });
    }

    // 3. Pool Empty: Fetch Live with 2500ms Timeout
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(2500) });

    if (!response.ok) {
      throw new Error(`External API returned non-200 HTTP status: ${response.status}`);
    }

    const data = await response.json();
    req.session.solution = data.solution;

    // Trigger background refill for subsequent rounds
    refillPuzzlePool();

    return res.json({
      question: data.question,
      source: 'LIVE_MARCCONRAD',
      prefetched: false,
      nextQuestionHint: puzzlePool[0]?.question || null
    });

  } catch (error) {
    // GRACEFUL DEGRADATION: Log external network failure to server console
    console.warn('⚠️ External API unavailable. Engaging fault-tolerant fallback cache:', error.message);

    // Bind fallback solution into user's session so game remains fully playable
    req.session.solution = FALLBACK_PUZZLE.solution;
    refillPuzzlePool();

    return res.json({
      question: FALLBACK_PUZZLE.question,
      source: 'FALLBACK_CACHE',
      prefetched: false,
      nextQuestionHint: null
    });
  }
};

// Controller method to validate player's guess against session solution
exports.checkAnswer = (req, res) => {
  // Extract player's submitted guess from request body
  const { guess } = req.body;

  // Retrieve correct solution previously saved in session (whether live API or fallback)
  const solution = req.session.solution;

  // Edge-case guard: Verify that an active puzzle solution exists in the user's session
  if (solution === undefined) {
    return res.status(400).json({
      success: false,
      message: 'No active puzzle. Please fetch a puzzle before submitting an answer.'
    });
  }

  // Compare parsed integer guess against stored solution
  if (parseInt(guess, 10) === solution) {
    // Respond that answer is correct
    return res.json({ correct: true, message: 'Correct! Well done!' });
  }

  // Respond that answer is incorrect and reveal answer
  return res.json({ correct: false, message: `Incorrect! The correct answer was ${solution}` });
};

// Controller method to save a game session score tied to the authenticated user
exports.saveScore = (req, res) => {
  // Extract score from request payload
  const { score } = req.body;

  // Retrieve authenticated username directly from server-side session cookie (Virtual Identity)
  const username = req.session.username;

  // Parse numeric score safely and prevent negative values
  const numericScore = Math.max(0, parseInt(score, 10) || 0);

  // Parameterized SQL INSERT statement to prevent SQL injection
  const sql = 'INSERT INTO scores (username, score) VALUES (?, ?)';

  // Insert score record into SQLite database
  db.run(sql, [username, numericScore], function (err) {
    // Check for database errors
    if (err) {
      console.error('Error saving score to database:', err.message);
      return res.status(500).json({ success: false, message: 'Database error saving score' });
    }

    // Return success response with newly created record ID
    return res.json({
      success: true,
      message: 'Score successfully recorded on leaderboard!',
      scoreId: this.lastID,
      username,
      score: numericScore
    });
  });
};

// Controller method to fetch top 5 high scores aggregated by player
exports.getLeaderboard = (req, res) => {
  // Parameterized aggregate SQL query retrieving top 5 highest scores per player
  const sql = `
    SELECT username, MAX(score) AS high_score 
    FROM scores 
    GROUP BY username 
    ORDER BY high_score DESC 
    LIMIT 5
  `;

  // Query SQLite database for top leaderboard records
  db.all(sql, [], (err, rows) => {
    // Check for query errors
    if (err) {
      console.error('Error fetching leaderboard:', err.message);
      return res.status(500).json({ success: false, message: 'Database error fetching leaderboard' });
    }

    // Return array of top players and their best scores
    return res.json({ success: true, leaderboard: rows });
  });
};
