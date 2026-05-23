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
  createTrailParticle,
  updateParticles,
  drawParticles
} from '../systems/particleSystem.js';
import {
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
import { Events } from '../app/events.js';
import {
  beginBonusWave,
  updateBonusSpawning,
  tickBonus,
  tickEndOverlay,
  reportEscape,
  drawAnnouncement as drawBonusAnnouncement,
  drawTimer as drawBonusTimer,
  drawEnd as drawBonusEnd,
  shouldSkipNextWave,
  consumeSkipNextWave
} from './bonusScene.js';

/**
 * The gameplay scene. Single update/render path covering wave play
 * and the bonus stage (which co-runs inside this scene rather than
 * being a separately-pushed scene).
 *
 * Animation timers that previously lived as module-level vars in
 * main.js are scene-local closures here so the play scene is the
 * sole owner of its own per-frame state.
 *
 * Phase 1 keeps every inline audio/shake/particle call exactly as
 * it was in main.js. Phase 2A replaces those with bus emits.
 */
export function createPlayScene({ menuController, onGameOver }) {
  let waveAnnouncementAlpha = 0;
  let waveAnnouncementTimer = 0;
  let waveCompleteAlpha = 0;
  let waveCompleteTimer = 0;
  let interWavePause = false;
  let interWavePauseTimer = 0;
  let pausePressed = false;

  function handlePlayerDeath(ctx) {
    const { state, adjustedConfig, audio, theme, bus } = ctx;
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

    const themeName = theme && theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
    startWave(state, adjustedConfig, themeName);
    waveAnnouncementTimer = 2;
    waveAnnouncementAlpha = 1;
    bus.emit(Events.WAVE_START, { wave: state.currentWave });
  }

  function update(ctx, dt) {
    const { state, audio, input, bus, theme } = ctx;
    if (state.currentState !== GameStates.PLAYING) return;

    state.gameTime += dt;

    updateBackground(ctx.backgroundElements, dt, state.gameTime);
    updateCombo(state, dt);

    if (state.bonusStageActive) {
      tickBonus(ctx, dt);
    }
    tickEndOverlay(dt);

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

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      updateEnemy(enemy, dt, playerPos);

      if (theme && theme.name.toLowerCase().includes('absurd') && Math.random() < 0.3) {
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

      if (theme && theme.name.toLowerCase().includes('absurd') && Math.random() < 0.5) {
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
        bus.emit(Events.ENEMY_KILLED, {
          enemy: hitEnemy,
          scoreValue: hitEnemy.scoreValue,
          comboAfter: state.combo
        });

        const drop = maybeCreatePowerUpDrop(hitEnemy);
        if (drop) state.powerUps.push(drop);
      }
    }

    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = state.enemyBullets[i];
      updateProjectile(bullet, dt);
      if (isOffScreen(bullet)) {
        state.enemyBullets.splice(i, 1);
        continue;
      }
      const playerHitbox = getPlayerHitbox(state.player);
      if (checkPlayerBulletCollision(bullet, playerHitbox, state)) {
        state.enemyBullets.splice(i, 1);
        if (!hasPowerUp(state, 'shield')) {
          const gameOver = hitPlayer(state);
          if (gameOver) {
            bus.emit(Events.PLAYER_DIED, { player: state.player });
            onGameOver(ctx);
            return;
          }
          handlePlayerDeath(ctx);
          return;
        }
      }
    }

    if (checkPlayerEnemyCollision(state.player, state.enemies, state)) {
      if (!hasPowerUp(state, 'shield')) {
        const gameOver = hitPlayer(state);
        if (gameOver) {
          bus.emit(Events.PLAYER_DIED, { player: state.player });
          onGameOver(ctx);
          return;
        }
        handlePlayerDeath(ctx);
        return;
      }
    }

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const powerUp = state.powerUps[i];
      updatePowerUp(powerUp, dt);
      if (isPowerUpOffScreen(powerUp)) {
        state.powerUps.splice(i, 1);
        continue;
      }
      if (checkPlayerPowerUpCollision(state.player, powerUp)) {
        applyPowerUp(state, powerUp);
        state.powerUps.splice(i, 1);
        bus.emit(Events.POWERUP_PICKUP, { kind: powerUp.kind });
      }
    }
    updateActivePowerUps(state, dt);

    updateParticles(state.particles, dt);
    updateEnergyAnimation(state, dt);

    if (state.currentWave && state.enemiesKilled >= state.currentWave.requiredKills && !state.waveComplete) {
      state.waveComplete = true;
      state.waveBonus = state.perfectWave ? 1000 : 500;
      addScore(state, state.waveBonus);
      bus.emit(Events.WAVE_COMPLETE, { wave: state.currentWave });
      startEnergyRefill(state);
      interWavePause = true;
      interWavePauseTimer = 3;
      waveCompleteTimer = 3;
      waveCompleteAlpha = 1;
    }

    if (interWavePause) {
      interWavePauseTimer -= dt;
      if (interWavePauseTimer <= 0) {
        interWavePause = false;
        if (consumeSkipNextWave()) {
          nextWave(state);
        } else if (shouldTriggerBonusStage(state)) {
          nextWave(state);
          beginBonusWave(ctx);
        } else {
          nextWave(state);
        }
        const themeName = theme && theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
        if (!state.bonusStageActive) {
          startWave(state, ctx.adjustedConfig, themeName);
        }
        waveAnnouncementTimer = 2;
        waveAnnouncementAlpha = 1;
        bus.emit(Events.WAVE_START, { wave: state.currentWave });
      }
    }

    if (waveAnnouncementTimer > 0) {
      waveAnnouncementTimer -= dt;
      waveAnnouncementAlpha = Math.max(0, waveAnnouncementTimer / 2);
    }
    if (waveCompleteTimer > 0) {
      waveCompleteTimer -= dt;
      waveCompleteAlpha = Math.max(0, waveCompleteTimer / 3);
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

      drawBonusAnnouncement(g, state.level + 1);
      if (state.bonusStageActive) {
        drawBonusTimer(g, state.bonusStageTimer, state.level + 1);
      }
      drawBonusEnd(g, state.bonusStageEnemiesEscaped);
    }

    g.restore();
  }

  return { update, render };
}
