/**
 * @fileoverview Advanced background system with multiple visual modes
 * Starfields, matrix rain, psychedelic effects, and more!
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * Background mode types
 */
export const BackgroundMode = {
  CLASSIC: 'classic',           // White starfield (default)
  RAINBOW: 'rainbow',            // Rainbow starfield
  PSYCHEDELIC: 'psychedelic',    // Full psychedelic with pulsing
  MATRIX: 'matrix',              // Matrix rain effect
  NEBULA: 'nebula',              // Nebula clouds
  VAPORWAVE: 'vaporwave',        // Vaporwave aesthetic
  GLITCH: 'glitch',              // Glitch art effect
  COSMOS: 'cosmos'               // Deep space with colored stars
};

/**
 * Generate background based on mode
 * @param {string} mode - Background mode
 * @param {number} count - Number of elements
 * @returns {Array} Background elements
 */
export function generateBackground(mode = BackgroundMode.CLASSIC, count = 100) {
  switch (mode) {
    case BackgroundMode.MATRIX:
      return generateMatrixRain(30);
    case BackgroundMode.NEBULA:
      return generateNebula(20);
    case BackgroundMode.VAPORWAVE:
      return generateVaporwave(100);
    case BackgroundMode.GLITCH:
      return generateGlitchElements(50);
    case BackgroundMode.COSMOS:
      return generateCosmos(120);
    default:
      return generateStarfield(count, mode);
  }
}

/**
 * Generate starfield (works for classic, rainbow, psychedelic)
 */
function generateStarfield(count, mode) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const baseSpeed = Math.random() < 0.3 ? 20 : (Math.random() < 0.6 ? 40 : 60);
    stars.push({
      type: 'star',
      x: Math.random() * gameConfig.canvas.width,
      y: Math.random() * gameConfig.canvas.height,
      size: Math.random() < 0.5 ? 1 : 2,
      opacity: 0.3 + Math.random() * 0.7,
      speed: baseSpeed,
      baseSpeed: baseSpeed,
      hue: Math.random() * 360,
      pulsePhase: Math.random() * Math.PI * 2,
      mode: mode
    });
  }
  return stars;
}

/**
 * Generate Matrix rain effect
 */
function generateMatrixRain(columns) {
  const elements = [];
  const columnWidth = gameConfig.canvas.width / columns;

  for (let i = 0; i < columns; i++) {
    const chars = Math.floor(5 + Math.random() * 15);
    elements.push({
      type: 'matrix_column',
      x: i * columnWidth + columnWidth / 2,
      y: -Math.random() * gameConfig.canvas.height,
      chars: chars,
      speed: 50 + Math.random() * 100,
      glyphSpeed: 30 + Math.random() * 20,
      glyphIndex: 0,
      trailLength: chars,
      opacity: 0.7 + Math.random() * 0.3
    });
  }
  return elements;
}

/**
 * Generate nebula clouds
 */
function generateNebula(count) {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      type: 'nebula_cloud',
      x: Math.random() * gameConfig.canvas.width,
      y: Math.random() * gameConfig.canvas.height,
      size: 40 + Math.random() * 80,
      hue: Math.random() * 360,
      opacity: 0.1 + Math.random() * 0.15,
      driftSpeed: 5 + Math.random() * 10,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.5 + Math.random() * 0.5
    });
  }
  return clouds;
}

/**
 * Generate vaporwave aesthetic
 */
function generateVaporwave(count) {
  const elements = [];

  // Vaporwave grid lines
  for (let i = 0; i < 10; i++) {
    elements.push({
      type: 'vaporwave_grid',
      y: 300 + i * 20,
      opacity: 0.3 - i * 0.02,
      speed: 20,
      hue: 280 + i * 5 // Purple to pink
    });
  }

  // Floating stars
  for (let i = 0; i < count; i++) {
    elements.push({
      type: 'vaporwave_star',
      x: Math.random() * gameConfig.canvas.width,
      y: Math.random() * 300,
      size: 1 + Math.random(),
      opacity: 0.4 + Math.random() * 0.4,
      hue: 280 + Math.random() * 40, // Purple/pink/blue
      twinklePhase: Math.random() * Math.PI * 2
    });
  }

  return elements;
}

/**
 * Generate glitch elements
 */
function generateGlitchElements(count) {
  const elements = [];
  for (let i = 0; i < count; i++) {
    elements.push({
      type: 'glitch_bar',
      x: Math.random() * gameConfig.canvas.width,
      y: Math.random() * gameConfig.canvas.height,
      width: 20 + Math.random() * 100,
      height: 2 + Math.random() * 8,
      hue: Math.random() * 360,
      opacity: 0.2 + Math.random() * 0.3,
      speed: 100 + Math.random() * 200,
      glitchTimer: Math.random() * 2,
      visible: true
    });
  }
  return elements;
}

/**
 * Generate cosmos (colored stars)
 */
function generateCosmos(count) {
  const stars = [];
  const starColors = [
    { hue: 30, name: 'red giant' },
    { hue: 50, name: 'yellow star' },
    { hue: 200, name: 'blue star' },
    { hue: 0, name: 'white star' },
    { hue: 280, name: 'purple nebula' }
  ];

  for (let i = 0; i < count; i++) {
    const colorType = starColors[Math.floor(Math.random() * starColors.length)];
    const baseSpeed = Math.random() < 0.3 ? 15 : (Math.random() < 0.6 ? 30 : 50);

    stars.push({
      type: 'cosmos_star',
      x: Math.random() * gameConfig.canvas.width,
      y: Math.random() * gameConfig.canvas.height,
      size: Math.random() < 0.7 ? 1 : 2,
      opacity: 0.3 + Math.random() * 0.5,
      speed: baseSpeed,
      baseSpeed: baseSpeed,
      hue: colorType.hue + (Math.random() - 0.5) * 20,
      saturation: 60 + Math.random() * 40,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }
  return stars;
}

/**
 * Update background elements
 */
export function updateBackground(elements, dt, time = 0) {
  if (!elements || elements.length === 0) return;

  const firstType = elements[0]?.type;

  switch (firstType) {
    case 'star':
      updateStarfield(elements, dt, time);
      break;
    case 'matrix_column':
      updateMatrixRain(elements, dt);
      break;
    case 'nebula_cloud':
      updateNebula(elements, dt, time);
      break;
    case 'vaporwave_grid':
    case 'vaporwave_star':
      updateVaporwave(elements, dt, time);
      break;
    case 'glitch_bar':
      updateGlitch(elements, dt);
      break;
    case 'cosmos_star':
      updateCosmos(elements, dt, time);
      break;
  }
}

function updateStarfield(stars, dt, time) {
  for (const star of stars) {
    // Psychedelic mode: pulsing speed
    if (star.mode === BackgroundMode.PSYCHEDELIC || star.mode === BackgroundMode.RAINBOW) {
      const pulseFactor = 1 + Math.sin(time * 2 + star.pulsePhase) * 0.5;
      star.speed = star.baseSpeed * pulseFactor;
    }

    star.y += star.speed * dt;

    if (star.y > gameConfig.canvas.height) {
      star.y = 0;
      star.x = Math.random() * gameConfig.canvas.width;
    }
  }
}

function updateMatrixRain(columns, dt) {
  for (const col of columns) {
    col.y += col.speed * dt;
    col.glyphIndex += col.glyphSpeed * dt;

    if (col.y > gameConfig.canvas.height + col.trailLength * 15) {
      col.y = -col.trailLength * 15;
      col.x = (Math.random() * 30) * (gameConfig.canvas.width / 30);
    }
  }
}

function updateNebula(clouds, dt, time) {
  for (const cloud of clouds) {
    cloud.x += cloud.driftSpeed * dt;

    if (cloud.x > gameConfig.canvas.width + cloud.size) {
      cloud.x = -cloud.size;
      cloud.y = Math.random() * gameConfig.canvas.height;
    }
  }
}

function updateVaporwave(elements, dt, time) {
  for (const elem of elements) {
    if (elem.type === 'vaporwave_grid') {
      elem.y += elem.speed * dt;
      if (elem.y > gameConfig.canvas.height) {
        elem.y = 300;
      }
    }
  }
}

function updateGlitch(elements, dt) {
  for (const elem of elements) {
    elem.glitchTimer -= dt;
    if (elem.glitchTimer <= 0) {
      elem.visible = !elem.visible;
      elem.glitchTimer = 0.05 + Math.random() * 0.2;
      elem.x = Math.random() * gameConfig.canvas.width;
      elem.y = Math.random() * gameConfig.canvas.height;
    }
  }
}

function updateCosmos(stars, dt, time) {
  for (const star of stars) {
    star.y += star.speed * dt;

    if (star.y > gameConfig.canvas.height) {
      star.y = 0;
      star.x = Math.random() * gameConfig.canvas.width;
    }
  }
}

/**
 * Draw background based on mode
 */
export function drawBackground(ctx, elements, time = 0) {
  if (!elements || elements.length === 0) return;

  const firstType = elements[0]?.type;

  switch (firstType) {
    case 'star':
      drawStarfield(ctx, elements, time);
      break;
    case 'matrix_column':
      drawMatrixRain(ctx, elements, time);
      break;
    case 'nebula_cloud':
      drawNebula(ctx, elements, time);
      break;
    case 'vaporwave_grid':
    case 'vaporwave_star':
      drawVaporwave(ctx, elements, time);
      break;
    case 'glitch_bar':
      drawGlitch(ctx, elements);
      break;
    case 'cosmos_star':
      drawCosmos(ctx, elements, time);
      break;
  }
}

function drawStarfield(ctx, stars, time) {
  for (const star of stars) {
    if (star.mode === BackgroundMode.PSYCHEDELIC || star.mode === BackgroundMode.RAINBOW) {
      const hue = (star.hue + time * 50) % 360;
      const saturation = 70 + Math.sin(time * 2 + star.x * 0.01) * 30;
      const lightness = 50 + Math.sin(time * 3 + star.y * 0.01) * 20;
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${star.opacity})`;

      if (star.size >= 2) {
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
        ctx.shadowBlur = 3 + Math.sin(time * 5 + star.x) * 2;
      }
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    }

    ctx.fillRect(star.x, star.y, star.size, star.size);

    if (star.size >= 2) ctx.shadowBlur = 0;
  }
}

function drawMatrixRain(ctx, columns, time) {
  const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

  for (const col of columns) {
    for (let i = 0; i < col.trailLength; i++) {
      const charY = col.y - i * 15;
      if (charY < -15 || charY > gameConfig.canvas.height) continue;

      const fadeOut = i / col.trailLength;
      const isLeader = i === 0;

      ctx.font = '12px monospace';
      ctx.fillStyle = isLeader
        ? `rgba(200, 255, 200, ${col.opacity})`
        : `rgba(0, 255, 0, ${col.opacity * (1 - fadeOut)})`;

      const glyphIdx = Math.floor((col.glyphIndex + i) % glyphs.length);
      ctx.fillText(glyphs[glyphIdx], col.x, charY);
    }
  }
}

function drawNebula(ctx, clouds, time) {
  for (const cloud of clouds) {
    const pulseSize = cloud.size * (1 + Math.sin(time * cloud.pulseSpeed + cloud.pulsePhase) * 0.2);

    const gradient = ctx.createRadialGradient(
      cloud.x, cloud.y, 0,
      cloud.x, cloud.y, pulseSize / 2
    );

    gradient.addColorStop(0, `hsla(${cloud.hue}, 80%, 50%, ${cloud.opacity})`);
    gradient.addColorStop(0.5, `hsla(${cloud.hue + 30}, 70%, 40%, ${cloud.opacity * 0.5})`);
    gradient.addColorStop(1, `hsla(${cloud.hue}, 60%, 30%, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(
      cloud.x - pulseSize / 2,
      cloud.y - pulseSize / 2,
      pulseSize,
      pulseSize
    );
  }
}

function drawVaporwave(ctx, elements, time) {
  for (const elem of elements) {
    if (elem.type === 'vaporwave_grid') {
      ctx.strokeStyle = `hsla(${elem.hue}, 80%, 60%, ${elem.opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, elem.y);
      ctx.lineTo(gameConfig.canvas.width, elem.y);
      ctx.stroke();

      // Vertical grid lines
      for (let x = 0; x < gameConfig.canvas.width; x += 40) {
        const perspective = (elem.y - 300) / 200;
        const offset = x - gameConfig.canvas.width / 2;
        const perspectiveX = gameConfig.canvas.width / 2 + offset * (1 - perspective * 0.5);

        ctx.beginPath();
        ctx.moveTo(perspectiveX, elem.y);
        ctx.lineTo(perspectiveX, elem.y + 20);
        ctx.stroke();
      }
    } else if (elem.type === 'vaporwave_star') {
      const twinkle = 0.7 + Math.sin(time * 3 + elem.twinklePhase) * 0.3;
      ctx.fillStyle = `hsla(${elem.hue}, 90%, 70%, ${elem.opacity * twinkle})`;
      ctx.fillRect(elem.x, elem.y, elem.size, elem.size);
    }
  }
}

function drawGlitch(ctx, elements) {
  for (const elem of elements) {
    if (!elem.visible) continue;

    ctx.fillStyle = `hsla(${elem.hue}, 100%, 60%, ${elem.opacity})`;
    ctx.fillRect(elem.x, elem.y, elem.width, elem.height);
  }
}

function drawCosmos(ctx, stars, time) {
  for (const star of stars) {
    const twinkle = 1 + Math.sin(time * 4 + star.twinklePhase) * 0.3;
    const opacity = star.opacity * twinkle;

    ctx.fillStyle = `hsla(${star.hue}, ${star.saturation}%, 60%, ${opacity})`;

    if (star.size >= 2) {
      ctx.shadowColor = `hsl(${star.hue}, ${star.saturation}%, 70%)`;
      ctx.shadowBlur = 2;
    }

    ctx.fillRect(star.x, star.y, star.size, star.size);

    if (star.size >= 2) ctx.shadowBlur = 0;
  }
}
