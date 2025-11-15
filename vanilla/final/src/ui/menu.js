/**
 * @fileoverview Menu system
 * Handles menu navigation and state
 */

/**
 * Menu controller
 */
export function createMenuController() {
  let currentScreen = 'menu';
  let selectedIndex = 0;

  const screens = {
    menu: {
      id: 'menu',
      buttons: ['btn-start', 'btn-high-scores', 'btn-settings', 'btn-help']
    },
    'high-scores': {
      id: 'high-scores-screen',
      buttons: ['btn-back-scores']
    },
    settings: {
      id: 'settings-screen',
      buttons: ['btn-back-settings']
    },
    help: {
      id: 'help-screen',
      buttons: ['btn-back-help']
    },
    pause: {
      id: 'pause-screen',
      buttons: ['btn-resume', 'btn-quit']
    },
    gameOver: {
      id: 'game-over-screen',
      buttons: ['btn-restart', 'btn-menu']
    }
  };

  /**
   * Show a screen
   * @param {string} screenName - Screen name
   */
  function showScreen(screenName) {
    // Hide all screens
    for (const screen of Object.values(screens)) {
      const element = document.getElementById(screen.id);
      if (element) {
        element.classList.add('hidden');
      }
    }

    // Show requested screen
    const screen = screens[screenName];
    if (screen) {
      const element = document.getElementById(screen.id);
      if (element) {
        element.classList.remove('hidden');
        currentScreen = screenName;
        selectedIndex = 0;
        updateButtonSelection();
      }
    }
  }

  /**
   * Hide all screens
   */
  function hideAllScreens() {
    for (const screen of Object.values(screens)) {
      const element = document.getElementById(screen.id);
      if (element) {
        element.classList.add('hidden');
      }
    }
  }

  /**
   * Update button selection styling
   */
  function updateButtonSelection() {
    const screen = screens[currentScreen];
    if (!screen) return;

    // Remove selection from all buttons
    screen.buttons.forEach((btnId, index) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.toggle('selected', index === selectedIndex);
      }
    });
  }

  /**
   * Navigate menu
   * @param {number} direction - -1 for up, 1 for down
   */
  function navigate(direction) {
    const screen = screens[currentScreen];
    if (!screen) return;

    selectedIndex += direction;
    if (selectedIndex < 0) selectedIndex = screen.buttons.length - 1;
    if (selectedIndex >= screen.buttons.length) selectedIndex = 0;

    updateButtonSelection();
  }

  /**
   * Select current button
   * @returns {string|null} Button ID that was selected
   */
  function select() {
    const screen = screens[currentScreen];
    if (!screen) return null;

    const btnId = screen.buttons[selectedIndex];
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.click();
      return btnId;
    }
    return null;
  }

  return {
    showScreen,
    hideAllScreens,
    navigate,
    select,
    getCurrentScreen: () => currentScreen
  };
}
