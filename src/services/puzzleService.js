// ====================================================
// SERVICE: PUZZLE BUFFER, INTEROPERABILITY & FAILOVER
// THEME 2: INTEROPERABILITY (EXTERNAL API RESILIENCE)
// ====================================================

const { FALLBACK_PUZZLE_BANK } = require('../config/fallbackPuzzles');

// ====================================================
// PRODUCER-CONSUMER PRE-FETCH QUEUE (INSTANT PUZZLES)
// ====================================================
const TARGET_POOL_SIZE = 3;
const puzzlePool = [];
let isRefilling = false;

// Asynchronous background worker to maintain a buffer of pre-fetched puzzles
async function refillPuzzlePool() {
  if (isRefilling || puzzlePool.length >= TARGET_POOL_SIZE) {
    return;
  }
  isRefilling = true;

  while (puzzlePool.length < TARGET_POOL_SIZE) {
    try {
      const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';
      const response = await fetch(apiUrl, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) break;
      const data = await response.json();
      if (data && data.question && data.solution !== undefined) {
        puzzlePool.push({ question: data.question, solution: data.solution });
      }
    } catch (err) {
      // If external network fails or times out, stop gracefully without crashing
      break;
    }
  }

  isRefilling = false;
}

// Initial background fill on service initialization
refillPuzzlePool();

// Rotate through fallback bank avoiding consecutive duplicate puzzles
let lastFallbackIndex = -1;
function getRandomFallbackPuzzle() {
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * FALLBACK_PUZZLE_BANK.length);
  } while (FALLBACK_PUZZLE_BANK.length > 1 && nextIndex === lastFallbackIndex);
  lastFallbackIndex = nextIndex;
  return FALLBACK_PUZZLE_BANK[nextIndex];
}

/**
 * Retrieves the optimal puzzle for gameplay:
 * - Checks for simulated outage requests
 * - Consumes from instant pre-fetch buffer if available
 * - Falls back to live fetch with 2500ms timeout
 * - Automatically degrades gracefully to the offline bank upon failure
 * 
 * @param {boolean} simulateOutage
 * @returns {Promise<{ question: string, solution: number, source: string, prefetched: boolean, nextQuestionHint: string|null }>}
 */
async function getOptimalPuzzle(simulateOutage = false) {
  // 1. Simulated Outage Demonstration
  if (simulateOutage === true || simulateOutage === 'true') {
    const fallback = getRandomFallbackPuzzle();
    const nextHint = FALLBACK_PUZZLE_BANK[(lastFallbackIndex + 1) % FALLBACK_PUZZLE_BANK.length].question;
    return {
      question: fallback.question,
      solution: fallback.solution,
      source: 'FALLBACK_CACHE',
      prefetched: false,
      nextQuestionHint: nextHint
    };
  }

  // 2. Instant Pre-Fetch Pool Consumption (< 5ms response time)
  if (puzzlePool.length > 0) {
    const puzzle = puzzlePool.shift();

    // Asynchronously refill the pool in background (non-blocking)
    refillPuzzlePool();

    return {
      question: puzzle.question,
      solution: puzzle.solution,
      source: 'LIVE_MARCCONRAD',
      prefetched: true,
      nextQuestionHint: puzzlePool[0]?.question || null
    };
  }

  // 3. Pool Empty: Fetch Live with 2500ms Timeout
  try {
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(2500) });

    if (!response.ok) {
      throw new Error(`External API returned non-200 HTTP status: ${response.status}`);
    }

    const data = await response.json();

    // Trigger background refill for subsequent rounds
    refillPuzzlePool();

    return {
      question: data.question,
      solution: data.solution,
      source: 'LIVE_MARCCONRAD',
      prefetched: false,
      nextQuestionHint: puzzlePool[0]?.question || null
    };
  } catch (error) {
    // GRACEFUL DEGRADATION: Log external network failure to server console
    console.warn('⚠️ Live API unreachable. Automatically engaging 10+ puzzle fallback bank...', error.message || error);

    const fallback = getRandomFallbackPuzzle();
    const nextHint = FALLBACK_PUZZLE_BANK[(lastFallbackIndex + 1) % FALLBACK_PUZZLE_BANK.length].question;
    refillPuzzlePool();

    return {
      question: fallback.question,
      solution: fallback.solution,
      source: 'FALLBACK_CACHE',
      prefetched: false,
      nextQuestionHint: nextHint
    };
  }
}

module.exports = {
  getOptimalPuzzle,
  getRandomFallbackPuzzle,
  refillPuzzlePool,
  puzzlePool,
  FALLBACK_PUZZLE_BANK
};
