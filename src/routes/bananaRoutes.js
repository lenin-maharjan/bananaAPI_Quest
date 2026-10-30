// ====================================================
// ROUTES: BANANA GAMEPLAY & INTEROPERABILITY
// THEME 2: INTEROPERABILITY ROUTING
// THEME 4: ACCESS CONTROL VIA SECURITY MIDDLEWARE & PERSISTENCE
// ====================================================

// Import Express framework to access the Router module
const express = require('express');

// Create a new router instance for banana game endpoints
const router = express.Router();

// Import the bananaController methods containing the game business logic
const bananaController = require('../controllers/bananaController');

// Import authentication security middleware to guard protected game routes
const requireAuth = require('../middleware/authMiddleware');

// Map GET /api/puzzle protected by requireAuth middleware
router.get('/puzzle', requireAuth, bananaController.getPuzzle);

// Map POST /api/check-answer protected by requireAuth middleware
router.post('/check-answer', requireAuth, bananaController.checkAnswer);

// Map POST /api/score to save score to SQLite database (protected)
router.post('/score', requireAuth, bananaController.saveScore);

// Map GET /api/leaderboard to fetch top players from SQLite (protected)
router.get('/leaderboard', requireAuth, bananaController.getLeaderboard);

// Export router to be mounted in the main Express application server
module.exports = router;
