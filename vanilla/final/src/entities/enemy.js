/**
 * @fileoverview Enemy entity
 * Enemy ships with various movement patterns
 */

/**
 * @typedef {Object} Enemy
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} width - Width
 * @property {number} height - Height
 * @property {number} hp - Hit points
 * @property {number} scoreValue - Points awarded when destroyed
 * @property {string} color - Color
 * @property {string} pathType - Movement pattern type
 * @property {Object} pathParams - Pattern-specific parameters
 * @property {number} speed - Movement speed
 * @property {number} spawnTime - Time when spawned
 * @property {number} lastFireTime - Last time fired
 * @property {number} fireRate - MS between shots
 * @property {number} bulletSpeed - Bullet speed
 * @property {number} initialX - Starting X position
 * @property {number} initialY - Starting Y position
 * @property {number} angle - Current angle (for circular paths)
 * @property {number} time - Time alive in seconds
 */

/**
 * Create enemy
 * @param {Object} waveConfig - Wave configuration
 * @param {number} spawnIndex - Spawn order index
 * @param {number} speedMult - Speed multiplier
 * @param {number} fireRateMult - Fire rate multiplier
 * @returns {Enemy} Enemy object
 */
export function createEnemy(waveConfig, spawnIndex, speedMult = 1, fireRateMult = 1) {
  const { enemy, pathType, pathParams, speed, fireRate, bulletSpeed } = waveConfig;

  // Calculate spawn position based on path type
  let startX = 320;
  let startY = -enemy.height;

  switch (pathType) {
    case 'sweep':
    case 'zigzag':
    case 'chaotic':
      startX = 50 + (spawnIndex * 60) % 540;
      break;
    case 'sine_dive':
      startX = 100 + (spawnIndex * 80) % 440;
      break;
    case 'circular':
      const angleStep = (Math.PI * 2) / waveConfig.count;
      const angle = spawnIndex * angleStep;
      startX = pathParams.centerX + Math.cos(angle) * pathParams.radius;
      startY = pathParams.centerY + Math.sin(angle) * pathParams.radius;
      break;
  }

  return {
    x: startX,
    y: startY,
    width: enemy.width,
    height: enemy.height,
    hp: enemy.hp,
    scoreValue: enemy.scoreValue,
    color: enemy.color,
    pathType,
    pathParams: { ...pathParams },
    speed: speed * speedMult,
    spawnTime: Date.now(),
    lastFireTime: Date.now() + Math.random() * 1000, // Random initial delay
    fireRate: fireRate / fireRateMult,
    bulletSpeed,
    initialX: startX,
    initialY: startY,
    angle: 0,
    time: 0,
    directionChangeTime: 0,
    direction: Math.random() > 0.5 ? 1 : -1
  };
}

/**
 * Update enemy position and behavior
 * @param {Enemy} enemy - Enemy object
 * @param {number} dt - Delta time in seconds
 */
export function updateEnemy(enemy, dt) {
  enemy.time += dt;

  switch (enemy.pathType) {
    case 'sweep':
      updateSweepPattern(enemy, dt);
      break;
    case 'zigzag':
      updateZigzagPattern(enemy, dt);
      break;
    case 'sine_dive':
      updateSineDivePattern(enemy, dt);
      break;
    case 'circular':
      updateCircularPattern(enemy, dt);
      break;
    case 'chaotic':
      updateChaoticPattern(enemy, dt);
      break;
  }
}

/**
 * Sweep pattern: horizontal back and forth
 */
function updateSweepPattern(enemy, dt) {
  const { amplitude, direction, ySpeed } = enemy.pathParams;

  enemy.x += enemy.speed * direction * dt;
  enemy.y += (ySpeed || 20) * dt;

  // Bounce at edges
  if (enemy.x < 50 || enemy.x > 590) {
    enemy.pathParams.direction *= -1;
  }
}

/**
 * Zigzag pattern: diagonal movement with direction changes
 */
function updateZigzagPattern(enemy, dt) {
  const { amplitude, frequency, ySpeed } = enemy.pathParams;

  const offset = Math.sin(enemy.time * frequency * 100) * amplitude;
  enemy.x = enemy.initialX + offset;
  enemy.y += (ySpeed || 30) * dt;
}

/**
 * Sine dive pattern: sinusoidal descent
 */
function updateSineDivePattern(enemy, dt) {
  const { amplitude, frequency, diveSpeed } = enemy.pathParams;

  const offset = Math.sin(enemy.time * frequency * 100) * amplitude;
  enemy.x = enemy.initialX + offset;
  enemy.y += diveSpeed * dt;
}

/**
 * Circular pattern: rotating around center point
 */
function updateCircularPattern(enemy, dt) {
  const { radius, centerX, centerY, angularSpeed } = enemy.pathParams;

  enemy.angle += angularSpeed;
  enemy.x = centerX + Math.cos(enemy.angle) * radius;
  enemy.y = centerY + Math.sin(enemy.angle) * radius;

  // Slowly expand outward
  enemy.pathParams.radius += 5 * dt;
}

/**
 * Chaotic pattern: random direction changes
 */
function updateChaoticPattern(enemy, dt) {
  const { changeInterval, amplitude, ySpeed } = enemy.pathParams;

  enemy.directionChangeTime += dt;

  // Change direction periodically
  if (enemy.directionChangeTime * 1000 >= changeInterval) {
    enemy.direction = Math.random() > 0.5 ? 1 : -1;
    enemy.directionChangeTime = 0;
  }

  enemy.x += enemy.speed * enemy.direction * dt;
  enemy.y += (ySpeed || 40) * dt;

  // Bounce at edges
  if (enemy.x < 20 || enemy.x > 620) {
    enemy.direction *= -1;
  }
}

/**
 * Check if enemy can fire
 * @param {Enemy} enemy - Enemy object
 * @returns {boolean} True if can fire
 */
export function canEnemyFire(enemy) {
  if (enemy.fireRate === 0) return false;

  const now = Date.now();
  return now - enemy.lastFireTime >= enemy.fireRate;
}

/**
 * Record that enemy fired
 * @param {Enemy} enemy - Enemy object
 */
export function recordEnemyFire(enemy) {
  enemy.lastFireTime = Date.now();
}

/**
 * Check if enemy is off-screen (below)
 * @param {Enemy} enemy - Enemy object
 * @returns {boolean} True if off-screen
 */
export function isEnemyOffScreen(enemy) {
  return enemy.y > 500; // Slightly below screen
}

/**
 * Draw enemy
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Enemy} enemy - Enemy object
 */
export function drawEnemy(ctx, enemy) {
  // Draw as rectangle (could be replaced with sprites)
  ctx.fillStyle = enemy.color;
  ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);

  // Add border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);
  ctx.globalAlpha = 1.0;
}
