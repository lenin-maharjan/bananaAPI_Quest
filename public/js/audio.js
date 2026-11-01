// ====================================================
// MODULE: 8-BIT PROCEDURAL AUDIO SYNTHESIZER
// THEME 3: EVENT-DRIVEN PROGRAMMING (WEB AUDIO API SYNTH)
// ====================================================

export let audioCtx = null;
export let masterGainNode = null;
let isAudioMuted = false;
let sfxEnabled = true;

/**
 * Initializes or wakes up the Web Audio API AudioContext and Master Gain Node
 * @param {number} [volumePercent=80] - Current volume level 0 to 100
 */
export function ensureAudioContext(volumePercent = 80) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioCtx.createGain();
    masterGainNode.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const vol = (volumePercent / 100);
  masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
}

/**
 * Sets the master volume level
 * @param {number} volumePercent - Value between 0 and 100
 */
export function setAudioVolume(volumePercent) {
  if (audioCtx && masterGainNode) {
    const vol = Math.max(0, Math.min(100, volumePercent)) / 100;
    masterGainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
  }
}

/**
 * Sets whether arcade sound effects are globally muted
 * @param {boolean} muted
 */
export function setAudioMuted(muted) {
  isAudioMuted = Boolean(muted);
}

/**
 * Sets whether arcade sound effects are enabled via DIP switches
 * @param {boolean} enabled
 */
export function setSfxEnabled(enabled) {
  sfxEnabled = Boolean(enabled);
}

/**
 * Synthesizes vintage 8-bit arcade sound effects in real-time
 * @param {'click'|'coin'|'correct'|'wrong'|'gameover'|'tick'|'streak'} type
 * @param {object} [options]
 */
export function playArcadeSound(type, options = {}) {
  const muted = options.isMuted !== undefined ? options.isMuted : isAudioMuted;
  const enabled = options.sfxEnabled !== undefined ? options.sfxEnabled : sfxEnabled;

  if (muted || !enabled) return;

  try {
    ensureAudioContext(options.volume !== undefined ? options.volume : 80);
    const now = audioCtx.currentTime;

    // TYPE 1: CLICK / TACTILE KEYPAD BUTTON
    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start(now);
      osc.stop(now + 0.04);
    }

    // TYPE 2: COIN INSERT CHIME (Two-tone high pitch)
    else if (type === 'coin') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(987.77, now);
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(masterGainNode);
      osc1.start(now);
      osc1.stop(now + 0.08);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    }

    // TYPE 3: CORRECT ANSWER (Triumphant power-up arpeggio)
    else if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.07);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now + idx * 0.07);
        osc.stop(now + (idx + 1) * 0.07);
      });
    }

    // TYPE 4: WRONG ANSWER (Low-pitched hurt buzz)
    else if (type === 'wrong') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    // TYPE 5: GAME OVER (Classic descending sad chords)
    else if (type === 'gameover') {
      const pitches = [440, 370, 311, 220];
      pitches.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0.2, now + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.14);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now + idx * 0.14);
        osc.stop(now + (idx + 1) * 0.14);
      });
    }

    // TYPE 6: PANIC TICK (< 10s Timer Warning Beep)
    else if (type === 'tick') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGainNode);
      osc.start(now);
      osc.stop(now + 0.04);
    }

    // TYPE 7: COMBO STREAK FANFARE (High ascending celebratory chime)
    else if (type === 'streak') {
      const streakPitches = [784, 988, 1175, 1568]; // G5, B5, D6, G6
      streakPitches.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1) * 0.05);
        osc.connect(gain);
        gain.connect(masterGainNode);
        osc.start(now + idx * 0.05);
        osc.stop(now + (idx + 1) * 0.05);
      });
    }
  } catch (e) {
    // Gracefully ignore audio errors if browser blocks sound
  }
}
