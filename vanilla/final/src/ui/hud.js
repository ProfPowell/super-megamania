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

  // COMBO DISPLAY! 🔥 (only show if multiplier > 1)
  if (state.combo >= 3 && state.comboMultiplier > 1) {
    const centerX = 320;
    const centerY = 280;  // Below center

    // Choose color based on multiplier
    let comboColor = '#ffffff';
    let glowColor = '#ffffff';
    if (state.comboMultiplier >= 4) {
      comboColor = '#ff00ff';  // Magenta for 4x
      glowColor = '#ff00ff';
    } else if (state.comboMultiplier >= 3) {
      comboColor = '#ff0000';  // Red for 3x
      glowColor = '#ff0000';
    } else if (state.comboMultiplier >= 2) {
      comboColor = '#ff8800';  // Orange for 2x
      glowColor = '#ff8800';
    } else if (state.comboMultiplier >= 1.5) {
      comboColor = '#ffff00';  // Yellow for 1.5x
      glowColor = '#ffff00';
    }

    // Glow effect
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;

    // Combo text
    ctx.font = 'bold 32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = comboColor;
    ctx.fillText(`${state.combo} COMBO!`, centerX, centerY);

    // Multiplier text
    if (state.comboMultiplier > 1) {
      ctx.font = 'bold 20px "Press Start 2P", monospace';
      ctx.fillStyle = glowColor;
      ctx.fillText(`${state.comboMultiplier}x MULTIPLIER`, centerX, centerY + 35);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
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

/**
 * Draw active power-ups indicators
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} state - Game state
 */
export function drawActivePowerUps(ctx, state) {
  if (!state.activePowerUps || Object.keys(state.activePowerUps).length === 0) {
    return;
  }

  ctx.save();

  const startX = 10;
  const startY = 430; // Bottom left
  const boxWidth = 140; // Wider box for text
  const boxHeight = 22;
  let yOffset = 0;

  // Power-up icons and colors
  const powerUpDisplay = {
    shield: { emoji: '🛡️', color: '#00ffff', name: 'SHIELD' },
    rapidFire: { emoji: '⚡', color: '#ff6600', name: 'RAPID' },
    spreadShot: { emoji: '💫', color: '#ff00ff', name: 'SPREAD' }
  };

  for (const [type, powerUp] of Object.entries(state.activePowerUps)) {
    const display = powerUpDisplay[type];
    if (!display) continue;

    const now = Date.now();
    const timeLeft = Math.max(0, powerUp.expiresAt - now);
    const secondsLeft = Math.ceil(timeLeft / 1000);

    // Background box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(startX, startY + yOffset, boxWidth, boxHeight);

    // Border (pulsing when low time)
    const pulse = secondsLeft <= 3 ? (Math.sin(Date.now() / 200) * 0.5 + 0.5) : 1;
    ctx.strokeStyle = display.color;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY + yOffset, boxWidth, boxHeight);
    ctx.globalAlpha = 1;

    // Emoji icon
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(display.emoji, startX + 4, startY + yOffset + boxHeight / 2);

    // Power-up name
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = display.color;
    ctx.textAlign = 'left';
    ctx.fillText(display.name, startX + 26, startY + yOffset + boxHeight / 2 - 2);

    // Time remaining (right-aligned in box)
    ctx.fillStyle = secondsLeft <= 3 ? '#ff0000' : '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${secondsLeft}s`, startX + boxWidth - 4, startY + yOffset + boxHeight / 2 - 2);

    yOffset += boxHeight + 3;
  }

  ctx.restore();
}
