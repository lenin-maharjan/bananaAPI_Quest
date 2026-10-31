// ====================================================
// CONTROLLER: BANANA GAME, SCORES & LEADERBOARD
// THEME 2: INTEROPERABILITY (EXTERNAL REST API CONSUMPTION)
// THEME 4: VIRTUAL IDENTITY & PERSISTENT LEADERBOARD
// ====================================================

// Import SQLite database instance for leaderboard persistence
const db = require('../models/db');

// Diverse offline fallback cache bank (12 unique puzzles covering solutions 0 through 9)
// Guarantees High Availability and zero downtime during network partitions (ENOTFOUND, ETIMEDOUT, ECONNREFUSED)
const FALLBACK_PUZZLES = [
  { question: 'https://www.sanfoh.com/uob/banana/data/tc9d31fc3a6ac1a87f124facb33n70.png', solution: 0 },
  { question: 'https://www.sanfoh.com/uob/banana/data/te7e5f16c26bea6df6f2379a7e7n31.png', solution: 1 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tf30437c602f833b676c95503e6n122.png', solution: 2 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tc286c4e2a0003e3659371d736bn93.png', solution: 3 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tda960504e718609d6c2f28d7c2n54.png', solution: 4 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tcd93e3a4465dd8e34ff3b8bd8dn55.png', solution: 5 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tcb5d449818fca2ea6ae35c286dn36.png', solution: 6 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tc9f54fe04b66596ceac48b59b8n107.png', solution: 7 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tc4a8b88ce3d891cdcaa98ce5e5n118.png', solution: 8 },
  { question: 'https://www.sanfoh.com/uob/banana/data/td6e00bc0e65772405c16bf5134n79.png', solution: 9 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tf0891d7e3b4ee609aaaf34c092n6.png', solution: 6 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tf5ee98cd2d0f07cf40ebb965d2n103.png', solution: 3 }
];

let fallbackIndex = 0;
function getNextFallbackPuzzle() {
  const puzzle = FALLBACK_PUZZLES[fallbackIndex % FALLBACK_PUZZLES.length];
  fallbackIndex++;
  return puzzle;
}

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
      const fallback = getNextFallbackPuzzle();
      req.session.solution = fallback.solution;
      const nextHint = FALLBACK_PUZZLES[fallbackIndex % FALLBACK_PUZZLES.length].question;
      return res.json({
        question: fallback.question,
        source: 'FALLBACK_CACHE',
        prefetched: false,
        nextQuestionHint: nextHint
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
    console.warn('⚠️ External API unavailable. Engaging fault-tolerant fallback cache bank:', error.message);

    // Bind fallback solution into user's session so game remains fully playable
    const fallback = getNextFallbackPuzzle();
    req.session.solution = fallback.solution;
    const nextHint = FALLBACK_PUZZLES[fallbackIndex % FALLBACK_PUZZLES.length].question;
    refillPuzzlePool();

    return res.json({
      question: fallback.question,
      source: 'FALLBACK_CACHE',
      prefetched: false,
      nextQuestionHint: nextHint
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
