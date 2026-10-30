// ====================================================
// DATABASE MODEL: PERSISTENT SQLITE STORAGE
// THEME 4: VIRTUAL IDENTITY (CREDENTIAL PERSISTENCE)
// ====================================================

// Import path module to resolve cross-platform absolute filesystem paths
const path = require('path');

// Import sqlite3 with verbose debugging messages enabled
const sqlite3 = require('sqlite3').verbose();

// Construct absolute path to the local database file in project root
const dbPath = path.resolve(__dirname, '../database.sqlite');

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
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `;

  // Execute the SQL schema creation command
  db.run(createTableSql, (err) => {
    // Check if error occurred during table initialization
    if (err) {
      // Print table creation failure error to console
      console.error('Error creating users table:', err.message);
    } else {
      // Print confirmation that users table is ready
      console.log('Database schema verified: "users" table is ready');
    }
  });
});

// Export the initialized database instance for use across controllers
module.exports = db;
