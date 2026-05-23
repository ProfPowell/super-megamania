import {
  startBonusStage,
  updateBonusStage,
  bonusStageEnemyEscaped,
  endBonusStage
} from './_bonusStateMutations.js';
import { createEnemy } from '../entities/enemyExpanded.js';
import { startEnergyRefill } from '../state/gameState.js';
import { Events } from '../app/events.js';

/**
 * Bonus-stage controller. Owns spawning, tick, end, and the three
 * on-screen overlays (announcement / timer / end). Re-exports the
 * pure mutators from _bonusStateMutations.js so callers only import
 * from one module.
 *
 * Side-effect contract: emits BONUS_START on begin, BONUS_END on end
 * with payload { perfect, escaped, score }, and ENEMY_ESCAPED whenever
 * an enemy leaves the play area during the bonus stage.
 */

export { bonusStageEnemyEscaped };

let announceTimer = 0;
let announceAlpha = 0;
let endTimer = 0;
let endAlpha = 0;
let endPerfect = false;
let skipNextWaveAfterBonus = false;

export function shouldSkipNextWave() {
  return skipNextWaveAfterBonus;
}
export function consumeSkipNextWave() {
  const v = skipNextWaveAfterBonus;
  skipNextWaveAfterBonus = false;
  return v;
}

export function beginBonusWave(ctx) {
  const { state, themeImages, adjustedConfig, bus } = ctx;
  let enemyKeys = Object.keys(themeImages);
  if (enemyKeys.length === 0) enemyKeys = ['wave1'];

  state.currentWave = {
    name: `BONUS STAGE - LEVEL ${state.level + 1}`,
    count: 40,
    spawnInterval: 300,
    formationDelay: 0,
    themeKey: 'mixed',
    enemy: { width: 24, height: 24, color: '#ff00ff', hp: 1, scoreValue: 100 },
    speed: 0,
    pathType: 'straight',
    pathParams: { ySpeed: 60 },
    fireRate: 3000,
    bulletSpeed: 150,
    requiredKills: 40
  };

  state.waveStartTime = state.gameTime;
  state.lastEnemySpawnTime = state.gameTime - 1;
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
  state.perfectWave = true;
  state.waveFormationComplete = true;

  startBonusStage(state);

  // Initial batch of 5 to make the start feel decisive.
  for (let i = 0; i < 5 && state.enemiesSpawned < state.currentWave.count; i++) {
    const key = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
    const wave = { ...state.currentWave, themeKey: key };
    const enemy = createEnemy(
      wave,
      state.enemiesSpawned,
      adjustedConfig.enemySpeedMult || 1,
      adjustedConfig.enemyFireRateMult || 1
    );
    state.enemies.push(enemy);
    state.enemiesSpawned++;
  }

  announceTimer = 2;
  announceAlpha = 1;
  bus.emit(Events.BONUS_START, { level: state.level + 1 });
}

export function updateBonusSpawning(ctx, dt) {
  const { state, themeImages, adjustedConfig } = ctx;
  if (!state.currentWave || state.spawnComplete) return;

  const timeSinceLastSpawn = (state.gameTime - state.lastEnemySpawnTime) * 1000;
  if (timeSinceLastSpawn < state.currentWave.spawnInterval) return;
  if (state.enemiesSpawned >= state.currentWave.count) {
    state.spawnComplete = true;
    return;
  }

  let enemyKeys = Object.keys(themeImages);
  if (enemyKeys.length === 0) enemyKeys = ['wave1'];
  const key = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
  const wave = { ...state.currentWave, themeKey: key };

  const enemy = createEnemy(
    wave,
    state.enemiesSpawned,
    adjustedConfig.enemySpeedMult || 1,
    adjustedConfig.enemyFireRateMult || 1
  );
  state.enemies.push(enemy);
  state.enemiesSpawned++;
  state.lastEnemySpawnTime = state.gameTime;
}

/**
 * Per-frame tick during the bonus stage. Returns true if the stage
 * just ended this frame (so playScene can pause for the end overlay).
 */
export function tickBonus(ctx, dt) {
  const { state, bus } = ctx;
  if (!state.bonusStageActive) return false;

  announceTimer = Math.max(0, announceTimer - dt);
  announceAlpha = announceTimer > 0 ? Math.min(1, announceTimer / 2) : 0;

  const ended = updateBonusStage(state, dt);
  if (!ended) return false;

  endPerfect = state.bonusStageEnemiesEscaped === 0;
  endTimer = 3;
  endAlpha = 1;
  skipNextWaveAfterBonus = true;
  state.waveComplete = true;
  state.enemies = [];
  state.enemyBullets = [];
  startEnergyRefill(state);

  bus.emit(Events.BONUS_END, {
    perfect: endPerfect,
    escaped: state.bonusStageEnemiesEscaped,
    score: state.bonusStageScore
  });

  return true;
}

export function tickEndOverlay(dt) {
  if (endTimer > 0) {
    endTimer = Math.max(0, endTimer - dt);
    endAlpha = endTimer / 3;
  }
}

export function reportEscape(ctx) {
  bonusStageEnemyEscaped(ctx.state);
  if (ctx.state.bonusStageActive) {
    ctx.bus.emit(Events.ENEMY_ESCAPED, {});
  }
}

export function drawAnnouncement(g, level) {
  if (announceAlpha <= 0) return;
  g.save();
  g.globalAlpha = announceAlpha;
  g.fillStyle = 'rgba(0, 0, 0, 0.9)';
  g.fillRect(100, 160, 440, 100);
  g.strokeStyle = '#ff00ff';
  g.lineWidth = 4;
  g.strokeRect(100, 160, 440, 100);
  g.fillStyle = '#ff00ff';
  g.font = "24px 'Press Start 2P', monospace";
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('BONUS STAGE!', 320, 190);
  g.font = "16px 'Press Start 2P', monospace";
  g.fillText(`LEVEL ${level}`, 320, 225);
  g.restore();
}

export function drawTimer(g, timeLeft, level) {
  g.save();
  const seconds = Math.ceil(timeLeft);
  const isLowTime = seconds <= 5;
  g.font = "16px 'Press Start 2P', monospace";
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.fillStyle = '#ff00ff';
  g.fillText(`BONUS LEVEL ${level}`, 320, 10);
  g.font = "14px 'Press Start 2P', monospace";
  if (isLowTime) {
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    g.globalAlpha = pulse;
    g.fillStyle = '#ff0000';
  } else {
    g.fillStyle = '#ffff00';
  }
  g.fillText(`TIME: ${seconds}s`, 320, 32);
  g.restore();
}

export function drawEnd(g, escaped) {
  if (endAlpha <= 0) return;
  g.save();
  g.globalAlpha = endAlpha;
  g.font = "20px 'Press Start 2P', monospace";
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0, 0, 0, 0.9)';
  g.fillRect(100, 160, 440, 120);
  const borderColor = endPerfect ? '#00ff00' : '#ffff00';
  g.strokeStyle = borderColor;
  g.lineWidth = 4;
  g.strokeRect(100, 160, 440, 120);
  g.fillStyle = borderColor;
  g.fillText('BONUS STAGE COMPLETE!', 320, 195);
  if (endPerfect) {
    g.font = "24px 'Press Start 2P', monospace";
    g.fillStyle = '#00ff00';
    g.fillText('PERFECT! +1000', 320, 240);
  } else {
    g.font = "14px 'Press Start 2P', monospace";
    g.fillStyle = '#ffffff';
    g.fillText(`${escaped} ENEMIES ESCAPED`, 320, 240);
  }
  g.restore();
}
