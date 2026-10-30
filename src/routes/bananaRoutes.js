// ====================================================
// ROUTES: BANANA GAMEPLAY & INTEROPERABILITY
// THEME 2: INTEROPERABILITY ROUTING
// ====================================================

// Import Express framework to access the Router module
const express = require('express');

// Create a new router instance for banana game endpoints
const router = express.Router();

// Import the bananaController methods containing the game business logic
const bananaController = require('../controllers/bananaController');

// Map GET /api/puzzle to bananaController.getPuzzle
router.get('/puzzle', bananaController.getPuzzle);

// Map POST /api/check-answer to bananaController.checkAnswer
router.post('/check-answer', bananaController.checkAnswer);

// Export router to be mounted in the main Express application server
module.exports = router;
