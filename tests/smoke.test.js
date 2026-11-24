// ====================================================
// File: tests/smoke.test.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Test architecture, test cases, and assertion matrix designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - All test logic, assertions, and route coverage verified by the Author.
//
// External References & Documentation:
// - Node.js Assert Module: https://nodejs.org/api/assert.html
// - Node.js HTTP Module: https://nodejs.org/api/http.html
// - Express Testing Best Practices: https://expressjs.com/en/advanced/best-practice-performance.html
// ====================================================

const assert = require('assert');
const app = require('../src/server');

/**
 * Self-contained Automated Smoke Test Suite for Banana Quest Arcade
 * Runs against an ephemeral port (port 0) to prevent port collisions.
 */
async function runSmokeTests() {
  console.log('\n======================================================');
  console.log('🍌 BANANA QUEST ARCADE: AUTOMATED SMOKE TEST SUITE');
  console.log('CIS046-3 Software for Enterprise AY 26/27');
  console.log('Author: Lenin Maharjan (Student ID: 2425736)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  // Spin up an ephemeral HTTP server on dynamic port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`> Test server listening on ephemeral port: ${port}\n`);

  function pass(desc) {
    passed++;
    console.log(`  ✔ PASS: ${desc}`);
  }

  function fail(desc, err) {
    failed++;
    console.error(`  ✖ FAIL: ${desc}`);
    console.error(`         ${err.message || err}`);
  }

  // Session cookie jar for stateful auth flow
  let sessionCookie = '';

  try {
    // ====================================================
    // SUITE 1: STATIC ES6 CLIENT MODULES & ASSETS
    // ====================================================
    console.log('--- Suite 1: Static ES6 Client Modules & HTML ---');

    const staticModules = [
      '/js/app.js',
      '/js/api.js',
      '/js/audio.js',
      '/js/ui.js',
      '/js/settings.js',
      '/js/gameState.js'
    ];

    for (const mod of staticModules) {
      try {
        const res = await fetch(`${baseUrl}${mod}`);
        assert.strictEqual(res.status, 200, `Expected HTTP 200 for ${mod}`);
        const ctype = res.headers.get('content-type') || '';
        assert(
          ctype.includes('javascript'),
          `Expected application/javascript content-type for ${mod}, got ${ctype}`
        );
        pass(`Static ES6 module ${mod} served with HTTP 200 and JavaScript MIME type`);
      } catch (err) {
        fail(`Static module ${mod}`, err);
      }
    }

    try {
      const indexRes = await fetch(`${baseUrl}/index.html`);
      assert.strictEqual(indexRes.status, 200, 'Expected HTTP 200 for /index.html');
      const htmlText = await indexRes.text();
      assert(htmlText.includes('BANANA QUEST'), 'Expected index.html to contain BANANA QUEST');
      pass('Static HTML /index.html served with HTTP 200');
    } catch (err) {
      fail('Static HTML /index.html', err);
    }

    // ====================================================
    // SUITE 2: AUTHENTICATION & ACCESS CONTROL GUARDS
    // ====================================================
    console.log('\n--- Suite 2: Authentication & Virtual Identity Security Guards ---');

    // 2.1 Unauthenticated access to protected routes must return HTTP 401
    try {
      const guardPuzzleRes = await fetch(`${baseUrl}/api/puzzle`);
      assert.strictEqual(guardPuzzleRes.status, 401, 'Unauthenticated /api/puzzle must return 401');
      pass('Unauthenticated guard blocks /api/puzzle with HTTP 401 Unauthorized');
    } catch (err) {
      fail('Unauthenticated guard /api/puzzle', err);
    }

    try {
      const guardScoreRes = await fetch(`${baseUrl}/api/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: 100 })
      });
      assert.strictEqual(guardScoreRes.status, 401, 'Unauthenticated /api/score must return 401');
      pass('Unauthenticated guard blocks /api/score with HTTP 401 Unauthorized');
    } catch (err) {
      fail('Unauthenticated guard /api/score', err);
    }

    // 2.2 Empty registration validation must return HTTP 400
    try {
      const emptyRegRes = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: '', password: '' })
      });
      assert.strictEqual(emptyRegRes.status, 400, 'Empty registration must return 400');
      pass('Registration rejects empty credentials with HTTP 400 Bad Request');
    } catch (err) {
      fail('Registration empty input validation', err);
    }

    // 2.3 Valid registration must return HTTP 201
    const testUsername = `agent_smoke_${Date.now()}`;
    const testPassword = 'SmokePassword#2026';

    try {
      const regRes = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.strictEqual(regRes.status, 201, 'Valid registration must return 201');
      const regData = await regRes.json();
      assert.strictEqual(regData.success, true, 'Registration payload success flag');
      pass(`Valid user registration returns HTTP 201 Created for "${testUsername}"`);
    } catch (err) {
      fail('Valid registration', err);
    }

    // 2.4 Duplicate registration must return HTTP 409
    try {
      const dupRes = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.strictEqual(dupRes.status, 409, 'Duplicate username must return 409');
      pass('Registration prevents duplicate identity with HTTP 409 Conflict');
    } catch (err) {
      fail('Duplicate username rejection', err);
    }

    // 2.5 Invalid login must return HTTP 401
    try {
      const badLoginRes = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: 'WrongPasswordXYZ' })
      });
      assert.strictEqual(badLoginRes.status, 401, 'Invalid password must return 401');
      pass('Login rejects invalid password with HTTP 401 Unauthorized');
    } catch (err) {
      fail('Login invalid credentials rejection', err);
    }

    // 2.6 Valid login must return HTTP 200 and establish session cookie
    try {
      const loginRes = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: testUsername, password: testPassword })
      });
      assert.strictEqual(loginRes.status, 200, 'Valid login must return 200');
      const loginData = await loginRes.json();
      assert.strictEqual(loginData.success, true);
      assert.strictEqual(loginData.username, testUsername);

      // Extract connect.sid session cookie from response headers
      const rawCookie = loginRes.headers.get('set-cookie') || '';
      assert(rawCookie.includes('connect.sid'), 'Login must issue connect.sid session cookie');
      sessionCookie = rawCookie.split(';')[0];
      pass(`Login establishes Virtual Identity with HTTP 200 and signed session cookie`);
    } catch (err) {
      fail('Login authentication and session cookie establishment', err);
    }

    // 2.7 Verify active session via /api/session
    try {
      const sessionRes = await fetch(`${baseUrl}/api/session`, {
        headers: { Cookie: sessionCookie }
      });
      assert.strictEqual(sessionRes.status, 200);
      const sessionData = await sessionRes.json();
      assert.strictEqual(sessionData.loggedIn, true);
      assert.strictEqual(sessionData.username, testUsername);
      pass(`Active Virtual Identity verified via /api/session (user: ${sessionData.username})`);
    } catch (err) {
      fail('Session verification', err);
    }

    // ====================================================
    // SUITE 3: INTEROPERABILITY & RESILIENT CACHING
    // ====================================================
    console.log('\n--- Suite 3: Interoperability Routes & Fallback Cache ---');

    // 3.1 Simulated outage fallback cache
    try {
      const fallbackRes = await fetch(`${baseUrl}/api/puzzle?simulateOutage=true`, {
        headers: { Cookie: sessionCookie }
      });
      assert.strictEqual(fallbackRes.status, 200);
      const fallbackData = await fallbackRes.json();
      assert.strictEqual(fallbackData.success, true);
      assert.strictEqual(fallbackData.source, 'FALLBACK_CACHE');
      assert(
        typeof fallbackData.question === 'string' && fallbackData.question.length > 0,
        'Fallback puzzle must provide a valid question data URI'
      );
      pass('Interoperability fallback cache serves offline puzzle with HTTP 200 (?simulateOutage=true)');
    } catch (err) {
      fail('Simulated outage fallback cache', err);
    }

    // 3.2 Live or buffered puzzle fetch
    try {
      const puzzleRes = await fetch(`${baseUrl}/api/puzzle`, {
        headers: { Cookie: sessionCookie }
      });
      assert.strictEqual(puzzleRes.status, 200);
      const puzzleData = await puzzleRes.json();
      assert.strictEqual(puzzleData.success, true);
      assert(puzzleData.question, 'Puzzle must contain a question URL/URI');
      pass(`Interoperability puzzle endpoint returns HTTP 200 (source: ${puzzleData.source})`);
    } catch (err) {
      fail('Live puzzle fetch', err);
    }

    // ====================================================
    // SUITE 4: SCORE PERSISTENCE & LEADERBOARD
    // ====================================================
    console.log('\n--- Suite 4: SQLite Score Persistence & Leaderboard ---');

    try {
      const scoreRes = await fetch(`${baseUrl}/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ score: 99999 })
      });
      assert.strictEqual(scoreRes.status, 200);
      const scoreData = await scoreRes.json();
      assert.strictEqual(scoreData.success, true);
      assert.strictEqual(scoreData.username, testUsername);
      assert(scoreData.scoreId, 'Expected persistent scoreId from SQLite database');
      pass(`Player score (99999 PTS) saved into SQLite database with HTTP 200 (scoreId: ${scoreData.scoreId})`);
    } catch (err) {
      fail('Score persistence', err);
    }

    try {
      const leaderRes = await fetch(`${baseUrl}/api/leaderboard`, {
        headers: { Cookie: sessionCookie }
      });
      assert.strictEqual(leaderRes.status, 200);
      const leaderData = await leaderRes.json();
      assert.strictEqual(leaderData.success, true);
      assert(Array.isArray(leaderData.leaderboard), 'Leaderboard must return an array');
      const found = leaderData.leaderboard.find((entry) => entry.username === testUsername);
      assert(found, `Expected new score record for ${testUsername} to appear in leaderboard`);
      pass(`Leaderboard returns HTTP 200 with verified top scores including agent record`);
    } catch (err) {
      fail('Leaderboard retrieval', err);
    }

    // ====================================================
    // SUITE 5: LOGOUT & SESSION TERMINATION
    // ====================================================
    console.log('\n--- Suite 5: Logout & Virtual Identity Teardown ---');

    try {
      const logoutRes = await fetch(`${baseUrl}/api/logout`, {
        method: 'POST',
        headers: { Cookie: sessionCookie }
      });
      assert.strictEqual(logoutRes.status, 200);
      const logoutData = await logoutRes.json();
      assert.strictEqual(logoutData.success, true);
      pass('Logout terminates Virtual Identity session with HTTP 200');
    } catch (err) {
      fail('Logout procedure', err);
    }

    try {
      const postLogoutRes = await fetch(`${baseUrl}/api/session`, {
        headers: { Cookie: sessionCookie }
      });
      assert.strictEqual(postLogoutRes.status, 200);
      const postLogoutData = await postLogoutRes.json();
      assert.strictEqual(postLogoutData.loggedIn, false);
      pass('Post-logout /api/session confirms loggedIn: false');
    } catch (err) {
      fail('Post-logout session state', err);
    }

  } finally {
    // Gracefully terminate the ephemeral test server
    await new Promise((resolve) => server.close(resolve));
    console.log('\n> Ephemeral test server closed cleanly.');
  }

  // Print Summary
  console.log('\n======================================================');
  console.log(`SMOKE TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Execute tests if invoked directly or via npm test
if (require.main === module) {
  runSmokeTests().catch((err) => {
    console.error('Unhandled fatal error in smoke test runner:', err);
    process.exit(1);
  });
}

module.exports = runSmokeTests;
