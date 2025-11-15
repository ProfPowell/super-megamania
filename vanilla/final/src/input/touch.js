/**
 * @fileoverview Touch input handler for mobile devices
 * Manages on-screen touch buttons
 */

/**
 * @typedef {Object} TouchState
 * @property {boolean} left - Left button pressed
 * @property {boolean} right - Right button pressed
 * @property {boolean} fire - Fire button pressed
 */

/**
 * Create touch input handler
 * @returns {{getState: Function, show: Function, hide: Function, enable: Function, disable: Function}}
 */
export function createTouchInput() {
  const touchState = {
    left: false,
    right: false,
    fire: false
  };

  let enabled = true;
  const activeTouches = new Map(); // Track touch IDs to buttons

  // Get touch control elements
  const touchControls = document.getElementById('touch-controls');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnFire = document.getElementById('btn-fire');

  /**
   * Handle touch start
   * @param {TouchEvent} e - Touch event
   */
  function handleTouchStart(e) {
    if (!enabled) return;
    e.preventDefault();

    const button = e.target.closest('.touch-btn');
    if (!button) return;

    // Track which button was touched
    const touch = e.changedTouches[0];
    activeTouches.set(touch.identifier, button.id);

    // Update state
    updateButtonState(button.id, true);
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e - Touch event
   */
  function handleTouchEnd(e) {
    if (!enabled) return;
    e.preventDefault();

    for (const touch of e.changedTouches) {
      const buttonId = activeTouches.get(touch.identifier);
      if (buttonId) {
        updateButtonState(buttonId, false);
        activeTouches.delete(touch.identifier);
      }
    }
  }

  /**
   * Handle touch cancel
   * @param {TouchEvent} e - Touch event
   */
  function handleTouchCancel(e) {
    handleTouchEnd(e);
  }

  /**
   * Update button state
   * @param {string} buttonId - Button element ID
   * @param {boolean} pressed - Pressed state
   */
  function updateButtonState(buttonId, pressed) {
    switch (buttonId) {
      case 'btn-left':
        touchState.left = pressed;
        break;
      case 'btn-right':
        touchState.right = pressed;
        break;
      case 'btn-fire':
        touchState.fire = pressed;
        break;
    }
  }

  // Attach event listeners
  if (touchControls) {
    touchControls.addEventListener('touchstart', handleTouchStart, { passive: false });
    touchControls.addEventListener('touchend', handleTouchEnd, { passive: false });
    touchControls.addEventListener('touchcancel', handleTouchCancel, { passive: false });
  }

  return {
    /**
     * Get current touch state
     * @returns {TouchState} Current touch states
     */
    getState() {
      return { ...touchState };
    },

    /**
     * Show touch controls
     */
    show() {
      if (touchControls) {
        touchControls.classList.remove('hidden');
      }
    },

    /**
     * Hide touch controls
     */
    hide() {
      if (touchControls) {
        touchControls.classList.add('hidden');
      }
    },

    /**
     * Enable touch input
     */
    enable() {
      enabled = true;
    },

    /**
     * Disable touch input
     */
    disable() {
      enabled = false;
      touchState.left = false;
      touchState.right = false;
      touchState.fire = false;
      activeTouches.clear();
    },

    /**
     * Check if device has touch support
     * @returns {boolean} True if touch supported
     */
    isTouchDevice() {
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }
  };
}
