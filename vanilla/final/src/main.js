/**
 * @fileoverview Enhanced main game entry point
 * Integrates themes, expanded waves, and all improvements
 */

import { initCanvas, clearCanvas } from './canvas.js';
import { generateBackground, updateBackground, drawBackground, BackgroundMode } from './systems/backgroundSystem.js';
import { createGameLoop } from './gameLoop.js';
import { createGameState, resetGameState, GameStates, addScore, loseLife, nextWave, depleteEnergy, refillEnergy, startEnergyRefill, updateEnergyAnimation, incrementCombo, updateCombo, resetCombo, shouldTriggerBonusStage, startBonusStage, updateBonusStage, bonusStageEnemyEscaped, endBonusStage } from './state/gameState.js';
import { getAdjustedConfig } from './config/gameConfig.js';
import { createInputManager } from './input/inputManager.js';
import { createPlayer, updatePlayer, canFire, recordFire, hitPlayer, getPlayerHitbox, drawPlayer } from './entities/player.js';
import { createPlayerBullet, createEnemyBullet, updateProjectile, isOffScreen, drawProjectile } from './entities/projectile.js';
import { createEnemy, updateEnemy, canEnemyFire, recordEnemyFire, isEnemyOffScreen, drawEnemy } from './entities/enemyExpanded.js';
import { maybeCreatePowerUpDrop, updatePowerUp, drawPowerUp, isPowerUpOffScreen, checkPlayerPowerUpCollision, applyPowerUp, updateActivePowerUps, hasPowerUp } from './entities/powerup.js';
import { checkProjectileEnemyCollision, checkPlayerEnemyCollision, checkPlayerBulletCollision } from './systems/collision.js';
import { startWave, updateWaveManager } from './systems/waveManager.js';
import { createExplosion, createAbsurdExplosion, createPlayerExplosion, createTrailParticle, updateParticles, drawParticles } from './systems/particleSystem.js';
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
let backgroundElements;
let backgroundMode = BackgroundMode.CLASSIC;
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

// Menu animations
let menuFallingEnemies = [];
let menuEnemySpawnTimer = 0;

// Bonus stage tracking
let bonusStageAnnouncementTimer = 0;
let bonusStageAnnouncementAlpha = 0;
let bonusStageEndTimer = 0;
let bonusStageEndAlpha = 0;
let bonusStagePerfect = false;

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

  // Generate initial background
  backgroundElements = generateBackground(backgroundMode, 100);

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

  // Set background mode based on theme
  if (themeName === 'absurd') {
    // ABSURD MODE: Random crazy background! 🌈
    const crazyBackgrounds = [
      BackgroundMode.PSYCHEDELIC,
      BackgroundMode.MATRIX,
      BackgroundMode.NEBULA,
      BackgroundMode.VAPORWAVE,
      BackgroundMode.GLITCH,
      BackgroundMode.COSMOS
    ];
    backgroundMode = crazyBackgrounds[Math.floor(Math.random() * crazyBackgrounds.length)];
    console.log(`🌭 ABSURD BACKGROUND MODE: ${backgroundMode}`);
  } else {
    // Normal themes: classic starfield
    backgroundMode = BackgroundMode.CLASSIC;
  }

  // Regenerate background with new mode
  backgroundElements = generateBackground(backgroundMode, 100);

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

  // Keyboard navigation for menus
  let lastKeyTime = 0;
  const KEY_REPEAT_DELAY = 150; // ms between key repeats

  window.addEventListener('keydown', (e) => {
    // Don't handle keys when typing in input fields (except ENTER for submission)
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      // Allow ENTER to submit name entry
      if (e.code === 'Enter' && menuController.getCurrentScreen() === 'nameEntry') {
        // ENTER key handling is in the name entry screen handler
        return;
      }
      // Ignore other keys when typing
      return;
    }

    // Only handle menu navigation when not playing
    if (state.currentState === GameStates.PLAYING) {
      return;
    }

    const now = Date.now();
    const currentScreen = menuController.getCurrentScreen();

    // Arrow key navigation (with repeat delay)
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (now - lastKeyTime > KEY_REPEAT_DELAY) {
        e.preventDefault();
        audioManager.playMenuMove();
        menuController.navigate(-1);
        lastKeyTime = now;
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (now - lastKeyTime > KEY_REPEAT_DELAY) {
        e.preventDefault();
        audioManager.playMenuMove();
        menuController.navigate(1);
        lastKeyTime = now;
      }
    }
    // SPACE or ENTER to select
    else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      audioManager.playMenuSelect();
      menuController.select();
    }
    // ESC to go back
    else if (e.code === 'Escape') {
      e.preventDefault();

      // Handle ESC based on current screen
      if (currentScreen === 'pause') {
        resumeGame();
      } else if (currentScreen === 'high-scores' || currentScreen === 'settings' || currentScreen === 'help') {
        audioManager.playMenuSelect();
        menuController.showScreen('menu');
      } else if (currentScreen === 'gameOver') {
        audioManager.playMenuSelect();
        quitToMenu();
      }
    }
  });
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

  // Clear menu animations
  menuFallingEnemies = [];
  menuEnemySpawnTimer = 0;

  const settings = loadSettings();
  resetGameState(state, settings.difficulty);
  adjustedConfig = getAdjustedConfig(state.difficulty, state.level);

  // Create player
  state.player = createPlayer(adjustedConfig);

  // Start first wave
  const themeName = currentTheme?.name.toLowerCase().includes('absurd') ? 'absurd' : '';
  startWave(state, adjustedConfig, themeName);
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
  const themeName = currentTheme?.name.toLowerCase().includes('absurd') ? 'absurd' : '';
  startWave(state, adjustedConfig, themeName);
  waveAnnouncementTimer = 2;
  waveAnnouncementAlpha = 1;
  audioManager.playWaveStart();
}

/**
 * Start bonus wave with mixed enemy types
 * @param {GameState} state - Game state
 * @param {Object} config - Adjusted game config
 */
function startBonusWave(state, config) {
  state.currentWave = {
    name: `BONUS STAGE - LEVEL ${state.level + 1}`,
    totalEnemies: 30, // Lots of enemies!
    spawnInterval: 200, // Fast spawning
    themeKey: 'mixed' // Special flag for mixed enemies
  };

  // Get all available enemy keys for mixing
  const enemyKeys = Object.keys(themeImages);
  if (enemyKeys.length === 0) {
    enemyKeys.push('wave1'); // Fallback
  }

  // Start spawning mixed enemies
  state.waveStartTime = state.gameTime;
  state.lastEnemySpawnTime = state.gameTime;
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
  state.perfectWave = true;

  // Immediately spawn first batch of enemies
  for (let i = 0; i < 5; i++) {
    if (state.enemiesSpawned < state.currentWave.totalEnemies) {
      // Random enemy type for each spawn
      const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];

      const enemy = createEnemy(
        Math.random() * (config.canvas.width - 32),
        -30 - i * 40,
        randomKey,
        config
      );
      enemy.themeKey = randomKey; // Ensure theme key is set
      state.enemies.push(enemy);
      state.enemiesSpawned++;
    }
  }
}

/**
 * Update bonus wave spawning (mixed enemies)
 * @param {GameState} state - Game state
 * @param {number} dt - Delta time
 * @param {Object} config - Adjusted game config
 */
function updateBonusWaveSpawning(state, dt, config) {
  if (!state.currentWave || state.spawnComplete) return;

  const timeSinceLastSpawn = (state.gameTime - state.lastEnemySpawnTime) * 1000;

  if (timeSinceLastSpawn >= state.currentWave.spawnInterval && state.enemiesSpawned < state.currentWave.totalEnemies) {
    // Get all available enemy keys
    const enemyKeys = Object.keys(themeImages);
    if (enemyKeys.length === 0) return;

    // Random enemy type
    const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];

    const enemy = createEnemy(
      Math.random() * (config.canvas.width - 32),
      -30,
      randomKey,
      config
    );
    enemy.themeKey = randomKey;
    state.enemies.push(enemy);
    state.enemiesSpawned++;
    state.lastEnemySpawnTime = state.gameTime;
  }

  // Mark spawn as complete
  if (state.enemiesSpawned >= state.currentWave.totalEnemies) {
    state.spawnComplete = true;
  }
}

/**
 * Handle game over
 */
function handleGameOver() {
  state.currentState = GameStates.GAME_OVER;

  audioManager.stopMusic();  // Stop background music
  audioManager.playGameOver();

  // Check for high score
  if (isHighScore(state.score)) {
    // NEW FLOW: Show name entry screen first
    showNameEntryScreen();
  } else {
    // No high score: go directly to game over menu
    showGameOverMenu();
  }
}

/**
 * Show name entry screen for high score
 */
function showNameEntryScreen() {
  // Show name entry screen
  document.getElementById('name-entry-score').textContent = `SCORE: ${state.score}`;

  const nameInput = document.getElementById('player-name');
  nameInput.value = loadPlayerName();

  menuController.showScreen('nameEntry');

  // Focus and select after a tiny delay to ensure screen is visible
  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 100);

  // Handle ENTER key to submit name
  const handleNameSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'change') {
      e.preventDefault();

      const name = nameInput.value.toUpperCase().substring(0, 3).padEnd(3, 'A');
      savePlayerName(name);

      // Add high score to localStorage
      const rank = addHighScore(name, state.score, state.level);

      // Remove event listeners
      nameInput.removeEventListener('keydown', handleNameSubmit);
      nameInput.removeEventListener('change', handleNameSubmit);

      // Show high scores screen
      showHighScoresAfterEntry();
    }
  };

  nameInput.addEventListener('keydown', handleNameSubmit);
  nameInput.addEventListener('change', handleNameSubmit);
}

/**
 * Show high scores screen after name entry
 */
function showHighScoresAfterEntry() {
  menuController.showScreen('high-scores');
  renderHighScores('high-scores-list');

  // Replace the "BACK" button functionality temporarily
  const backButton = document.getElementById('btn-back-scores');
  const handleContinue = () => {
    backButton.removeEventListener('click', handleContinue);
    showGameOverMenu();
  };

  backButton.addEventListener('click', handleContinue, { once: true });
}

/**
 * Show game over menu (final screen)
 */
function showGameOverMenu() {
  document.getElementById('final-score').textContent = `SCORE: ${state.score}`;
  menuController.showScreen('gameOver');
}

/**
 * Draw bonus stage announcement
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} level - Current level
 * @param {number} alpha - Opacity
 */
function drawBonusStageAnnouncement(ctx, level, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#ffff00';
  ctx.font = "24px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(100, 160, 440, 100);

  // Border
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(100, 160, 440, 100);

  // Text
  ctx.fillStyle = '#ff00ff';
  ctx.fillText('BONUS STAGE!', 320, 190);
  ctx.font = "16px 'Press Start 2P', monospace";
  ctx.fillText(`LEVEL ${level}`, 320, 225);

  ctx.restore();
}

/**
 * Draw bonus stage timer
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} timeLeft - Time remaining in seconds
 */
function drawBonusStageTimer(ctx, timeLeft) {
  ctx.save();

  const seconds = Math.ceil(timeLeft);
  const isLowTime = seconds <= 10;

  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Pulse when low on time
  if (isLowTime) {
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff0000';
  } else {
    ctx.fillStyle = '#ffff00';
  }

  ctx.fillText(`TIME: ${seconds}s`, 320, 10);

  ctx.restore();
}

/**
 * Draw bonus stage end message
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {boolean} perfect - Got perfect bonus
 * @param {number} escaped - Number of enemies escaped
 * @param {number} alpha - Opacity
 */
function drawBonusStageEnd(ctx, perfect, escaped, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(100, 160, 440, 120);

  // Border
  const borderColor = perfect ? '#00ff00' : '#ffff00';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(100, 160, 440, 120);

  // Title
  ctx.fillStyle = borderColor;
  ctx.fillText('BONUS STAGE COMPLETE!', 320, 195);

  // Result
  if (perfect) {
    ctx.font = "24px 'Press Start 2P', monospace";
    ctx.fillStyle = '#00ff00';
    ctx.fillText('PERFECT! +1000', 320, 240);
  } else {
    ctx.font = "14px 'Press Start 2P', monospace";
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${escaped} ENEMIES ESCAPED`, 320, 240);
  }

  ctx.restore();
}

/**
 * Update menu falling enemies
 * @param {number} dt - Delta time in seconds
 */
function updateMenuEnemies(dt) {
  const SPAWN_INTERVAL = 0.4; // Spawn enemy every 0.4 seconds
  const FALL_SPEED = 80; // Pixels per second

  menuEnemySpawnTimer += dt;

  // Spawn new enemies
  if (menuEnemySpawnTimer >= SPAWN_INTERVAL) {
    menuEnemySpawnTimer = 0;

    // Get random enemy sprite from current theme
    const enemyKeys = Object.keys(themeImages);
    if (enemyKeys.length > 0) {
      const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];

      menuFallingEnemies.push({
        x: Math.random() * 620, // Random X position (with margin)
        y: -30, // Start above screen
        themeKey: randomKey,
        speed: FALL_SPEED + Math.random() * 40, // Varied speed
        rotation: Math.random() * Math.PI * 2, // Random rotation
        rotationSpeed: (Math.random() - 0.5) * 3, // Rotation speed
        scale: 0.8 + Math.random() * 0.4 // Varied size
      });
    }
  }

  // Update positions
  for (let i = menuFallingEnemies.length - 1; i >= 0; i--) {
    const enemy = menuFallingEnemies[i];
    enemy.y += enemy.speed * dt;
    enemy.rotation += enemy.rotationSpeed * dt;

    // Remove if off screen
    if (enemy.y > 480 + 30) {
      menuFallingEnemies.splice(i, 1);
    }
  }
}

/**
 * Draw menu falling enemies
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
function drawMenuEnemies(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.6; // Semi-transparent

  for (const enemy of menuFallingEnemies) {
    const image = themeImages[enemy.themeKey];
    if (image && image.complete) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.rotation);
      ctx.scale(enemy.scale, enemy.scale);

      const width = 32;
      const height = 32;
      ctx.drawImage(image, -width / 2, -height / 2, width, height);

      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Update game logic
 * @param {number} dt - Delta time in seconds
 */
function update(dt) {
  // Update menu falling enemies (when in MENU state)
  if (state.currentState === GameStates.MENU) {
    updateMenuEnemies(dt);
    return;
  }

  if (state.currentState !== GameStates.PLAYING) return;

  state.gameTime += dt;

  // Update background animation
  updateBackground(backgroundElements, dt, state.gameTime);

  // Update COMBO timer (breaks combo if no kills within 2 seconds)
  updateCombo(state, dt);

  // Update BONUS STAGE timer 🎯
  if (state.bonusStageActive) {
    const bonusEnded = updateBonusStage(state, dt);
    if (bonusEnded) {
      // Bonus stage time's up!
      bonusStagePerfect = state.bonusStageEnemiesEscaped === 0;
      bonusStageEndTimer = 3;
      bonusStageEndAlpha = 1;

      // Clear remaining enemies
      state.enemies = [];
      state.enemyBullets = [];

      // Trigger inter-wave pause to show bonus results
      interWavePause = true;
      interWavePauseTimer = 3;
      startEnergyRefill(state);
    }
  }

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
    if (state.bonusStageActive) {
      // Bonus stage: spawn mixed enemies!
      updateBonusWaveSpawning(state, dt, adjustedConfig);
    } else {
      // Normal wave
      updateWaveManager(state, dt, adjustedConfig);
    }
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

      // Track bonus stage escapes
      bonusStageEnemyEscaped(state);

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
      // MISSED SHOT: Reset combo! 💔
      if (state.combo > 0) {
        resetCombo(state);
      }
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

      // Spectacular player explosion!
      const isAbsurd = currentTheme === 'absurd';
      state.particles.push(...createPlayerExplosion(state.player.x + 16, state.player.y + 12, isAbsurd));
      if (isAbsurd) {
        triggerScreenShake(8, 0.3); // MASSIVE shake for player death in ABSURD!
      } else {
        triggerScreenShake(5, 0.2);
      }

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

      // Spectacular player explosion!
      const isAbsurd = currentTheme === 'absurd';
      state.particles.push(...createPlayerExplosion(state.player.x + 16, state.player.y + 12, isAbsurd));
      if (isAbsurd) {
        triggerScreenShake(8, 0.3); // MASSIVE shake for player death in ABSURD!
      } else {
        triggerScreenShake(5, 0.2);
      }

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

    // Play energy bonus sound if we got bonus points
    if (state.energyBonus > 0) {
      audioManager.playEnergyBonus();
    }
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

      // Check if should trigger BONUS STAGE! 🎯
      if (shouldTriggerBonusStage(state)) {
        startBonusStage(state);
        startBonusWave(state, adjustedConfig);
        bonusStageAnnouncementTimer = 3;
        bonusStageAnnouncementAlpha = 1;
        audioManager.playWaveStart(); // TODO: Add special bonus stage music
      } else {
        // Normal wave
        const themeName = currentTheme?.name.toLowerCase().includes('absurd') ? 'absurd' : '';
        startWave(state, adjustedConfig, themeName);
        waveAnnouncementTimer = 2;
        waveAnnouncementAlpha = 1;
        audioManager.playWaveStart();
      }
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

  if (bonusStageAnnouncementTimer > 0) {
    bonusStageAnnouncementTimer -= dt;
    bonusStageAnnouncementAlpha = Math.max(0, bonusStageAnnouncementTimer / 3);
  }

  if (bonusStageEndTimer > 0) {
    bonusStageEndTimer -= dt;
    bonusStageEndAlpha = Math.max(0, bonusStageEndTimer / 3);
  }
}

/**
 * Render game graphics
 */
function render() {
  // Clear screen
  clearCanvas(ctx);

  // Draw background
  drawBackground(ctx, backgroundElements, state.gameTime);

  // Draw menu falling enemies (when in MENU state)
  if (state.currentState === GameStates.MENU) {
    drawMenuEnemies(ctx);
  }

  // Apply screen shake effect
  ctx.save();
  applyScreenShake(ctx);

  if (state.currentState === GameStates.PLAYING || state.currentState === GameStates.PAUSED) {
    // Draw player with theme image (pass state for shield effect)
    if (state.player) {
      drawPlayer(ctx, state.player, playerImage, state);
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

    // Draw bonus stage UI
    if (bonusStageAnnouncementAlpha > 0) {
      drawBonusStageAnnouncement(ctx, state.level + 1, bonusStageAnnouncementAlpha);
    }

    if (state.bonusStageActive) {
      drawBonusStageTimer(ctx, state.bonusStageTimer);
    }

    if (bonusStageEndAlpha > 0) {
      drawBonusStageEnd(ctx, bonusStagePerfect, state.bonusStageEnemiesEscaped, bonusStageEndAlpha);
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
