/**
 * @fileoverview Power-up entities and logic
 * Shields, rapid fire, spread shot, etc.
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * Power-up types
 */
export const PowerUpType = {
  SHIELD: 'shield',
  RAPID_FIRE: 'rapidFire',
  SPREAD_SHOT: 'spreadShot'
};

/**
 * Power-up configuration
 */
const powerUpConfig = {
  shield: {
    color: '#00ffff',      // Cyan
    emoji: '🛡️',
    duration: 10000,        // 10 seconds
    dropChance: 0.08        // 8% drop rate
  },
  rapidFire: {
    color: '#ff6600',      // Orange
    emoji: '⚡',
    duration: 8000,         // 8 seconds
    fireRateMultiplier: 3,  // 3x faster firing
    dropChance: 0.10        // 10% drop rate
  },
  spreadShot: {
    color: '#ff00ff',      // Magenta
    emoji: '💫',
    duration: 7000,         // 7 seconds
    bulletCount: 3,         // Fire 3 bullets
    spread: 0.3,            // Spread angle in radians
    dropChance: 0.07        // 7% drop rate
  }
};

/**
 * Create a power-up
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} type - Power-up type
 * @returns {Object} Power-up object
 */
export function createPowerUp(x, y, type) {
  const config = powerUpConfig[type];

  return {
    x,
    y,
    type,
    width: 24,
    height: 24,
    speed: 80,  // Pixels per second (slower than enemies)
    color: config.color,
    emoji: config.emoji,
    config,
    // Pulsing animation
    pulseTime: 0,
    pulseSpeed: 4  // Cycles per second
  };
}

/**
 * Randomly create a power-up drop from enemy position
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Object|null} Power-up object or null
 */
export function maybeCreatePowerUpDrop(x, y) {
  const roll = Math.random();

  // Check each power-up type
  let cumulativeChance = 0;

  for (const [type, config] of Object.entries(powerUpConfig)) {
    cumulativeChance += config.dropChance;
    if (roll < cumulativeChance) {
      return createPowerUp(x, y, type);
    }
  }

  return null;  // No drop
}

/**
 * Update power-up position
 * @param {Object} powerUp - Power-up object
 * @param {number} dt - Delta time
 */
export function updatePowerUp(powerUp, dt) {
  // Move downward
  powerUp.y += powerUp.speed * dt;

  // Update pulse animation
  powerUp.pulseTime += dt * powerUp.pulseSpeed;
}

/**
 * Draw power-up
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} powerUp - Power-up object
 */
export function drawPowerUp(ctx, powerUp) {
  ctx.save();

  // Pulsing scale effect
  const pulseScale = 1 + Math.sin(powerUp.pulseTime * Math.PI * 2) * 0.15;

  // Center position
  const centerX = powerUp.x;
  const centerY = powerUp.y;

  // Rotate slightly for visual interest
  ctx.translate(centerX, centerY);
  ctx.rotate(powerUp.pulseTime * 0.5);
  ctx.scale(pulseScale, pulseScale);

  // Glow effect
  ctx.shadowColor = powerUp.color;
  ctx.shadowBlur = 15;

  // Background circle
  ctx.fillStyle = powerUp.color;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(0, 0, powerUp.width / 2, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.globalAlpha = 1;
  ctx.strokeStyle = powerUp.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, powerUp.width / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Emoji icon
  ctx.shadowBlur = 0;
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  // Slight vertical offset to visually center emoji in circle
  ctx.fillText(powerUp.emoji, 0, 1);

  ctx.restore();
}

/**
 * Check if power-up is off screen
 * @param {Object} powerUp - Power-up object
 * @returns {boolean} True if off screen
 */
export function isPowerUpOffScreen(powerUp) {
  return powerUp.y > gameConfig.canvas.height + powerUp.height;
}

/**
 * Check collision between player and power-up
 * @param {Object} player - Player object
 * @param {Object} powerUp - Power-up object
 * @returns {boolean} True if collision detected
 */
export function checkPlayerPowerUpCollision(player, powerUp) {
  const dx = player.x - powerUp.x;
  const dy = player.y - powerUp.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Use circle collision (player radius + powerup radius)
  const playerRadius = player.width / 2;
  const powerUpRadius = powerUp.width / 2;

  return distance < (playerRadius + powerUpRadius);
}

/**
 * Apply power-up effect to game state
 * @param {Object} state - Game state
 * @param {Object} powerUp - Power-up object
 */
export function applyPowerUp(state, powerUp) {
  const now = Date.now();

  if (!state.activePowerUps) {
    state.activePowerUps = {};
  }

  // Store active power-up with expiration time
  state.activePowerUps[powerUp.type] = {
    type: powerUp.type,
    expiresAt: now + powerUp.config.duration,
    config: powerUp.config
  };
}

/**
 * Update active power-ups (remove expired ones)
 * @param {Object} state - Game state
 */
export function updateActivePowerUps(state) {
  if (!state.activePowerUps) {
    state.activePowerUps = {};
    return;
  }

  const now = Date.now();

  // Remove expired power-ups
  for (const [type, powerUp] of Object.entries(state.activePowerUps)) {
    if (now >= powerUp.expiresAt) {
      delete state.activePowerUps[type];
    }
  }
}

/**
 * Check if player has a specific power-up active
 * @param {Object} state - Game state
 * @param {string} type - Power-up type
 * @returns {boolean} True if power-up is active
 */
export function hasPowerUp(state, type) {
  return state.activePowerUps && state.activePowerUps[type] !== undefined;
}

/**
 * Get time remaining for a power-up
 * @param {Object} state - Game state
 * @param {string} type - Power-up type
 * @returns {number} Milliseconds remaining (0 if not active)
 */
export function getPowerUpTimeRemaining(state, type) {
  if (!hasPowerUp(state, type)) return 0;

  const now = Date.now();
  return Math.max(0, state.activePowerUps[type].expiresAt - now);
}
