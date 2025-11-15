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
 * @param {number} bonus - Bonus points
 * @param {number} alpha - Opacity (0-1)
 */
export function drawWaveComplete(ctx, bonus, alpha = 1.0) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#00ff00';
  ctx.font = "18px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background - positioned to avoid HUD
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(120, 160, 400, 100);

  // Border
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 160, 400, 100);

  // Text
  ctx.fillStyle = '#00ff00';
  ctx.fillText('WAVE COMPLETE!', 320, 190);

  if (bonus > 0) {
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`PERFECT! +${bonus}`, 320, 230);
  }

  ctx.restore();
}
