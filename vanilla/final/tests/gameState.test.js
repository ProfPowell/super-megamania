/**
 * @fileoverview Tests for game state management
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { createGameState, resetGameState, addScore, loseLife, nextWave, GameStates } from '../src/state/gameState.js';

test('createGameState - creates initial state', () => {
  const state = createGameState('normal');
  assert.strictEqual(state.score, 0);
  assert.strictEqual(state.lives, 3);
  assert.strictEqual(state.level, 0);
  assert.strictEqual(state.currentWaveIndex, 0);
  assert.strictEqual(state.difficulty, 'normal');
});

test('resetGameState - resets state to initial values', () => {
  const state = createGameState('normal');
  state.score = 1000;
  state.lives = 1;
  state.level = 5;

  resetGameState(state, 'hard');

  assert.strictEqual(state.score, 0);
  assert.strictEqual(state.lives, 3);
  assert.strictEqual(state.level, 0);
  assert.strictEqual(state.difficulty, 'hard');
});

test('addScore - adds points with multiplier', () => {
  const state = createGameState('normal');
  addScore(state, 100);
  assert.strictEqual(state.score, 100);
});

test('addScore - applies difficulty multiplier', () => {
  const easyState = createGameState('easy');
  const hardState = createGameState('hard');

  addScore(easyState, 100);
  addScore(hardState, 100);

  assert.ok(easyState.score < 100); // Easy has 0.8 multiplier
  assert.ok(hardState.score > 100); // Hard has 1.5 multiplier
});

test('loseLife - decrements lives', () => {
  const state = createGameState('normal');
  const initialLives = state.lives;

  const gameOver = loseLife(state);

  assert.strictEqual(state.lives, initialLives - 1);
  assert.strictEqual(gameOver, false);
});

test('loseLife - returns true on game over', () => {
  const state = createGameState('normal');
  state.lives = 1;

  const gameOver = loseLife(state);

  assert.strictEqual(state.lives, 0);
  assert.strictEqual(gameOver, true);
});

test('nextWave - advances wave index', () => {
  const state = createGameState('normal');
  const initialWave = state.currentWaveIndex;

  nextWave(state);

  assert.strictEqual(state.currentWaveIndex, initialWave + 1);
});

test('nextWave - advances level after all waves', () => {
  const state = createGameState('normal');
  state.currentWaveIndex = 4; // Last wave (0-indexed)
  const initialLevel = state.level;

  nextWave(state);

  assert.strictEqual(state.currentWaveIndex, 0); // Reset to first wave
  assert.strictEqual(state.level, initialLevel + 1);
});

test('nextWave - awards perfect wave bonus', () => {
  const state = createGameState('normal');
  state.perfectWave = true;
  const initialScore = state.score;

  nextWave(state);

  assert.ok(state.score > initialScore);
});
