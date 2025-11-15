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

  // Background music state
  let musicOscillators = [];
  let musicGainNode = null;
  let musicPlaying = false;
  let musicLoopId = null;

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

  /**
   * Start background music loop
   * Simple procedurally generated music using oscillators
   */
  function startBackgroundMusic() {
    if (!musicEnabled || !audioContext || musicPlaying) return;

    try {
      init();
      stopBackgroundMusic(); // Stop any existing music first

      // Create gain node for music volume control
      musicGainNode = audioContext.createGain();
      musicGainNode.connect(audioContext.destination);
      musicGainNode.gain.value = masterVolume * gameConfig.audio.musicVolume * 0.3;

      // Simple 4-note bass line loop (C2, G1, A1, F1)
      const bassNotes = [65.41, 49.00, 55.00, 43.65]; // Hz
      const beatDuration = 0.5; // seconds per note

      let beatIndex = 0;

      function playNextBeat() {
        if (!musicEnabled || !audioContext) return;

        const osc = audioContext.createOscillator();
        const noteGain = audioContext.createGain();

        osc.connect(noteGain);
        noteGain.connect(musicGainNode);

        osc.type = 'triangle';
        osc.frequency.value = bassNotes[beatIndex % bassNotes.length];

        const now = audioContext.currentTime;
        noteGain.gain.setValueAtTime(0.3, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + beatDuration);

        osc.start(now);
        osc.stop(now + beatDuration);

        beatIndex++;

        // Schedule next beat
        musicLoopId = setTimeout(playNextBeat, beatDuration * 1000);
      }

      playNextBeat();
      musicPlaying = true;
    } catch (error) {
      console.warn('Failed to start background music:', error);
    }
  }

  /**
   * Stop background music
   */
  function stopBackgroundMusic() {
    if (musicLoopId) {
      clearTimeout(musicLoopId);
      musicLoopId = null;
    }

    musicPlaying = false;
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
      if (enabled) {
        startBackgroundMusic();
      } else {
        stopBackgroundMusic();
      }
    },

    /**
     * Start background music
     */
    startMusic() {
      if (musicEnabled) {
        startBackgroundMusic();
      }
    },

    /**
     * Stop background music
     */
    stopMusic() {
      stopBackgroundMusic();
    },

    /**
     * Set master volume
     * @param {number} volume - Volume (0-1)
     */
    setMasterVolume(volume) {
      masterVolume = Math.max(0, Math.min(1, volume));
      if (musicGainNode) {
        musicGainNode.gain.value = masterVolume * gameConfig.audio.musicVolume * 0.3;
      }
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
