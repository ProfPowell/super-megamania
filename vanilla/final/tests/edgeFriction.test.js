import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, updatePlayer } from '../src/entities/player.js';
import { gameConfig } from '../src/config/gameConfig.js';

function makePlayerAt(x) {
  const p = createPlayer();
  p.x = x;
  return p;
}

test('edge friction: far from walls, displacement equals speed*dt', () => {
  const p = makePlayerAt(320); // dead center
  const before = p.x;
  updatePlayer(p, 1 / 60, 1);
  const moved = p.x - before;
  const expected = p.speed * (1 / 60);
  assert.ok(Math.abs(moved - expected) < 0.001,
    `expected unfriction ${expected}, got ${moved}`);
});

test('edge friction: near left wall + moving left, displacement is dampened', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.minX + 4); // 4 px from left
  const before = p.x;
  updatePlayer(p, 1 / 60, -1);
  const moved = before - p.x; // moving left = x decreases
  const fullSpeed = p.speed * (1 / 60);
  assert.ok(moved < fullSpeed,
    `near left wall moved=${moved} should be < fullSpeed=${fullSpeed}`);
  assert.ok(moved > 0, 'should still move a little');
});

test('edge friction: near right wall + moving right, displacement is dampened', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.maxX - 4); // will be repositioned below
  p.x = bounds.maxX - p_width(p) - 4;
  const before = p.x;
  updatePlayer(p, 1 / 60, 1);
  const moved = p.x - before;
  const fullSpeed = p.speed * (1 / 60);
  assert.ok(moved < fullSpeed && moved > 0,
    `near right wall moved=${moved} should be 0 < x < ${fullSpeed}`);
});

test('edge friction: near left wall + moving RIGHT (away), no friction', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.minX + 4);
  const before = p.x;
  updatePlayer(p, 1 / 60, 1);
  const moved = p.x - before;
  const expected = p.speed * (1 / 60);
  assert.ok(Math.abs(moved - expected) < 0.001,
    `moving away from wall should not be friction-ed: expected ${expected}, got ${moved}`);
});

test('edge friction: hard clamp still works at the boundary', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.minX);
  updatePlayer(p, 1, -1); // big dt, push hard into the wall
  assert.equal(p.x, bounds.minX, 'should clamp to minX');
});

// Helper for the right-wall test above
function p_width(p) { return p.width; }
