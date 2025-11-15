/**
 * @fileoverview HUD (Heads-Up Display)
 * Score, lives, wave information overlay
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * Draw HUD elements
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} state - Game state
 * @param {number} fps - Current FPS
 */
export function drawHUD(ctx, state, fps) {
  const { hud } = gameConfig.ui;

  ctx.font = hud.font;
  ctx.fillStyle = hud.color;
  ctx.textBaseline = 'top';

  // Add shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Score (left)
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${state.score}`, hud.scorePosition.x, hud.scorePosition.y);

  // Lives (right)
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${state.lives}`, hud.livesPosition.x, hud.livesPosition.y);

  // Wave (center top)
  ctx.textAlign = 'center';
  const waveNum = state.currentWaveIndex + 1;
  ctx.fillText(`WAVE ${waveNum}`, hud.wavePosition.x, hud.wavePosition.y);

  // Level (center, second row)
  const level = state.level + 1;
  ctx.fillText(`LEVEL ${level}`, hud.levelPosition.x, hud.levelPosition.y);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // FPS (debug)
  if (hud.showFPS) {
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${fps}`, hud.fpsPosition.x, hud.fpsPosition.y);
  }
}

/**
 * Draw wave announcement
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} waveName - Wave name
 * @param {number} alpha - Opacity (0-1)
 */
export function drawWaveAnnouncement(ctx, waveName, alpha = 1.0) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#ffff00';
  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background - positioned lower to avoid HUD
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(120, 180, 400, 60);

  // Border
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 180, 400, 60);

  // Text
  ctx.fillStyle = '#ffff00';
  ctx.fillText(waveName, 320, 210);

  ctx.restore();
}

/**
 * Draw wave complete message
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} bonus - Wave completion bonus points
 * @param {number} energyBonus - Energy bonus points
 * @param {number} alpha - Opacity (0-1)
 */
export function drawWaveComplete(ctx, bonus, energyBonus, alpha = 1.0) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#00ff00';
  ctx.font = "18px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background - positioned to avoid HUD
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(120, 160, 400, 120);

  // Border
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 160, 400, 120);

  // Text
  ctx.fillStyle = '#00ff00';
  ctx.fillText('WAVE COMPLETE!', 320, 190);

  // Perfect wave bonus
  if (bonus > 0) {
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`PERFECT! +${bonus}`, 320, 220);
  }

  // Energy bonus
  if (energyBonus > 0) {
    ctx.font = "12px 'Press Start 2P', monospace";
    ctx.fillStyle = '#00ffff';
    const bonusY = bonus > 0 ? 245 : 220;
    ctx.fillText(`ENERGY BONUS +${energyBonus}`, 320, bonusY);
  }

  ctx.restore();
}

/**
 * Draw energy bar
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} state - Game state
 */
export function drawEnergyBar(ctx, state) {
  const { energyBar } = gameConfig.ui.hud;
  const { warningThreshold, criticalThreshold } = gameConfig.player.energy;

  ctx.save();

  // Label
  if (energyBar.showLabel) {
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ENERGY', energyBar.x + energyBar.width / 2, energyBar.y + energyBar.labelOffset);
  }

  // Background
  ctx.fillStyle = energyBar.backgroundColor;
  ctx.fillRect(energyBar.x, energyBar.y, energyBar.width, energyBar.height);

  // Border
  ctx.strokeStyle = energyBar.borderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(energyBar.x, energyBar.y, energyBar.width, energyBar.height);

  // Energy fill
  const energyPercent = Math.max(0, state.energy / state.maxEnergy);
  const fillWidth = (energyBar.width - 4) * energyPercent;

  // Choose color based on energy level
  let fillColor = energyBar.normalColor;
  if (state.energy <= criticalThreshold) {
    fillColor = energyBar.criticalColor;
  } else if (state.energy <= warningThreshold) {
    fillColor = energyBar.warningColor;
  }

  ctx.fillStyle = fillColor;
  ctx.fillRect(energyBar.x + 2, energyBar.y + 2, fillWidth, energyBar.height - 4);

  ctx.restore();
}
