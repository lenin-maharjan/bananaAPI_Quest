// ====================================================
// File: src/middleware/authMiddleware.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Authentication interceptor and security boundary designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - Security gate logic verified by the Author.
//
// External References & Documentation:
// - Express Middleware: https://expressjs.com/en/guide/using-middleware.html
// ====================================================

// Middleware function to intercept requests and verify active Virtual Identity session
const requireAuth = (req, res, next) => {
  // Check if session exists and contains an authenticated username
  if (req.session && req.session.username) {
    // Identity verified: allow request to proceed to next handler in pipeline
    return next();
  }

  // Identity absent: reject request with HTTP 401 Unauthorized
  return res.status(401).json({
    success: false,
    message: 'Unauthorized: Active Virtual Identity session required to perform this action'
  });
};

// Export middleware function for route protection
module.exports = requireAuth;
