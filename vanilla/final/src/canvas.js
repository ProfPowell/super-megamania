/**
 * @fileoverview Canvas setup and rendering utilities
 * Handles canvas initialization, scaling, and coordinate transformations
 */

import { gameConfig } from './config/gameConfig.js';

/**
 * Initialize canvas and get 2D context
 * @param {string} canvasId - Canvas element ID
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}} Canvas and context
 */
export function initCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas element with id "${canvasId}" not found`);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D rendering context');
  }

  // Set logical size
  canvas.width = gameConfig.canvas.width;
  canvas.height = gameConfig.canvas.height;

  // Disable image smoothing for crisp pixels
  if (gameConfig.canvas.pixelArt) {
    ctx.imageSmoothingEnabled = false;
  }

  // Handle window resize
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  return { canvas, ctx };
}

/**
 * Resize canvas to fit viewport while maintaining aspect ratio
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export function resizeCanvas(canvas) {
  const targetRatio = gameConfig.canvas.width / gameConfig.canvas.height;
  const windowRatio = window.innerWidth / window.innerHeight;

  let scale;
  if (windowRatio > targetRatio) {
    // Window is wider than target ratio
    scale = window.innerHeight / gameConfig.canvas.height;
  } else {
    // Window is taller than target ratio
    scale = window.innerWidth / gameConfig.canvas.width;
  }

  // Apply scaling via CSS
  canvas.style.width = `${gameConfig.canvas.width * scale}px`;
  canvas.style.height = `${gameConfig.canvas.height * scale}px`;
}

/**
 * Clear the entire canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function clearCanvas(ctx) {
  ctx.fillStyle = gameConfig.canvas.backgroundColor;
  ctx.fillRect(0, 0, gameConfig.canvas.width, gameConfig.canvas.height);
}

/**
 * Draw a simple starfield background
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<{x: number, y: number, size: number, opacity: number}>} stars - Star positions
 */
export function drawStarfield(ctx, stars) {
  for (const star of stars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

/**
 * Generate random starfield with movement
 * @param {number} count - Number of stars
 * @returns {Array} Star array
 */
export function generateStars(count = 100) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const speed = Math.random() < 0.3 ? 20 : (Math.random() < 0.6 ? 40 : 60);
    stars.push({
      x: Math.random() * gameConfig.canvas.width,
      y: Math.random() * gameConfig.canvas.height,
      size: Math.random() < 0.5 ? 1 : 2,
      opacity: 0.3 + Math.random() * 0.7,
      speed: speed  // Pixels per second downward
    });
  }
  return stars;
}

/**
 * Update starfield positions (creates scrolling effect)
 * @param {Array} stars - Star array
 * @param {number} dt - Delta time in seconds
 */
export function updateStarfield(stars, dt) {
  for (const star of stars) {
    star.y += star.speed * dt;

    // Wrap around when star goes off bottom
    if (star.y > gameConfig.canvas.height) {
      star.y = 0;
      star.x = Math.random() * gameConfig.canvas.width;
    }
  }
}
