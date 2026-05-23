/**
 * @fileoverview Wave management system
 * Spawns and manages enemy waves
 */

import { getWaveByIndex } from '../config/wavesExpanded.js';
import { createEnemy } from '../entities/enemyExpanded.js';

// All ABSURD MODE enemy keys for randomization
const ABSURD_ENEMIES = [
  'wave1', 'wave2', 'wave3', 'wave4', 'wave5', 'wave6', 'wave7', 'wave8',
  'wave9', 'wave10', 'wave11', 'wave12', 'wave13', 'wave14', 'wave15',
  'toilet', 'loading', 'skull', 'mcdonalds', 'plunger', 'pumpkin',
  'bitcoin', 'doge', 'coffee', 'error404', 'cowboyhat', 'chili', 'martini', 'stonks'
];

/**
 * Start a new wave
 * @param {Object} state - Game state
 * @param {Object} adjustedConfig - Difficulty-adjusted configuration
 * @param {string} themeName - Current theme name for enemy randomization
 */
export function startWave(state, adjustedConfig, themeName = '') {
  const waveConfig = getWaveByIndex(state.currentWaveIndex);

  // ABSURD MODE: Randomize enemy for this wave! 🎲
  if (themeName === 'absurd') {
    const randomEnemy = ABSURD_ENEMIES[Math.floor(Math.random() * ABSURD_ENEMIES.length)];
    waveConfig.themeKey = randomEnemy;
    console.log(`🌭 ABSURD WAVE ${state.currentWaveIndex + 1}: ${randomEnemy}`);
  }

  state.waveStartTime = state.gameTime;
  state.lastEnemySpawnTime = state.gameTime - 999; // Allow immediate spawn
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
  state.enemies = [];
  state.currentWave = waveConfig;

  // Wait for formation delay before spawning
  state.waveFormationComplete = false;
}

/**
 * Update wave spawning and progression
 * @param {Object} state - Game state
 * @param {number} dt - Delta time in seconds
 * @param {Object} adjustedConfig - Difficulty-adjusted configuration
 */
export function updateWaveManager(state, dt, adjustedConfig) {
  if (!state.currentWave) return;

  const waveConfig = state.currentWave;
  const timeSinceWaveStart = state.gameTime - state.waveStartTime;

  // Wait for formation delay
  if (!state.waveFormationComplete) {
    if (timeSinceWaveStart * 1000 >= waveConfig.formationDelay) {
      state.waveFormationComplete = true;
    }
    return;
  }

  // Spawn enemies
  if (!state.spawnComplete) {
    const spawnInterval = waveConfig.spawnInterval * adjustedConfig.spawnIntervalMult;
    const timeSinceLastSpawn = (state.gameTime - state.lastEnemySpawnTime) * 1000;

    if (timeSinceLastSpawn >= spawnInterval && state.enemiesSpawned < waveConfig.count) {
      const enemy = createEnemy(
        waveConfig,
        state.enemiesSpawned,
        adjustedConfig.enemySpeedMult,
        adjustedConfig.enemyFireRateMult
      );
      state.enemies.push(enemy);
      state.enemiesSpawned++;
      state.lastEnemySpawnTime = state.gameTime;
    }

    if (state.enemiesSpawned >= waveConfig.count) {
      state.spawnComplete = true;
    }
  }

  // Check wave completion - all enemies must be cleared
  // This is more robust than just checking kills (handles edge cases)
  if (state.spawnComplete && state.enemies.length === 0 && state.enemiesKilled > 0) {
    state.waveComplete = true;
  }
}

/**
 * Check if all enemies are cleared
 * @param {Object} state - Game state
 * @returns {boolean} True if wave is clear
 */
export function isWaveCleared(state) {
  return state.spawnComplete && state.enemies.length === 0;
}

/**
 * Get wave progress (0-1)
 * @param {Object} state - Game state
 * @returns {number} Progress ratio
 */
export function getWaveProgress(state) {
  if (!state.currentWave) return 0;
  return state.enemiesKilled / state.currentWave.requiredKills;
}

/**
 * Compute the first `count` spawn positions for a wave config, for use by
 * the wave-start telegraph in playScene. Pure: no side effects on shared
 * state. Returns [{ x, y, themeKey }, ...]. Y is overridden to a visible
 * value (just below the HUD) since createEnemy starts enemies off-screen.
 */
export function previewFormation(waveConfig, count = 8) {
  if (!waveConfig) return [];
  const n = Math.min(count, waveConfig.count || count);
  const previews = [];
  for (let i = 0; i < n; i++) {
    const enemy = createEnemy(waveConfig, i, 1, 1);
    previews.push({
      x: enemy.x,
      // Show ghosts at a visible y just below the HUD instead of off-screen.
      y: 80,
      themeKey: enemy.themeKey
    });
  }
  return previews;
}
