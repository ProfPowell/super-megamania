/**
 * Super Megamania — bootstrap.
 *
 * Responsibilities, in order: build ctx, load settings, load theme,
 * install the juice reactor, wire DOM listeners (menu buttons,
 * keyboard navigation, settings controls), push the menu scene,
 * start the game loop.
 *
 * No gameplay logic lives here. Per-frame work belongs in scenes/.
 */

import { initCanvas } from './canvas.js';
import { generateBackground, BackgroundMode } from './systems/backgroundSystem.js';
import { createGameLoop } from './gameLoop.js';
import {
  createGameState,
  resetGameState,
  GameStates
} from './state/gameState.js';
import { getAdjustedConfig } from './config/gameConfig.js';
import { createInputManager } from './input/inputManager.js';
import { createPlayer } from './entities/player.js';
import { startWave } from './systems/waveManager.js';
import { resetScreenShake } from './systems/screenShake.js';
import { createMenuController } from './ui/menu.js';
import {
  loadSettings,
  saveSettings,
  applySettingsToUI
} from './storage/settings.js';
import { renderHighScores } from './storage/highScores.js';
import { createAudioManager } from './audio/audioManager.js';
import { loadThemeImages } from './assets/assetLoader.js';
import { getTheme } from './assets/themes.js';
import { createEventBus } from './app/eventBus.js';
import { createContext } from './app/context.js';
import { createSceneController } from './scenes/sceneController.js';
import { createMenuScene } from './scenes/menuScene.js';
import { createPlayScene } from './scenes/playScene.js';
import { handleGameOver } from './scenes/gameOverScene.js';
import { installJuiceReactor } from './systems/juice.js';

let ctx;
let menuController;
let playScene;
let menuScene;

async function init() {
  const { canvas, ctx: ctx2d } = initCanvas('gameCanvas');
  const settings = loadSettings();
  applySettingsToUI(settings);
  applyCrtMode(settings.crtMode);

  const bus = createEventBus();
  const audio = createAudioManager();
  audio.setSfxEnabled(settings.sfxEnabled);
  audio.setMusicEnabled(settings.musicEnabled);
  audio.setMasterVolume(settings.masterVolume);

  const input = createInputManager();
  const state = createGameState(settings.difficulty);
  state.currentState = GameStates.MENU;

  const gameLoop = createGameLoop(
    (dt) => sceneController.update(ctx, dt),
    () => sceneController.render(ctx)
  );

  const sceneController = createSceneController();

  ctx = createContext({
    state, audio, input, canvas, ctx2d, bus, sceneController, gameLoop
  });

  menuController = createMenuController();
  await loadTheme(settings.theme || 'cats');

  installJuiceReactor(ctx);

  menuScene = createMenuScene();
  playScene = createPlayScene({
    menuController,
    onGameOver: (c) => handleGameOver(c, menuController)
  });

  setupEventListeners();

  sceneController.push(menuScene);
  menuController.showScreen('menu');

  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  }, 500);

  gameLoop.start();
}

async function loadTheme(themeName) {
  ctx.theme = getTheme(themeName);
  const loadedImages = await loadThemeImages(ctx.theme);
  ctx.playerImage = loadedImages.player || null;
  ctx.themeImages = {};
  for (const [key, image] of Object.entries(loadedImages)) {
    if (key !== 'player') ctx.themeImages[key] = image;
  }
  ctx.audio.setTheme(themeName);

  if (themeName === 'absurd') {
    const crazy = [
      BackgroundMode.PSYCHEDELIC, BackgroundMode.MATRIX, BackgroundMode.NEBULA,
      BackgroundMode.VAPORWAVE, BackgroundMode.GLITCH, BackgroundMode.COSMOS
    ];
    ctx.backgroundMode = crazy[Math.floor(Math.random() * crazy.length)];
  } else {
    ctx.backgroundMode = BackgroundMode.CLASSIC;
  }
  ctx.backgroundElements = generateBackground(ctx.backgroundMode, 100);
}

function startGame() {
  menuController.hideAllScreens();
  const settings = loadSettings();
  resetGameState(ctx.state, settings.difficulty);
  ctx.adjustedConfig = getAdjustedConfig(ctx.state.difficulty, ctx.state.level);
  ctx.state.player = createPlayer(ctx.adjustedConfig);

  const themeName = ctx.theme && ctx.theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
  startWave(ctx.state, ctx.adjustedConfig, themeName);

  ctx.audio.startMusic();
  ctx.state.currentState = GameStates.PLAYING;
  resetScreenShake();
  ctx.sceneController.replace(playScene);
}

function quitToMenu() {
  ctx.state.currentState = GameStates.MENU;
  ctx.input.disable();
  ctx.input.enable();
  menuController.showScreen('menu');
  ctx.sceneController.replace(menuScene);
}

function resumeGame() {
  if (ctx.state.currentState === GameStates.PAUSED) {
    ctx.state.currentState = GameStates.PLAYING;
    ctx.input.disable();
    ctx.input.enable();
    menuController.hideAllScreens();
  }
}

function applyCrtMode(enabled) {
  document.body.classList.toggle('crt-mode', !!enabled);
  const toggle = document.getElementById('crt-toggle');
  if (toggle) toggle.textContent = enabled ? 'ON' : 'OFF';
}

function getSettingsFromUI() {
  return {
    difficulty: document.getElementById('difficulty-select').value,
    theme: document.getElementById('theme-select').value,
    sfxEnabled: document.getElementById('sfx-toggle').textContent === 'ON',
    musicEnabled: document.getElementById('music-toggle').textContent === 'ON',
    masterVolume: parseInt(document.getElementById('volume-slider').value) / 100,
    crtMode: document.getElementById('crt-toggle').textContent === 'ON'
  };
}

function toggleSfx() {
  const t = document.getElementById('sfx-toggle');
  const enabled = t.textContent === 'OFF';
  t.textContent = enabled ? 'ON' : 'OFF';
  ctx.audio.setSfxEnabled(enabled);
}
function toggleMusic() {
  const t = document.getElementById('music-toggle');
  const enabled = t.textContent === 'OFF';
  t.textContent = enabled ? 'ON' : 'OFF';
  ctx.audio.setMusicEnabled(enabled);
}
function updateVolume(e) {
  ctx.audio.setMasterVolume(parseInt(e.target.value) / 100);
}
function toggleCRT() {
  const t = document.getElementById('crt-toggle');
  const enabled = t.textContent === 'OFF';
  t.textContent = enabled ? 'ON' : 'OFF';
  applyCrtMode(enabled);
}

function setupEventListeners() {
  document.getElementById('btn-start').addEventListener('click', () => { ctx.audio.playMenuSelect(); startGame(); });
  document.getElementById('btn-high-scores').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('high-scores'); renderHighScores('high-scores-list'); });
  document.getElementById('btn-settings').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('settings'); });
  document.getElementById('btn-help').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('help'); });
  document.getElementById('btn-back-scores').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('menu'); });
  document.getElementById('btn-back-settings').addEventListener('click', async () => {
    ctx.audio.playMenuSelect();
    const s = getSettingsFromUI();
    saveSettings(s);
    applyCrtMode(s.crtMode);
    if (s.theme !== ctx.theme.name.toLowerCase()) await loadTheme(s.theme);
    menuController.showScreen('menu');
  });
  document.getElementById('btn-back-help').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('menu'); });
  document.getElementById('btn-resume').addEventListener('click', () => { ctx.audio.playMenuSelect(); resumeGame(); });
  document.getElementById('btn-quit').addEventListener('click', () => { ctx.audio.playMenuSelect(); quitToMenu(); });
  document.getElementById('btn-restart').addEventListener('click', () => { ctx.audio.playMenuSelect(); startGame(); });
  document.getElementById('btn-menu').addEventListener('click', () => { ctx.audio.playMenuSelect(); quitToMenu(); });

  document.getElementById('sfx-toggle').addEventListener('click', toggleSfx);
  document.getElementById('music-toggle').addEventListener('click', toggleMusic);
  document.getElementById('volume-slider').addEventListener('input', updateVolume);
  document.getElementById('crt-toggle').addEventListener('click', toggleCRT);

  let lastKeyTime = 0;
  const KEY_REPEAT_DELAY = 150;
  window.addEventListener('keydown', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      if (e.code === 'Enter' && menuController.getCurrentScreen() === 'nameEntry') return;
      return;
    }
    if (ctx.state.currentState === GameStates.PLAYING) return;

    const now = Date.now();
    const screen = menuController.getCurrentScreen();
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (now - lastKeyTime > KEY_REPEAT_DELAY) {
        e.preventDefault(); ctx.audio.playMenuMove(); menuController.navigate(-1); lastKeyTime = now;
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (now - lastKeyTime > KEY_REPEAT_DELAY) {
        e.preventDefault(); ctx.audio.playMenuMove(); menuController.navigate(1); lastKeyTime = now;
      }
    } else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault(); ctx.audio.playMenuSelect(); menuController.select();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      if (screen === 'pause') resumeGame();
      else if (screen === 'high-scores' || screen === 'settings' || screen === 'help') { ctx.audio.playMenuSelect(); menuController.showScreen('menu'); }
      else if (screen === 'gameOver') { ctx.audio.playMenuSelect(); quitToMenu(); }
    }
  });
}

window.addEventListener('load', init);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
