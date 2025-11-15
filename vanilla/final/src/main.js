/**
 * @fileoverview Main game entry point
 * Initializes and runs the game
 */

import { initCanvas, clearCanvas, generateStars, drawStarfield } from './canvas.js';
import { createGameLoop } from './gameLoop.js';
import { createGameState, resetGameState, GameStates, addScore, loseLife, nextWave } from './state/gameState.js';
import { getAdjustedConfig } from './config/gameConfig.js';
import { createInputManager } from './input/inputManager.js';
import { createPlayer, updatePlayer, canFire, recordFire, hitPlayer, getPlayerHitbox, drawPlayer } from './entities/player.js';
import { createPlayerBullet, createEnemyBullet, updateProjectile, isOffScreen, drawProjectile } from './entities/projectile.js';
import { updateEnemy, canEnemyFire, recordEnemyFire, isEnemyOffScreen, drawEnemy } from './entities/enemy.js';
import { checkProjectileEnemyCollision, checkPlayerEnemyCollision, checkPlayerBulletCollision } from './systems/collision.js';
import { startWave, updateWaveManager } from './systems/waveManager.js';
import { createExplosion, updateParticles, drawParticles } from './systems/particleSystem.js';
import { drawHUD, drawWaveAnnouncement, drawWaveComplete } from './ui/hud.js';
import { createMenuController } from './ui/menu.js';
import { loadHighScores, isHighScore, addHighScore, renderHighScores } from './storage/highScores.js';
import { loadSettings, saveSettings, loadPlayerName, savePlayerName, applySettingsToUI } from './storage/settings.js';
import { createAudioManager } from './audio/audioManager.js';

// Global game state
let state;
let gameLoop;
let inputManager;
let menuController;
let audioManager;
let stars;
let ctx;

// Adjusted config based on difficulty
let adjustedConfig;

// Animation states
let waveAnnouncementAlpha = 0;
let waveAnnouncementTimer = 0;
let waveCompleteAlpha = 0;
let waveCompleteTimer = 0;

// Pause tracking
let pausePressed = false;

/**
 * Initialize the game
 */
function init() {
  console.log('Initializing Super Megamania...');

  // Initialize canvas
  const { canvas, ctx: context } = initCanvas('gameCanvas');
  ctx = context;

  // Generate starfield
  stars = generateStars(100);

  // Load settings
  const settings = loadSettings();
  applySettingsToUI(settings);

  // Initialize audio
  audioManager = createAudioManager();
  audioManager.setSfxEnabled(settings.sfxEnabled);
  audioManager.setMusicEnabled(settings.musicEnabled);
  audioManager.setMasterVolume(settings.masterVolume);

  // Initialize input
  inputManager = createInputManager();

  // Initialize menu controller
  menuController = createMenuController();
  menuController.showScreen('menu');

  // Initialize game state
  state = createGameState(settings.difficulty);
  state.currentState = GameStates.MENU;

  // Setup UI event listeners
  setupEventListeners();

  // Create game loop
  gameLoop = createGameLoop(update, render);

  // Hide loading screen
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
  }, 500);

  // Start the game loop
  gameLoop.start();

  console.log('Game initialized!');
}

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
  // Menu buttons
  document.getElementById('btn-start').addEventListener('click', () => {
    audioManager.playMenuSelect();
    startGame();
  });

  document.getElementById('btn-high-scores').addEventListener('click', () => {
    audioManager.playMenuSelect();
    menuController.showScreen('high-scores');
    renderHighScores('high-scores-list');
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    audioManager.playMenuSelect();
    menuController.showScreen('settings');
  });

  document.getElementById('btn-help').addEventListener('click', () => {
    audioManager.playMenuSelect();
    menuController.showScreen('help');
  });

  // Back buttons
  document.getElementById('btn-back-scores').addEventListener('click', () => {
    audioManager.playMenuSelect();
    menuController.showScreen('menu');
  });

  document.getElementById('btn-back-settings').addEventListener('click', () => {
    audioManager.playMenuSelect();
    const settings = getSettingsFromUI();
    saveSettings(settings);
    menuController.showScreen('menu');
  });

  document.getElementById('btn-back-help').addEventListener('click', () => {
    audioManager.playMenuSelect();
    menuController.showScreen('menu');
  });

  // Pause menu
  document.getElementById('btn-resume').addEventListener('click', () => {
    audioManager.playMenuSelect();
    resumeGame();
  });

  document.getElementById('btn-quit').addEventListener('click', () => {
    audioManager.playMenuSelect();
    quitToMenu();
  });

  // Game over buttons
  document.getElementById('btn-restart').addEventListener('click', () => {
    audioManager.playMenuSelect();
    startGame();
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    audioManager.playMenuSelect();
    quitToMenu();
  });

  // Settings controls
  document.getElementById('sfx-toggle').addEventListener('click', toggleSfx);
  document.getElementById('music-toggle').addEventListener('click', toggleMusic);
  document.getElementById('volume-slider').addEventListener('input', updateVolume);
}

/**
 * Get settings from UI
 */
function getSettingsFromUI() {
  return {
    difficulty: document.getElementById('difficulty-select').value,
    sfxEnabled: document.getElementById('sfx-toggle').textContent === 'ON',
    musicEnabled: document.getElementById('music-toggle').textContent === 'ON',
    masterVolume: parseInt(document.getElementById('volume-slider').value) / 100
  };
}

/**
 * Toggle SFX
 */
function toggleSfx() {
  const btn = document.getElementById('sfx-toggle');
  const enabled = btn.textContent === 'OFF';
  btn.textContent = enabled ? 'ON' : 'OFF';
  btn.classList.toggle('off', !enabled);
  audioManager.setSfxEnabled(enabled);
  if (enabled) audioManager.playMenuSelect();
}

/**
 * Toggle music
 */
function toggleMusic() {
  const btn = document.getElementById('music-toggle');
  const enabled = btn.textContent === 'OFF';
  btn.textContent = enabled ? 'ON' : 'OFF';
  btn.classList.toggle('off', !enabled);
  audioManager.setMusicEnabled(enabled);
}

/**
 * Update volume
 */
function updateVolume(e) {
  const value = parseInt(e.target.value);
  document.getElementById('volume-value').textContent = `${value}%`;
  audioManager.setMasterVolume(value / 100);
}

/**
 * Start a new game
 */
function startGame() {
  menuController.hideAllScreens();

  const settings = loadSettings();
  resetGameState(state, settings.difficulty);
  adjustedConfig = getAdjustedConfig(state.difficulty, state.level);

  // Create player
  state.player = createPlayer(adjustedConfig);

  // Start first wave
  startWave(state, adjustedConfig);
  waveAnnouncementTimer = 2;
  waveAnnouncementAlpha = 1;

  audioManager.playWaveStart();

  state.currentState = GameStates.PLAYING;
}

/**
 * Pause game
 */
function pauseGame() {
  if (state.currentState === GameStates.PLAYING) {
    state.currentState = GameStates.PAUSED;
    menuController.showScreen('pause');
  }
}

/**
 * Resume game
 */
function resumeGame() {
  if (state.currentState === GameStates.PAUSED) {
    state.currentState = GameStates.PLAYING;
    menuController.hideAllScreens();
  }
}

/**
 * Quit to menu
 */
function quitToMenu() {
  state.currentState = GameStates.MENU;
  menuController.showScreen('menu');
}

/**
 * Handle game over
 */
function handleGameOver() {
  state.currentState = GameStates.GAME_OVER;

  audioManager.playGameOver();

  // Show game over screen
  document.getElementById('final-score').textContent = `SCORE: ${state.score}`;

  // Check for high score
  if (isHighScore(state.score)) {
    document.getElementById('new-high-score').classList.remove('hidden');
    document.getElementById('name-entry').classList.remove('hidden');

    const nameInput = document.getElementById('player-name');
    nameInput.value = loadPlayerName();
    nameInput.focus();
    nameInput.select();

    // Save high score when name changes
    nameInput.addEventListener('change', () => {
      const name = nameInput.value.toUpperCase().substring(0, 3);
      savePlayerName(name);
      addHighScore(name, state.score, state.level);
    });
  } else {
    document.getElementById('new-high-score').classList.add('hidden');
    document.getElementById('name-entry').classList.add('hidden');
  }

  menuController.showScreen('gameOver');
}

/**
 * Update game logic
 * @param {number} dt - Delta time in seconds
 */
function update(dt) {
  if (state.currentState !== GameStates.PLAYING) return;

  state.gameTime += dt;

  // Get input
  const input = inputManager.getState();

  // Handle pause
  if (input.pause && !pausePressed) {
    pausePressed = true;
    pauseGame();
    return;
  }
  if (!input.pause) {
    pausePressed = false;
  }

  // Update player
  const direction = inputManager.getDirection();
  updatePlayer(state.player, dt, direction);

  // Player firing
  if (input.fire && canFire(state.player)) {
    if (state.playerBullets.length < 5) {
      const bullet = createPlayerBullet(
        state.player.x + state.player.width / 2,
        state.player.y
      );
      state.playerBullets.push(bullet);
      recordFire(state.player);
      audioManager.playPlayerFire();
    }
  }

  // Update wave manager
  updateWaveManager(state, dt, adjustedConfig);

  // Update enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    updateEnemy(enemy, dt);

    // Enemy firing
    if (canEnemyFire(enemy)) {
      const bullet = createEnemyBullet(enemy.x, enemy.y + enemy.height / 2, enemy.bulletSpeed);
      state.enemyBullets.push(bullet);
      recordEnemyFire(enemy);
    }

    // Remove if off-screen
    if (isEnemyOffScreen(enemy)) {
      state.enemies.splice(i, 1);
    }
  }

  // Update player bullets
  for (let i = state.playerBullets.length - 1; i >= 0; i--) {
    const bullet = state.playerBullets[i];
    updateProjectile(bullet, dt);

    if (isOffScreen(bullet)) {
      state.playerBullets.splice(i, 1);
      continue;
    }

    // Check collision with enemies
    const hitEnemy = checkProjectileEnemyCollision(bullet, state.enemies);
    if (hitEnemy) {
      state.playerBullets.splice(i, 1);
      state.enemies = state.enemies.filter(e => e !== hitEnemy);
      state.enemiesKilled++;
      addScore(state, hitEnemy.scoreValue);
      state.particles.push(...createExplosion(hitEnemy.x, hitEnemy.y, hitEnemy.color));
      audioManager.playEnemyExplode();
    }
  }

  // Update enemy bullets
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const bullet = state.enemyBullets[i];
    updateProjectile(bullet, dt);

    if (isOffScreen(bullet)) {
      state.enemyBullets.splice(i, 1);
    }
  }

  // Update particles
  updateParticles(state.particles, dt);

  // Check player collisions
  if (!state.player.isInvincible) {
    const playerHitbox = getPlayerHitbox(state.player);

    // Player vs enemies
    const hitByEnemy = checkPlayerEnemyCollision(playerHitbox, state.enemies);
    if (hitByEnemy) {
      state.enemies = state.enemies.filter(e => e !== hitByEnemy);
      hitPlayer(state.player);
      state.particles.push(...createExplosion(state.player.x + 16, state.player.y + 12, '#00ff00'));
      audioManager.playPlayerHit();

      if (loseLife(state)) {
        handleGameOver();
      }
    }

    // Player vs enemy bullets
    const hitByBullet = checkPlayerBulletCollision(playerHitbox, state.enemyBullets);
    if (hitByBullet) {
      state.enemyBullets = state.enemyBullets.filter(b => b !== hitByBullet);
      hitPlayer(state.player);
      state.particles.push(...createExplosion(state.player.x + 16, state.player.y + 12, '#00ff00'));
      audioManager.playPlayerHit();

      if (loseLife(state)) {
        handleGameOver();
      }
    }
  }

  // Check wave completion
  if (state.waveComplete && state.enemies.length === 0) {
    waveCompleteTimer = 2;
    waveCompleteAlpha = 1;
    nextWave(state);
    adjustedConfig = getAdjustedConfig(state.difficulty, state.level);
    startWave(state, adjustedConfig);
    waveAnnouncementTimer = 2;
    waveAnnouncementAlpha = 1;
    audioManager.playWaveStart();
  }

  // Update UI animations
  if (waveAnnouncementTimer > 0) {
    waveAnnouncementTimer -= dt;
    waveAnnouncementAlpha = Math.max(0, waveAnnouncementTimer / 2);
  }

  if (waveCompleteTimer > 0) {
    waveCompleteTimer -= dt;
    waveCompleteAlpha = Math.max(0, waveCompleteTimer / 2);
  }
}

/**
 * Render game graphics
 */
function render() {
  // Clear screen
  clearCanvas(ctx);

  // Draw starfield
  drawStarfield(ctx, stars);

  if (state.currentState === GameStates.PLAYING || state.currentState === GameStates.PAUSED) {
    // Draw player
    if (state.player) {
      drawPlayer(ctx, state.player);
    }

    // Draw enemies
    for (const enemy of state.enemies) {
      drawEnemy(ctx, enemy);
    }

    // Draw bullets
    for (const bullet of state.playerBullets) {
      drawProjectile(ctx, bullet);
    }
    for (const bullet of state.enemyBullets) {
      drawProjectile(ctx, bullet);
    }

    // Draw particles
    drawParticles(ctx, state.particles);

    // Draw HUD
    drawHUD(ctx, state, gameLoop.fps);

    // Draw wave announcement
    if (waveAnnouncementAlpha > 0 && state.currentWave) {
      drawWaveAnnouncement(ctx, state.currentWave.name, waveAnnouncementAlpha);
    }

    // Draw wave complete
    if (waveCompleteAlpha > 0) {
      drawWaveComplete(ctx, state.waveBonus, waveCompleteAlpha);
    }
  }
}

// Start the game when page loads
window.addEventListener('load', init);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
