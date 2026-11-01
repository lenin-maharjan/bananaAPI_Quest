# 🍌 CIS046-3: Software for Enterprise (AY 26/27)
## Week 8 Formal Sign-Off Form — 1-Page Printable Submission Sheet

**Student Name:** [Your Name] &nbsp;&nbsp;|&nbsp;&nbsp; **Student Number:** [Your Student ID]  
**Student Signature:** ____________________________________ &nbsp;&nbsp;|&nbsp;&nbsp; **Date:** November 2026 (Week 8)  
**Project:** Banana Quest: 90s Retro Arcade Cabinet Edition &nbsp;&nbsp;|&nbsp;&nbsp; **Repository:** `https://github.com/lenin-maharjan/bananaAPI_Quest.git`  
**Tech Stack:** Node.js, Express, SQLite3, Bcrypt.js, Express-Session, Web Audio API, Vanilla HTML5/CSS3/JavaScript  

---

### 1. Version Control
**Question:** *How did you develop your code (e.g., what features have been added after first version)?*
- **Enterprise Git Flow & Feature Branching:** Developed iteratively across dedicated feature branches (`feature/architecture-refactor`, `feature/robust-identity-sqlite`, `feature/src-directory-refactor`, `feature/api-fallback-cache`, `feature/90s-arcade-cabinet`, `feature/arcade-juice-polish`, `feature/settings-and-instant-prefetch`, `feature/fullstack-modular-refactor`) merged via atomic commits into `main`.
- **Architectural Decoupling (MVC, Services & Config):** Transformed monoliths into a clean architecture: backend Service Layer ([`src/services/puzzleService.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/services/puzzleService.js)), Config layer ([`src/config/fallbackPuzzles.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/config/fallbackPuzzles.js)), thin controllers ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)), and frontend ES6 modules ([`audio.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/audio.js), [`terminal.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/terminal.js), [`api.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/api.js), [`ui.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/ui.js), [`app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js)).
- **Resilience & Fault Tolerance:** Evolved from simple remote fetch calls to an asynchronous Producer-Consumer puzzle buffer queue (`puzzlePool`), a 2.5s `AbortSignal` barrier, and an offline bank of 12 verified puzzles ([`FALLBACK_PUZZLE_BANK`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/config/fallbackPuzzles.js)).
- **Retro Arcade Experience & UX Overhaul:** Added authentic CRT scanlines, procedural Web Audio API 8-bit sound synthesis, 0–9 keypad, System DIP Switches modal (`localStorage`), dual-tab MS-DOS console (`[BUS]` / `[ERRORS]`), and a full-viewport spacing overhaul.
- **Strict Repository Hygiene:** Enforced thorough [`.gitignore`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/.gitignore) exclusions for `node_modules/`, local database files (`database.sqlite`), logs, and system cache artifacts.

---

### 2. Event Driven Architectures
**Question:** *What in your code triggers events (e.g., GUI, buttons, timeout …)?*
- **Decoupled Pub/Sub Bus (`window.dispatchEvent`):** In [`public/js/app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js), application components communicate purely via `CustomEvent` (`auth-success`, `game-start`, `puzzle-loaded`, `guess-evaluated`, `streak-updated`, `score-saved`, `game-over`) without tight DOM coupling.
- **Dual-Tab MS-DOS Observer Terminal:** Real-time event logger (`logToEventStream`) records payloads to `EVENT_BUS.EXE` ([`[BUS]`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/index.html)), while runtime faults and timeouts are intercepted by `logToErrorStream` to `ERROR_LOG.DAT` ([`[ERRORS]`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/index.html)).
- **Temporal & Interval Events:** A 1,000ms `setInterval` ticks game time (`timer-tick`) and triggers Panic Mode beeps when `timeLeft <= 10s`. Wrong guesses trigger a 3-second non-blocking recovery interval (`setTimeout(() => loadPuzzle(), 3000)`), while correct answers auto-advance in 1.5s.
- **GUI & Hardware Interrupts:** Tactile 0–9 arcade keypad clicks and physical keyboard listeners (`keydown` 0–9) auto-submit answers; hotkey **`F`** toggles live/simulated outage mode; DIP switch sliders and selects dispatch `settings-updated`.

---

### 3. Interoperability
**Question:** *Do you use the API https://marcconrad.com/uob/tomato/api.php? If no, where in your code do you demonstrate interoperability? What protocols do you use?*
- **Remote REST API Consumption:** Interoperates with **Marc Conrad's Banana API** (`https://marcconrad.com/uob/banana/api.php?out=json`) via a backend Express proxy in [`src/controllers/bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js) ([`getPuzzle`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)).
- **Standards & Protocols:** Secure HTTPS/TLS communication over port 443 using HTTP GET with standard JSON serialization (`?out=json`).
- **Server-Side Reverse Proxy & Anti-Cheat:** Server extracts and stores solutions securely in `req.session.solution`, forwarding only the question URL and provenance metadata (`source: 'LIVE_MARCCONRAD'`) to prevent browser DevTools answer inspection.
- **Producer-Consumer Pre-Fetch Pool (< 5ms Latency):** In-memory buffer (`puzzlePool = []`, target size: 3) continuously replenished in the background, serving instant puzzle rounds with preemptive browser image caching (`nextQuestionHint`).
- **12-Puzzle Offline Fallback Cache & Auto-Failover:** Guarded by `AbortSignal.timeout(2500)`. Any upstream network drop (`ENOTFOUND`, `ETIMEDOUT`, non-200 HTTP status) or manual simulation (`?simulateOutage=true`) seamlessly serves randomized puzzles from `FALLBACK_PUZZLE_BANK` (`source: 'FALLBACK_CACHE'`).

---

### 4. Virtual Identity
**Question:** *How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)*
- **Cryptographic Password Hashing (`bcryptjs`):** Plaintext credentials are never saved; [`src/controllers/authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js) enforces one-way hashing with 10 salt rounds (`bcrypt.hash`) and timing-safe verification (`bcrypt.compare`).
- **Relational SQL Persistence (SQLite):** User identities (`users` table) and player scores (`scores` table) are permanently persisted in `database.sqlite` managed by [`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js).
- **SQL Injection Defense (Parameterized Queries):** All authentication and game queries use parameterized placeholders (`?`) preventing SQL injection (e.g., `INSERT INTO users (username, password_hash) VALUES (?, ?)`).
- **Signed Stateful Cookies & Session Management:** Configured via `express-session` with cryptographic HMAC signatures (`connect.sid`), `httpOnly: true` (mitigating XSS session hijacking), and a 10-minute sliding window expiration.
- **Access Control Barrier Middleware (`requireAuth`):** [`src/middleware/authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js) halts unauthorized requests with HTTP 401 Unauthorized and securely binds game scores to `req.session.username`.

---

### 5. Other Interesting Features & Post-Week 8 Ideas
**Question:** *Any other interesting features (plus ideas on how to continue development)?*
- **Procedural Web Audio API 8-Bit Synthesizer:** Zero external audio files; procedurally synthesizes custom square, triangle, and sawtooth waves via `AudioContext` with master volume scaling and mute toggles.
- **System DIP Switches Settings Modal:** Retro arcade configuration panel (`#settings-modal`) controlling timer difficulty (Easy 60s, Normal 45s, Hard 20s), CRT scanlines, and camera shake VFX with `localStorage` persistence.
- **Arcade "Juice" & Combo Streak Multipliers:** Screen camera shake, red damage flash, green heal pulse, animated "+PTS" floating popups, and combo streak multipliers (`2X STREAK!`, `3X ON FIRE!`).
- **Hall of Fame Leaderboard:** SQL aggregate query (`SELECT username, MAX(score) AS high_score ... GROUP BY username ORDER BY high_score DESC LIMIT 5`) rendered in a retro arcade cabinet bezel.
- **Post-Week 8 Development Roadmap:**
  1. *Real-Time Multiplayer (WebSockets):* Implement head-to-head split-screen puzzle battles via `Socket.io`.
  2. *Federated Identity (OAuth2 / OpenID Connect):* Add Google/GitHub single sign-on alongside local SQLite accounts.
  3. *Cloud Scalability (Redis / Microservices):* Migrate session storage and puzzle pools to distributed Redis clusters for horizontal container scaling.
