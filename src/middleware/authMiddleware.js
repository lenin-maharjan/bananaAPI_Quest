// ====================================================
// SECURITY MIDDLEWARE: AUTHENTICATION ENFORCEMENT
// THEME 4: VIRTUAL IDENTITY & ACCESS CONTROL
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
