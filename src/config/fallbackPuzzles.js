// ====================================================
// File: src/config/fallbackPuzzles.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Curated fallback cache bank and offline high availability strategy designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - All fallback image URLs and verified solutions reviewed by the Author.
//
// External References & Documentation:
// - Marc Conrad's Banana API Dataset: https://marcconrad.com/uob/banana/doc.php
// ====================================================

// Diverse offline fallback cache bank (12 unique puzzles covering solutions 0 through 9)
// Guarantees High Availability and zero downtime during network partitions (ENOTFOUND, ETIMEDOUT, ECONNREFUSED)
const FALLBACK_PUZZLE_BANK = [
  { question: 'https://www.sanfoh.com/uob/banana/data/tc9d31fc3a6ac1a87f124facb33n70.png', solution: 0 },
  { question: 'https://www.sanfoh.com/uob/banana/data/te7e5f16c26bea6df6f2379a7e7n31.png', solution: 1 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tf30437c602f833b676c95503e6n122.png', solution: 2 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tc286c4e2a0003e3659371d736bn93.png', solution: 3 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tda960504e718609d6c2f28d7c2n54.png', solution: 4 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tcd93e3a4465dd8e34ff3b8bd8dn55.png', solution: 5 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tcb5d449818fca2ea6ae35c286dn36.png', solution: 6 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tc9f54fe04b66596ceac48b59b8n107.png', solution: 7 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tc4a8b88ce3d891cdcaa98ce5e5n118.png', solution: 8 },
  { question: 'https://www.sanfoh.com/uob/banana/data/td6e00bc0e65772405c16bf5134n79.png', solution: 9 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tf0891d7e3b4ee609aaaf34c092n6.png', solution: 6 },
  { question: 'https://www.sanfoh.com/uob/banana/data/tf5ee98cd2d0f07cf40ebb965d2n103.png', solution: 3 }
];

module.exports = {
  FALLBACK_PUZZLE_BANK
};
