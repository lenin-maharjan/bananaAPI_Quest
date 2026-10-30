// ====================================================
// SERVER ENTRY POINT: SCALABLE MODULAR MVC ARCHITECTURE
// THEME 1: MODULAR COMPONENT ORGANIZATION
// ====================================================

// Import the core Express framework
const express = require('express');

// Import express-session for Virtual Identity cookie handling
const session = require('express-session');

// Import modular authentication routes
const authRoutes = require('./routes/authRoutes');

// Import modular banana game and interoperability routes
const bananaRoutes = require('./routes/bananaRoutes');

// Create the main Express application instance
const app = express();

// Define server port
const PORT = 3000;

// Middleware: Parse incoming JSON request payloads
app.use(express.json());

// Middleware: Configure Virtual Identity session cookies
app.use(session({
  // Cryptographic secret key used to sign session cookies
  secret: 'banana-quest-secret-key-123',
  // Do not resave unmodified sessions
  resave: false,
  // Save uninitialized sessions
  saveUninitialized: true,
  // Configure browser cookie options
  cookie: {
    // Session expiration after 10 minutes of inactivity
    maxAge: 600000,
    // Protect against Cross-Site Scripting (XSS)
    httpOnly: true
  }
}));

// Middleware: Serve static frontend files from the 'public' directory
app.use(express.static('public'));

// Mount modular authentication routes under '/api' prefix
app.use('/api', authRoutes);

// Mount modular banana game routes under '/api' prefix
app.use('/api', bananaRoutes);

// Start the HTTP server on the configured port
app.listen(PORT, () => {
  // Output confirmation to console
  console.log(`Server is running at http://localhost:${PORT}`);
});
