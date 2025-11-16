/**
 * @fileoverview Enhanced main game entry point
 * Integrates themes, expanded waves, and all improvements
 */

import { initCanvas, clearCanvas, generateStars, drawStarfield, updateStarfield } from './canvas.js';
import { createGameLoop } from './gameLoop.js';
import { createGameState, resetGameState, GameStates, addScore, loseLife, nextWave, depleteEnergy, refillEnergy, startEnergyRefill, updateEnergyAnimation, incrementCombo, updateCombo, resetCombo } from './state/gameState.js';
import { getAdjustedConfig } from './config/gameConfig.js';
import { createInputManager } from './input/inputManager.js';
import { createPlayer, updatePlayer, canFire, recordFire, hitPlayer, getPlayerHitbox, drawPlayer } from './entities/player.js';
import { createPlayerBullet, createEnemyBullet, updateProjectile, isOffScreen, drawProjectile } from './entities/projectile.js';
import { createEnemy, updateEnemy, canEnemyFire, recordEnemyFire, isEnemyOffScreen, drawEnemy } from './entities/enemyExpanded.js';
import { maybeCreatePowerUpDrop, updatePowerUp, drawPowerUp, isPowerUpOffScreen, checkPlayerPowerUpCollision, applyPowerUp, updateActivePowerUps, hasPowerUp } from './entities/powerup.js';
import { checkProjectileEnemyCollision, checkPlayerEnemyCollision, checkPlayerBulletCollision } from './systems/collision.js';
import { startWave, updateWaveManager } from './systems/waveManager.js';
import { createExplosion, createAbsurdExplosion, createTrailParticle, updateParticles, drawParticles } from './systems/particleSystem.js';
import { triggerScreenShake, updateScreenShake, applyScreenShake, resetScreenShake } from './systems/screenShake.js';
import { drawHUD, drawWaveAnnouncement, drawWaveComplete, drawEnergyBar, drawActivePowerUps } from './ui/hud.js';
import { createMenuController } from './ui/menu.js';
import { loadHighScores, isHighScore, addHighScore, renderHighScores } from './storage/highScores.js';
import { loadSettings, saveSettings, loadPlayerName, savePlayerName, applySettingsToUI } from './storage/settings.js';
import { createAudioManager } from './audio/audioManager.js';
import { assetLoader, loadThemeImages } from './assets/assetLoader.js';
import { getTheme } from './assets/themes.js';
import { waves } from './config/wavesExpanded.js';
import { getTotalWaves } from './config/wavesExpanded.js';

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
let interWavePause = false;
let interWavePauseTimer = 0;

// Pause tracking
let pausePressed = false;

// Theme assets
let currentTheme = null;
let themeImages = {};
let playerImage = null;

/**
 * Initialize the game
 */
async function init() {
  console.log('Initializing Super Megamania...');

  // Initialize canvas
  const { canvas, ctx: context } = initCanvas('gameCanvas');
  ctx = context;

  // Generate starfield
  stars = generateStars(100);

  // Load settings
  const settings = loadSettings();
  applySettingsToUI(settings);

  // Load theme
  await loadTheme(settings.theme || 'cats');

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

  // Update loading progress
  updateLoadingProgress(100);

  // Hide loading screen and show menu
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  }, 500);

  // Start the game loop
  gameLoop.start();

  console.log('Game initialized!');
}

/**
 * Load theme assets
 * Supports both SVG data URLs and external PNG/JPG files
 * @param {string} themeName - Theme name
 */
async function loadTheme(themeName) {
  console.log(`Loading theme: ${themeName}`);

  currentTheme = getTheme(themeName);

  // Use the unified theme loader (handles both data URLs and external files)
  const loadedImages = await loadThemeImages(currentTheme);

  // Extract player and enemy images
  playerImage = loadedImages.player || null;
  themeImages = {};

  for (const [key, image] of Object.entries(loadedImages)) {
    if (key !== 'player') {
      themeImages[key] = image;
    }
  }

  // Update audio manager with current theme (for absurd mode sounds)
  if (audioManager) {
    audioManager.setTheme(themeName);
  }

  console.log(`Theme loaded: ${currentTheme.name} (${Object.keys(themeImages).length} enemy sprites)`);
}

/**
 * Update loading progress
 * @param {number} percentage - Progress percentage (0-100)
 */
function updateLoadingProgress(percentage) {
  const progressBar = document.getElementById('loading-progress');
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
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

  document.getElementById('btn-back-settings').addEventListener('click', async () => {
    audioManager.playMenuSelect();
    const settings = getSettingsFromUI();
    saveSettings(settings);

    // Reload theme if changed
    if (settings.theme !== currentTheme.name.toLowerCase()) {
      await loadTheme(settings.theme);
    }

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
    theme: document.getElementById('theme-select').value,
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
  audioManager.startMusic();  // Start background music

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
 * Handle player death - restart wave (unless wave was already complete)
 */
function handlePlayerDeath() {
  audioManager.playPlayerDeath();

  // If wave was already complete, don't restart - let it progress normally
  if (state.waveComplete) {
    // Just clear bullets and refill energy
    state.enemyBullets = [];
    state.playerBullets = [];
    refillEnergy(state);
    return;
  }

  // Wave not complete - clear everything and restart
  state.enemies = [];
  state.enemyBullets = [];
  state.playerBullets = [];

  // Refill energy for new life
  refillEnergy(state);

  // Restart the current wave
  startWave(state, adjustedConfig);
  waveAnnouncementTimer = 2;
  waveAnnouncementAlpha = 1;
  audioManager.playWaveStart();
}

/**
 * Handle game over
 */
function handleGameOver() {
  state.currentState = GameStates.GAME_OVER;

  audioManager.stopMusic();  // Stop background music
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
    }, { once: true });
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

  // Update moving starfield background
  updateStarfield(stars, dt);

  // Update COMBO timer (breaks combo if no kills within 2 seconds)
  updateCombo(state, dt);

  // Update screen shake
  updateScreenShake(dt);

  // Deplete energy over time (like original Megamania!)
  const energyDepleted = depleteEnergy(state, dt);
  if (energyDepleted) {
    // Ran out of energy - lose a life
    const gameOver = loseLife(state);
    if (gameOver) {
      handleGameOver();
      return;
    }
    // Lost a life but game continues - restart wave
    handlePlayerDeath();
    return;
  }

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
  if (input.fire) {
    // Check fire rate (reduced by rapid fire power-up)
    let fireRateModifier = 1;
    if (hasPowerUp(state, 'rapidFire')) {
      fireRateModifier = 0.33; // 3x faster (1/3 the delay)
    }

    if (canFire(state.player, fireRateModifier)) {
      // Spread shot fires 3 bullets at angles
      if (hasPowerUp(state, 'spreadShot')) {
        const spreadAngle = 0.3; // radians
        const angles = [-spreadAngle, 0, spreadAngle];

        for (const angle of angles) {
          const bullet = createPlayerBullet(
            state.player.x + state.player.width / 2,
            state.player.y,
            angle
          );
          state.playerBullets.push(bullet);
        }
      } else {
        // Normal single shot
        if (state.playerBullets.length < 5) {
          const bullet = createPlayerBullet(
            state.player.x + state.player.width / 2,
            state.player.y
          );
          state.playerBullets.push(bullet);
        }
      }

      recordFire(state.player);
      audioManager.playPlayerFire();
    }
  }

  // Don't spawn/update enemies during inter-wave pause
  if (!interWavePause) {
    // Update wave manager
    updateWaveManager(state, dt, adjustedConfig);
  }

  // Update enemies (pass player position for kamikaze tracking)
  const playerPos = { x: state.player.x + state.player.width / 2, y: state.player.y };

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    updateEnemy(enemy, dt, playerPos);

    // ABSURD MODE: Enemy trails! 🌟
    if (currentTheme === 'absurd' && Math.random() < 0.3) {
      state.particles.push(createTrailParticle(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.color
      ));
    }

    // Enemy firing
    if (canEnemyFire(enemy)) {
      const bullet = createEnemyBullet(enemy.x, enemy.y + enemy.height / 2, enemy.bulletSpeed);
      state.enemyBullets.push(bullet);
      recordEnemyFire(enemy);
    }

    // Remove if off-screen (enemy escaped - breaks perfect wave!)
    if (isEnemyOffScreen(enemy)) {
      state.enemies.splice(i, 1);
      state.perfectWave = false; // Letting enemies escape breaks perfect wave
      // Count escaped enemies toward wave progression so it doesn't hang
      if (state.currentWave) {
        // Don't count as kill for score, but allow wave to progress
        state.enemiesKilled++;
      }
    }
  }

  // Update player bullets
  for (let i = state.playerBullets.length - 1; i >= 0; i--) {
    const bullet = state.playerBullets[i];
    updateProjectile(bullet, dt);

    // ABSURD MODE: Add bullet trails! ✨
    if (currentTheme === 'absurd' && Math.random() < 0.5) {
      state.particles.push(createTrailParticle(bullet.x, bullet.y, bullet.color));
    }

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

      // INCREMENT COMBO! 🔥
      incrementCombo(state);

      const extraLife = addScore(state, hitEnemy.scoreValue);
      if (extraLife) {
        audioManager.playExtraLife();
      }

      // ABSURD MODE: Crazy explosions and screen shake! 💥
      if (currentTheme === 'absurd') {
        state.particles.push(...createAbsurdExplosion(hitEnemy.x, hitEnemy.y, hitEnemy.color));
        triggerScreenShake(4, 0.15); // Intense shake!
      } else {
        state.particles.push(...createExplosion(hitEnemy.x, hitEnemy.y, hitEnemy.color));
        triggerScreenShake(2, 0.1); // Mild shake
      }

      audioManager.playEnemyExplode();

      // MAYBE DROP A POWER-UP! 💫
      const powerUpDrop = maybeCreatePowerUpDrop(hitEnemy.x, hitEnemy.y);
      if (powerUpDrop) {
        state.powerUps.push(powerUpDrop);
      }
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

  // Update power-ups
  for (let i = state.powerUps.length - 1; i >= 0; i--) {
    const powerUp = state.powerUps[i];
    updatePowerUp(powerUp, dt);

    // Remove if off screen
    if (isPowerUpOffScreen(powerUp)) {
      state.powerUps.splice(i, 1);
      continue;
    }

    // Check collision with player
    if (checkPlayerPowerUpCollision(state.player, powerUp)) {
      state.powerUps.splice(i, 1);
      applyPowerUp(state, powerUp);
      audioManager.playPowerUp();
    }
  }

  // Update active power-up timers
  updateActivePowerUps(state);

  // Check player collisions (skip if invincible or has shield)
  const hasShield = hasPowerUp(state, 'shield');
  if (!state.player.isInvincible && !hasShield) {
    const playerHitbox = getPlayerHitbox(state.player);

    // Player vs enemies
    const hitByEnemy = checkPlayerEnemyCollision(playerHitbox, state.enemies);
    if (hitByEnemy) {
      state.enemies = state.enemies.filter(e => e !== hitByEnemy);
      hitPlayer(state.player);
      state.particles.push(...createExplosion(state.player.x + 16, state.player.y + 12, '#00ff00'));

      const gameOver = loseLife(state);
      if (gameOver) {
        handleGameOver();
      } else {
        // Lost a life but game continues - restart wave
        handlePlayerDeath();
      }
      return; // Don't process more collisions this frame
    }

    // Player vs enemy bullets
    const hitByBullet = checkPlayerBulletCollision(playerHitbox, state.enemyBullets);
    if (hitByBullet) {
      state.enemyBullets = state.enemyBullets.filter(b => b !== hitByBullet);
      hitPlayer(state.player);
      state.particles.push(...createExplosion(state.player.x + 16, state.player.y + 12, '#00ff00'));

      const gameOver = loseLife(state);
      if (gameOver) {
        handleGameOver();
      } else {
        // Lost a life but game continues - restart wave
        handlePlayerDeath();
      }
      return; // Don't process more collisions this frame
    }
  }

  // Check wave completion
  if (state.waveComplete && state.enemies.length === 0 && !interWavePause) {
    // Start inter-wave pause
    interWavePause = true;
    interWavePauseTimer = 3.0; // 3 second pause between waves
    waveCompleteTimer = 2.5;
    waveCompleteAlpha = 1;

    // Start energy refill animation
    startEnergyRefill(state);
  }

  // Handle inter-wave pause
  if (interWavePause) {
    interWavePauseTimer -= dt;

    // Update energy refill animation
    const animCompleted = updateEnergyAnimation(state, dt);
    if (animCompleted) {
      audioManager.playEnergyRefill();
    }

    if (interWavePauseTimer <= 0) {
      // Pause complete, start next wave
      interWavePause = false;
      nextWave(state);
      adjustedConfig = getAdjustedConfig(state.difficulty, state.level);
      startWave(state, adjustedConfig);
      waveAnnouncementTimer = 2;
      waveAnnouncementAlpha = 1;
      audioManager.playWaveStart();
    }
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

  // Apply screen shake effect
  ctx.save();
  applyScreenShake(ctx);

  if (state.currentState === GameStates.PLAYING || state.currentState === GameStates.PAUSED) {
    // Draw player with theme image
    if (state.player) {
      drawPlayer(ctx, state.player, playerImage);
    }

    // Draw enemies with theme images
    for (const enemy of state.enemies) {
      const enemyImage = themeImages[enemy.themeKey] || null;
      drawEnemy(ctx, enemy, enemyImage);
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

    // Draw power-ups
    for (const powerUp of state.powerUps) {
      drawPowerUp(ctx, powerUp);
    }

    // Draw HUD
    drawHUD(ctx, state, gameLoop.fps);

    // Draw energy bar (like original Megamania!)
    drawEnergyBar(ctx, state);

    // Draw active power-ups
    drawActivePowerUps(ctx, state);

    // Draw wave announcement
    if (waveAnnouncementAlpha > 0 && state.currentWave) {
      drawWaveAnnouncement(ctx, state.currentWave.name, waveAnnouncementAlpha);
    }

    // Draw wave complete (show both wave bonus and energy bonus)
    if (waveCompleteAlpha > 0) {
      drawWaveComplete(ctx, state.waveBonus, state.energyBonus, waveCompleteAlpha);
    }
  }

  // Restore context (remove screen shake)
  ctx.restore();
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
