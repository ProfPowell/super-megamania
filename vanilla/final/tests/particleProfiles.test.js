import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBigExplosion,
  createComboFlash,
  createPowerupBurst,
  createBonusDrainSparkle,
  createWaveTelegraphGhosts
} from '../src/systems/particleSystem.js';

test('createBigExplosion returns 24+ particles at the given position', () => {
  const ps = createBigExplosion(100, 200, '#ff00ff');
  assert.ok(ps.length >= 24, `expected ≥24 particles, got ${ps.length}`);
  for (const p of ps) {
    assert.equal(typeof p.x, 'number');
    assert.equal(typeof p.y, 'number');
    assert.equal(typeof p.vx, 'number');
    assert.equal(typeof p.vy, 'number');
  }
});

test('createComboFlash returns ring-shaped particles', () => {
  const ps = createComboFlash(50, 50, 10);
  assert.ok(ps.length >= 8);
  const radii = ps.map(p => Math.hypot(p.vx, p.vy));
  const min = Math.min(...radii), max = Math.max(...radii);
  assert.ok(max / min < 2, 'ring particles should have similar radii');
});

test('createPowerupBurst returns particles colored by kind', () => {
  const shield = createPowerupBurst(0, 0, 'shield');
  const rapid = createPowerupBurst(0, 0, 'rapidFire');
  assert.ok(shield.length > 0);
  assert.ok(rapid.length > 0);
  assert.notEqual(shield[0].color, rapid[0].color);
});

test('createBonusDrainSparkle returns a small sparkle particle', () => {
  const ps = createBonusDrainSparkle(200, 100);
  assert.ok(Array.isArray(ps));
  assert.ok(ps.length >= 1 && ps.length <= 4);
});

test('createWaveTelegraphGhosts returns ghost objects with sprite metadata', () => {
  const positions = [{ x: 100, y: 50, themeKey: 'wave1' }, { x: 200, y: 50, themeKey: 'wave1' }];
  const ghosts = createWaveTelegraphGhosts(positions);
  assert.equal(ghosts.length, 2);
  assert.equal(ghosts[0].themeKey, 'wave1');
  assert.equal(ghosts[0].alpha < 1, true, 'ghosts should be semi-transparent');
});
