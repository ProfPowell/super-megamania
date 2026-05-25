import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConfetti } from '../src/systems/particleSystem.js';

test('createConfetti returns 40+ particles at the given position', () => {
  const ps = createConfetti(320, 240);
  assert.ok(ps.length >= 40, `expected ≥40 particles, got ${ps.length}`);
  for (const p of ps) {
    assert.equal(typeof p.x, 'number');
    assert.equal(typeof p.y, 'number');
    assert.equal(typeof p.vx, 'number');
    assert.equal(typeof p.vy, 'number');
    assert.equal(typeof p.color, 'string');
  }
});

test('createConfetti particles have varied colors (not all the same)', () => {
  const ps = createConfetti(0, 0);
  const colors = new Set(ps.map(p => p.color));
  assert.ok(colors.size >= 3, `expected ≥3 distinct colors, got ${colors.size}`);
});

test('createConfetti starts at the given position', () => {
  const ps = createConfetti(100, 200);
  for (const p of ps) {
    assert.equal(p.x, 100);
    assert.equal(p.y, 200);
  }
});

test('createConfetti respects count override', () => {
  const ps = createConfetti(0, 0, 60);
  assert.equal(ps.length, 60);
});
