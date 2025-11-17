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
 * @param {number} fireRateModifier - Optional fire rate modifier (0.5 = 2x faster, 2 = 2x slower)
 * @returns {boolean} True if can fire
 */
export function canFire(player, fireRateModifier = 1) {
  const now = Date.now();
  const effectiveCooldown = gameConfig.player.bullet.cooldown * fireRateModifier;
  return now - player.lastFireTime >= effectiveCooldown;
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
 * Draw player with image support
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Player} player - Player object
 * @param {HTMLImageElement|null} image - Player sprite image (or null for fallback)
 * @param {Object} state - Game state (for shield power-up check)
 */
export function drawPlayer(ctx, player, image = null, state = null) {
  // Draw shield if active
  const hasShield = state && state.activePowerUps && state.activePowerUps.shield;
  if (hasShield) {
    const now = Date.now();
    const pulse = Math.sin(now / 100) * 0.3 + 0.7; // Pulsing effect
    const radius = 20;

    ctx.save();
    ctx.globalAlpha = pulse * 0.6;

    // Outer glow
    const gradient = ctx.createRadialGradient(
      player.x + player.width / 2,
      player.y + player.height / 2,
      radius * 0.5,
      player.x + player.width / 2,
      player.y + player.height / 2,
      radius
    );
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      player.x + player.width / 2,
      player.y + player.height / 2,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Shield hexagon
    ctx.globalAlpha = pulse * 0.8;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -now / 50; // Rotating dash pattern

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = player.x + player.width / 2 + Math.cos(angle) * radius;
      const y = player.y + player.height / 2 + Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  // Flash when invincible
  if (player.isInvincible) {
    const flashInterval = 100;
    const timeSinceHit = Date.now() - player.hitTime;
    if (Math.floor(timeSinceHit / flashInterval) % 2 === 0) {
      return; // Don't draw (flash effect)
    }
  }

  if (image && image.complete) {
    // Draw image
    ctx.drawImage(image, player.x, player.y, player.width, player.height);
  } else {
    // Fallback: Draw as triangle pointing up
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
}
