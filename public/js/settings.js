// ====================================================
// File: public/js/settings.js
// Author: Lenin Maharjan (Student ID: 2425736)
// Module: CIS046-3 Software for Enterprise AY 26/27
//
// Authorship & AI Assistance Disclosure:
// - Architecture, domain encapsulation, and storage contracts designed by the Author.
// - Implementation drafted and refactored with generative AI assistance
//   (Gemini 3.8 / Google Antigravity IDE).
// - All logic manually reviewed, debugged, and verified by the Author.
//
// External References & Documentation:
// - HTML5 Web Storage API (localStorage): https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
// ====================================================

/**
 * Default arcade cabinet hardware DIP switch configuration.
 */
export const DEFAULT_SETTINGS = Object.freeze({
  sfxEnabled: true,
  volume: 80,
  timerDifficulty: 45,
  crtEnabled: true,
  vfxEnabled: true,
  simulateOutage: false
});

const STORAGE_KEY = 'banana_quest_arcade_settings';

/**
 * Active in-memory settings state.
 */
let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Loads persisted DIP switch preferences from localStorage,
 * gracefully falling back to defaults if parsing fails.
 * @returns {typeof DEFAULT_SETTINGS}
 */
export function loadSavedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } else {
      currentSettings = { ...DEFAULT_SETTINGS };
    }
  } catch (err) {
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  return { ...currentSettings };
}

/**
 * Serializes the current settings object into localStorage.
 * @param {object} [customSettings] - Optional settings object to persist.
 */
export function saveSettingsToStorage(customSettings = null) {
  if (customSettings && typeof customSettings === 'object') {
    currentSettings = { ...currentSettings, ...customSettings };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  } catch (err) {
    // Gracefully handle storage quota or privacy mode restrictions
  }
}

/**
 * Returns a cloned snapshot of the current settings.
 * @returns {typeof DEFAULT_SETTINGS}
 */
export function getSettings() {
  return { ...currentSettings };
}

/**
 * Updates a single setting property in memory.
 * @param {string} key
 * @param {any} value
 */
export function updateSetting(key, value) {
  if (key in currentSettings) {
    currentSettings[key] = value;
  }
}

/**
 * Replaces the current settings state.
 * @param {object} newSettings
 */
export function setSettings(newSettings) {
  if (newSettings && typeof newSettings === 'object') {
    currentSettings = { ...DEFAULT_SETTINGS, ...newSettings };
  }
}

// Convenient typed getters
export const isSfxEnabled = () => Boolean(currentSettings.sfxEnabled);
export const getVolume = () => parseInt(currentSettings.volume, 10) || 80;
export const getTimerDifficulty = () => parseInt(currentSettings.timerDifficulty, 10) || 45;
export const isCrtEnabled = () => Boolean(currentSettings.crtEnabled);
export const isVfxEnabled = () => Boolean(currentSettings.vfxEnabled);
export const isSimulateOutage = () => Boolean(currentSettings.simulateOutage);

// Convenient mutators
export function toggleSimulateOutage() {
  currentSettings.simulateOutage = !currentSettings.simulateOutage;
  return currentSettings.simulateOutage;
}

export function setSimulateOutage(value) {
  currentSettings.simulateOutage = Boolean(value);
}

export function toggleSfxEnabled() {
  currentSettings.sfxEnabled = !currentSettings.sfxEnabled;
  return currentSettings.sfxEnabled;
}

export function toggleCrtEnabled() {
  currentSettings.crtEnabled = !currentSettings.crtEnabled;
  return currentSettings.crtEnabled;
}

export function toggleVfxEnabled() {
  currentSettings.vfxEnabled = !currentSettings.vfxEnabled;
  return currentSettings.vfxEnabled;
}
