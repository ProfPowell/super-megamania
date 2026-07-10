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
   * Randomly detune a frequency by ±pct so repeated sounds don't fatigue.
   * @param {number} freq - Base frequency in Hz
   * @param {number} pct - Max deviation fraction (default 6%)
   * @returns {number} Detuned frequency
   */
  function vary(freq, pct = 0.06) {
    return freq * (1 + (Math.random() * 2 - 1) * pct);
  }

  /**
   * ABSURD MODE SOUNDS - Maximum chaos! 🌭
   */

  function playAbsurdPlayerFire() {
    // "Pew pew" but make it silly — detuned per shot so mashing fire
    // doesn't sound like a metronome
    playBeep(vary(1200), 0.05, 'sine');
    setTimeout(() => playBeep(vary(800), 0.05, 'sine'), 50);
    // Add a little "boing" at the end
    setTimeout(() => playBeep(vary(1500), 0.03, 'triangle'), 100);
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
      setTimeout(() => playBeep(vary(sound.freq), 0.08, sound.type), i * 40);
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
   * AUDIO PASS - micromode stingers + event flavor 🔊
   */

  function playMicroModeStartSting() {
    // Glitchy "we interrupt this program" — stuttering square drops,
    // then an attention-grabbing rising blip
    playBeep(900, 0.04, 'square');
    setTimeout(() => playBeep(600, 0.04, 'square'), 60);
    setTimeout(() => playBeep(900, 0.04, 'square'), 120);
    setTimeout(() => playBeep(400, 0.06, 'square'), 180);
    setTimeout(() => playBeep(500, 0.08, 'triangle'), 280);
    setTimeout(() => playBeep(800, 0.08, 'triangle'), 360);
    setTimeout(() => playBeep(1300, 0.12, 'sine'), 440);
  }

  function playMicroModeSuccessSting() {
    // "Ta-da!" — two-chord fanfare with a sparkle tail
    playBeep(523, 0.12, 'triangle');   // C5
    playBeep(659, 0.12, 'triangle');   // E5
    setTimeout(() => {
      playBeep(784, 0.2, 'triangle');  // G5
      playBeep(1047, 0.2, 'sine');     // C6
    }, 140);
    setTimeout(() => playBeep(1568, 0.06, 'sine'), 380);
    setTimeout(() => playBeep(2093, 0.08, 'sine'), 440);
  }

  function playMicroModeFailSting() {
    // Mini womp-womp — shorter and lighter than the death trombone,
    // because failing a micromode costs nothing
    playBeep(300, 0.15, 'sawtooth');
    setTimeout(() => playBeep(250, 0.2, 'sawtooth'), 180);
  }

  function playComboMilestoneSting(combo) {
    // Ascending arpeggio whose base pitch climbs with the combo, so a
    // 25-chain audibly outranks a 5-chain (capped to stay musical)
    const base = 400 + Math.min(combo, 30) * 20;
    playBeep(base, 0.06, 'triangle');
    setTimeout(() => playBeep(base * 1.25, 0.06, 'triangle'), 60);
    setTimeout(() => playBeep(base * 1.5, 0.1, 'sine'), 120);
  }

  function playComboBrokenSting() {
    // Short deflating buzz — noticeable but not punishing
    playBeep(220, 0.08, 'sawtooth');
    setTimeout(() => playBeep(160, 0.12, 'sawtooth'), 70);
  }

  function playEnemyEscapedBlip() {
    // Sad little "he got away" blip
    playBeep(350, 0.06, 'triangle');
    setTimeout(() => playBeep(260, 0.1, 'triangle'), 70);
  }

  function playPerfectBonusFanfare() {
    // The big one — perfect bonus deserves a full victory lap
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C-E-G-C-E-G climb
    notes.forEach((freq, i) => {
      setTimeout(() => playBeep(freq, 0.12, 'triangle'), i * 70);
    });
    setTimeout(() => {
      playBeep(1047, 0.35, 'sine');
      playBeep(1319, 0.35, 'sine');
      playBeep(1568, 0.35, 'triangle');
    }, notes.length * 70 + 60);
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
     * Play energy drain sound (subtle tick)
     */
    playEnergyDrain() {
      init();
      if (!sfxEnabled || !audioContext) return;

      // Subtle descending tick
      playBeep(300, 0.02, 'square');
      setTimeout(() => playBeep(250, 0.02, 'square'), 30);
    },

    /**
     * Play energy conversion sound (scoring bonus)
     */
    playEnergyBonus() {
      init();
      if (!sfxEnabled || !audioContext) return;

      // Rising chime for bonus points
      playBeep(500, 0.08, 'sine');
      setTimeout(() => playBeep(700, 0.08, 'triangle'), 60);
      setTimeout(() => playBeep(900, 0.08, 'sine'), 120);
      setTimeout(() => playBeep(1100, 0.1, 'triangle'), 180);
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
     * Play micromode interrupt sting (Absurd-mode interludes)
     */
    playMicroModeStart() {
      init();
      if (!sfxEnabled || !audioContext) return;
      playMicroModeStartSting();
    },

    /**
     * Play micromode success "ta-da"
     */
    playMicroModeSuccess() {
      init();
      if (!sfxEnabled || !audioContext) return;
      playMicroModeSuccessSting();
    },

    /**
     * Play micromode fail mini womp-womp
     */
    playMicroModeFail() {
      init();
      if (!sfxEnabled || !audioContext) return;
      playMicroModeFailSting();
    },

    /**
     * Play combo milestone chime (pitch scales with combo)
     * @param {number} combo - Current combo count
     */
    playComboMilestone(combo) {
      init();
      if (!sfxEnabled || !audioContext) return;
      playComboMilestoneSting(combo);
    },

    /**
     * Play combo broken sound
     */
    playComboBroken() {
      init();
      if (!sfxEnabled || !audioContext) return;
      playComboBrokenSting();
    },

    /**
     * Play enemy escaped blip
     */
    playEnemyEscaped() {
      init();
      if (!sfxEnabled || !audioContext) return;
      playEnemyEscapedBlip();
    },

    /**
     * Play perfect-bonus fanfare
     */
    playPerfectBonus() {
      init();
      if (!sfxEnabled || !audioContext) return;
      playPerfectBonusFanfare();
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
