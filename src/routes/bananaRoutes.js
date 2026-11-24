// ====================================================
// File: src/routes/bananaRoutes.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Game and interoperability route configuration and security protection designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - All route guards verified by the Author.
//
// External References & Documentation:
// - Express Router: https://expressjs.com/en/guide/routing.html
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
