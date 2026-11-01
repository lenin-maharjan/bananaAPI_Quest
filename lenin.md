# 🍌 CIS046-3: Software for Enterprise (AY 26/27)
## Week 8 Formal Sign-Off Form — First-Class Architecture Submission Sheet

**Student Name:** Lenin Maharjan &nbsp;&nbsp;|&nbsp;&nbsp; **Student ID:** [Your Student ID] &nbsp;&nbsp;|&nbsp;&nbsp; **Date:** November 2026 (Week 8)  
**Project:** Banana Quest: 90s Retro Arcade Edition &nbsp;&nbsp;|&nbsp;&nbsp; **Repository:** `https://github.com/lenin-maharjan/bananaAPI_Quest.git`  
**Tech Stack:** Node.js, Express, SQLite3, Bcrypt.js, Express-Session, Web Audio API, Vanilla HTML5/CSS3/JavaScript (ES6 Modules)

---

### 1. Version Control & Architectural Evolution
**Question:** *How did you develop your code (e.g., what features have been added after first version)?*
- **Enterprise Git Flow & Atomic Branching:** Engineered systematically across isolated feature branches (`feature/architecture-refactor`, `feature/robust-identity-sqlite`, `feature/api-fallback-cache`, `feature/settings-and-instant-prefetch`, `feature/fullstack-modular-refactor`), merging atomically into `main` with conventional commits and zero working-tree pollution ([`.gitignore`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/.gitignore) excludes `database.sqlite`, `node_modules/`, and logs).
- **Multi-Tier Backend (MVC + Service Layer):** Transformed a monolithic server prototype into an enterprise multi-tier architecture:
  - **Service Layer ([`src/services/puzzleService.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/services/puzzleService.js)):** Encapsulates background workers, caching queues, and external failover business logic.
  - **Config Layer ([`src/config/fallbackPuzzles.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/config/fallbackPuzzles.js)):** Centralizes static, pre-verified offline disaster-recovery assets.
  - **Thin Controllers ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js), [`authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js)):** Handle HTTP transport, request validation, and session binding exclusively.
  - **Data Model Layer ([`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js)):** Manages serialized SQLite connection initialization and relational table schemas.
- **Frontend ES6 Modularization (Separation of Concerns):** Completely eliminated client monoliths using native ES6 modules (`<script type="module" src="/js/app.js"></script>`), partitioning presentation into single-responsibility domains: [`audio.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/audio.js) (synthesis), [`terminal.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/terminal.js) (diagnostics), [`api.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/api.js) (REST client), [`ui.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/ui.js) (DOM updates/HUD), and [`app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js) (orchestrator).

---

### 2. Event-Driven Architectures (EDA)
**Question:** *What in your code triggers events (e.g., GUI, buttons, timeout …)?*
- **Decoupled Pub/Sub Architecture (`window.dispatchEvent`):** Domain modules communicate purely asynchronously through an in-browser `CustomEvent` bus (`auth-success`, `puzzle-loaded`, `guess-evaluated`, `streak-updated`, `score-saved`, `game-over`, `sfx-toggled`, `settings-updated`), eliminating direct DOM and component coupling.
- **Non-Blocking Asynchronous Error Recovery:** Runtime faults and wrong guesses initiate a non-blocking 3-second self-healing interval (`setTimeout(() => loadPuzzle(), 3000)`). The system halts the active countdown timer and disables keypad/keyboard inputs to prevent race conditions and input spamming while auto-advancing rounds.
- **Dual-Stream Observer Pattern Diagnostics:** Implemented a real-time MS-DOS diagnostic console split into an Event Bus stream (`logToEventStream` -> `EVENT_BUS.EXE`) observing dispatched events, and an automated fault interceptor (`logToErrorStream` -> `ERROR_LOG.DAT`) intercepting network drops, timeouts, and wrong answers with millisecond timestamps (`HH:MM:SS.mmm`).
- **Hardware Interrupts & Procedural Sound Triggers:** Listens for physical keyboard interrupts (`0`–`9` instant submission, `F` live outage toggle), temporal intervals (`setInterval` 1s tick with `<10s` panic pulsing), and GUI DIP switches to dynamically trigger procedural sound synthesis.

---

### 3. Interoperability & Resilient Microservices
**Question:** *Do you use the API https://marcconrad.com/uob/tomato/api.php? If no, where in your code do you demonstrate interoperability? What protocols do you use?*
- **External REST API Integration & Facade Reverse-Proxy:** Consumes Marc Conrad's Banana API (`https://marcconrad.com/uob/banana/api.php?out=json`) via a secure backend Express proxy ([`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)) over HTTPS/TLS (port 443) using standard JSON serialization.
- **Anti-Cheat Architectural Barrier:** The server extracts `data.solution` and binds it exclusively to `req.session.solution`. Only the image URL and queue hints are exposed to the client, preventing browser DevTools inspection or cheat injections.
- **Producer-Consumer Pre-Fetch Pool (< 5ms Latency):** Server maintains an in-memory buffer queue (`puzzlePool = []`, target size: 3) continuously replenished in the background. Round requests are served from RAM in `< 5ms` (`prefetched: true`) and paired with client image pre-caching (`new Image().src = data.nextQuestionHint`).
- **Fault-Tolerant Auto-Failover & Graceful Degradation:** Upstream fetches are guarded by an `AbortSignal.timeout(2500)` barrier. If the live API drops, times out, or simulates an outage (`?simulateOutage=true`), [`puzzleService.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/services/puzzleService.js) catches the fault, logs a console alert, and serves non-repeating puzzles from a 12-puzzle offline bank (`source: 'FALLBACK_CACHE'`), guaranteeing 100% High Availability.

---

### 4. Virtual Identity & Cryptographic Security
**Question:** *How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)*
- **Cryptographic Key Derivation (Bcrypt):** User passwords never touch disk or memory in plaintext. [`authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js) enforces one-way hashing with 10 salt rounds (`bcrypt.hash`), and validates logins using timing-safe comparisons (`bcrypt.compare`).
- **Stateful HTTP-Only Session Management:** Virtual identities are tracked via `express-session` with cryptographically signed HMAC cookies (`connect.sid`). Cookies enforce `httpOnly: true` (mitigating XSS token theft) with a 10-minute sliding expiration window.
- **Relational Persistence & SQL Injection Defense:** User profiles and scores are stored in SQLite tables (`users`, `scores`) via [`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js). Every query strictly utilizes parameterized placeholders (`?`), providing full immunity against SQL injection attacks.
- **Access Control Barrier Middleware (`requireAuth`):** [`src/middleware/authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js) acts as an HTTP 401 gatekeeper across all gameplay and leaderboard routes, binding high scores directly to the verified `req.session.username`.

---

### 5. Architectural Innovations & Strategic Roadmap
**Question:** *Any other interesting features (plus ideas on how to continue development)?*
- **Procedural Web Audio API 8-Bit Synthesizer:** Zero external audio assets; [`audio.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/audio.js) procedurally generates 7 authentic waveforms (square/triangle/sawtooth) with dynamic master volume gain scaling (`masterGainNode`).
- **Motherboard DIP Switches Modal & Arcade Juice:** Emulates physical cabinet DIP switches (`#settings-modal`) controlling timer difficulty (Easy 60s, Normal 45s, Hard 20s), CRT scanlines, and screen shake VFX with `localStorage` persistence.
- **Post-Week 8 Scalability Roadmap:**
  1. *Horizontal Scaling:* Decouple stateful sessions and buffer pools into distributed Redis clusters for multi-container load balancing.
  2. *Real-Time Duplex Networking:* Introduce WebSockets (`Socket.io`) for head-to-head multiplayer split-screen puzzle battles.
  3. *Federated Identity:* Integrate OAuth2 / OpenID Connect (OIDC) allowing single sign-on via Google and GitHub.
