import { updateBackground, drawBackground } from '../systems/backgroundSystem.js';
import {
  GameStates,
  addScore,
  loseLife,
  nextWave,
  depleteEnergy,
  refillEnergy,
  startEnergyRefill,
  updateEnergyAnimation,
  incrementCombo,
  updateCombo,
  resetCombo,
  shouldTriggerBonusStage
} from '../state/gameState.js';
import {
  createPlayerBullet,
  createEnemyBullet,
  updateProjectile,
  isOffScreen,
  drawProjectile
} from '../entities/projectile.js';
import {
  canFire,
  recordFire,
  hitPlayer,
  getPlayerHitbox,
  drawPlayer,
  updatePlayer
} from '../entities/player.js';
import {
  updateEnemy,
  canEnemyFire,
  recordEnemyFire,
  isEnemyOffScreen,
  drawEnemy
} from '../entities/enemyExpanded.js';
import {
  maybeCreatePowerUpDrop,
  updatePowerUp,
  drawPowerUp,
  isPowerUpOffScreen,
  checkPlayerPowerUpCollision,
  applyPowerUp,
  updateActivePowerUps,
  hasPowerUp
} from '../entities/powerup.js';
import {
  checkProjectileEnemyCollision,
  checkPlayerEnemyCollision,
  checkPlayerBulletCollision
} from '../systems/collision.js';
import { startWave, updateWaveManager } from '../systems/waveManager.js';
import {
  createExplosion,
  createAbsurdExplosion,
  createPlayerExplosion,
  createTrailParticle,
  updateParticles,
  drawParticles
} from '../systems/particleSystem.js';
import {
  triggerScreenShake,
  updateScreenShake,
  applyScreenShake
} from '../systems/screenShake.js';
import {
  drawHUD,
  drawWaveAnnouncement,
  drawWaveComplete,
  drawEnergyBar,
  drawActivePowerUps
} from '../ui/hud.js';
import { clearCanvas } from '../canvas.js';
import { getAdjustedConfig } from '../config/gameConfig.js';
import { Events } from '../app/events.js';
import {
  beginBonusWave,
  updateBonusSpawning,
  reportEscape,
  drawAnnouncement as drawBonusAnnouncement,
  drawTimer as drawBonusTimer,
  drawEnd as drawBonusEnd
} from './bonusScene.js';
import {
  startBonusStage,
  updateBonusStage
} from './_bonusStateMutations.js';

/**
 * The gameplay scene. Single update/render path covering wave play
 * and the bonus stage (which co-runs inside this scene rather than
 * being a separately-pushed scene).
 *
 * Animation timers that previously lived as module-level vars in
 * main.js are scene-local closures here so the play scene is the
 * sole owner of its own per-frame state.
 *
 * Phase 1 keeps every inline audio/shake/particle call exactly as it
 * was in the original main.js update(). Bus emits are added as new
 * hooks so Phase 2A reactors can subscribe without changing behavior.
 */
export function createPlayScene({ menuController, onGameOver }) {
  let waveAnnouncementAlpha = 0;
  let waveAnnouncementTimer = 0;
  let waveCompleteAlpha = 0;
  let waveCompleteTimer = 0;
  let interWavePause = false;
  let interWavePauseTimer = 0;
  let pausePressed = false;

  let bonusStageAnnouncementTimer = 0;
  let bonusStageAnnouncementAlpha = 0;
  let bonusStageEndTimer = 0;
  let bonusStageEndAlpha = 0;
  let bonusStagePerfect = false;
  let skipNextWaveAfterBonus = false;

  function enter() {
    // Reset all closure timers when (re)entering the play scene so a
    // fresh run does not inherit alpha/timer values from a prior run.
    waveAnnouncementAlpha = 1;
    waveAnnouncementTimer = 2;
    waveCompleteAlpha = 0;
    waveCompleteTimer = 0;
    interWavePause = false;
    interWavePauseTimer = 0;
    pausePressed = false;
    bonusStageAnnouncementTimer = 0;
    bonusStageAnnouncementAlpha = 0;
    bonusStageEndTimer = 0;
    bonusStageEndAlpha = 0;
    bonusStagePerfect = false;
    skipNextWaveAfterBonus = false;
  }

  function handlePlayerDeath(ctx) {
    const { state, audio, theme, bus } = ctx;
    audio.playPlayerDeath();

    if (state.waveComplete) {
      state.enemyBullets = [];
      state.playerBullets = [];
      refillEnergy(state);
      return;
    }

    state.enemies = [];
    state.enemyBullets = [];
    state.playerBullets = [];
    refillEnergy(state);

    const themeName = theme && theme.name && theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
    startWave(state, ctx.adjustedConfig, themeName);
    waveAnnouncementTimer = 2;
    waveAnnouncementAlpha = 1;
    audio.playWaveStart();
    bus.emit(Events.WAVE_START, { wave: state.currentWave });
  }

  function update(ctx, dt) {
    const { state, audio, input, bus, theme } = ctx;
    // PHASE 2A: hitstop — freeze gameplay for N seconds after a big hit.
    // The reactor sets state.hitstopTimer on ENEMY_KILLED/PLAYER_HIT.
    // Real dt still ticks the hitstop timer itself, but the rest of the
    // update sees dt=0 while hitstop is active.
    if (state.hitstopTimer > 0) {
      state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
      // Still update screen shake during hitstop so the shake doesn't freeze.
      updateScreenShake(dt);
      return;
    }
    if (state.currentState !== GameStates.PLAYING) return;

    state.gameTime += dt;

    updateBackground(ctx.backgroundElements, dt, state.gameTime);
    updateCombo(state, dt);

    // BONUS STAGE timer tick
    if (state.bonusStageActive) {
      const bonusEnded = updateBonusStage(state, dt);
      if (bonusEnded) {
        bonusStagePerfect = state.bonusStageEnemiesEscaped === 0;
        bonusStageEndTimer = 3;
        bonusStageEndAlpha = 1;
        state.enemies = [];
        state.enemyBullets = [];
        state.waveComplete = true;
        skipNextWaveAfterBonus = true;
        interWavePause = true;
        interWavePauseTimer = 3;
        startEnergyRefill(state);
        bus.emit(Events.BONUS_END, {
          perfect: bonusStagePerfect,
          escaped: state.bonusStageEnemiesEscaped,
          score: state.bonusStageScore
        });
      }
    }

    updateScreenShake(dt);

    const energyDepleted = depleteEnergy(state, dt);
    if (energyDepleted) {
      const gameOver = loseLife(state);
      if (gameOver) {
        onGameOver(ctx);
        return;
      }
      handlePlayerDeath(ctx);
      return;
    }

    const inputState = input.getState();

    if (inputState.pause && !pausePressed) {
      pausePressed = true;
      state.currentState = GameStates.PAUSED;
      input.disable();
      input.enable();
      menuController.showScreen('pause');
      return;
    }
    if (!inputState.pause) {
      pausePressed = false;
    }

    const direction = input.getDirection();
    updatePlayer(state.player, dt, direction);

    if (inputState.fire) {
      let fireRateModifier = 1;
      if (hasPowerUp(state, 'rapidFire')) {
        fireRateModifier = 0.33;
      }
      if (canFire(state.player, fireRateModifier)) {
        if (hasPowerUp(state, 'spreadShot')) {
          const spreadAngle = 0.3;
          for (const angle of [-spreadAngle, 0, spreadAngle]) {
            const bullet = createPlayerBullet(
              state.player.x + state.player.width / 2,
              state.player.y,
              angle
            );
            state.playerBullets.push(bullet);
          }
        } else if (state.playerBullets.length < 5) {
          const bullet = createPlayerBullet(
            state.player.x + state.player.width / 2,
            state.player.y
          );
          state.playerBullets.push(bullet);
        }
        recordFire(state.player);
        audio.playPlayerFire();
      }
    }

    if (!interWavePause) {
      if (state.bonusStageActive) {
        updateBonusSpawning(ctx, dt);
      } else {
        updateWaveManager(state, dt, ctx.adjustedConfig);
      }
    }

    const playerPos = {
      x: state.player.x + state.player.width / 2,
      y: state.player.y
    };

    // PHASE 2A FIX: theme is the theme object; check its name.
    const isAbsurd = !!(theme && theme.name && theme.name.toLowerCase().includes('absurd'));

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      updateEnemy(enemy, dt, playerPos);

      if (isAbsurd && Math.random() < 0.3) {
        state.particles.push(createTrailParticle(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.color
        ));
      }

      if (canEnemyFire(enemy)) {
        const bullet = createEnemyBullet(enemy.x, enemy.y + enemy.height / 2, enemy.bulletSpeed);
        state.enemyBullets.push(bullet);
        recordEnemyFire(enemy);
      }

      if (isEnemyOffScreen(enemy)) {
        state.enemies.splice(i, 1);
        state.perfectWave = false;
        reportEscape(ctx);
        if (state.currentWave) state.enemiesKilled++;
      }
    }

    for (let i = state.playerBullets.length - 1; i >= 0; i--) {
      const bullet = state.playerBullets[i];
      updateProjectile(bullet, dt);

      if (isAbsurd && Math.random() < 0.5) {
        state.particles.push(createTrailParticle(bullet.x, bullet.y, bullet.color));
      }

      if (isOffScreen(bullet)) {
        state.playerBullets.splice(i, 1);
        if (state.combo > 0) resetCombo(state);
        continue;
      }

      const hitEnemy = checkProjectileEnemyCollision(bullet, state.enemies);
      if (hitEnemy) {
        state.playerBullets.splice(i, 1);
        state.enemies = state.enemies.filter(e => e !== hitEnemy);
        state.enemiesKilled++;

        incrementCombo(state);
        const extraLife = addScore(state, hitEnemy.scoreValue);
        if (extraLife) audio.playExtraLife();

        if (isAbsurd) {
          state.particles.push(...createAbsurdExplosion(hitEnemy.x, hitEnemy.y, hitEnemy.color));
          triggerScreenShake(4, 0.15);
        } else {
          state.particles.push(...createExplosion(hitEnemy.x, hitEnemy.y, hitEnemy.color));
          triggerScreenShake(2, 0.1);
        }
        audio.playEnemyExplode();

        bus.emit(Events.ENEMY_KILLED, {
          enemy: hitEnemy,
          scoreValue: hitEnemy.scoreValue,
          comboAfter: state.combo
        });
        bus.emit(Events.COMBO_INCREMENT, {
          combo: state.combo,
          multiplier: state.comboMultiplier
        });

        const powerUpDrop = maybeCreatePowerUpDrop(hitEnemy.x, hitEnemy.y);
        if (powerUpDrop) state.powerUps.push(powerUpDrop);
      }
    }

    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = state.enemyBullets[i];
      updateProjectile(bullet, dt);
      if (isOffScreen(bullet)) {
        state.enemyBullets.splice(i, 1);
      }
    }

    updateParticles(state.particles, dt);

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const powerUp = state.powerUps[i];
      updatePowerUp(powerUp, dt);
      if (isPowerUpOffScreen(powerUp)) {
        state.powerUps.splice(i, 1);
        continue;
      }
      if (checkPlayerPowerUpCollision(state.player, powerUp)) {
        state.powerUps.splice(i, 1);
        applyPowerUp(state, powerUp);
        audio.playPowerUp();
        bus.emit(Events.POWERUP_PICKUP, { kind: powerUp.type });
      }
    }

    updateActivePowerUps(state);

    const hasShield = hasPowerUp(state, 'shield');
    const playerHitbox = getPlayerHitbox(state.player);

    if (hasShield && !state.player.isInvincible) {
      const hitByEnemy = checkPlayerEnemyCollision(playerHitbox, state.enemies);
      if (hitByEnemy) {
        state.enemies = state.enemies.filter(e => e !== hitByEnemy);
        state.enemiesKilled++;

        const extraLife = addScore(state, hitByEnemy.scoreValue);
        if (extraLife) audio.playExtraLife();

        if (isAbsurd) {
          state.particles.push(...createAbsurdExplosion(hitByEnemy.x, hitByEnemy.y, hitByEnemy.color));
          triggerScreenShake(3, 0.12);
        } else {
          state.particles.push(...createExplosion(hitByEnemy.x, hitByEnemy.y, hitByEnemy.color));
          triggerScreenShake(2, 0.08);
        }
        audio.playEnemyExplode();

        bus.emit(Events.ENEMY_KILLED, {
          enemy: hitByEnemy,
          scoreValue: hitByEnemy.scoreValue,
          comboAfter: state.combo
        });
      }
    } else if (!state.player.isInvincible && !hasShield) {
      const hitByEnemy = checkPlayerEnemyCollision(playerHitbox, state.enemies);
      if (hitByEnemy) {
        state.enemies = state.enemies.filter(e => e !== hitByEnemy);
        hitPlayer(state.player);

        state.particles.push(...createPlayerExplosion(state.player.x + 16, state.player.y + 12, isAbsurd));
        if (isAbsurd) {
          triggerScreenShake(8, 0.3);
        } else {
          triggerScreenShake(5, 0.2);
        }

        bus.emit(Events.PLAYER_HIT, { player: state.player });

        const gameOver = loseLife(state);
        if (gameOver) {
          bus.emit(Events.PLAYER_DIED, { player: state.player });
          onGameOver(ctx);
        } else {
          handlePlayerDeath(ctx);
        }
        return;
      }

      const hitByBullet = checkPlayerBulletCollision(playerHitbox, state.enemyBullets);
      if (hitByBullet) {
        state.enemyBullets = state.enemyBullets.filter(b => b !== hitByBullet);
        hitPlayer(state.player);

        state.particles.push(...createPlayerExplosion(state.player.x + 16, state.player.y + 12, isAbsurd));
        if (isAbsurd) {
          triggerScreenShake(8, 0.3);
        } else {
          triggerScreenShake(5, 0.2);
        }

        bus.emit(Events.PLAYER_HIT, { player: state.player });

        const gameOver = loseLife(state);
        if (gameOver) {
          bus.emit(Events.PLAYER_DIED, { player: state.player });
          onGameOver(ctx);
        } else {
          handlePlayerDeath(ctx);
        }
        return;
      }
    }

    // Wave completion: requires kill count AND screen cleared AND not already in inter-wave
    if (state.waveComplete && state.enemies.length === 0 && !interWavePause) {
      interWavePause = true;
      interWavePauseTimer = 3.0;
      waveCompleteTimer = 2.5;
      waveCompleteAlpha = 1;
      startEnergyRefill(state);
      if (state.energyBonus > 0) {
        audio.playEnergyBonus();
      }
      bus.emit(Events.WAVE_COMPLETE, { wave: state.currentWave });
    }

    if (interWavePause) {
      interWavePauseTimer -= dt;

      const animCompleted = updateEnergyAnimation(state, dt);
      if (animCompleted) {
        audio.playEnergyRefill();
      }

      if (interWavePauseTimer <= 0) {
        interWavePause = false;

        if (!skipNextWaveAfterBonus) {
          nextWave(state);
        } else {
          state.enemiesKilled = 0;
          state.waveComplete = false;
          state.perfectWave = true;
          state.enemiesSpawned = 0;
          state.spawnComplete = false;
          state.enemies = [];
          state.enemyBullets = [];
          resetCombo(state);
          skipNextWaveAfterBonus = false;
        }

        ctx.adjustedConfig = getAdjustedConfig(state.difficulty, state.level);

        if (shouldTriggerBonusStage(state)) {
          startBonusStage(state);
          beginBonusWave(ctx);
          bonusStageAnnouncementTimer = 3;
          bonusStageAnnouncementAlpha = 1;
          audio.playWaveStart();
          bus.emit(Events.BONUS_START, { level: state.level + 1 });
        } else {
          const themeName = theme && theme.name && theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
          startWave(state, ctx.adjustedConfig, themeName);
          waveAnnouncementTimer = 2;
          waveAnnouncementAlpha = 1;
          audio.playWaveStart();
          bus.emit(Events.WAVE_START, { wave: state.currentWave });
        }
      }
    }

    if (waveAnnouncementTimer > 0) {
      waveAnnouncementTimer -= dt;
      waveAnnouncementAlpha = Math.max(0, waveAnnouncementTimer / 2);
    }

    if (waveCompleteTimer > 0) {
      waveCompleteTimer -= dt;
      waveCompleteAlpha = Math.max(0, waveCompleteTimer / 2);
    }

    if (bonusStageAnnouncementTimer > 0) {
      bonusStageAnnouncementTimer -= dt;
      bonusStageAnnouncementAlpha = Math.max(0, bonusStageAnnouncementTimer / 3);
    }

    if (bonusStageEndTimer > 0) {
      bonusStageEndTimer -= dt;
      bonusStageEndAlpha = Math.max(0, bonusStageEndTimer / 3);
    }
  }

  function render(ctx) {
    const g = ctx.ctx2d;
    const { state } = ctx;

    clearCanvas(g);
    drawBackground(g, ctx.backgroundElements, state.gameTime);

    g.save();
    applyScreenShake(g);

    if (state.currentState === GameStates.PLAYING || state.currentState === GameStates.PAUSED) {
      if (state.player) {
        drawPlayer(g, state.player, ctx.playerImage, state);
      }
      for (const enemy of state.enemies) {
        const enemyImage = ctx.themeImages[enemy.themeKey] || null;
        drawEnemy(g, enemy, enemyImage);
      }
      for (const bullet of state.playerBullets) drawProjectile(g, bullet);
      for (const bullet of state.enemyBullets) drawProjectile(g, bullet);
      drawParticles(g, state.particles);
      for (const powerUp of state.powerUps) drawPowerUp(g, powerUp);
      drawHUD(g, state, ctx.gameLoop.fps);
      drawEnergyBar(g, state);
      drawActivePowerUps(g, state);

      if (waveAnnouncementAlpha > 0 && state.currentWave) {
        drawWaveAnnouncement(g, state.currentWave.name, waveAnnouncementAlpha);
      }
      if (waveCompleteAlpha > 0) {
        drawWaveComplete(g, state.waveBonus, state.energyBonus, waveCompleteAlpha);
      }

      if (bonusStageAnnouncementAlpha > 0) {
        drawBonusAnnouncement(g, state.level + 1, bonusStageAnnouncementAlpha);
      }
      if (state.bonusStageActive) {
        drawBonusTimer(g, state.bonusStageTimer, state.level + 1);
      }
      if (bonusStageEndAlpha > 0) {
        drawBonusEnd(g, bonusStagePerfect, state.bonusStageEnemiesEscaped, bonusStageEndAlpha);
      }
    }

    g.restore();
  }

  return { enter, update, render };
}
