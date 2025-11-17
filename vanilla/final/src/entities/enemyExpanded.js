/**
 * @fileoverview Enhanced enemy entity with expanded movement patterns
 * Supports 15+ different movement types
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
 * @property {string} themeKey - Theme sprite key
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
  const { enemy, pathType, pathParams, speed, fireRate, bulletSpeed, themeKey } = waveConfig;

  // Calculate spawn position based on path type
  let startX = 320;
  let startY = -enemy.height;

  switch (pathType) {
    case 'sweep':
    case 'zigzag':
    case 'chaotic':
    case 'wave':
      startX = 50 + (spawnIndex * 60) % 540;
      break;

    case 'sine_dive':
    case 'cluster':
      startX = 100 + (spawnIndex * 80) % 440;
      break;

    case 'circular':
      const angleStep = (Math.PI * 2) / waveConfig.count;
      const angle = spawnIndex * angleStep;
      startX = pathParams.centerX + Math.cos(angle) * pathParams.radius;
      startY = pathParams.centerY + Math.sin(angle) * pathParams.radius;
      break;

    case 'v_shape':
      const isLeft = spawnIndex % 2 === 0;
      const offset = Math.floor(spawnIndex / 2) * pathParams.spacing;
      startX = isLeft ? 320 - offset : 320 + offset;
      break;

    case 'split':
      startX = 320;
      break;

    case 'pincer':
      startX = pathParams.startSide === 'alternate'
        ? (spawnIndex % 2 === 0 ? 50 : 590)
        : (spawnIndex < waveConfig.count / 2 ? 50 : 590);
      break;

    case 'cross':
      const arm = spawnIndex % 4;
      if (arm === 0) startX = 320;
      else if (arm === 1) startX = 320 + pathParams.armLength;
      else if (arm === 2) startX = 320 - pathParams.armLength;
      else startX = 320;
      break;

    case 'kamikaze':
      startX = 100 + (spawnIndex * 40) % 440;
      break;

    default:
      startX = 50 + (spawnIndex * 60) % 540;
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
    lastFireTime: Date.now() + Math.random() * 1000,
    fireRate: fireRate / fireRateMult,
    bulletSpeed,
    initialX: startX,
    initialY: startY,
    angle: 0,
    time: 0,
    directionChangeTime: 0,
    direction: Math.random() > 0.5 ? 1 : -1,
    bounceVelocity: 0,
    targetX: 0,
    targetY: 0,
    spawnIndex,
    themeKey: themeKey || 'wave1'
  };
}

/**
 * Update enemy position and behavior
 * @param {Enemy} enemy - Enemy object
 * @param {number} dt - Delta time in seconds
 * @param {Object} playerPos - Player position {x, y} for tracking
 */
export function updateEnemy(enemy, dt, playerPos = null) {
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
    case 'v_shape':
      updateVShapePattern(enemy, dt);
      break;
    case 'spiral':
      updateSpiralPattern(enemy, dt);
      break;
    case 'wave':
      updateWavePattern(enemy, dt);
      break;
    case 'split':
      updateSplitPattern(enemy, dt);
      break;
    case 'cluster':
      updateClusterPattern(enemy, dt);
      break;
    case 'figure8':
      updateFigure8Pattern(enemy, dt);
      break;
    case 'pincer':
      updatePincerPattern(enemy, dt);
      break;
    case 'bounce':
      updateBouncePattern(enemy, dt);
      break;
    case 'cross':
      updateCrossPattern(enemy, dt);
      break;
    case 'kamikaze':
      updateKamikazePattern(enemy, dt, playerPos);
      break;
    default:
      updateSweepPattern(enemy, dt);
  }

  // Horizontal wrapping - keep enemies fully within playable area
  const playAreaWidth = 640;
  const enemyWidth = enemy.width || 24;

  if (enemy.x < 0) {
    // Went off left, wrap to right side (inside play area)
    enemy.x = playAreaWidth - enemyWidth;
  } else if (enemy.x + enemyWidth > playAreaWidth) {
    // Went off right, wrap to left side (inside play area)
    enemy.x = 0;
  }
}

// Movement pattern implementations

function updateSweepPattern(enemy, dt) {
  const { amplitude, direction, ySpeed } = enemy.pathParams;
  enemy.x += enemy.speed * direction * dt;
  enemy.y += (ySpeed || 20) * dt;

  if (enemy.x < 50 || enemy.x > 590) {
    enemy.pathParams.direction *= -1;
  }
}

function updateZigzagPattern(enemy, dt) {
  const { amplitude, frequency, ySpeed } = enemy.pathParams;
  const offset = Math.sin(enemy.time * frequency * 100) * amplitude;
  enemy.x = enemy.initialX + offset;
  enemy.y += (ySpeed || 30) * dt;
}

function updateSineDivePattern(enemy, dt) {
  const { amplitude, frequency, diveSpeed } = enemy.pathParams;
  const offset = Math.sin(enemy.time * frequency * 100) * amplitude;
  enemy.x = enemy.initialX + offset;
  enemy.y += diveSpeed * dt;
}

function updateCircularPattern(enemy, dt) {
  const { radius, centerX, centerY, angularSpeed } = enemy.pathParams;
  enemy.angle += angularSpeed;
  enemy.x = centerX + Math.cos(enemy.angle) * radius;
  enemy.y = centerY + Math.sin(enemy.angle) * radius;
  enemy.pathParams.radius += 5 * dt;
}

function updateChaoticPattern(enemy, dt) {
  const { changeInterval, amplitude, ySpeed } = enemy.pathParams;
  enemy.directionChangeTime += dt;

  if (enemy.directionChangeTime * 1000 >= changeInterval) {
    enemy.direction = Math.random() > 0.5 ? 1 : -1;
    enemy.directionChangeTime = 0;
  }

  enemy.x += enemy.speed * enemy.direction * dt;
  enemy.y += (ySpeed || 40) * dt;

  if (enemy.x < 20 || enemy.x > 620) {
    enemy.direction *= -1;
  }
}

function updateVShapePattern(enemy, dt) {
  const { angle, spacing, ySpeed } = enemy.pathParams;
  const isLeft = enemy.spawnIndex % 2 === 0;
  const angleRad = (angle || 45) * Math.PI / 180;
  const xMove = isLeft ? -Math.cos(angleRad) : Math.cos(angleRad);

  enemy.x += xMove * enemy.speed * dt;
  enemy.y += ySpeed * dt;
}

function updateSpiralPattern(enemy, dt) {
  const { radius, radiusGrowth, angularSpeed, ySpeed } = enemy.pathParams;
  enemy.angle += angularSpeed;
  const currentRadius = radius + (radiusGrowth * enemy.time * 100);

  enemy.x = enemy.initialX + Math.cos(enemy.angle) * currentRadius;
  enemy.y += ySpeed * dt;
}

function updateWavePattern(enemy, dt) {
  const { amplitude, frequency, ySpeed } = enemy.pathParams;
  const offset = Math.sin(enemy.time * frequency * 100) * amplitude;
  enemy.x = enemy.initialX + offset;
  enemy.y += ySpeed * dt;
}

function updateSplitPattern(enemy, dt) {
  const { splitPoint, divergeAngle, ySpeed } = enemy.pathParams;

  if (enemy.y < splitPoint) {
    enemy.y += ySpeed * dt;
  } else {
    const angleRad = divergeAngle * Math.PI / 180;
    const xDir = enemy.spawnIndex % 2 === 0 ? -1 : 1;
    enemy.x += Math.sin(angleRad) * enemy.speed * xDir * dt;
    enemy.y += Math.cos(angleRad) * enemy.speed * dt;
  }
}

function updateClusterPattern(enemy, dt) {
  const { clusterSize, spacing, ySpeed } = enemy.pathParams;
  const clusterIndex = Math.floor(enemy.spawnIndex / clusterSize);
  const inClusterIndex = enemy.spawnIndex % clusterSize;

  const offsetX = (inClusterIndex - clusterSize / 2) * spacing;
  enemy.x = enemy.initialX + offsetX + Math.sin(enemy.time * 5) * 10;
  enemy.y += ySpeed * dt;
}

function updateFigure8Pattern(enemy, dt) {
  const { width, height, speed: figureSpeed } = enemy.pathParams;
  const t = enemy.time * figureSpeed * 10;

  enemy.x = enemy.initialX + Math.sin(t) * width;
  enemy.y = enemy.initialY + Math.sin(t * 2) * height + enemy.time * 30;
}

function updatePincerPattern(enemy, dt) {
  const { startSide, convergeY, ySpeed } = enemy.pathParams;
  const targetX = 320; // Center of screen

  if (enemy.y < convergeY) {
    enemy.y += ySpeed * dt;
  } else {
    const dx = targetX - enemy.x;
    enemy.x += Math.sign(dx) * enemy.speed * dt;
    enemy.y += ySpeed * 0.5 * dt;
  }
}

function updateBouncePattern(enemy, dt) {
  const { bounceHeight, gravity, xSpeed } = enemy.pathParams;

  enemy.bounceVelocity += gravity * dt;
  enemy.y += enemy.bounceVelocity * dt;
  enemy.x += xSpeed * enemy.direction * dt;

  if (enemy.y > bounceHeight) {
    enemy.y = bounceHeight;
    enemy.bounceVelocity = -Math.abs(enemy.bounceVelocity * 0.7);
  }

  if (enemy.x < 20 || enemy.x > 620) {
    enemy.direction *= -1;
  }
}

function updateCrossPattern(enemy, dt) {
  const { armLength, rotationSpeed, ySpeed } = enemy.pathParams;
  enemy.angle += rotationSpeed;

  const arm = enemy.spawnIndex % 4;
  const baseAngle = (Math.PI / 2) * arm;
  const totalAngle = baseAngle + enemy.angle;

  enemy.x = 320 + Math.cos(totalAngle) * armLength;
  enemy.y = 150 + Math.sin(totalAngle) * armLength + enemy.time * ySpeed;
}

function updateKamikazePattern(enemy, dt, playerPos) {
  const { trackPlayer, updateInterval, ySpeed } = enemy.pathParams;

  if (trackPlayer && playerPos) {
    const dx = playerPos.x - enemy.x;
    enemy.x += Math.sign(dx) * enemy.speed * 0.7 * dt;
  }

  enemy.y += ySpeed * dt;
}

/**
 * Check if enemy can fire
 * @param {Enemy} enemy - Enemy object
 * @returns {boolean} True if can fire
 */
export function canEnemyFire(enemy) {
  if (enemy.fireRate === 0) return false;

  // Don't fire if enemy is outside the visible play area
  // This prevents bullets from spawning in weird positions
  const playAreaWidth = 640;
  const margin = 20; // Safety margin

  if (enemy.x < -margin || enemy.x > playAreaWidth + margin) {
    return false;
  }

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
  return enemy.y > 500;
}

/**
 * Draw enemy with image support
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Enemy} enemy - Enemy object
 * @param {HTMLImageElement|null} image - Enemy sprite image (or null for fallback)
 */
export function drawEnemy(ctx, enemy, image = null) {
  const x = enemy.x - enemy.width / 2;
  const y = enemy.y - enemy.height / 2;

  if (image && image.complete) {
    // Draw image
    ctx.drawImage(image, x, y, enemy.width, enemy.height);
  } else {
    // Fallback to shape
    ctx.fillStyle = enemy.color;
    ctx.fillRect(x, y, enemy.width, enemy.height);

    // Add border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(x, y, enemy.width, enemy.height);
    ctx.globalAlpha = 1.0;
  }
}
