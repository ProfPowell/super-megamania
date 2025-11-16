/**
 * @fileoverview Projectile entities
 * Player and enemy bullets
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * @typedef {Object} Projectile
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width
 * @property {number} height - Height
 * @property {number} speed - Vertical speed (positive = down, negative = up)
 * @property {string} color - Color
 * @property {boolean} fromPlayer - True if player bullet
 */

/**
 * Create player projectile
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} angle - Optional angle in radians (0 = straight up)
 * @returns {Projectile} Projectile object
 */
export function createPlayerBullet(x, y, angle = 0) {
  const speed = gameConfig.player.bullet.speed;

  // Calculate velocity components from angle
  // angle 0 = straight up, positive angle = tilted right
  const velocityX = Math.sin(angle) * speed;
  const velocityY = -Math.cos(angle) * speed; // Negative for upward

  return {
    x: x - gameConfig.player.bullet.width / 2,
    y: y - gameConfig.player.bullet.height,
    width: gameConfig.player.bullet.width,
    height: gameConfig.player.bullet.height,
    speed: -speed, // Keep for compatibility (negative = upward)
    velocityX: velocityX,
    velocityY: velocityY,
    color: gameConfig.player.bullet.color,
    fromPlayer: true
  };
}

/**
 * Create enemy projectile
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} speed - Bullet speed
 * @returns {Projectile} Projectile object
 */
export function createEnemyBullet(x, y, speed = 200) {
  return {
    x: x - 1.5,
    y: y,
    width: 3,
    height: 8,
    speed: speed, // Positive = downward
    color: '#ff0000',
    fromPlayer: false
  };
}

/**
 * Update projectile position
 * @param {Projectile} projectile - Projectile object
 * @param {number} dt - Delta time in seconds
 */
export function updateProjectile(projectile, dt) {
  // Use velocity components if available (for angled shots)
  if (projectile.velocityX !== undefined && projectile.velocityY !== undefined) {
    projectile.x += projectile.velocityX * dt;
    projectile.y += projectile.velocityY * dt;
  } else {
    // Fallback to simple vertical movement
    projectile.y += projectile.speed * dt;
  }
}

/**
 * Check if projectile is off-screen
 * @param {Projectile} projectile - Projectile object
 * @returns {boolean} True if off-screen
 */
export function isOffScreen(projectile) {
  return projectile.y + projectile.height < 0 || projectile.y > gameConfig.canvas.height;
}

/**
 * Draw projectile
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Projectile} projectile - Projectile object
 */
export function drawProjectile(ctx, projectile) {
  ctx.fillStyle = projectile.color;
  ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);

  // Add glow effect
  if (projectile.fromPlayer) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = projectile.color;
    ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    ctx.shadowBlur = 0;
  }
}
