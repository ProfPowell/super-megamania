/**
 * @fileoverview Wave management system
 * Spawns and manages enemy waves
 */

import { getWaveByIndex } from '../config/wavesExpanded.js';
import { createEnemy } from '../entities/enemyExpanded.js';

/**
 * Start a new wave
 * @param {Object} state - Game state
 * @param {Object} adjustedConfig - Difficulty-adjusted configuration
 */
export function startWave(state, adjustedConfig) {
  const waveConfig = getWaveByIndex(state.currentWaveIndex);

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
