// ====================================================
// File: public/js/app.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Architecture, event coordination, and client flow designed by the Author.
// - Implementation drafted and refactored with generative AI assistance (Gemini 3.8 / Antigravity IDE).
// - All logic manually reviewed, debugged, and verified by the Author.
//
// External References & Documentation:
// - DOM CustomEvent (Pub/Sub): https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
// - Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
// ====================================================

import * as audio from './audio.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as settings from './settings.js';
import * as gameState from './gameState.js';

const on = (el, evt, fn) => el && el.addEventListener(evt, fn);

// --- Settings & UI Synchronization ---
function syncSettingsUI() {
  const cur = settings.getSettings();
  audio.setAudioMuted(!cur.sfxEnabled);
  audio.setSfxEnabled(cur.sfxEnabled);
  audio.setAudioVolume(cur.volume);
  ui.applySettingsToUI(cur, !cur.sfxEnabled, cur.simulateOutage);
}

function initSettings() {
  settings.loadSavedSettings();
  syncSettingsUI();
}

function toggleSfx() {
  const sfx = settings.toggleSfxEnabled();
  settings.saveSettingsToStorage();
  syncSettingsUI();
  return sfx;
}

// --- Leaderboard & Session Management ---
async function refreshLeaderboard() {
  try {
    const data = await api.fetchLeaderboard();
    if (data.success) ui.renderLeaderboard(data.leaderboard);
  } catch (err) { console.error('Failed to fetch leaderboard:', err); }
}

async function checkExistingSession() {
  try {
    const res = await api.checkSession();
    if (res.loggedIn) window.dispatchEvent(new CustomEvent('auth-success', { detail: { username: res.username, reconnected: true } }));
    else ui.switchView('login');
  } catch { ui.switchView('login'); }
}

async function performLogout() {
  audio.playArcadeSound('click');
  try { await api.logout(); } catch (err) { console.error('Logout error:', err); }
  gameState.stopTimerInterval();
  window.dispatchEvent(new CustomEvent('auth-logout', { detail: { status: 'SESSION_DESTROYED' } }));
}

// --- Gameplay Flow ---
function startRoundTimer() {
  ui.submitGuessBtn.disabled = ui.guessInput.disabled = false;
  gameState.startTimerInterval(
    settings.getTimerDifficulty(),
    (sec) => window.dispatchEvent(new CustomEvent('timer-tick', { detail: { seconds: sec } })),
    () => window.dispatchEvent(new CustomEvent('timer-expired', { detail: { status: 'TIMEOUT' } }))
  );
}

async function loadPuzzle() {
  gameState.clearAutoAdvance();
  if (gameState.isLoading()) return;
  gameState.setIsLoading(true);
  ui.setPuzzleLoading(true);
  const outage = settings.isSimulateOutage();
  ui.messageBox.style.color = 'var(--arcade-cyan)';
  ui.messageBox.textContent = outage ? 'SIMULATING OUTAGE: ENGAGING BACKUP CACHE...' : 'FETCHING PUZZLE FROM FAST BUFFER...';

  try {
    const data = await api.fetchPuzzle(outage);
    if (data.nextQuestionHint) new Image().src = data.nextQuestionHint;
    window.dispatchEvent(new CustomEvent('puzzle-loaded', {
      detail: { imageUrl: data.question, source: data.source || 'LIVE_MARCCONRAD', prefetched: data.prefetched }
    }));
  } catch {
    ui.setPuzzleLoading(false);
    ui.messageBox.style.color = 'var(--arcade-red)';
    ui.messageBox.textContent = 'ERROR LOADING PUZZLE';
  } finally {
    gameState.setIsLoading(false);
  }
}

function handleCorrectGuess({ message }) {
  gameState.stopTimerInterval();
  ui.timerDisplay?.classList.remove('panic-pulse');
  audio.playArcadeSound('correct');
  const streak = gameState.incrementStreak();
  const pts = gameState.calculatePoints(gameState.getTimeLeft(), streak);
  const newScore = gameState.addScore(pts.total);
  ui.updateStreakDisplay(streak);
  ui.updateScoreDisplay(newScore);
  ui.triggerScreenHeal();
  const bonus = streak > 1 ? `+${pts.total} PTS (${streak}X COMBO!)` : `+${pts.total} PTS!`;
  ui.showFloatingPoints(bonus);
  if (streak >= 2) audio.playArcadeSound('streak');
  window.dispatchEvent(new CustomEvent('streak-updated', { detail: { streak, bonus: pts.streakBonus, totalScore: newScore } }));
  ui.submitGuessBtn.disabled = ui.guessInput.disabled = true;
  ui.messageBox.style.color = 'var(--arcade-green)';
  ui.messageBox.textContent = `★ ${message} ${bonus} NEXT IN 1.5S ★`;
  gameState.scheduleAutoAdvance(() => loadPuzzle(), 1500);
}

function handleIncorrectGuess({ message }) {
  audio.playArcadeSound('wrong');
  gameState.resetStreak();
  ui.updateStreakDisplay(0);
  ui.triggerScreenShake(settings.isVfxEnabled());
  window.dispatchEvent(new CustomEvent('streak-updated', { detail: { streak: 0, reset: true } }));
  const livesLeft = gameState.decrementLives();
  ui.updateLivesDisplay(livesLeft);
  gameState.stopTimerInterval();
  ui.timerDisplay?.classList.remove('panic-pulse');
  ui.submitGuessBtn.disabled = ui.guessInput.disabled = true;
  ui.messageBox.style.color = 'var(--arcade-red)';
  if (livesLeft > 0) {
    ui.messageBox.textContent = `✖ ${message} (${livesLeft} LIVES LEFT) - AUTO-RECOVERING IN 3S...`;
    gameState.scheduleAutoAdvance(() => loadPuzzle(), 3000);
  } else {
    gameState.clearAutoAdvance();
    ui.messageBox.textContent = '💀 GAME OVER! ZERO LIVES REMAINING.';
    window.dispatchEvent(new CustomEvent('game-over', { detail: { reason: 'OUT_OF_LIVES', finalScore: gameState.getScore(), timestamp: Date.now() } }));
  }
}

// --- Custom Event Subscribers (Observer Pattern) ---
window.addEventListener('timer-tick', (e) => {
  const isPanic = e.detail.seconds <= 10 && e.detail.seconds > 0;
  ui.updateTimerDisplay(e.detail.seconds, isPanic);
  if (isPanic) audio.playArcadeSound('tick');
});

window.addEventListener('timer-expired', () => {
  ui.updateTimerDisplay(0, false);
  if (ui.timerDisplay) ui.timerDisplay.textContent = 'TIME EXPIRED!';
  gameState.setLives(0);
  gameState.resetStreak();
  ui.updateLivesDisplay(0);
  ui.updateStreakDisplay(0);
  ui.submitGuessBtn.disabled = ui.guessInput.disabled = true;
  ui.triggerScreenShake(settings.isVfxEnabled());
  window.dispatchEvent(new CustomEvent('game-over', { detail: { reason: 'TIME_EXPIRED', finalScore: gameState.getScore(), timestamp: Date.now() } }));
});

window.addEventListener('auth-success', (e) => {
  ui.switchView('dashboard');
  refreshLeaderboard();
  if (ui.dashUserSpan) ui.dashUserSpan.textContent = e.detail.username;
  if (ui.currentUserSpan) ui.currentUserSpan.textContent = e.detail.username;
  if (ui.authMessage) ui.authMessage.textContent = '';
});

window.addEventListener('auth-logout', () => {
  ui.switchView('login');
  ui.puzzleImg?.classList.add('hidden');
  ui.guessContainer?.classList.add('hidden');
  if (ui.messageBox) ui.messageBox.textContent = '';
  gameState.resetStreak();
  ui.updateStreakDisplay(0);
  ui.timerDisplay?.classList.remove('panic-pulse');
});

window.addEventListener('puzzle-loaded', (e) => {
  gameState.clearAutoAdvance();
  if (ui.puzzleImg) {
    ui.puzzleImg.onload = ui.puzzleImg.onerror = () => { ui.setPuzzleLoading(false); ui.puzzleImg.classList.remove('hidden'); };
    ui.puzzleImg.src = e.detail.imageUrl;
  }
  ui.guessContainer?.classList.remove('hidden');
  ui.submitGuessBtn.disabled = ui.guessInput.disabled = false;
  ui.guessInput.value = ui.messageBox.textContent = '';
  ui.guessInput.focus();
  ui.timerDisplay?.classList.remove('panic-pulse');
  startRoundTimer();
  ui.updateApiStatusPill(e.detail.source, settings.isSimulateOutage());
});

window.addEventListener('guess-evaluated', (e) => (e.detail.correct ? handleCorrectGuess : handleIncorrectGuess)(e.detail));

window.addEventListener('game-start', () => {
  gameState.resetRunState(settings.getTimerDifficulty());
  ui.updateLivesDisplay(gameState.getLives());
  ui.updateScoreDisplay(gameState.getScore());
  ui.updateStreakDisplay(gameState.getStreak());
  ui.timerDisplay?.classList.remove('panic-pulse');
});

window.addEventListener('game-over', async (e) => {
  audio.playArcadeSound('gameover');
  ui.timerDisplay?.classList.remove('panic-pulse');
  gameState.resetStreak();
  ui.updateStreakDisplay(0);
  const finalScore = e.detail.finalScore ?? gameState.getScore();
  try {
    const data = await api.submitScore(finalScore);
    if (data.success) {
      window.dispatchEvent(new CustomEvent('score-saved', { detail: { score: finalScore, dbRecord: data.scoreId, username: data.username } }));
    }
  } catch (err) { console.error('Failed to persist score:', err); }
  ui.showGameOverModal(finalScore);
});

window.addEventListener('score-saved', (e) => {
  const saved = e.detail.score || 0;
  const high = parseInt(ui.marqueeHigh ? ui.marqueeHigh.textContent : '0', 10) || 0;
  if (saved > high && ui.marqueeHigh) ui.marqueeHigh.textContent = String(saved).padStart(4, '0');
});

// --- DOM Event Wiring ---
on(ui.sfxToggleBtn, 'click', () => { if (toggleSfx()) audio.playArcadeSound('coin'); });
on(ui.apiStatusPill, 'click', () => {
  gameState.clearAutoAdvance();
  settings.toggleSimulateOutage();
  settings.saveSettingsToStorage();
  syncSettingsUI();
  audio.playArcadeSound('click');
  loadPuzzle();
});

on(ui.settingsBtn, 'click', () => { audio.playArcadeSound('click'); syncSettingsUI(); ui.showSettingsModal(); });
on(ui.settingsCloseX, 'click', () => { audio.playArcadeSound('click'); ui.hideSettingsModal(); });
on(ui.settingsModal, 'click', (e) => e.target === ui.settingsModal && (audio.playArcadeSound('click'), ui.hideSettingsModal()));
on(ui.settingSfxToggle, 'click', () => { toggleSfx(); audio.playArcadeSound('click'); });
on(ui.settingVolumeSlider, 'input', (e) => { settings.updateSetting('volume', +e.target.value); audio.setAudioVolume(+e.target.value); syncSettingsUI(); });
on(ui.settingVolumeSlider, 'change', () => audio.playArcadeSound('click'));
on(ui.settingDifficultySelect, 'change', (e) => { settings.updateSetting('timerDifficulty', +e.target.value); audio.playArcadeSound('click'); });
on(ui.settingCrtToggle, 'click', () => { settings.toggleCrtEnabled(); syncSettingsUI(); audio.playArcadeSound('click'); });
on(ui.settingVfxToggle, 'click', () => { settings.toggleVfxEnabled(); syncSettingsUI(); audio.playArcadeSound('click'); });
on(ui.settingApiToggle, 'click', () => { gameState.clearAutoAdvance(); settings.toggleSimulateOutage(); syncSettingsUI(); audio.playArcadeSound('click'); if (ui.gameSection && !ui.gameSection.classList.contains('hidden')) loadPuzzle(); });
on(ui.settingsSaveBtn, 'click', () => { settings.saveSettingsToStorage(); ui.hideSettingsModal(); audio.playArcadeSound('coin'); });

on(ui.modalRetryBtn, 'click', () => { audio.playArcadeSound('coin'); ui.hideGameOverModal(); window.dispatchEvent(new CustomEvent('game-start', { detail: { mode: 'ARCADE_RETRY', timestamp: Date.now() } })); loadPuzzle(); });
on(ui.modalMenuBtn, 'click', () => { audio.playArcadeSound('click'); ui.hideGameOverModal(); ui.switchView('dashboard'); refreshLeaderboard(); });

ui.keypadButtons?.forEach((btn) => {
  on(btn, 'click', () => {
    if (ui.submitGuessBtn.disabled || gameState.isSubmittingGuess()) return;
    audio.playArcadeSound('click');
    ui.guessInput.value = btn.dataset.val;
    ui.submitGuessBtn.click();
  });
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return ui.settingsModal?.classList.contains('hidden') || ui.hideSettingsModal();
  const inGame = ui.gameSection && !ui.gameSection.classList.contains('hidden');
  const modalOpen = (ui.gameOverModal && !ui.gameOverModal.classList.contains('hidden')) || (ui.settingsModal && !ui.settingsModal.classList.contains('hidden'));
  if (inGame && !modalOpen) {
    if (e.key >= '0' && e.key <= '9' && !ui.submitGuessBtn.disabled && !gameState.isSubmittingGuess()) {
      e.preventDefault();
      audio.playArcadeSound('click');
      ui.guessInput.value = e.key;
      ui.submitGuessBtn.click();
    } else if (e.key.toLowerCase() === 'f') {
      ui.apiStatusPill?.click();
    }
  }
});

on(ui.guessInput, 'input', (e) => {
  const s = e.target.value.replace(/[^0-9]/g, '');
  e.target.value = s.length > 0 ? s.slice(-1) : '';
  if (e.target.value && !ui.submitGuessBtn.disabled && !gameState.isSubmittingGuess()) {
    audio.playArcadeSound('click');
    ui.submitGuessBtn.click();
  }
});

on(ui.guessInput, 'keydown', (e) => e.key === 'Enter' && !ui.submitGuessBtn.disabled && !gameState.isSubmittingGuess() && (e.preventDefault(), ui.submitGuessBtn.click()));

on(ui.togglePasswordBtn, 'click', () => {
  audio.playArcadeSound('click');
  const isPwd = ui.passwordInput.type === 'password';
  ui.passwordInput.type = isPwd ? 'text' : 'password';
  ui.togglePasswordBtn.textContent = isPwd ? '🔒' : '👁️';
});
on(ui.usernameInput, 'keydown', (e) => e.key === 'Enter' && (e.preventDefault(), ui.passwordInput?.focus()));
on(ui.passwordInput, 'keydown', (e) => e.key === 'Enter' && (e.preventDefault(), ui.loginBtn?.click()));

async function submitAuth(isLogin) {
  const [u, p] = [ui.usernameInput.value.trim(), ui.passwordInput.value];
  if (!u || !p) {
    ui.authMessage.style.color = 'var(--arcade-red)';
    ui.authMessage.textContent = 'ENTER USERNAME & PASSWORD!';
    return;
  }
  try {
    const data = isLogin ? await api.login(u, p) : await api.register(u, p);
    ui.authMessage.style.color = data.success ? 'var(--arcade-green)' : 'var(--arcade-red)';
    ui.authMessage.textContent = data.message || (data.success ? (isLogin ? '' : 'REGISTERED') : 'FAILED');
    if (data.success) {
      window.dispatchEvent(new CustomEvent(isLogin ? 'auth-success' : 'auth-register', { detail: { username: u, ...data } }));
    }
  } catch {
    ui.authMessage.style.color = 'var(--arcade-red)';
    ui.authMessage.textContent = 'NETWORK ERROR DURING AUTHENTICATION';
  }
}

on(ui.registerBtn, 'click', () => { audio.playArcadeSound('click'); submitAuth(false); });
on(ui.loginBtn, 'click', () => { audio.playArcadeSound('coin'); submitAuth(true); });
on(ui.startGameBtn, 'click', () => { audio.playArcadeSound('coin'); ui.switchView('game'); window.dispatchEvent(new CustomEvent('game-start', { detail: { mode: 'ARCADE', player: ui.dashUserSpan ? ui.dashUserSpan.textContent : 'PLAYER_1', timestamp: Date.now() } })); loadPuzzle(); });
on(ui.backToDashBtn, 'click', () => { audio.playArcadeSound('click'); gameState.stopTimerInterval(); ui.switchView('dashboard'); refreshLeaderboard(); });
[ui.logoutBtn, ui.dashLogoutBtn].forEach((btn) => on(btn, 'click', performLogout));
on(ui.fetchPuzzleBtn, 'click', () => { gameState.clearAutoAdvance(); audio.playArcadeSound('click'); loadPuzzle(); });

on(ui.submitGuessBtn, 'click', async () => {
  if (gameState.isSubmittingGuess() || ui.submitGuessBtn.disabled) return;
  const guess = ui.guessInput.value.trim();
  if (!guess) {
    ui.messageBox.style.color = 'var(--arcade-yellow)';
    ui.messageBox.textContent = 'PLEASE ENTER OR CLICK A DIGIT 0-9';
    return;
  }
  gameState.setIsSubmitting(true);
  ui.submitGuessBtn.disabled = ui.guessInput.disabled = true;
  try {
    const res = await api.checkAnswer(guess);
    window.dispatchEvent(new CustomEvent('guess-evaluated', { detail: { guess: parseInt(guess, 10), correct: res.correct, message: res.message } }));
  } catch (err) {
    console.error('Answer check error:', err);
    ui.submitGuessBtn.disabled = ui.guessInput.disabled = false;
  } finally {
    gameState.setIsSubmitting(false);
  }
});

// --- Bootstrapping ---
initSettings();
checkExistingSession();
