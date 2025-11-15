/**
 * @fileoverview Collision detection system
 * AABB collision detection for all game entities
 */

/**
 * @typedef {Object} Rect
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width
 * @property {number} height - Height
 */

/**
 * Check if two rectangles overlap (AABB collision)
 * @param {Rect} a - First rectangle
 * @param {Rect} b - Second rectangle
 * @returns {boolean} True if rectangles overlap
 */
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if point is inside rectangle
 * @param {number} px - Point X
 * @param {number} py - Point Y
 * @param {Rect} rect - Rectangle
 * @returns {boolean} True if point is inside
 */
export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.width &&
         py >= rect.y && py <= rect.y + rect.height;
}

/**
 * Get rectangle for entity (handles center-based positioning)
 * @param {Object} entity - Entity with x, y, width, height
 * @param {boolean} centered - If true, x/y is center point
 * @returns {Rect} Rectangle
 */
export function getEntityRect(entity, centered = false) {
  if (centered) {
    return {
      x: entity.x - entity.width / 2,
      y: entity.y - entity.height / 2,
      width: entity.width,
      height: entity.height
    };
  }
  return {
    x: entity.x,
    y: entity.y,
    width: entity.width,
    height: entity.height
  };
}

/**
 * Check collision between projectile and enemies
 * @param {Object} projectile - Projectile object
 * @param {Array} enemies - Array of enemies
 * @returns {Object|null} Hit enemy or null
 */
export function checkProjectileEnemyCollision(projectile, enemies) {
  const bulletRect = getEntityRect(projectile);

  for (const enemy of enemies) {
    const enemyRect = getEntityRect(enemy, true); // Enemies use centered positioning
    if (rectsOverlap(bulletRect, enemyRect)) {
      return enemy;
    }
  }

  return null;
}

/**
 * Check collision between player and enemies
 * @param {Object} playerHitbox - Player hitbox rectangle
 * @param {Array} enemies - Array of enemies
 * @returns {Object|null} Hit enemy or null
 */
export function checkPlayerEnemyCollision(playerHitbox, enemies) {
  for (const enemy of enemies) {
    const enemyRect = getEntityRect(enemy, true);
    if (rectsOverlap(playerHitbox, enemyRect)) {
      return enemy;
    }
  }

  return null;
}

/**
 * Check collision between player and enemy bullets
 * @param {Object} playerHitbox - Player hitbox rectangle
 * @param {Array} bullets - Array of enemy bullets
 * @returns {Object|null} Hit bullet or null
 */
export function checkPlayerBulletCollision(playerHitbox, bullets) {
  for (const bullet of bullets) {
    const bulletRect = getEntityRect(bullet);
    if (rectsOverlap(playerHitbox, bulletRect)) {
      return bullet;
    }
  }

  return null;
}
