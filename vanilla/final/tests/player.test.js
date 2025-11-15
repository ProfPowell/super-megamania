/**
 * @fileoverview Tests for player entity
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { createPlayer, updatePlayer, canFire, recordFire } from '../src/entities/player.js';

test('createPlayer - creates player with default values', () => {
  const player = createPlayer();
  assert.strictEqual(typeof player.x, 'number');
  assert.strictEqual(typeof player.y, 'number');
  assert.strictEqual(player.width, 32);
  assert.strictEqual(player.height, 24);
  assert.strictEqual(player.isInvincible, false);
});

test('updatePlayer - moves player right', () => {
  const player = createPlayer();
  const initialX = player.x;
  updatePlayer(player, 1, 1); // 1 second, direction right
  assert.ok(player.x > initialX);
});

test('updatePlayer - moves player left', () => {
  const player = createPlayer();
  const initialX = player.x;
  updatePlayer(player, 1, -1); // 1 second, direction left
  assert.ok(player.x < initialX);
});

test('updatePlayer - does not move when direction is 0', () => {
  const player = createPlayer();
  const initialX = player.x;
  updatePlayer(player, 1, 0);
  assert.strictEqual(player.x, initialX);
});

test('updatePlayer - clamps to left boundary', () => {
  const player = createPlayer();
  player.x = 0;
  updatePlayer(player, 10, -1); // Try to move far left
  assert.ok(player.x >= 16); // minX boundary
});

test('updatePlayer - clamps to right boundary', () => {
  const player = createPlayer();
  player.x = 1000;
  updatePlayer(player, 10, 1); // Try to move far right
  assert.ok(player.x <= 624 - player.width); // maxX boundary
});

test('canFire - returns true initially', () => {
  const player = createPlayer();
  assert.strictEqual(canFire(player), true);
});

test('canFire - returns false after firing', () => {
  const player = createPlayer();
  recordFire(player);
  assert.strictEqual(canFire(player), false);
});

test('canFire - returns true after cooldown', (t, done) => {
  const player = createPlayer();
  recordFire(player);

  setTimeout(() => {
    assert.strictEqual(canFire(player), true);
    done();
  }, 350); // Slightly more than cooldown time
});
