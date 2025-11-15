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
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1.0;
}
