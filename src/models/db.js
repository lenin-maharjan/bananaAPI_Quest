// ====================================================
// DATABASE MODEL: PERSISTENT SQLITE STORAGE
// THEME 4: VIRTUAL IDENTITY (CREDENTIAL PERSISTENCE)
// THEME 1: DATA PERSISTENCE & SCORES SCHEMA
// ====================================================

// Import path module to resolve cross-platform absolute filesystem paths
const path = require('path');

// Import sqlite3 with verbose debugging messages enabled
const sqlite3 = require('sqlite3').verbose();

// Construct absolute path to the database file in root directory (two levels up from src/models)
const dbPath = path.join(__dirname, '../../database.sqlite');

// Open or automatically create the SQLite database file
const db = new sqlite3.Database(dbPath, (err) => {
  // Check if an error occurred while connecting to the database
  if (err) {
    // Print database connection failure error to the console
    console.error('Database connection error:', err.message);
  } else {
    // Print success confirmation when connected to SQLite
    console.log('Connected to local SQLite database (database.sqlite)');
  }
});

// Serialize operations to ensure table initialization finishes before queries
db.serialize(() => {
  // Define SQL DDL statement to create the users table if it does not exist
  const createUsersTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `;

  // Execute the SQL schema creation command for users
  db.run(createUsersTableSql, (err) => {
    // Check if error occurred during table initialization
    if (err) {
      // Print table creation failure error to console
      console.error('Error creating users table:', err.message);
    } else {
      // Print confirmation that users table is ready
      console.log('Database schema verified: "users" table is ready');
    }
  });

  // Define SQL DDL statement to create the arcade scores leaderboard table
  const createScoresTableSql = `
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Execute the SQL schema creation command for scores
  db.run(createScoresTableSql, (err) => {
    // Check if error occurred during scores table creation
    if (err) {
      // Print error to console
      console.error('Error creating scores table:', err.message);
    } else {
      // Print confirmation that scores table is ready
      console.log('Database schema verified: "scores" table is ready');
    }
  });
});

// Export the initialized database instance for use across controllers
module.exports = db;
