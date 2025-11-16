/**
 * @fileoverview Game state management
 * Central state object for the entire game
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * Game states enum
 */
export const GameStates = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  HIGH_SCORES: 'HIGH_SCORES',
  SETTINGS: 'SETTINGS',
  HELP: 'HELP'
};

/**
 * @typedef {Object} GameState
 * @property {string} currentState - Current game state
 * @property {number} score - Current score
 * @property {number} lives - Remaining lives
 * @property {number} energy - Current energy (depletes over time)
 * @property {number} maxEnergy - Maximum energy capacity
 * @property {number} level - Current level (0-indexed)
 * @property {number} currentWaveIndex - Current wave index
 * @property {number} enemiesKilled - Enemies killed in current wave
 * @property {boolean} waveComplete - Wave completion flag
 * @property {number} waveBonus - Bonus points for wave completion
 * @property {number} energyBonus - Bonus points from remaining energy
 * @property {boolean} perfectWave - No hits taken this wave
 * @property {string} difficulty - Current difficulty setting
 * @property {Object} player - Player entity reference
 * @property {Array} enemies - Active enemies
 * @property {Array} playerBullets - Player projectiles
 * @property {Array} enemyBullets - Enemy projectiles
 * @property {Array} particles - Visual effects particles
 * @property {number} gameTime - Total game time in seconds
 */

/**
 * Create initial game state
 * @param {string} difficulty - Difficulty setting
 * @returns {GameState} Initial state
 */
export function createGameState(difficulty = 'normal') {
  return {
    currentState: GameStates.LOADING,
    score: 0,
    lives: gameConfig.player.initialLives,
    nextExtraLifeScore: 20000,  // Award extra life at this score
    energy: gameConfig.player.energy.maxEnergy,
    maxEnergy: gameConfig.player.energy.maxEnergy,
    level: 0,
    currentWaveIndex: 0,
    enemiesKilled: 0,
    waveComplete: false,
    waveBonus: 0,
    energyBonus: 0,
    perfectWave: true,
    difficulty,

    // Entity collections
    player: null,
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    particles: [],

    // Timing
    gameTime: 0,
    waveStartTime: 0,
    lastEnemySpawnTime: 0,
    energyDepletionTimer: 0,  // Timer before energy starts depleting

    // Energy animation
    energyAnimating: false,
    energyAnimationTarget: gameConfig.player.energy.maxEnergy,
    energyAnimationSpeed: 2000, // Points per second during animation

    // Wave spawning
    enemiesSpawned: 0,
    spawnComplete: false
  };
}

/**
 * Reset game state for new game
 * @param {GameState} state - Game state to reset
 * @param {string} difficulty - Difficulty setting
 */
export function resetGameState(state, difficulty) {
  state.currentState = GameStates.PLAYING;
  state.score = 0;
  state.lives = gameConfig.player.initialLives;
  state.nextExtraLifeScore = 20000;  // Reset extra life threshold
  state.energy = gameConfig.player.energy.maxEnergy;
  state.maxEnergy = gameConfig.player.energy.maxEnergy;
  state.level = 0;
  state.currentWaveIndex = 0;
  state.enemiesKilled = 0;
  state.waveComplete = false;
  state.waveBonus = 0;
  state.energyBonus = 0;
  state.perfectWave = true;
  state.difficulty = difficulty;

  state.enemies = [];
  state.playerBullets = [];
  state.enemyBullets = [];
  state.particles = [];

  state.gameTime = 0;
  state.waveStartTime = 0;
  state.lastEnemySpawnTime = 0;
  state.energyDepletionTimer = 0;
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
}

/**
 * Add score with multiplier
 * @param {GameState} state - Game state
 * @param {number} points - Base points to add
 * @returns {boolean} True if extra life was awarded
 */
export function addScore(state, points) {
  const oldScore = state.score;
  const { scoreMultiplier } = gameConfig.difficulty[state.difficulty];
  const levelMult = Math.pow(gameConfig.difficulty.levelProgression.scoreMultiplier, state.level);
  state.score += Math.floor(points * scoreMultiplier * levelMult);

  // Check if we crossed an extra life threshold (every 20,000 points)
  if (state.score >= state.nextExtraLifeScore && oldScore < state.nextExtraLifeScore) {
    state.lives++;
    state.nextExtraLifeScore += 20000;  // Set next threshold
    return true;  // Extra life awarded!
  }

  return false;
}

/**
 * Decrement lives and check game over
 * @param {GameState} state - Game state
 * @returns {boolean} True if game over
 */
export function loseLife(state) {
  state.lives--;
  state.perfectWave = false;
  return state.lives <= 0;
}

/**
 * Deplete energy over time
 * @param {GameState} state - Game state
 * @param {number} dt - Delta time in seconds
 * @returns {boolean} True if energy ran out (lose life)
 */
export function depleteEnergy(state, dt) {
  if (state.currentState !== GameStates.PLAYING) return false;

  // STOP depleting when wave is complete!
  if (state.waveComplete) return false;

  const { depletionRate, startDelay } = gameConfig.player.energy;

  // Increment timer
  state.energyDepletionTimer += dt;

  // Don't start depleting until after the delay
  if (state.energyDepletionTimer < startDelay) {
    return false;
  }

  // Now deplete energy
  state.energy -= depletionRate * dt;

  // Clamp to zero
  if (state.energy < 0) {
    state.energy = 0;
    return true; // Out of energy!
  }

  return false;
}

/**
 * Start animated energy refill
 * @param {GameState} state - Game state
 */
export function startEnergyRefill(state) {
  state.energyAnimating = true;
  state.energyAnimationTarget = state.maxEnergy;
  state.energyDepletionTimer = 0;  // Reset timer so energy doesn't start depleting immediately
}

/**
 * Update energy animation (call each frame)
 * @param {GameState} state - Game state
 * @param {number} dt - Delta time in seconds
 * @returns {boolean} True if animation just completed
 */
export function updateEnergyAnimation(state, dt) {
  if (!state.energyAnimating) return false;

  const diff = state.energyAnimationTarget - state.energy;

  if (Math.abs(diff) < 10) {
    // Close enough - snap to target
    state.energy = state.energyAnimationTarget;
    state.energyAnimating = false;
    return true; // Animation completed!
  }

  // Animate towards target
  const step = state.energyAnimationSpeed * dt;
  if (diff > 0) {
    // Filling up
    state.energy = Math.min(state.energy + step, state.energyAnimationTarget);
  } else {
    // Draining down
    state.energy = Math.max(state.energy + diff * 5 * dt, state.energyAnimationTarget);
  }

  return false;
}

/**
 * Refill energy instantly (for immediate needs)
 * @param {GameState} state - Game state
 */
export function refillEnergy(state) {
  state.energy = state.maxEnergy;
  state.energyDepletionTimer = 0;
  state.energyAnimating = false;
}

/**
 * Calculate energy bonus points
 * @param {GameState} state - Game state
 * @returns {number} Bonus points from remaining energy
 */
export function calculateEnergyBonus(state) {
  const { bonusPointsMultiplier } = gameConfig.player.energy;
  return Math.floor(state.energy * bonusPointsMultiplier);
}

/**
 * Advance to next wave
 * @param {GameState} state - Game state
 * @param {number} totalWaves - Total number of waves
 */
export function nextWave(state, totalWaves = 15) {
  state.currentWaveIndex++;

  // Check if completed full cycle (all waves)
  if (state.currentWaveIndex >= totalWaves) {
    state.currentWaveIndex = 0;
    state.level++;
  }

  // Award wave completion bonus
  if (state.perfectWave) {
    state.waveBonus = 50;
    addScore(state, state.waveBonus);
  }

  // Award energy bonus (remaining energy converts to points!)
  state.energyBonus = calculateEnergyBonus(state);
  if (state.energyBonus > 0) {
    addScore(state, state.energyBonus);
  }

  // Energy refill is handled via animation during inter-wave pause
  // (no instant refill here)

  // Reset wave tracking
  state.enemiesKilled = 0;
  state.waveComplete = false;
  state.perfectWave = true;
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
  state.enemies = [];
  state.enemyBullets = [];
}
