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

  // Score
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${state.score}`, hud.scorePosition.x, hud.scorePosition.y);

  // Lives
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES: ${state.lives}`, hud.livesPosition.x, hud.livesPosition.y);

  // Wave
  ctx.textAlign = 'center';
  const waveNum = state.currentWaveIndex + 1;
  const level = state.level + 1;
  ctx.fillText(`WAVE ${waveNum} - LEVEL ${level}`, hud.wavePosition.x, hud.wavePosition.y);

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
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(120, 220, 400, 60);

  // Border
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 220, 400, 60);

  // Text
  ctx.fillStyle = '#ffff00';
  ctx.fillText(waveName, 320, 250);

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
  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(120, 200, 400, 100);

  // Border
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 200, 400, 100);

  // Text
  ctx.fillStyle = '#00ff00';
  ctx.fillText('WAVE COMPLETE!', 320, 230);

  if (bonus > 0) {
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`PERFECT! +${bonus}`, 320, 270);
  }

  ctx.restore();
}
