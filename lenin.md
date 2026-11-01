# CIS046-3 Software for Enterprise – AY 26/27
## Week 8 Formal Sign-Off Sheet — First-Class Architecture Submission Form

**Student Name:** Lenin Maharjan &nbsp;&nbsp;|&nbsp;&nbsp; **Student Number:** 2425736 &nbsp;&nbsp;|&nbsp;&nbsp; **Date:** November 2026 (Week 8)  
**Student Signature:** ____________________________________ &nbsp;&nbsp;|&nbsp;&nbsp; **Project:** Banana Quest: 90s Retro Arcade Edition  
**Repository:** `https://github.com/lenin-maharjan/bananaAPI_Quest.git`  
**Tech Stack:** Node.js, Express, SQLite3, Bcrypt.js, Express-Session, Web Audio API, Vanilla HTML5/CSS3/JavaScript (ES6 Modules)

*Please answer the questions below, print this form and bring it to the presentation where it will be checked against reality and signed off by the tutor. Once signed off, scan this form and submit on BREO with all other deliverables (video, code). At this stage, Week 8, (at least) a working prototype should be presented plus some ideas on how to continue with the development.*

---

### 1. Version Control
**Question:** *How did you develop your code (e.g., what features have been added after first version)?*
- **Enterprise Git Flow & Feature Branching:** Developed systematically across isolated feature branches (`feature/architecture-refactor`, `feature/robust-identity-sqlite`, `feature/api-fallback-cache`, `feature/settings-and-instant-prefetch`, `feature/fullstack-modular-refactor`), merged atomically into `main` with conventional commits and zero working-tree pollution ([`.gitignore`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/.gitignore) excludes `database.sqlite`, `node_modules/`, and logs).
- **Multi-Tier Backend (MVC + Service Layer):** Decoupled server into specialized enterprise tiers: Service Layer ([`src/services/puzzleService.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/services/puzzleService.js)) managing background workers, pre-fetch queue, and failover; Config Layer ([`src/config/fallbackPuzzles.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/config/fallbackPuzzles.js)) storing 12 verified offline recovery puzzles; thin HTTP transport controllers ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js), [`authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js)); and SQLite relational models ([`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js)).
- **Frontend ES6 Modularization (Separation of Concerns):** Eliminated client monoliths using native ES6 modules (`<script type="module" src="/js/app.js"></script>`), partitioning responsibilities into single-purpose domains: [`audio.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/audio.js) (Web Audio synth), [`terminal.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/terminal.js) (dual-stream diagnostics), [`api.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/api.js) (REST client), [`ui.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/ui.js) (DOM/HUD mutations), and [`app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js) (orchestrator).

---

### 2. Event Driven Architectures
**Question:** *What in your code triggers events (e.g., GUI, buttons, timeout …)?*
- **Decoupled Pub/Sub Architecture (`window.dispatchEvent`):** Components interact asynchronously via an in-browser `CustomEvent` bus (`auth-success`, `puzzle-loaded`, `guess-evaluated`, `streak-updated`, `score-saved`, `game-over`, `sfx-toggled`, `settings-updated`), eliminating direct DOM and component coupling.
- **Non-Blocking Asynchronous Error Recovery:** Runtime faults and wrong guesses initiate a non-blocking 3-second self-healing delay (`setTimeout(() => loadPuzzle(), 3000)`), pausing game countdowns and disabling keypad/keyboard inputs to prevent race conditions and input spamming while auto-advancing rounds.
- **Dual-Stream Observer Pattern Diagnostics:** Real-time MS-DOS diagnostic console split into an Event Bus stream (`logToEventStream` -> `EVENT_BUS.EXE`) observing custom events, and an automated fault interceptor (`logToErrorStream` -> `ERROR_LOG.DAT`) capturing HTTP drops, countdown timeouts, and exceptions with millisecond timestamps (`HH:MM:SS.mmm`).
- **Hardware & Temporal Event Triggers:** Captures physical keyboard interrupts (keypad 0–9 auto-submit, `F` outage toggle), temporal intervals (`setInterval` 1s tick with `<10s` panic mode visual pulsing and warning ticks), and GUI DIP switches to dynamically trigger procedural sound synthesis.

---

### 3. Interoperability
**Question:** *Do you use the API https://marcconrad.com/uob/tomato/api.php? If no, where in your code do you demonstrate interoperability? What protocols do you use?*
- **External REST API Integration & Facade Reverse-Proxy:** Consumes Marc Conrad's Banana API microservice (`https://marcconrad.com/uob/banana/api.php?out=json`) via a secure backend Express proxy ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)) over HTTPS/TLS (port 443) using standard JSON serialization.
- **Anti-Cheat Architectural Barrier:** The server extracts `data.solution` and binds it exclusively to `req.session.solution`. Only the image URL and queue hints are exposed to the client, preventing browser DevTools inspection or cheat injections.
- **Producer-Consumer Pre-Fetch Pool (< 5ms Latency):** Server maintains an in-memory buffer queue (`puzzlePool = []`, target size: 3) continuously replenished in the background. Round requests are served from RAM in `< 5ms` (`prefetched: true`) and paired with client image pre-caching (`new Image().src = data.nextQuestionHint`).
- **Fault-Tolerant Auto-Failover & Live Health Indicator:** Upstream requests are guarded by an `AbortSignal.timeout(2500)` barrier. On socket drops, network drops, or simulated outages (`?simulateOutage=true` or `F` key), [`puzzleService.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/services/puzzleService.js) auto-fails over to a 12-puzzle offline cache (`source: 'FALLBACK_CACHE'`) and updates the HUD status pill (`[🟢 LIVE API]` vs `[🟠 OFFLINE CACHE]`).

---

### 4. Virtual Identity
**Question:** *How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)*
- **Cryptographic Key Derivation (Bcrypt):** User passwords never touch disk or memory in plaintext. [`authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js) enforces one-way cryptographic derivation using `bcryptjs` with 10 salt rounds (`bcrypt.hash`), and validates logins using timing-safe comparisons (`bcrypt.compare`).
- **Stateful HTTP-Only Session Management:** Virtual identities are tracked via `express-session` with cryptographically signed HMAC cookies (`connect.sid`). Cookies enforce `httpOnly: true` (mitigating XSS token theft) with a 10-minute sliding expiration window.
- **Relational Persistence & SQL Injection Defense:** User credentials and high scores are permanently stored in SQLite tables (`users`, `scores`) via [`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js). Every query strictly utilizes parameterized prepared statements (`?`), providing full immunity against SQL injection vulnerabilities.
- **Access Control Barrier Middleware (`requireAuth`):** [`src/middleware/authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js) halts unauthenticated requests with HTTP 401 Unauthorized across all game endpoints, binding player scores directly to the verified `req.session.username` preventing score spoofing.

---

### 5. Other Interesting Features & Post-Week 8 Ideas
**Question:** *Any other interesting features (plus ideas on how to continue development)?*
- **Procedural 8-Bit Synthesizer & Hardware DIP Switches:** Zero external audio files; [`audio.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/audio.js) procedurally synthesizes 7 authentic waveforms (square/triangle/sawtooth) with master volume gain scaling; `#settings-modal` emulates arcade motherboard DIP switches controlling difficulty, CRT scanlines, and VFX shake with `localStorage` persistence.
- **Arcade Juice & Persistent Hall of Fame:** Camera shake, CRT damage/heal flashes, floating `+PTS` popups, and combo streak multipliers (`x1`, `x2`, `x3 ON FIRE!`); SQL aggregate query (`MAX(score)`) powers the live marquee High Score tracker.
- **Strategic Evolution Roadmap:** (1) Horizontal container scalability via Redis session clustering; (2) Real-time duplex WebSocket multiplayer (`Socket.io`) for split-screen battles; (3) Federated identity via OAuth2/OIDC (Google/GitHub SSO).
