/**
 * @fileoverview Particle system for visual effects
 * Explosions and other particle effects
 */

/**
 * @typedef {Object} Particle
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} vx - X velocity
 * @property {number} vy - Y velocity
 * @property {string} color - Color
 * @property {number} life - Remaining lifetime (0-1)
 * @property {number} maxLife - Maximum lifetime in seconds
 * @property {number} size - Particle size
 */

/**
 * Create explosion particles
 * @param {number} x - Explosion center X
 * @param {number} y - Explosion center Y
 * @param {string} color - Particle color
 * @param {number} count - Number of particles
 * @returns {Particle[]} Array of particles
 */
export function createExplosion(x, y, color = '#ffff00', count = 12) {
  const particles = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 100 + Math.random() * 100;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 1.0,
      maxLife: 0.5 + Math.random() * 0.5,
      size: 2 + Math.random() * 2
    });
  }

  return particles;
}

/**
 * Update particles
 * @param {Particle[]} particles - Particles array
 * @param {number} dt - Delta time in seconds
 */
export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Update position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Apply gravity
    p.vy += 200 * dt;

    // Fade out
    p.life -= dt / p.maxLife;

    // Remove dead particles
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/**
 * Draw particles
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Particle[]} particles - Particles array
 */
export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;

    // Draw based on particle shape
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'star') {
      // Simple star shape
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? p.size : p.size / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Default square
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1.0;
}

/**
 * Create ABSURD explosion with crazy particles
 * @param {number} x - Explosion center X
 * @param {number} y - Explosion center Y
 * @param {string} color - Primary particle color
 * @returns {Particle[]} Array of particles
 */
export function createAbsurdExplosion(x, y, color = '#ffff00') {
  const particles = [];
  const colors = [color, '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#00ff00'];

  // Main explosion burst
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 2 * i) / 25 + (Math.random() - 0.5) * 0.5;
    const speed = 150 + Math.random() * 200;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      maxLife: 0.6 + Math.random() * 0.6,
      size: 3 + Math.random() * 4,
      shape: Math.random() < 0.3 ? 'star' : (Math.random() < 0.5 ? 'circle' : 'square'),
      rotation: Math.random() * Math.PI * 2
    });
  }

  // Secondary sparkles
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50, // Slight upward bias
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1.0,
      maxLife: 0.8 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
      shape: 'star',
      rotation: Math.random() * Math.PI * 2
    });
  }

  return particles;
}

/**
 * Create trail particle
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {string} color - Particle color
 * @returns {Particle} Trail particle
 */
export function createTrailParticle(x, y, color = '#ffffff') {
  return {
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 20,
    vy: (Math.random() - 0.5) * 20,
    color,
    life: 1.0,
    maxLife: 0.3 + Math.random() * 0.2,
    size: 1 + Math.random() * 2,
    shape: Math.random() < 0.5 ? 'circle' : 'square'
  };
}
