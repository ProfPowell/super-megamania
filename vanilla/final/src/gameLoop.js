/**
 * @fileoverview Game loop implementation
 * Fixed timestep game loop with delta time for smooth updates
 */

/**
 * @typedef {Object} GameLoop
 * @property {Function} start - Start the game loop
 * @property {Function} stop - Stop the game loop
 * @property {Function} pause - Pause the game loop
 * @property {Function} resume - Resume the game loop
 * @property {number} fps - Current FPS
 */

/**
 * Create a game loop
 * @param {Function} update - Update callback (dt in seconds)
 * @param {Function} render - Render callback
 * @returns {GameLoop} Game loop controller
 */
export function createGameLoop(update, render) {
  let animationId = null;
  let lastTime = 0;
  let isPaused = false;
  let fps = 0;
  let frameCount = 0;
  let fpsTime = 0;

  /**
   * Main loop function
   * @param {number} timestamp - Current timestamp from RAF
   */
  function loop(timestamp) {
    animationId = requestAnimationFrame(loop);

    // Calculate delta time in seconds
    const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    // Clamp delta time to prevent spiral of death
    const dt = Math.min(deltaTime, 0.1);

    // Calculate FPS
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1.0) {
      fps = frameCount;
      frameCount = 0;
      fpsTime = 0;
    }

    if (!isPaused) {
      // Update game logic
      update(dt);
    }

    // Always render (even when paused)
    render();
  }

  return {
    /**
     * Start the game loop
     */
    start() {
      if (!animationId) {
        lastTime = 0;
        animationId = requestAnimationFrame(loop);
      }
    },

    /**
     * Stop the game loop
     */
    stop() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
        lastTime = 0;
      }
    },

    /**
     * Pause the game loop (continues rendering)
     */
    pause() {
      isPaused = true;
    },

    /**
     * Resume the game loop
     */
    resume() {
      isPaused = false;
      lastTime = 0; // Reset to prevent large delta
    },

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    get fps() {
      return fps;
    },

    /**
     * Check if paused
     * @returns {boolean} Paused state
     */
    get paused() {
      return isPaused;
    }
  };
}
