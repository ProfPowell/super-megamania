/**
 * @fileoverview Input manager
 * Combines keyboard and touch input into unified interface
 */

import { createKeyboardInput } from './keyboard.js';
import { createTouchInput } from './touch.js';

/**
 * @typedef {Object} InputState
 * @property {boolean} left - Move left
 * @property {boolean} right - Move right
 * @property {boolean} fire - Fire weapon
 * @property {boolean} pause - Pause game
 * @property {boolean} restart - Restart game
 */

/**
 * Create input manager
 * @returns {Object} Input manager
 */
export function createInputManager() {
  const keyboard = createKeyboardInput();
  const touch = createTouchInput();

  // Auto-detect and show touch controls on touch devices
  if (touch.isTouchDevice()) {
    touch.show();
  }

  return {
    /**
     * Get combined input state from all sources
     * @returns {InputState} Combined input state
     */
    getState() {
      const kbState = keyboard.getState();
      const touchState = touch.getState();

      return {
        left: kbState.left || touchState.left,
        right: kbState.right || touchState.right,
        fire: kbState.fire || touchState.fire,
        pause: kbState.pause,
        restart: kbState.restart
      };
    },

    /**
     * Get movement direction (-1 = left, 0 = none, 1 = right)
     * @returns {number} Direction
     */
    getDirection() {
      const state = this.getState();
      if (state.left && !state.right) return -1;
      if (state.right && !state.left) return 1;
      return 0;
    },

    /**
     * Enable all inputs
     */
    enable() {
      keyboard.enable();
      touch.enable();
    },

    /**
     * Disable all inputs
     */
    disable() {
      keyboard.disable();
      touch.disable();
    },

    /**
     * Show touch controls
     */
    showTouchControls() {
      touch.show();
    },

    /**
     * Hide touch controls
     */
    hideTouchControls() {
      touch.hide();
    }
  };
}
