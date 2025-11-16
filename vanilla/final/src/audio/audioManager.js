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

  // Background music state (HTML5 Audio for file playback)
  let musicAudio = null;
  let musicLoaded = false;

  // Track current theme for absurd mode sounds
  let currentTheme = 'classic';

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
   * ABSURD MODE SOUNDS - Maximum chaos! 🌭
   */

  function playAbsurdPlayerFire() {
    // "Pew pew" but make it silly
    playBeep(1200, 0.05, 'sine');
    setTimeout(() => playBeep(800, 0.05, 'sine'), 50);
    // Add a little "boing" at the end
    setTimeout(() => playBeep(1500, 0.03, 'triangle'), 100);
  }

  function playAbsurdEnemyExplode() {
    // Cartoonish explosion with ascending pitches (opposite of normal)
    const sounds = [
      { freq: 100, type: 'sawtooth' },
      { freq: 200, type: 'square' },
      { freq: 400, type: 'sine' },
      { freq: 800, type: 'triangle' }
    ];

    sounds.forEach((sound, i) => {
      setTimeout(() => playBeep(sound.freq, 0.08, sound.type), i * 40);
    });

    // Add a silly "pop" at the end
    setTimeout(() => playBeep(1200, 0.05, 'sine'), 200);
  }

  function playAbsurdPlayerDeath() {
    // Sad trombone / game show fail sound
    playBeep(400, 0.3, 'sawtooth');
    setTimeout(() => playBeep(350, 0.3, 'sawtooth'), 250);
    setTimeout(() => playBeep(300, 0.3, 'sawtooth'), 500);
    setTimeout(() => playBeep(200, 0.5, 'sawtooth'), 750);

    // Add a "womp womp womp" effect
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => playBeep(150 - i * 20, 0.1, 'triangle'), i * 150);
      }
    }, 1200);
  }

  function playAbsurdWaveStart() {
    // Silly fanfare / achievement sound
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      setTimeout(() => playBeep(freq, 0.15, 'sine'), i * 80);
    });

    // Add a glitchy descending sound at the end
    setTimeout(() => {
      playBeep(900, 0.1, 'square');
      setTimeout(() => playBeep(700, 0.1, 'square'), 50);
    }, 350);
  }

  function playAbsurdEnergyRefill() {
    // Power-up sound with weird glitch
    playBeep(300, 0.08, 'triangle');
    setTimeout(() => playBeep(500, 0.08, 'triangle'), 40);
    setTimeout(() => playBeep(700, 0.08, 'triangle'), 80);
    setTimeout(() => playBeep(1000, 0.15, 'sine'), 120);

    // Glitchy wobble
    setTimeout(() => {
      playBeep(950, 0.05, 'square');
      setTimeout(() => playBeep(1050, 0.05, 'square'), 30);
      setTimeout(() => playBeep(1000, 0.1, 'sine'), 60);
    }, 280);
  }

  function playAbsurdMenuSelect() {
    // Quirky menu sound
    playBeep(800, 0.05, 'sine');
    setTimeout(() => playBeep(1200, 0.08, 'triangle'), 50);
    setTimeout(() => playBeep(900, 0.05, 'sine'), 130);
  }

  /**
   * Initialize background music (load audio file)
   */
  function initMusic() {
    if (musicAudio) return; // Already initialized

    try {
      musicAudio = new Audio();
      musicAudio.src = gameConfig.audio.musicFile;
      musicAudio.loop = true;
      musicAudio.volume = masterVolume * gameConfig.audio.musicVolume;

      // Preload music
      musicAudio.load();

      musicAudio.addEventListener('canplaythrough', () => {
        musicLoaded = true;
        console.log('Background music loaded:', gameConfig.audio.musicFile);
      });

      musicAudio.addEventListener('error', (e) => {
        console.warn('Failed to load background music file:', gameConfig.audio.musicFile);
        console.warn('Music will not play. Add a music file to enable background music.');
      });
    } catch (error) {
      console.warn('Failed to initialize music:', error);
    }
  }

  /**
   * Start background music playback
   */
  function startBackgroundMusic() {
    if (!musicEnabled) return;

    initMusic();

    if (musicAudio && musicLoaded) {
      try {
        musicAudio.currentTime = 0; // Start from beginning
        musicAudio.play().catch(err => {
          console.warn('Failed to play music (user interaction required):', err);
        });
      } catch (error) {
        console.warn('Failed to start background music:', error);
      }
    }
  }

  /**
   * Stop background music
   */
  function stopBackgroundMusic() {
    if (musicAudio) {
      try {
        musicAudio.pause();
        musicAudio.currentTime = 0;
      } catch (error) {
        console.warn('Failed to stop music:', error);
      }
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
      if (currentTheme === 'absurd') {
        playAbsurdPlayerFire();
      } else {
        playBeep(800, 0.1, 'square');
      }
    },

    /**
     * Play enemy explosion sound
     */
    playEnemyExplode() {
      init();
      if (currentTheme === 'absurd') {
        playAbsurdEnemyExplode();
      } else {
        playBeep(150, 0.2, 'sawtooth');
      }
    },

    /**
     * Play player hit sound
     */
    playPlayerHit() {
      init();
      playBeep(100, 0.4, 'sawtooth');
    },

    /**
     * Play player death/explosion sound
     */
    playPlayerDeath() {
      init();
      if (!sfxEnabled || !audioContext) return;

      if (currentTheme === 'absurd') {
        playAbsurdPlayerDeath();
      } else {
        // Dramatic descending explosion
        playBeep(300, 0.15, 'sawtooth');
        setTimeout(() => playBeep(200, 0.15, 'sawtooth'), 100);
        setTimeout(() => playBeep(100, 0.3, 'sawtooth'), 200);
        setTimeout(() => playBeep(50, 0.4, 'sawtooth'), 350);
      }
    },

    /**
     * Play wave start sound
     */
    playWaveStart() {
      init();
      if (currentTheme === 'absurd') {
        playAbsurdWaveStart();
      } else {
        playBeep(600, 0.3, 'sine');
      }
    },

    /**
     * Play energy refill sound (rising tone)
     */
    playEnergyRefill() {
      init();
      if (!sfxEnabled || !audioContext) return;

      if (currentTheme === 'absurd') {
        playAbsurdEnergyRefill();
      } else {
        // Rising tone for excitement!
        playBeep(200, 0.1, 'sine');
        setTimeout(() => playBeep(300, 0.1, 'sine'), 50);
        setTimeout(() => playBeep(400, 0.1, 'sine'), 100);
        setTimeout(() => playBeep(600, 0.2, 'sine'), 150);
      }
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
     * Play extra life sound
     */
    playExtraLife() {
      init();
      if (!sfxEnabled || !audioContext) return;

      // Celebratory ascending fanfare
      playBeep(400, 0.1, 'sine');
      setTimeout(() => playBeep(500, 0.1, 'sine'), 100);
      setTimeout(() => playBeep(600, 0.1, 'sine'), 200);
      setTimeout(() => playBeep(800, 0.2, 'triangle'), 300);
      setTimeout(() => playBeep(1000, 0.3, 'sine'), 500);
    },

    /**
     * Play power-up collection sound
     */
    playPowerUp() {
      init();
      if (!sfxEnabled || !audioContext) return;

      // Magical ascending chime
      playBeep(600, 0.08, 'sine');
      setTimeout(() => playBeep(800, 0.08, 'triangle'), 60);
      setTimeout(() => playBeep(1000, 0.08, 'sine'), 120);
      setTimeout(() => playBeep(1200, 0.12, 'triangle'), 180);
      setTimeout(() => playBeep(1500, 0.15, 'sine'), 240);

      // Add sparkle effect
      setTimeout(() => {
        playBeep(1800, 0.05, 'sine');
        setTimeout(() => playBeep(2000, 0.05, 'sine'), 30);
      }, 360);
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
      if (currentTheme === 'absurd') {
        playAbsurdMenuSelect();
      } else {
        playBeep(600, 0.1, 'sine');
      }
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
      if (musicAudio) {
        musicAudio.volume = masterVolume * gameConfig.audio.musicVolume;
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
    },

    /**
     * Set current theme (for absurd mode sounds)
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
      currentTheme = theme;
    }
  };
}
