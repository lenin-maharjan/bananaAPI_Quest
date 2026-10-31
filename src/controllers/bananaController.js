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

// Controller method to fetch puzzle from Marc Conrad's external API with fallback resilience
exports.getPuzzle = async (req, res) => {
  try {
    // Check if client requested a simulated outage for presentation demonstration
    if (req.query.simulateOutage === 'true') {
      throw new Error('Simulated external API outage for demonstration');
    }

    // External REST API endpoint URL provided by Marc Conrad
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';

    // Interoperate with external service with a 5000ms (5 second) network timeout guard
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });

    // Validate if HTTP response status indicates success (status code 200-299)
    if (!response.ok) {
      // Trigger error to divert execution into fallback catch block
      throw new Error(`External API returned non-200 HTTP status: ${response.status}`);
    }

    // Parse the received JSON response payload from the remote server
    const data = await response.json();

    // Store correct answer into server-side session to secure against client manipulation
    req.session.solution = data.solution;

    // Send puzzle image question URL and source provenance to client without exposing solution
    return res.json({
      question: data.question,
      source: 'LIVE_MARCCONRAD'
    });

  } catch (error) {
    // GRACEFUL DEGRADATION: Log external network failure to server console
    console.warn('⚠️ External API unavailable. Engaging fault-tolerant fallback cache:', error.message);

    // Bind fallback solution into user's session so game remains fully playable
    req.session.solution = FALLBACK_PUZZLE.solution;

    // Respond to frontend with identical contract structure and fallback source indicator
    return res.json({
      question: FALLBACK_PUZZLE.question,
      source: 'FALLBACK_CACHE'
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
