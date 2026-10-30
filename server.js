// ==========================================
// THEME 1: VERSION CONTROL & MODULAR ARCHITECTURE
// THEME 2: INTEROPERABILITY (EXTERNAL WEB API)
// THEME 4: VIRTUAL IDENTITY (SESSION COOKIES)
// ==========================================

// Import the Express framework to create our web server
const express = require('express');

// Import express-session to manage user virtual identity using cookies
const session = require('express-session');

// Create the main Express application instance
const app = express();

// Set the port number where our server will listen for requests
const PORT = 3000;

// Enable middleware to parse incoming JSON payloads in POST requests
app.use(express.json());

// Configure session middleware to establish Virtual Identity with cookies
app.use(session({
  // Secret key used to cryptographically sign the session ID cookie
  secret: 'banana-quest-secret-key-123',
  // Do not save session back to store if it was never modified
  resave: false,
  // Save new uninitialized sessions so we can track anonymous visitors
  saveUninitialized: true,
  // Configure cookie settings for the client browser
  cookie: {
    // Cookie expires after 10 minutes of inactivity (600,000 milliseconds)
    maxAge: 600000,
    // Prevents client-side scripts from stealing the cookie (XSS protection)
    httpOnly: true
  }
}));

// Serve all frontend files (HTML, CSS, JS) from the 'public' folder
app.use(express.static('public'));

// ----------------------------------------------------
// THEME 4: VIRTUAL IDENTITY (LOGIN ENDPOINT)
// ----------------------------------------------------
// POST endpoint to authenticate user and issue a virtual identity session
app.post('/api/login', (req, res) => {
  // Extract username and password sent from the frontend login form
  const { username, password } = req.body;

  // Verify against hardcoded credentials (demonstrating authentication logic)
  if (username === 'student' && password === 'banana123') {
    // Store authenticated username in server-side session tied to cookie ID
    req.session.username = username;
    // Return a success response confirming identity has been established
    return res.json({ success: true, message: 'Login successful!', username });
  }

  // Return an unauthorized status code if credentials do not match
  return res.status(401).json({ success: false, message: 'Invalid username or password' });
});

// ----------------------------------------------------
// THEME 4: VIRTUAL IDENTITY (CHECK CURRENT SESSION)
// ----------------------------------------------------
// GET endpoint to verify if the client has an active virtual identity
app.get('/api/session', (req, res) => {
  // Check if session contains an authenticated username
  if (req.session.username) {
    // Return authenticated state and username back to client
    return res.json({ loggedIn: true, username: req.session.username });
  }
  // Return logged-out state if no valid session cookie exists
  return res.json({ loggedIn: false });
});

// ----------------------------------------------------
// THEME 4: VIRTUAL IDENTITY (LOGOUT ENDPOINT)
// ----------------------------------------------------
// POST endpoint to destroy session and revoke virtual identity
app.post('/api/logout', (req, res) => {
  // Destroy session data stored on server
  req.session.destroy((err) => {
    // Clear session cookie from the browser
    res.clearCookie('connect.sid');
    // Send confirmation of logout to client
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// ----------------------------------------------------
// THEME 2: INTEROPERABILITY (EXTERNAL BANANA API)
// ----------------------------------------------------
// GET endpoint that communicates with Marc Conrad's 3rd-party Banana API
app.get('/api/puzzle', async (req, res) => {
  try {
    // Define the external third-party REST API URL
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';

    // Interoperate with external service by sending an HTTP GET request
    const response = await fetch(apiUrl);

    // Parse the received JSON response from the remote server
    const data = await response.json();

    // Store correct answer in server session so client cannot inspect or cheat
    req.session.solution = data.solution;

    // Send puzzle image URL to client without exposing the solution
    res.json({ question: data.question });
  } catch (error) {
    // Handle network or parsing errors during interoperability exchange
    res.status(500).json({ error: 'Failed to fetch puzzle from external API' });
  }
});

// ----------------------------------------------------
// GAME LOGIC: VERIFY USER ANSWER AGAINST SESSION
// ----------------------------------------------------
// POST endpoint to validate the player's guess against session solution
app.post('/api/check-answer', (req, res) => {
  // Extract player guess from request body
  const { guess } = req.body;

  // Retrieve correct solution previously saved in session
  const solution = req.session.solution;

  // Compare parsed integer guess against stored solution
  if (parseInt(guess, 10) === solution) {
    // Respond that answer is correct
    return res.json({ correct: true, message: 'Correct! Well done!' });
  }

  // Respond that answer is incorrect and reveal answer
  return res.json({ correct: false, message: `Incorrect! The correct answer was ${solution}` });
});

// Start listening on specified port and print startup message in console
app.listen(PORT, () => {
  // Log message showing server is running
  console.log(`Server is running at http://localhost:${PORT}`);
});
