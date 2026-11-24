// ====================================================
// File: public/js/gameState.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Architecture, run-state lifecycle, and scoring economy designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - All logic manually reviewed, debugged, and verified by the Author.
//
// External References & Documentation:
// - Window timers (setInterval / setTimeout): https://developer.mozilla.org/en-US/docs/Web/API/setInterval
// ====================================================

// Core run state
let lives = 3;
let currentScore = 0;
let currentStreak = 0;
let timeLeft = 45;

// Timer and concurrency locks
let timerInterval = null;
let autoAdvanceTimeout = null;
let isLoadingPuzzle = false;
let isSubmitting = false;

// Accessors
export const getLives = () => lives;
export const setLives = (val) => { lives = Math.max(0, parseInt(val, 10) || 0); return lives; };
export const decrementLives = () => { lives = Math.max(0, lives - 1); return lives; };

export const getScore = () => currentScore;
export const setScore = (val) => { currentScore = Math.max(0, parseInt(val, 10) || 0); return currentScore; };
export const addScore = (pts) => { currentScore = Math.max(0, currentScore + (parseInt(pts, 10) || 0)); return currentScore; };

export const getStreak = () => currentStreak;
export const setStreak = (val) => { currentStreak = Math.max(0, parseInt(val, 10) || 0); return currentStreak; };
export const incrementStreak = () => { currentStreak++; return currentStreak; };
export const resetStreak = () => { currentStreak = 0; return currentStreak; };

export const getTimeLeft = () => timeLeft;
export const setTimeLeft = (val) => { timeLeft = Math.max(0, parseInt(val, 10) || 0); return timeLeft; };

/**
 * Calculates total points earned based on accuracy, time bonus, and combo multipliers:
 * Points = 100 (base) + (timeLeft * 2) + ((streak - 1) * 50 for streak >= 2)
 * @param {number} remainingSeconds
 * @param {number} streakCount
 * @returns {{ base: number, timeBonus: number, streakBonus: number, total: number }}
 */
export function calculatePoints(remainingSeconds, streakCount) {
  const base = 100;
  const timeBonus = Math.max(0, remainingSeconds * 2);
  const streakBonus = streakCount > 1 ? (streakCount - 1) * 50 : 0;
  const total = base + timeBonus + streakBonus;
  return { base, timeBonus, streakBonus, total };
}

/**
 * Resets player run state for a fresh game session.
 * @param {number} [initialDifficultySeconds=45]
 */
export function resetRunState(initialDifficultySeconds = 45) {
  clearAutoAdvance();
  stopTimerInterval();
  lives = 3;
  currentScore = 0;
  currentStreak = 0;
  timeLeft = parseInt(initialDifficultySeconds, 10) || 45;
  isLoadingPuzzle = false;
  isSubmitting = false;
}

/**
 * Starts the countdown interval.
 * Dispatches onTick(timeLeft) every second; invokes onExpire() when timer hits zero.
 * @param {number} durationSeconds
 * @param {(seconds: number) => void} onTick
 * @param {() => void} onExpire
 */
export function startTimerInterval(durationSeconds, onTick, onExpire) {
  clearAutoAdvance();
  stopTimerInterval();

  timeLeft = parseInt(durationSeconds, 10) || 45;

  timerInterval = setInterval(() => {
    timeLeft--;

    if (typeof onTick === 'function') {
      onTick(timeLeft);
    }

    if (timeLeft <= 0) {
      stopTimerInterval();
      if (typeof onExpire === 'function') {
        onExpire();
      }
    }
  }, 1000);
}

/**
 * Clears the active round countdown interval.
 */
export function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export const isTimerActive = () => timerInterval !== null;

/**
 * Schedules a non-blocking round advancement delay, cancelling any pending timeout first.
 * @param {Function} callback
 * @param {number} delayMs
 */
export function scheduleAutoAdvance(callback, delayMs) {
  clearAutoAdvance();
  autoAdvanceTimeout = setTimeout(() => {
    autoAdvanceTimeout = null;
    if (typeof callback === 'function') {
      callback();
    }
  }, delayMs);
}

/**
 * Cancels any active round advancement timeout.
 */
export function clearAutoAdvance() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
}

// Concurrency locks to guard against double-submissions and fetch collisions
export const isLoading = () => isLoadingPuzzle;
export const setIsLoading = (val) => { isLoadingPuzzle = Boolean(val); };

export const isSubmittingGuess = () => isSubmitting;
export const setIsSubmitting = (val) => { isSubmitting = Boolean(val); };
