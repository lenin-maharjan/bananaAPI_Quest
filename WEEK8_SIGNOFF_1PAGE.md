# 🍌 CIS046-3: Software for Enterprise (AY 26/27)
## Week 8 Formal Sign-Off Form — 1-Page Printable Submission Sheet

**Student Name:** [Your Name] &nbsp;&nbsp;|&nbsp;&nbsp; **Student Number:** [Your Student ID]  
**Student Signature:** ____________________________________ &nbsp;&nbsp;|&nbsp;&nbsp; **Date:** November 2026 (Week 8)  
**Project Title:** Banana Quest: 90s Retro Arcade Cabinet Edition &nbsp;&nbsp;|&nbsp;&nbsp; **Repository:** `https://github.com/lenin-maharjan/bananaAPI_Quest.git`  
**Tech Stack:** Node.js, Express, SQLite3, Bcrypt.js, Express-Session, Web Audio API, Vanilla HTML5/CSS3/JavaScript (ES6 Modules)

---

### 1. Version Control
**Question:** *How did you develop your code (e.g., what features have been added after first version)?*
- **Enterprise Git Flow & Feature Branching:** Developed across dedicated, isolated feature branches (`feature/architecture-refactor`, `feature/robust-identity-sqlite`, `feature/api-fallback-cache`, `feature/90s-arcade-cabinet`, `feature/settings-and-instant-prefetch`, `feature/fullstack-modular-refactor`), merging atomically into `main`.
- **Separation of Concerns (SoC) & Multi-Tier Architecture:** Refactored a monolithic prototype into a decoupled, enterprise full-stack architecture: a dedicated Backend Service Layer ([`puzzleService.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/services/puzzleService.js)) isolating business logic from thin HTTP controllers ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)), a declarative Config layer ([`fallbackPuzzles.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/config/fallbackPuzzles.js)), and a persistent Model layer ([`db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js)).
- **Frontend ES6 Modularization:** Eliminated client monoliths using standard native ES6 modules (`type="module"`), partitioning responsibilities into single-responsibility domains: [`audio.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/audio.js) (Web Audio synth), [`terminal.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/terminal.js) (diagnostics), [`api.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/api.js) (REST client), and [`ui.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/ui.js) (DOM mutation), orchestrated by a lean [`app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js).
- **Strict Repository Hygiene:** Enforced robust [`.gitignore`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/.gitignore) exclusions for `database.sqlite`, `node_modules/`, runtime logs, and cache artifacts, maintaining an uncluttered upstream codebase.

---

### 2. Event Driven Architectures
**Question:** *What in your code triggers events (e.g., GUI, buttons, timeout …)?*
- **Decoupled Pub/Sub Architecture (`window.dispatchEvent`):** Components interact asynchronously via a centralized `CustomEvent` bus (`auth-success`, `puzzle-loaded`, `guess-evaluated`, `streak-updated`, `score-saved`, `game-over`), eliminating tight coupling between UI presentation and business logic.
- **Non-Blocking Asynchronous Recovery:** Runtime faults and incorrect guesses trigger a non-blocking 3-second self-healing delay (`setTimeout(() => loadPuzzle(), 3000)`), pausing game timers and disabling inputs to prevent race conditions and input spamming while auto-advancing gameplay.
- **Dual-Stream Observer Pattern Diagnostics:** Real-time MS-DOS diagnostic console split into an Event Bus stream (`logToEventStream` -> `EVENT_BUS.EXE`) and an automated fault interceptor (`logToErrorStream` -> `ERROR_LOG.DAT`) logging network drops, wrong guesses, and timeouts with millisecond timestamps.
- **Hardware Interrupts & Procedural Web Audio Synth:** Captures physical keyboard interrupts (keypad 0–9 auto-submission, `F` outage toggle) and temporal intervals (`setInterval` 1s countdown with panic mode thresholding); procedurally synthesizes dynamic 8-bit sound waveforms via `AudioContext` and gain scaling.

---

### 3. Interoperability
**Question:** *Do you use the API https://marcconrad.com/uob/tomato/api.php? If no, where in your code do you demonstrate interoperability? What protocols do you use?*
- **External REST API Integration & Facade Proxy:** Interoperates with Marc Conrad's Banana microservice (`https://marcconrad.com/uob/banana/api.php?out=json`) via a secure backend reverse proxy ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)), consuming JSON over HTTPS/TLS (port 443) and shielding client browsers from CORS restrictions and DevTools credential/solution snooping.
- **Producer-Consumer Pre-Fetch Pool (< 5ms Latency):** In-memory buffer (`puzzlePool = []`, target size: 3) continuously replenished in the background via non-blocking worker threads. Shifting puzzles from server RAM provides instantaneous sub-5ms round transitions paired with preemptive client image pre-caching (`nextQuestionHint`).
- **Fault-Tolerant Auto-Failover & Graceful Degradation:** Upstream requests are bounded by a strict 2,500ms `AbortSignal.timeout` barrier. Upon socket drops, DNS failures (`ENOTFOUND`, `ETIMEDOUT`), or simulated outages (`?simulateOutage=true`), the system auto-degrades to an in-memory 12-puzzle offline bank ([`fallbackPuzzles.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/config/fallbackPuzzles.js)) using non-repeating round-robin rotation (`source: 'FALLBACK_CACHE'`), ensuring 100% High Availability and zero downtime.

---

### 4. Virtual Identity
**Question:** *How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)*
- **Cryptographic Hashing (Salted Bcrypt):** Plaintext credentials are never stored; [`authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js) enforces one-way cryptographic derivation using `bcryptjs` with 10 salt rounds (`bcrypt.hash`), verified via timing-attack-resistant comparisons (`bcrypt.compare`).
- **Stateful HTTP-Only Sessions:** Authenticated state is maintained via `express-session` with cryptographically signed HMAC cookie identifiers (`connect.sid`). Session cookies enforce `httpOnly: true` (mitigating Cross-Site Scripting / XSS session hijacking) with a 10-minute sliding window expiration.
- **Relational SQL Persistence & Parameterized Queries:** User identities (`users` table) and player scores (`scores` table) are permanently persisted in `database.sqlite` via [`db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js). All queries use parameterized placeholders (`?`), providing complete immunity against SQL injection vulnerabilities.
- **Access Control Barrier Middleware (`requireAuth`):** Enforces a deterministic security barrier ([`authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js)) intercepting unauthenticated API calls with HTTP 401 Unauthorized and binding game scores strictly to `req.session.username`.

---

### 5. Other Interesting Features & Post-Week 8 Ideas
**Question:** *Any other interesting features (plus ideas on how to continue development)?*
- **Cabinet Hardware DIP Switches Modal:** Motherboard configuration emulation (`#settings-modal`) adjusting game difficulty (Easy 60s, Normal 45s, Hard 20s), CRT scanlines, screen shake VFX, master volume gain, and live/offline API toggle, persisted in `localStorage`.
- **Arcade "Juice" Feedback Loops:** Screen shake, CRT damage/heal flashes, floating score delta popups, and combo streak multipliers (`x1`, `x2`, `x3`).
- **Strategic Evolution Roadmap:** (1) Horizontal scalability via Redis session clustering; (2) Real-time duplex WebSocket multiplayer (`Socket.io`); (3) Federated identity via OAuth2/OIDC (Google/GitHub SSO).
