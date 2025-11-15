/**
 * @fileoverview High scores storage
 * LocalStorage persistence for high scores
 */

import { gameConfig } from '../config/gameConfig.js';

/**
 * @typedef {Object} HighScore
 * @property {string} name - Player initials
 * @property {number} score - Score value
 * @property {number} level - Level reached
 * @property {string} date - ISO date string
 */

const STORAGE_KEY = gameConfig.storage.keys.highScores;
const MAX_SCORES = 10;

/**
 * Load high scores from localStorage
 * @returns {HighScore[]} Array of high scores
 */
export function loadHighScores() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const scores = JSON.parse(data);
    return Array.isArray(scores) ? scores : [];
  } catch (error) {
    console.error('Failed to load high scores:', error);
    return [];
  }
}

/**
 * Save high scores to localStorage
 * @param {HighScore[]} scores - High scores array
 */
export function saveHighScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error('Failed to save high scores:', error);
  }
}

/**
 * Check if score qualifies for high score list
 * @param {number} score - Score to check
 * @returns {boolean} True if qualifies
 */
export function isHighScore(score) {
  const scores = loadHighScores();
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1].score;
}

/**
 * Add new high score
 * @param {string} name - Player initials
 * @param {number} score - Score value
 * @param {number} level - Level reached
 * @returns {number} Rank (1-based) or -1 if not added
 */
export function addHighScore(name, score, level) {
  const scores = loadHighScores();

  const newScore = {
    name: name.toUpperCase().substring(0, 3).padEnd(3, 'A'),
    score,
    level,
    date: new Date().toISOString()
  };

  scores.push(newScore);
  scores.sort((a, b) => b.score - a.score);
  scores.splice(MAX_SCORES); // Keep only top 10

  saveHighScores(scores);

  // Find rank
  const rank = scores.findIndex(s => s === newScore);
  return rank >= 0 ? rank + 1 : -1;
}

/**
 * Get rank for a score
 * @param {number} score - Score value
 * @returns {number} Rank (1-based) or -1 if not in top 10
 */
export function getScoreRank(score) {
  const scores = loadHighScores();
  for (let i = 0; i < scores.length; i++) {
    if (score >= scores[i].score) {
      return i + 1;
    }
  }
  if (scores.length < MAX_SCORES) {
    return scores.length + 1;
  }
  return -1;
}

/**
 * Render high scores to HTML
 * @param {string} containerId - Container element ID
 */
export function renderHighScores(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const scores = loadHighScores();

  if (scores.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888;">No high scores yet!</p>';
    return;
  }

  let html = '';
  scores.forEach((score, index) => {
    html += `
      <div class="score-entry">
        <span class="score-rank">${index + 1}.</span>
        <span class="score-name">${score.name}</span>
        <span class="score-value">${score.score.toLocaleString()}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Clear all high scores
 */
export function clearHighScores() {
  localStorage.removeItem(STORAGE_KEY);
}
