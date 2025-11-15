/**
 * @fileoverview Audio manager
 * Handles sound effects and music playback using Web Audio API
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * Create audio manager
 * @returns {Object} Audio manager
 */
export function createAudioManager() {
  let audioContext = null;
  let sfxEnabled = gameConfig.audio.sfxEnabled;
  let musicEnabled = gameConfig.audio.musicEnabled;
  let masterVolume = gameConfig.audio.masterVolume;

  // Initialize on first user interaction (required by browsers)
  let initialized = false;

  /**
   * Initialize audio context
   */
  function init() {
    if (initialized) return;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      initialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Play a beep sound (synthesized)
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {string} type - Oscillator type
   */
  function playBeep(frequency, duration, type = 'square') {
    if (!sfxEnabled || !audioContext) return;

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(masterVolume * 0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play beep:', error);
    }
  }

  return {
    /**
     * Initialize audio system
     */
    init,

    /**
     * Play player fire sound
     */
    playPlayerFire() {
      init();
      playBeep(800, 0.1, 'square');
    },

    /**
     * Play enemy explosion sound
     */
    playEnemyExplode() {
      init();
      playBeep(150, 0.2, 'sawtooth');
    },

    /**
     * Play player hit sound
     */
    playPlayerHit() {
      init();
      playBeep(100, 0.4, 'sawtooth');
    },

    /**
     * Play wave start sound
     */
    playWaveStart() {
      init();
      playBeep(600, 0.3, 'sine');
    },

    /**
     * Play game over sound
     */
    playGameOver() {
      init();
      if (!sfxEnabled || !audioContext) return;

      // Descending tone sequence
      playBeep(400, 0.2);
      setTimeout(() => playBeep(300, 0.2), 200);
      setTimeout(() => playBeep(200, 0.4), 400);
    },

    /**
     * Play menu navigate sound
     */
    playMenuNavigate() {
      init();
      playBeep(400, 0.05, 'sine');
    },

    /**
     * Play menu select sound
     */
    playMenuSelect() {
      init();
      playBeep(600, 0.1, 'sine');
    },

    /**
     * Enable/disable sound effects
     * @param {boolean} enabled
     */
    setSfxEnabled(enabled) {
      sfxEnabled = enabled;
    },

    /**
     * Enable/disable music
     * @param {boolean} enabled
     */
    setMusicEnabled(enabled) {
      musicEnabled = enabled;
    },

    /**
     * Set master volume
     * @param {number} volume - Volume (0-1)
     */
    setMasterVolume(volume) {
      masterVolume = Math.max(0, Math.min(1, volume));
    },

    /**
     * Get current settings
     */
    getSettings() {
      return {
        sfxEnabled,
        musicEnabled,
        masterVolume
      };
    }
  };
}
