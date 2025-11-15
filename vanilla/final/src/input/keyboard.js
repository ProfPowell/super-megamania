/**
 * @fileoverview Keyboard input handler
 * Tracks key states for game controls
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * @typedef {Object} KeyboardState
 * @property {boolean} left - Left movement key
 * @property {boolean} right - Right movement key
 * @property {boolean} fire - Fire key
 * @property {boolean} pause - Pause key
 * @property {boolean} restart - Restart key
 */

/**
 * Create keyboard input handler
 * @returns {{getState: Function, enable: Function, disable: Function}}
 */
export function createKeyboardInput() {
  const keys = new Set();
  let enabled = true;

  /**
   * Check if event target is an input field
   * @param {Event} e - Event object
   * @returns {boolean} True if typing in input
   */
  function isTypingInInput(e) {
    const target = e.target;
    return target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
  }

  /**
   * Handle key down
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyDown(e) {
    if (!enabled) return;

    // Don't capture keys when typing in input fields
    if (isTypingInInput(e)) return;

    keys.add(e.code);

    // Prevent default for game keys
    if (isGameKey(e.code)) {
      e.preventDefault();
    }
  }

  /**
   * Handle key up
   * @param {KeyboardEvent} e - Keyboard event
   */
  function handleKeyUp(e) {
    if (!enabled) return;

    // Don't capture keys when typing in input fields
    if (isTypingInInput(e)) return;

    keys.delete(e.code);
  }

  /**
   * Check if key code is a game control
   * @param {string} code - Key code
   * @returns {boolean} True if game key
   */
  function isGameKey(code) {
    const controls = gameConfig.controls.keyboard;
    return [
      ...controls.moveLeft,
      ...controls.moveRight,
      ...controls.fire,
      ...controls.pause,
      ...controls.restart
    ].includes(code);
  }

  /**
   * Check if any key in array is pressed
   * @param {string[]} keyCodes - Array of key codes
   * @returns {boolean} True if any key is pressed
   */
  function isAnyKeyPressed(keyCodes) {
    return keyCodes.some(code => keys.has(code));
  }

  // Attach event listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Handle window blur (release all keys)
  window.addEventListener('blur', () => {
    keys.clear();
  });

  return {
    /**
     * Get current keyboard state
     * @returns {KeyboardState} Current key states
     */
    getState() {
      const controls = gameConfig.controls.keyboard;
      return {
        left: isAnyKeyPressed(controls.moveLeft),
        right: isAnyKeyPressed(controls.moveRight),
        fire: isAnyKeyPressed(controls.fire),
        pause: isAnyKeyPressed(controls.pause),
        restart: isAnyKeyPressed(controls.restart)
      };
    },

    /**
     * Enable keyboard input
     */
    enable() {
      enabled = true;
    },

    /**
     * Disable keyboard input
     */
    disable() {
      enabled = false;
      keys.clear();
    },

    /**
     * Cleanup event listeners
     */
    destroy() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keys.clear();
    }
  };
}
