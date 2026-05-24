/**
 * @fileoverview Input manager
 * Combines keyboard and touch input into unified interface.
 * Phase 2B: tracks fire-press edge for input buffering.
 */

import { createKeyboardInput } from './keyboard.js';
import { createTouchInput } from './touch.js';

/**
 * @typedef {Object} InputState
 * @property {boolean} left
 * @property {boolean} right
 * @property {boolean} fire
 * @property {boolean} pause
 * @property {boolean} restart
 * @property {number} firePressedAt - ms timestamp of the most recent false→true fire transition; 0 if never pressed.
 */

/**
 * Create input manager.
 *
 * `deps` is optional and used only by tests to inject fake keyboard/touch
 * modules. In normal use, the default real modules are constructed.
 */
export function createInputManager(deps = null) {
  const keyboard = deps && deps.keyboard ? deps.keyboard : createKeyboardInput();
  const touch    = deps && deps.touch    ? deps.touch    : createTouchInput();

  if (touch.isTouchDevice && touch.isTouchDevice()) {
    touch.show();
  }

  let prevFire = false;
  let firePressedAt = 0;

  return {
    getState() {
      const kbState = keyboard.getState();
      const touchState = touch.getState();
      const fire = !!(kbState.fire || touchState.fire);

      if (fire && !prevFire) {
        firePressedAt = Date.now();
      }
      prevFire = fire;

      return {
        left:  !!(kbState.left  || touchState.left),
        right: !!(kbState.right || touchState.right),
        fire,
        pause:   !!kbState.pause,
        restart: !!kbState.restart,
        firePressedAt
      };
    },

    getDirection() {
      const state = this.getState();
      if (state.left && !state.right) return -1;
      if (state.right && !state.left) return 1;
      return 0;
    },

    enable() {
      keyboard.enable();
      touch.enable();
    },

    disable() {
      keyboard.disable();
      touch.disable();
      // Reset press-edge tracking so re-enable doesn't see a stale "still held" state.
      prevFire = false;
    },

    showTouchControls() {
      if (touch.show) touch.show();
    },

    hideTouchControls() {
      if (touch.hide) touch.hide();
    }
  };
}
