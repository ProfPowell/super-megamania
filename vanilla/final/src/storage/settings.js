/**
 * @fileoverview Settings storage
 * LocalStorage persistence for game settings
 */

import { gameConfig } from '../config/gameConfig.js';

const STORAGE_KEY = gameConfig.storage.keys.settings;
const PLAYER_NAME_KEY = gameConfig.storage.keys.playerName;

/**
 * @typedef {Object} Settings
 * @property {string} difficulty - 'easy' | 'normal' | 'hard'
 * @property {boolean} sfxEnabled - Sound effects enabled
 * @property {boolean} musicEnabled - Music enabled
 * @property {number} masterVolume - Master volume (0-1)
 */

/**
 * Load settings from localStorage
 * @returns {Settings} Settings object
 */
export function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultSettings();

    const settings = JSON.parse(data);
    return { ...getDefaultSettings(), ...settings };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save settings to localStorage
 * @param {Settings} settings - Settings object
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Get default settings
 * @returns {Settings} Default settings
 */
export function getDefaultSettings() {
  return {
    difficulty: gameConfig.storage.defaults.difficulty,
    sfxEnabled: gameConfig.storage.defaults.audioEnabled,
    musicEnabled: gameConfig.storage.defaults.musicEnabled,
    masterVolume: gameConfig.audio.masterVolume
  };
}

/**
 * Load player name
 * @returns {string} Player name/initials
 */
export function loadPlayerName() {
  try {
    const name = localStorage.getItem(PLAYER_NAME_KEY);
    return name || gameConfig.storage.defaults.playerName;
  } catch (error) {
    return gameConfig.storage.defaults.playerName;
  }
}

/**
 * Save player name
 * @param {string} name - Player initials
 */
export function savePlayerName(name) {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.toUpperCase().substring(0, 3));
  } catch (error) {
    console.error('Failed to save player name:', error);
  }
}

/**
 * Apply settings to UI
 * @param {Settings} settings - Settings object
 */
export function applySettingsToUI(settings) {
  // Difficulty
  const difficultySelect = document.getElementById('difficulty-select');
  if (difficultySelect) {
    difficultySelect.value = settings.difficulty;
  }

  // SFX toggle
  const sfxToggle = document.getElementById('sfx-toggle');
  if (sfxToggle) {
    sfxToggle.textContent = settings.sfxEnabled ? 'ON' : 'OFF';
    sfxToggle.classList.toggle('off', !settings.sfxEnabled);
  }

  // Music toggle
  const musicToggle = document.getElementById('music-toggle');
  if (musicToggle) {
    musicToggle.textContent = settings.musicEnabled ? 'ON' : 'OFF';
    musicToggle.classList.toggle('off', !settings.musicEnabled);
  }

  // Volume slider
  const volumeSlider = document.getElementById('volume-slider');
  const volumeValue = document.getElementById('volume-value');
  if (volumeSlider) {
    volumeSlider.value = Math.round(settings.masterVolume * 100);
  }
  if (volumeValue) {
    volumeValue.textContent = `${Math.round(settings.masterVolume * 100)}%`;
  }
}
