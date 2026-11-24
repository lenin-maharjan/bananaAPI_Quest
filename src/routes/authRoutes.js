// ====================================================
// File: src/routes/authRoutes.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - REST endpoint routing and URL naming conventions designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - All route bindings verified by the Author.
//
// External References & Documentation:
// - Express Router: https://expressjs.com/en/guide/routing.html
// ====================================================

// Import Express framework to access the Router module
const express = require('express');

// Create a new router instance for auth endpoints
const router = express.Router();

// Import the authController methods containing the business logic
const authController = require('../controllers/authController');

// Map POST /api/register to authController.register
router.post('/register', authController.register);

// Map POST /api/login to authController.login
router.post('/login', authController.login);

// Map GET /api/session to authController.checkSession
router.get('/session', authController.checkSession);

// Map POST /api/logout to authController.logout
router.post('/logout', authController.logout);

// Export router to be mounted in the main Express application server
module.exports = router;
