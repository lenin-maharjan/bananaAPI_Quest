// ====================================================
// CONTROLLER: AUTHENTICATION & VIRTUAL IDENTITY
// THEME 4: VIRTUAL IDENTITY (CRYPTOGRAPHY & DATABASE)
// ====================================================

// Import bcryptjs library for secure one-way password hashing
const bcrypt = require('bcryptjs');

// Import SQLite database instance from our model layer
const db = require('../models/db');

// Cost factor for bcrypt key derivation (determines hashing complexity)
const SALT_ROUNDS = 10;

// Controller method to register a new user in the persistent database
exports.register = async (req, res) => {
  // Extract proposed username and plaintext password from request body
  const { username, password } = req.body;

  // Validate that both username and password fields were provided
  if (!username || !password) {
    // Return HTTP 400 Bad Request if fields are empty
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    // Generate salt and hash plaintext password asynchronously using bcrypt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // SQL query using parameterized placeholders (?) to prevent SQL injection attacks
    const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';

    // Execute INSERT query against SQLite database with bound parameters
    db.run(sql, [username, passwordHash], function (err) {
      // Check if error occurred during database insertion
      if (err) {
        // Check if error was caused by UNIQUE constraint violation (duplicate user)
        if (err.message.includes('UNIQUE')) {
          // Return HTTP 409 Conflict if username already exists in database
          return res.status(409).json({ success: false, message: 'Username is already taken' });
        }
        // Return HTTP 500 Internal Server Error for other database failures
        return res.status(500).json({ success: false, message: 'Database error during registration' });
      }

      // Return HTTP 201 Created on successful user registration
      return res.status(201).json({ success: true, message: 'Registration successful! You may now log in.' });
    });
  } catch (error) {
    // Handle unexpected cryptographic hashing errors
    return res.status(500).json({ success: false, message: 'Cryptographic hashing failed' });
  }
};

// Controller method to authenticate user and establish virtual identity session
exports.login = (req, res) => {
  // Extract submitted username and plaintext password from request body
  const { username, password } = req.body;

  // Validate that both fields are present
  if (!username || !password) {
    // Return HTTP 400 Bad Request if missing fields
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  // Parameterized SQL query to look up user record by username
  const sql = 'SELECT * FROM users WHERE username = ?';

  // Execute single-row SELECT query against SQLite database
  db.get(sql, [username], async (err, user) => {
    // Check for database read errors
    if (err) {
      // Return HTTP 500 if database query failed
      return res.status(500).json({ success: false, message: 'Database query error' });
    }

    // Check if user was not found in the database
    if (!user) {
      // Return HTTP 401 Unauthorized for unknown username
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Securely compare submitted plaintext password against stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    // Check if password verification failed
    if (!isPasswordValid) {
      // Return HTTP 401 Unauthorized for incorrect password
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Bind authenticated username to server-side session tied to cookie ID
    req.session.username = user.username;

    // Return success response confirming Virtual Identity is established
    return res.json({ success: true, message: 'Login successful!', username: user.username });
  });
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
