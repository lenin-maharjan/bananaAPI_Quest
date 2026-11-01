// ====================================================
// CONTROLLER: BANANA GAME, SCORES & LEADERBOARD
// THEME 2: INTEROPERABILITY (HTTP LAYER FOR PUZZLE SERVICE)
// THEME 4: VIRTUAL IDENTITY & PERSISTENT LEADERBOARD
// ====================================================

// Import SQLite database instance for leaderboard persistence
const db = require('../models/db');

// Import puzzle service encapsulating pre-fetch buffer, live API, and fallback bank
const puzzleService = require('../services/puzzleService');

/**
 * Controller method to fetch puzzle:
 * Delegates business logic to puzzleService and binds solution into player's session
 */
exports.getPuzzle = async (req, res) => {
  try {
    const simulateOutage = req.query.simulateOutage === 'true';
    const puzzle = await puzzleService.getOptimalPuzzle(simulateOutage);

    // Bind solution into user's server-side session for validation
    req.session.solution = puzzle.solution;

    // Return puzzle question asset, provenance source, and queue hints
    return res.json({
      question: puzzle.question,
      source: puzzle.source,
      prefetched: puzzle.prefetched,
      nextQuestionHint: puzzle.nextQuestionHint
    });
  } catch (error) {
    console.error('Controller error in getPuzzle:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve puzzle'
    });
  }
};

/**
 * Controller method to validate player's guess against session solution
 */
exports.checkAnswer = (req, res) => {
  // Extract player's submitted guess from request body
  const { guess } = req.body;

  // Retrieve correct solution previously saved in session
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
    return res.json({ correct: true, message: 'Correct! Well done!' });
  }

  return res.json({ correct: false, message: `Incorrect! The correct answer was ${solution}` });
};

/**
 * Controller method to save a game session score tied to the authenticated user
 */
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
    if (err) {
      console.error('Error saving score to database:', err.message);
      return res.status(500).json({ success: false, message: 'Database error saving score' });
    }

    return res.json({
      success: true,
      message: 'Score successfully recorded on leaderboard!',
      scoreId: this.lastID,
      username,
      score: numericScore
    });
  });
};

/**
 * Controller method to fetch top 5 high scores aggregated by player
 */
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
    if (err) {
      console.error('Error fetching leaderboard:', err.message);
      return res.status(500).json({ success: false, message: 'Database error fetching leaderboard' });
    }

    return res.json({ success: true, leaderboard: rows });
  });
};

// Re-export fallback puzzle bank for backward compatibility and test verification
exports.FALLBACK_PUZZLE_BANK = puzzleService.FALLBACK_PUZZLE_BANK;
