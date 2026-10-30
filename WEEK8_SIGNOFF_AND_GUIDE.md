# 🍌 BANANA QUEST // 90s ARCADE CABINET EDITION
## Unit CIS046-3: Software for Enterprise (AY 26/27) — Week 8 Final Sign-Off & Architecture Guide

---

# PART 1: CIS046-3 WEEK 8 SIGN-OFF SHEET (OFFICIAL ANSWERS)
> **Instructions for Student:** You can copy and paste the answers below directly into your printed or digital Week 8 sign-off form. These responses are written to an academic **First-Class (70%+ / A-Grade)** standard, referencing exact files, functions, lines, and architectural design patterns.

---

### **CIS046-3 Software for Enterprise – AY 26/27**
**Student Name:** [Your Name] &nbsp;&nbsp;|&nbsp;&nbsp; **Student Number:** [Your Student ID]  
**Date:** November 2026 (Week 8 Sign-Off)  
**Project Title:** Banana Quest: 90s Retro Arcade Cabinet Edition  
**Repository:** `https://github.com/lenin-maharjan/bananaAPI_Quest.git`  
**Tech Stack:** Node.js, Express, SQLite3, Bcrypt.js, Express-Session, Web Audio API, Vanilla HTML5/CSS3/JavaScript  

---

### 1. Version Control
**Question:** *How did you develop your code (e.g., what features have been added after first version)?*

**Academic Answer:**
> "The development of *Banana Quest* was executed using an enterprise Git workflow characterized by atomic commits, feature branching, and strict repository hygiene. Rather than developing directly on the `main` branch, every architectural milestone followed an isolated feature-branch strategy before merging:
>
> 1. **Initial Baseline (`main` / `v1.0.0`):** Started with a monolithic `server.js` file housing express routing, in-memory credential storage, and hardcoded REST calls.
> 2. **Phase 1: Backend MVC Modularization (`feature/architecture-refactor`):** Decoupled the monolith into a clean Model-View-Controller (MVC) structure by creating dedicated controllers ([`authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js) and [`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js)) and modular routers ([`authRoutes.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/routes/authRoutes.js) and [`bananaRoutes.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/routes/bananaRoutes.js)).
> 3. **Phase 2: Persistent Virtual Identity & SQLite (`feature/robust-identity-sqlite`):** Replaced volatile in-memory storage with a persistent SQLite database ([`db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L30-L50)), and introduced one-way password hashing using `bcryptjs` with 10 salt rounds.
> 4. **Phase 3: Directory Encapsulation & Middleware (`feature/src-directory-refactor`):** Migrated all server-side logic into an encapsulated `src/` directory, updated entry point configuration in [`package.json`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/package.json), and introduced security barrier middleware ([`authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js)) returning HTTP 401 for unauthenticated calls.
> 5. **Phase 4: Resilient Interoperability (`feature/api-fallback-cache`):** Upgraded external API consumption by introducing a 5-second `AbortSignal` timeout and a local hardcoded fallback cache object (`FALLBACK_PUZZLE`) in [`bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L11-L16) guaranteeing 100% uptime during upstream API outages.
> 6. **Phase 5: Event-Driven Observer Architecture (`feature/ui-event-stream`):** Implemented a real-time MS-DOS style Event Console terminal using the Publish-Subscribe pattern with custom events on `window`.
> 7. **Phase 6: 90s Arcade Cabinet Experience (`feature/90s-arcade-cabinet`):** Final release featuring a custom 3-view Finite State Machine (`switchView`), an authentic CRT monitor scanline aesthetic, on-screen arcade keypad (0–9), hardware keyboard event listeners, procedural Web Audio API 8-bit sound synthesis (`playArcadeSound`), 3-lives HUD, Game Over continue modal, and a persistent SQLite Hall of Fame leaderboard (`scores` table).
>
> All temporary files, database binaries (`database.sqlite`), and dependencies (`node_modules/`) are strictly excluded via [`.gitignore`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/.gitignore), leaving the working tree completely clean."

---

### 2. Event Driven Architectures
**Question:** *What in your code triggers events (e.g., GUI, buttons, timeout …)?*

**Academic Answer:**
> "The application implements a multi-tiered Event-Driven Architecture (EDA) adhering to the **Publish-Subscribe (Pub/Sub) pattern**, combining standard DOM triggers, temporal intervals, hardware keyboard interrupts, and decoupled `CustomEvent` dispatchers:
>
> 1. **Temporal / Timeout Events:**
>    - In [`public/js/app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L301-L332) ([`startTimer`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L301-L332)), a `setInterval` timer ticks every 1,000ms.
>    - Every second, it acts as a publisher by instantiating and dispatching a `CustomEvent('timer-tick', { detail: { seconds: timeLeft } })`.
>    - When `timeLeft <= 0`, it clears the interval and publishes `CustomEvent('timer-expired')`, which transitions the client into the Game Over state.
> 2. **GUI / User Interface Action Events:**
>    - **Buttons:** Clicks on `#register-btn`, `#login-btn`, `#start-game-btn`, `#fetch-puzzle-btn`, `#submit-guess-btn`, and `#clear-stream-btn` trigger async REST fetches and sound synthesizers.
>    - **On-Screen Arcade Keypad (0–9):** In [`public/js/app.js:L532-541`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L532-L541), clicking any arcade numeric button plays a tactile audio beep, sets the guess input value, and auto-fires the submission button.
> 3. **Hardware Keyboard Interrupts:**
>    - A global `window.addEventListener('keydown')` listener in [`public/js/app.js:L544-L553`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L544-L553) captures physical numeric key presses (`0` through `9`), allowing players to play seamlessly without a mouse.
> 4. **Custom Application Events (Pub/Sub Bus):**
>    - The system is fully decoupled through `window.dispatchEvent(new CustomEvent(...))`. Publishers never manipulate the UI directly; subscribers listen via `window.addEventListener(...)`:
>      - `'auth-register'`: Dispatched upon successful database user registration.
>      - `'auth-success'`: Switches view from login to main arcade dashboard.
>      - `'auth-logout'`: Resets UI, halts active timers, and returns to login.
>      - `'game-start'`: Resets lives to 3, resets score to 0000, and triggers puzzle load.
>      - `'puzzle-loaded'`: Renders third-party puzzle image and starts the 45-second timer.
>      - `'guess-evaluated'`: Evaluates correct vs. incorrect guesses, calculates time-bonus scores, or decrements lives.
>      - `'game-over'`: Persists final score to SQLite, synthesizes sad chords, and displays the Continue modal.
> 5. **Real-Time Observer Event Stream Console:**
>    - The function [`logToEventStream`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L258-L288) observes all dispatched events and appends them with millisecond timestamps (`HH:MM:SS.mmm`) and JSON payloads to the retro MS-DOS terminal on screen.
> 6. **Web Audio API Procedural Audio Events:**
>    - The synthesizer function [`playArcadeSound`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L71-L170) procedurally configures `AudioContext` oscillators (square, triangle, and sawtooth waves) to trigger authentic 8-bit sound effects for coin drops, button clicks, triumphant victory arpeggios, wrong buzzes, and game-over melodies."

---

### 3. Interoperability
**Question:** *Do you use the API https://marcconrad.com/uob/tomato/api.php? If no, where in your code do you demonstrate interoperability? What protocols do you use?*

**Academic Answer:**
> "I do not use the Tomato API directly; instead, I utilize **Marc Conrad's Banana API** (`https://marcconrad.com/uob/banana/api.php?out=json`), which shares the exact same underlying University of Bedfordshire microservice architecture and data contract, returning an image puzzle question URL and an integer solution value.
>
> Interoperability is implemented in [`src/controllers/bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L18-L52) within the [`getPuzzle`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L18-L52) controller function:
>
> 1. **Protocols & Standards:**
>    - **HTTP/1.1 over TLS (HTTPS):** Communication with the remote service is executed securely over port 443.
>    - **RESTful Paradigm & GET Method:** Requests are issued as an idempotent HTTP GET to retrieve remote puzzle assets.
>    - **JSON Serialization:** The external endpoint is queried with the query parameter `?out=json`. The controller parses the incoming payload (`const data = await response.json()`), adhering to cross-platform JSON data exchange standards.
> 2. **Reverse-Proxy Server-Side Facade Pattern:**
>    - To protect game integrity and prevent cross-origin issues (CORS), the client browser never contacts Marc Conrad's server directly. Instead, our Node.js Express server acts as an intermediary proxy.
>    - The server extracts `data.solution` and stores it securely inside `req.session.solution` on the server ([`bananaController.js:L37`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L37)). Only the question image URL (`{ question: data.question }`) is forwarded to the client browser ([`bananaController.js:L40`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L40)). This completely prevents client-side answer inspection via browser DevTools.
> 3. **Fault-Tolerant Fallback Cache (Graceful Degradation):**
>    - In enterprise environments, external services may suffer from latency, rate limits, or network partitions.
>    - To guarantee High Availability, the fetch call is wrapped with an `AbortSignal.timeout(5000)` timeout barrier ([`bananaController.js:L25`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L25)).
>    - If the remote API fails or exceeds 5,000ms, execution diverts to the `catch` block ([`bananaController.js:L42-L51`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L42-L51)). The controller seamlessly serves a local hardcoded fallback puzzle ([`FALLBACK_PUZZLE`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L11-L16)), saves the fallback solution into the session, and responds with the exact same JSON signature. The client application continues running without disruption or error."

---

### 4. Virtual Identity
**Question:** *How did you implement virtual identity in your code? (e.g., Passwords, Cookies, IP Numbers …)*

**Academic Answer:**
> "Virtual Identity is implemented using a robust, multi-layered security architecture encompassing cryptographic password hashing, persistent SQL relational storage, cryptographically signed HTTP cookies, server-side session stores, and role-based route guard middleware:
>
> 1. **Persistent Relational User Store (SQLite):**
>    - User identities are persisted across server reboots in an SQLite database file (`database.sqlite`) initialized in [`src/models/db.js:L31-L49`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L31-L49).
>    - The schema defines `id INTEGER PRIMARY KEY AUTOINCREMENT`, `username TEXT UNIQUE NOT NULL`, and `password_hash TEXT NOT NULL`.
> 2. **One-Way Cryptographic Hashing (`bcryptjs`):**
>    - Plaintext passwords are never saved. In [`src/controllers/authController.js:L27-L28`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L27-L28), user registration invokes `await bcrypt.hash(password, SALT_ROUNDS)` with 10 salt rounds to defend against dictionary and rainbow table attacks.
>    - During authentication ([`authController.js:L84`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L84)), `await bcrypt.compare(password, user.password_hash)` evaluates the submitted plaintext against the stored salt and hash.
> 3. **Defending Against SQL Injection (Parameterized Queries):**
>    - In both registration and login ([`authController.js:L31`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L31) and [`L67`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L67)), SQL statements utilize parameterized placeholders (`?`) rather than raw string concatenation (e.g., `INSERT INTO users (username, password_hash) VALUES (?, ?)`).
> 4. **Stateful Session Management & Signed Cookies (`express-session`):**
>    - Configured in [`src/server.js:L31-L45`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/server.js#L31-L45), the server issues a session identifier cookie named `connect.sid`.
>    - The cookie is signed with a secret key (`secret: 'banana-quest-secret-key-123'`), has a lifespan of 10 minutes (`maxAge: 600000`), and enforces `httpOnly: true` to prevent malicious client-side JavaScript access (mitigating XSS session hijacking).
>    - Upon successful login, the virtual identity is bound to the server session via `req.session.username = user.username` ([`authController.js:L93`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L93)).
> 5. **Access Control Barrier Middleware (`requireAuth`):**
>    - Defined in [`src/middleware/authMiddleware.js:L7-L19`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js#L7-L19), this gatekeeper function inspects incoming requests. If `req.session.username` is absent or expired, it halts execution and returns HTTP `401 Unauthorized`.
>    - In [`src/routes/bananaRoutes.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/routes/bananaRoutes.js#L20-L29), this middleware protects `/puzzle`, `/check-answer`, `/score`, and `/leaderboard`.
> 6. **Identity Association in Game State & Scores:**
>    - When saving scores ([`bananaController.js:L77-L87`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L77-L87)), the username is extracted directly from the validated session cookie on the server, guaranteeing players cannot forge scores under another user's name."

---

### 5. Other Interesting Features & Post-Week 8 Ideas
**Question:** *Any other interesting features (plus ideas on how to continue with the development after Week 8)?*

**Academic Answer:**
> "**Implemented Distinctive Features:**
> 1. **Web Audio API 8-Bit Procedural Synthesizer:** Rather than downloading static `.mp3` or `.wav` sound files, [`public/js/app.js:L71-L170`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L71-L170) synthesizes sound waves in real time using the browser's native `AudioContext`. It dynamically modulates frequency ramps on square waves for button clicks, dual-tone chimes for coin inserts, multi-note arpeggios for correct answers, and descending sawtooth waves for game overs.
> 2. **Authentic 90s CRT Arcade Cabinet Aesthetic:** Complete with simulated CRT scanline overlays, neon tube glow text-shadows, animated blinking marquees (1UP / HIGH SCORE / FREE PLAY), chunky 3D-embossed arcade buttons, and an MS-DOS command prompt event bus logger.
> 3. **Persistent SQLite High Score Leaderboard:** A dedicated `scores` table stores player achievements. The controller executes an aggregate SQL query (`SELECT username, MAX(score) AS high_score FROM scores GROUP BY username ORDER BY high_score DESC LIMIT 5`) in [`bananaController.js:L109-L114`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L109-L114) and renders the Hall of Fame dynamically on the arcade dashboard.
> 4. **Dual Input (On-Screen Tactile Keypad + Physical Keyboard 0–9):** Supports touchscreens, mouse clicks, and rapid physical keyboard number entry.
> 5. **Arcade Gameplay Economy (3 Lives, Scoring Formula & Continue Modal):** Players earn 100 base points plus a 2x remaining-seconds speed bonus on correct answers, lose a heart on incorrect guesses, and are presented with an authentic 90s 'CONTINUE? / INSERT COIN' modal upon depletion of lives or timeout.
>
> **Future Development Roadmap (Post-Week 8 Enterprise Expansion):**
> 1. **Real-Time Multiplayer with WebSockets (`Socket.io`):** Introduce head-to-head multiplayer arcade battles where two authenticated players race against the clock to solve the same banana puzzle simultaneously.
> 2. **Enterprise Virtual Identity (JWT & OAuth2 / OpenID Connect):** Migrate session storage to Redis and integrate OAuth2 federated single sign-on (SSO) with GitHub or Google for enterprise-grade identity federation.
> 3. **Adaptive Difficulty Engine:** Track player accuracy and response latency, dynamically varying the timer duration and selecting more intricate puzzle matrices as player streaks increase.
> 4. **Containerization & CI/CD Pipeline:** Package the application into a lightweight Docker container (`Dockerfile` & `docker-compose.yml`) and deploy to AWS ECS or DigitalOcean with automated GitHub Actions testing."

---

# PART 2: END-TO-END ARCHITECTURAL BREAKDOWN

## 1. System Architecture Overview
*Banana Quest* follows a classic **3-Tier Enterprise Distributed Web Architecture** organized strictly along the Model-View-Controller (MVC) paradigm:

```mermaid
graph TD
    subgraph Client_Tier [Client Tier: Browser & Presentation]
        DOM[DOM UI: HTML5 & Retro CRT CSS]
        FSM[Finite State Machine: Login / Dashboard / Game]
        EDA[Pub/Sub Event Bus: CustomEvents on window]
        Synth[Web Audio API: Procedural 8-Bit Synth]
        Terminal[MS-DOS Event Stream Terminal]
    end

    subgraph Application_Tier [Application Tier: Node.js & Express]
        Server[src/server.js: Express Bootstrapper]
        Session[express-session: Signed Cookie Jar]
        MW[src/middleware/authMiddleware.js: Security Guard]
        RouterAuth[src/routes/authRoutes.js]
        RouterBanana[src/routes/bananaRoutes.js]
        CtrlAuth[src/controllers/authController.js]
        CtrlBanana[src/controllers/bananaController.js]
        Fallback[Fault-Tolerant Cache: FALLBACK_PUZZLE]
    end

    subgraph Data_Tier [Data & External Services Tier]
        SQLite[(database.sqlite: SQLite3 Engine)]
        UsersTable[Table: users]
        ScoresTable[Table: scores]
        MarcConradAPI[External Microservice: Marc Conrad Banana REST API]
    end

    DOM <--> FSM
    FSM --> EDA
    EDA --> Terminal
    EDA --> Synth
    DOM -- HTTP Fetch + Cookie --> Server
    Server --> Session
    Server --> RouterAuth
    Server --> RouterBanana
    RouterBanana --> MW
    RouterAuth --> CtrlAuth
    RouterBanana --> CtrlBanana
    CtrlAuth --> UsersTable
    CtrlBanana --> ScoresTable
    CtrlBanana -- HTTPS GET + AbortSignal --> MarcConradAPI
    MarcConradAPI -. Network Failure .-> Fallback
```

---

## 2. Comprehensive Directory & File Catalog

### Root Files
| File / Directory | Purpose & Architectural Role |
| :--- | :--- |
| [`package.json`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/package.json) | Node.js manifest specifying dependencies (`express`, `express-session`, `sqlite3`, `bcryptjs`), project metadata, and entry point (`node src/server.js`). |
| [`.gitignore`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/.gitignore) | Protects repository hygiene by excluding `node_modules/`, local runtime database files (`*.sqlite`), logs, and operating system artifacts. |
| `database.sqlite` | Binary relational database file managed locally by SQLite3; contains persistent `users` and `scores` tables. (Excluded from Git). |

---

### Backend Components (`src/`)

#### 1. [`src/server.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/server.js) — Application Bootstrapper
- **Role:** Minimal, modular Express bootstrap file.
- **Key Responsibilities:**
  - Instantiates Express application on port 3000.
  - Mounts `express.json()` payload parsing middleware ([`L28`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/server.js#L28)).
  - Configures `express-session` with cryptographic signature, 10-minute expiration, and `httpOnly: true` protection ([`L31-L45`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/server.js#L31-L45)).
  - Serves static assets from `../public` ([`L48`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/server.js#L48)).
  - Mounts modular routers under `/api` prefix ([`L51-L54`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/server.js#L51-L54)).

#### 2. [`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js) — Data Persistence Layer
- **Role:** Centralized relational database connection and DDL schema manager.
- **Key Responsibilities:**
  - Resolves path to `database.sqlite` using `path.join(__dirname, '../../database.sqlite')` ([`L14`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L14)).
  - Uses `db.serialize()` to guarantee sequential schema execution upon initial startup ([`L29`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L29)).
  - Creates the `users` table (`id`, `username UNIQUE`, `password_hash`) ([`L31-L49`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L31-L49)).
  - Creates the `scores` table (`id`, `username`, `score`, `created_at TIMESTAMP`) ([`L52-L71`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L52-L71)).
  - Exports shared `db` connection instance ([`L75`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js#L75)).

#### 3. [`src/controllers/authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js) — Virtual Identity Logic
- **Role:** Business logic for user management, cryptography, and sessions.
- **Key Methods:**
  - `exports.register`: Hashes plaintext password with `bcrypt.hash(password, 10)` and executes parameterized SQL `INSERT INTO users` ([`L16-L53`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L16-L53)). Catches duplicate usernames via SQLite `UNIQUE` constraint error ([`L38`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L38)).
  - `exports.login`: Queries user by username via parameterized SQL `SELECT * FROM users WHERE username = ?`, checks credentials using `bcrypt.compare`, and binds identity to `req.session.username` ([`L56-L98`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L56-L98)).
  - `exports.checkSession`: Inspects `req.session.username` to allow client-side page reconnects without re-entering passwords ([`L101-L109`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L101-L109)).
  - `exports.logout`: Calls `req.session.destroy()` and clears client-side cookie `connect.sid` ([`L112-L120`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js#L112-L120)).

#### 4. [`src/controllers/bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js) — Game & Interoperability Logic
- **Role:** Handles external API consumption, puzzle validation, and score records.
- **Key Methods:**
  - `exports.getPuzzle`: Interoperates with `https://marcconrad.com/uob/banana/api.php?out=json` protected by `AbortSignal.timeout(5000)`. Stores solution into `req.session.solution` and serves image URL to client ([`L19-L41`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L19-L41)). Falls back to `FALLBACK_PUZZLE` during network failures ([`L42-L52`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L42-L52)).
  - `exports.checkAnswer`: Evaluates player's guess against session-bound solution ([`L55-L70`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L55-L70)).
  - `exports.saveScore`: Parameterized `INSERT INTO scores (username, score) VALUES (?, ?)` extracting username securely from session ([`L73-L103`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L73-L103)).
  - `exports.getLeaderboard`: Executes aggregate SQL `SELECT username, MAX(score) AS high_score FROM scores GROUP BY username ORDER BY high_score DESC LIMIT 5` ([`L106-L127`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js#L106-L127)).

#### 5. [`src/routes/authRoutes.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/routes/authRoutes.js) & [`src/routes/bananaRoutes.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/routes/bananaRoutes.js) — Routing Layer
- **Role:** Maps incoming URI endpoints to respective controller handler functions.
- `authRoutes`: Maps `/register`, `/login`, `/session`, and `/logout`.
- `bananaRoutes`: Maps `/puzzle`, `/check-answer`, `/score`, and `/leaderboard`. Injects `requireAuth` middleware before every route.

#### 6. [`src/middleware/authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js) — Security Route Guard
- **Role:** Intercepts incoming requests before reaching sensitive game controllers.
- **Implementation:** Validates `req.session && req.session.username`. If present, invokes `next()`; otherwise, aborts pipeline with HTTP 401 Unauthorized ([`L7-L19`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js#L7-L19)).

---

### Frontend Components (`public/`)

#### 1. [`public/index.html`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/index.html) — Arcade Cabinet Structure
- **Role:** Semantic HTML5 presentation structure.
- **Key Sections:**
  - **Marquee Header:** Real-time 1UP score tracker, High Score tracker, and blinking arcade cabinet title.
  - **#login-section:** Authentication forms for Register and Login.
  - **#dashboard-section:** Main arcade menu displaying active user, Start Arcade Mode button, and Hall of Fame Leaderboard table.
  - **#game-section:** HUD displaying SCORE, TIME, and LIVES; Marc Conrad puzzle image; 0–9 tactile keypad grid; Fire Answer button; and feedback box.
  - **#event-stream-console:** MS-DOS style terminal log with Clear button.
  - **#game-over-modal:** Animated CRT popup with CONTINUE? prompt, Final Score, and Insert Coin / Retry buttons.

#### 2. [`public/css/style.css`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/css/style.css) — 90s Retro Arcade Design System
- **Role:** Complete visual aesthetic without external CSS frameworks.
- **Key Features:**
  - CSS Custom Properties (`:root`) for arcade neon color palette (cyan `#00f0ff`, magenta `#ff007f`, yellow `#ffe600`, green `#39ff14`, red `#ff3131`).
  - Google Fonts integration: `'Press Start 2P'` (8-bit headings) and `'VT323'` (MS-DOS monospace terminal text).
  - CRT monitor scanline simulation using CSS repeating linear gradients.
  - Chunky, tactile, 3D-bevel button styling with active depression states.
  - Responsive flexbox and grid layouts adaptable from desktop monitors to mobile screens.

#### 3. [`public/js/app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js) — Client-Side Logic & Event Bus
- **Role:** Manages the client-side lifecycle, Web Audio sound synthesis, Pub/Sub events, and view states.
- **Key Modules:**
  - **Web Audio API Synthesizer ([`L71-L170`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L71-L170)):** Generates 5 distinct procedural sound effects (`click`, `coin`, `correct`, `wrong`, `gameover`).
  - **Finite State Machine ([`L177-L190`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L177-L190)):** `switchView(viewName)` switches between `login`, `dashboard`, and `game`.
  - **Pub/Sub CustomEvent Bus ([`L298-L478`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L298-L478)):** Publishes and subscribes to events across `window`.
  - **MS-DOS Observer Logger ([`L258-L288`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L258-L288)):** Renders incoming event objects and timestamps in real time.
  - **Dual Input Handlers ([`L528-L553`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js#L528-L553)):** Translates on-screen keypad clicks and physical keyboard digit presses (`0`–`9`) into instant answer guesses.

---

# PART 3: 10-MINUTE VIDEO PRESENTATION SCRIPT & CHEAT SHEET

Use this timeline to ensure you hit every criterion on the marking rubric during your presentation:

```
[0:00 - 1:15]  SLIDE 1: Introduction, Architecture & Git Workflow
[1:15 - 3:00]  SLIDE 2: Virtual Identity & Persistent SQLite Database
[3:00 - 5:15]  SLIDE 3: Interoperability, REST Proxying & Fallback Cache
[5:15 - 7:30]  SLIDE 4: Event-Driven Programming, CustomEvents & Web Audio Synth
[7:30 - 9:00]  SLIDE 5: Live Gameplay Demonstration & Arcade Features
[9:00 - 10:00] SLIDE 6: Enterprise Conclusion, Evaluation & Future Roadmap
```

### Minute-by-Minute Talking Points

#### [0:00 - 1:15] Introduction & Version Control
- *"Good day. Today I am presenting my enterprise project: Banana Quest 90s Arcade Cabinet Edition for unit CIS046-3."*
- *"We engineered this system starting from a monolithic prototype and methodically refactored it across 8 distinct Git feature branches into an enterprise MVC architecture."*
- Show Git commit tree / terminal: highlight branch hygiene, atomic commit messages, and the separation of backend `src/` from frontend `public/`.

#### [1:15 - 3:00] Virtual Identity (Theme 4)
- *"Our virtual identity system ensures security at rest and in transit."*
- Open [`src/models/db.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/models/db.js) & [`src/controllers/authController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/authController.js):
  - Point to `bcrypt.hash(password, 10)`: *"We never store plaintext passwords; credentials are cryptographically hashed using 10 salt rounds."*
  - Point to parameterized SQL: *"All database interactions use parameterized placeholders (`?`) to guarantee absolute protection against SQL Injection attacks."*
  - Point to session cookies: *"Upon login, a signed, HTTP-only session cookie (`connect.sid`) is issued. In [`authMiddleware.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/middleware/authMiddleware.js), any unauthenticated call to our protected game routes is intercepted with an HTTP 401 Unauthorized."*

#### [3:00 - 5:15] Interoperability & Fault Tolerance (Theme 2)
- *"For interoperability, we consume Marc Conrad's Banana REST API over HTTPS."*
- Open [`src/controllers/bananaController.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/src/controllers/bananaController.js):
  - Point to `fetch(apiUrl)`: *"Notice we employ a server-side reverse proxy pattern. The client browser never contacts the third-party API directly. This resolves CORS issues and hides the answer from browser DevTools by storing the solution strictly in `req.session.solution`."*
  - Point to `AbortSignal.timeout(5000)` and `FALLBACK_PUZZLE`: *"To achieve enterprise fault tolerance, we guard the call with a 5-second timeout and a pre-cached fallback puzzle. If the upstream university server is offline, our application degrades gracefully without the end user ever experiencing a crash."*

#### [5:15 - 7:30] Event-Driven Architecture & Web Audio Synthesizer (Theme 3)
- *"Our application is built on an asynchronous Publish-Subscribe Event-Driven Architecture."*
- Open [`public/js/app.js`](file:///c:/Users/lenin/OneDrive/Documents/what%20L6/Software%20Enterprise/bananaAPI_Quest/public/js/app.js):
  - Point to `window.dispatchEvent(new CustomEvent(...))`: *"The UI is completely decoupled. When the 45-second timer ticks, it dispatches `'timer-tick'`. When answers are evaluated, it dispatches `'guess-evaluated'`. The MS-DOS Event Stream terminal on the right acts as an observer, displaying live event payloads with millisecond timestamps."*
  - Point to `playArcadeSound()`: *"Instead of relying on large audio assets, we built a procedural 8-bit sound synthesizer using the browser's Web Audio API. It configures square, triangle, and sawtooth wave oscillators on the fly to produce authentic retro arcade beeps, coin chimes, and power-up arpeggios."*

#### [7:30 - 9:00] Live Arcade Demonstration
- Switch to browser (`http://localhost:3000`):
  1. Show registration: Register a new player account (e.g., `ArcadeMaster`).
  2. Point to the MS-DOS Event Stream: show the `> [auth-register]` event appearing.
  3. Log in: Hear the coin chime sound effect; observe the transition into the Main Menu Dashboard.
  4. Show the Leaderboard: point out the top 5 scores retrieved from SQLite.
  5. Click `[ START ARCADE MODE ]`: show the puzzle loading and the 45-second timer counting down.
  6. Answer a puzzle using the **on-screen keypad** or **keyboard number keys (0–9)**.
  7. Show score incrementing with the time bonus (+points).
  8. Enter an incorrect guess: hear the hurt buzz sound and show the heart decrementing from ❤️❤️❤️ to ❤️❤️🖤.
  9. Deplete lives: show the 90s `CONTINUE? / GAME OVER` modal appearing, the sad game-over chords playing, and the score being recorded to the SQLite leaderboard.

#### [9:00 - 10:00] Conclusion & Future Roadmap
- *"In conclusion, Banana Quest successfully demonstrates all four enterprise software themes: Version Control, Event-Driven Programming, Interoperability, and Virtual Identity."*
- *"For post-Week 8 development, we plan to implement WebSocket real-time multiplayer co-op, JWT/OAuth2 single sign-on, and containerize the entire stack with Docker for enterprise cloud deployment."*
- *"Thank you! I am now happy to answer any questions."*
