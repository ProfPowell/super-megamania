/**
 * @fileoverview Tests for high scores storage
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();

import { loadHighScores, saveHighScores, isHighScore, addHighScore, getScoreRank, clearHighScores } from '../src/storage/highScores.js';

test('loadHighScores - returns empty array when no scores', () => {
  clearHighScores();
  const scores = loadHighScores();
  assert.strictEqual(Array.isArray(scores), true);
  assert.strictEqual(scores.length, 0);
});

test('saveHighScores - saves scores to storage', () => {
  const scores = [{ name: 'ABC', score: 1000, level: 1 }];
  saveHighScores(scores);
  const loaded = loadHighScores();
  assert.strictEqual(loaded.length, 1);
  assert.strictEqual(loaded[0].name, 'ABC');
  assert.strictEqual(loaded[0].score, 1000);
});

test('isHighScore - returns true for empty list', () => {
  clearHighScores();
  assert.strictEqual(isHighScore(100), true);
});

test('isHighScore - returns true for qualifying score', () => {
  clearHighScores();
  saveHighScores([{ name: 'ABC', score: 500, level: 1 }]);
  assert.strictEqual(isHighScore(600), true);
});

test('isHighScore - returns false for non-qualifying score', () => {
  clearHighScores();
  const scores = [];
  for (let i = 0; i < 10; i++) {
    scores.push({ name: 'ABC', score: 1000 - i * 10, level: 1 });
  }
  saveHighScores(scores);
  assert.strictEqual(isHighScore(900), false);
});

test('addHighScore - adds score to list', () => {
  clearHighScores();
  const rank = addHighScore('AAA', 1000, 1);
  assert.strictEqual(rank, 1);

  const scores = loadHighScores();
  assert.strictEqual(scores.length, 1);
  assert.strictEqual(scores[0].score, 1000);
});

test('addHighScore - maintains sorted order', () => {
  clearHighScores();
  addHighScore('AAA', 500, 1);
  addHighScore('BBB', 1000, 2);
  addHighScore('CCC', 750, 1);

  const scores = loadHighScores();
  assert.strictEqual(scores[0].score, 1000);
  assert.strictEqual(scores[1].score, 750);
  assert.strictEqual(scores[2].score, 500);
});

test('addHighScore - limits to 10 scores', () => {
  clearHighScores();
  for (let i = 0; i < 15; i++) {
    addHighScore('AAA', i * 100, 1);
  }

  const scores = loadHighScores();
  assert.strictEqual(scores.length, 10);
});

test('getScoreRank - returns correct rank', () => {
  clearHighScores();
  addHighScore('AAA', 1000, 1);
  addHighScore('BBB', 800, 1);
  addHighScore('CCC', 600, 1);

  assert.strictEqual(getScoreRank(1200), 1);
  assert.strictEqual(getScoreRank(900), 2);
  assert.strictEqual(getScoreRank(700), 3);
  assert.strictEqual(getScoreRank(500), 4);
});
