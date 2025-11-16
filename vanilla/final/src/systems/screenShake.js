/**
 * @fileoverview Screen shake effect system
 * Adds impact feedback for explosions and hits
 */

/**
 * Screen shake state
 */
let shakeAmount = 0;
let shakeDuration = 0;
let shakeTimer = 0;

/**
 * Trigger screen shake
 * @param {number} amount - Shake intensity in pixels
 * @param {number} duration - Duration in seconds
 */
export function triggerScreenShake(amount, duration) {
  shakeAmount = Math.max(shakeAmount, amount); // Use larger shake if one is already active
  shakeDuration = duration;
  shakeTimer = duration;
}

/**
 * Update screen shake
 * @param {number} dt - Delta time in seconds
 */
export function updateScreenShake(dt) {
  if (shakeTimer > 0) {
    shakeTimer -= dt;
    if (shakeTimer <= 0) {
      shakeTimer = 0;
      shakeAmount = 0;
    }
  }
}

/**
 * Get current shake offset
 * @returns {{x: number, y: number}} Offset to apply to canvas
 */
export function getShakeOffset() {
  if (shakeTimer <= 0) {
    return { x: 0, y: 0 };
  }

  // Decay shake over time
  const decay = shakeTimer / shakeDuration;
  const currentAmount = shakeAmount * decay;

  return {
    x: (Math.random() - 0.5) * currentAmount * 2,
    y: (Math.random() - 0.5) * currentAmount * 2
  };
}

/**
 * Apply shake to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function applyScreenShake(ctx) {
  const offset = getShakeOffset();
  if (offset.x !== 0 || offset.y !== 0) {
    ctx.translate(offset.x, offset.y);
  }
}

/**
 * Reset shake (call before applying new shake)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function resetScreenShake(ctx) {
  const offset = getShakeOffset();
  if (offset.x !== 0 || offset.y !== 0) {
    ctx.translate(-offset.x, -offset.y);
  }
}
