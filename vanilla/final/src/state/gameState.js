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
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
}

/**
 * Add score with multiplier
 * @param {GameState} state - Game state
 * @param {number} points - Base points to add
 */
export function addScore(state, points) {
  const { scoreMultiplier } = gameConfig.difficulty[state.difficulty];
  const levelMult = Math.pow(gameConfig.difficulty.levelProgression.scoreMultiplier, state.level);
  state.score += Math.floor(points * scoreMultiplier * levelMult);
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

  const { depletionRate } = gameConfig.player.energy;
  state.energy -= depletionRate * dt;

  // Clamp to zero
  if (state.energy < 0) {
    state.energy = 0;
    return true; // Out of energy!
  }

  return false;
}

/**
 * Refill energy (when starting new wave or gaining life)
 * @param {GameState} state - Game state
 */
export function refillEnergy(state) {
  state.energy = state.maxEnergy;
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

  // Refill energy for next wave
  refillEnergy(state);

  // Reset wave tracking
  state.enemiesKilled = 0;
  state.waveComplete = false;
  state.perfectWave = true;
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
  state.enemies = [];
  state.enemyBullets = [];
}
