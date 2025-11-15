/**
 * @fileoverview Main game configuration
 * Defines all game parameters including canvas, player, waves, difficulty, audio, and controls
 */

/**
 * Master game configuration object
 */
export const gameConfig = {
  canvas: {
    width: 640,
    height: 480,
    backgroundColor: '#0a0e27',
    scaleMode: 'fit',
    pixelArt: true,
    maxFPS: 60
  },

  player: {
    width: 32,
    height: 24,
    speed: 250,
    initialLives: 3,
    invincibilityTime: 2000,

    startX: 320,
    startY: 440,
    moveZone: {
      minX: 16,
      maxX: 624,
      minY: 384,
      maxY: 464
    },

    bullet: {
      width: 4,
      height: 12,
      speed: 400,
      cooldown: 300,
      maxActive: 5,
      color: '#ffffff'
    },

    color: '#00ff00',
    hitboxScale: 0.8
  },

  difficulty: {
    easy: {
      playerSpeedMult: 1.2,
      enemySpeedMult: 0.8,
      enemyFireRateMult: 0.7,
      scoreMultiplier: 0.8
    },
    normal: {
      playerSpeedMult: 1.0,
      enemySpeedMult: 1.0,
      enemyFireRateMult: 1.0,
      scoreMultiplier: 1.0
    },
    hard: {
      playerSpeedMult: 1.0,
      enemySpeedMult: 1.3,
      enemyFireRateMult: 1.5,
      scoreMultiplier: 1.5
    },
    levelProgression: {
      speedIncrease: 0.15,
      fireRateIncrease: 0.20,
      spawnIntervalDecrease: 0.10,
      scoreMultiplier: 1.5
    }
  },

  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    sfxEnabled: true,
    musicEnabled: false
  },

  controls: {
    keyboard: {
      moveLeft: ['ArrowLeft', 'KeyA'],
      moveRight: ['ArrowRight', 'KeyD'],
      fire: ['Space', 'KeyW'],
      pause: ['Escape', 'KeyP'],
      restart: ['Enter', 'KeyR']
    }
  },

  ui: {
    hud: {
      font: "14px 'Press Start 2P', monospace",
      color: '#ffffff',
      scorePosition: { x: 10, y: 10 },
      livesPosition: { x: 630, y: 10 },
      wavePosition: { x: 320, y: 10 },
      levelPosition: { x: 320, y: 35 },
      fpsPosition: { x: 10, y: 465 },
      showFPS: false
    }
  },

  storage: {
    keys: {
      highScores: 'megamania_high_scores',
      settings: 'megamania_settings',
      playerName: 'megamania_player_name'
    },
    defaults: {
      playerName: 'AAA',
      difficulty: 'normal',
      audioEnabled: true,
      musicEnabled: false
    }
  }
};

/**
 * Apply difficulty and level modifiers to base config
 * @param {string} difficulty - 'easy' | 'normal' | 'hard'
 * @param {number} level - Current level (0-indexed)
 * @returns {Object} Modified configuration
 */
export function getAdjustedConfig(difficulty, level) {
  const diffMod = gameConfig.difficulty[difficulty];
  const levelMod = gameConfig.difficulty.levelProgression;

  return {
    playerSpeed: gameConfig.player.speed * diffMod.playerSpeedMult,
    enemySpeedMult: diffMod.enemySpeedMult * (1 + level * levelMod.speedIncrease),
    enemyFireRateMult: diffMod.enemyFireRateMult * (1 + level * levelMod.fireRateIncrease),
    spawnIntervalMult: 1 - (level * levelMod.spawnIntervalDecrease),
    scoreMultiplier: diffMod.scoreMultiplier * Math.pow(levelMod.scoreMultiplier, level)
  };
}
