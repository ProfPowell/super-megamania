/**
 * @fileoverview Player entity
 * Player ship with movement, shooting, and collision
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * @typedef {Object} Player
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width
 * @property {number} height - Height
 * @property {number} speed - Movement speed
 * @property {number} lastFireTime - Last time fired (ms)
 * @property {number} hitTime - Time when last hit (for invincibility)
 * @property {boolean} isInvincible - Invincibility state
 */

/**
 * Create player entity
 * @param {Object} adjustedConfig - Difficulty-adjusted config
 * @returns {Player} Player object
 */
export function createPlayer(adjustedConfig = null) {
  const speed = adjustedConfig?.playerSpeed || gameConfig.player.speed;

  return {
    x: gameConfig.player.startX,
    y: gameConfig.player.startY,
    width: gameConfig.player.width,
    height: gameConfig.player.height,
    speed,
    lastFireTime: 0,
    hitTime: 0,
    isInvincible: false
  };
}

/**
 * Update player position
 * @param {Player} player - Player object
 * @param {number} dt - Delta time in seconds
 * @param {number} direction - Movement direction (-1, 0, 1)
 */
export function updatePlayer(player, dt, direction) {
  // Move horizontally
  player.x += direction * player.speed * dt;

  // Clamp to boundaries
  const bounds = gameConfig.player.moveZone;
  player.x = Math.max(bounds.minX, Math.min(bounds.maxX - player.width, player.x));

  // Update invincibility
  const now = Date.now();
  if (player.isInvincible && now - player.hitTime > gameConfig.player.invincibilityTime) {
    player.isInvincible = false;
  }
}

/**
 * Check if player can fire
 * @param {Player} player - Player object
 * @returns {boolean} True if can fire
 */
export function canFire(player) {
  const now = Date.now();
  return now - player.lastFireTime >= gameConfig.player.bullet.cooldown;
}

/**
 * Record that player fired
 * @param {Player} player - Player object
 */
export function recordFire(player) {
  player.lastFireTime = Date.now();
}

/**
 * Hit player (lose life)
 * @param {Player} player - Player object
 */
export function hitPlayer(player) {
  if (player.isInvincible) return;

  player.isInvincible = true;
  player.hitTime = Date.now();
}

/**
 * Get player hitbox for collision
 * @param {Player} player - Player object
 * @returns {{x: number, y: number, width: number, height: number}} Hitbox
 */
export function getPlayerHitbox(player) {
  const scale = gameConfig.player.hitboxScale;
  const scaledWidth = player.width * scale;
  const scaledHeight = player.height * scale;

  return {
    x: player.x + (player.width - scaledWidth) / 2,
    y: player.y + (player.height - scaledHeight) / 2,
    width: scaledWidth,
    height: scaledHeight
  };
}

/**
 * Draw player
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Player} player - Player object
 */
export function drawPlayer(ctx, player) {
  // Flash when invincible
  if (player.isInvincible) {
    const flashInterval = 100;
    const timeSinceHit = Date.now() - player.hitTime;
    if (Math.floor(timeSinceHit / flashInterval) % 2 === 0) {
      return; // Don't draw (flash effect)
    }
  }

  // Draw as triangle pointing up
  ctx.fillStyle = gameConfig.player.color;
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y); // Top point
  ctx.lineTo(player.x, player.y + player.height); // Bottom left
  ctx.lineTo(player.x + player.width, player.y + player.height); // Bottom right
  ctx.closePath();
  ctx.fill();

  // Add glow effect
  ctx.strokeStyle = gameConfig.player.color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}
