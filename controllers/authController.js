// ====================================================
// CONTROLLER: AUTHENTICATION & VIRTUAL IDENTITY
// THEME 4: VIRTUAL IDENTITY (PASSWORDS & COOKIES)
// ====================================================

// Controller method to authenticate user and establish virtual identity session
exports.login = (req, res) => {
  // Extract username and password sent in request payload
  const { username, password } = req.body;

  // Verify credentials against hardcoded user store
  if (username === 'student' && password === 'banana123') {
    // Store authenticated identity username into server-side session
    req.session.username = username;
    // Return success response to client confirming identity established
    return res.json({ success: true, message: 'Login successful!', username });
  }

  // Return HTTP 401 Unauthorized if credentials fail verification
  return res.status(401).json({ success: false, message: 'Invalid username or password' });
};

// Controller method to inspect current virtual identity session status
exports.checkSession = (req, res) => {
  // Check if session contains an authenticated username
  if (req.session.username) {
    // Return active logged-in state and current username
    return res.json({ loggedIn: true, username: req.session.username });
  }
  // Return logged-out state if no valid session cookie exists
  return res.json({ loggedIn: false });
};

// Controller method to destroy session and revoke virtual identity
exports.logout = (req, res) => {
  // Destroy session data in server-side session store
  req.session.destroy((err) => {
    // Clear session cookie from client browser
    res.clearCookie('connect.sid');
    // Return confirmation of session termination
    res.json({ success: true, message: 'Logged out successfully' });
  });
};
