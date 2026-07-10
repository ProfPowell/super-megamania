import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loading99 } from '../src/scenes/micromodes/loading99.js';

// addScore reads difficulty/level/comboMultiplier — normal + level 0 +
// combo 1 makes the multiplier exactly 1 so the bonus lands verbatim.
function makeState() {
  return {
    score: 0,
    nextExtraLifeScore: 999999,
    lives: 3,
    difficulty: 'normal',
    level: 0,
    comboMultiplier: 1,
    microMode: { instance: {} }
  };
}

test('loading99: enter sets pct to 99 + picks a random sarcastic label', () => {
  const s = makeState();
  loading99.enter(s, {});
  assert.equal(s.microMode.instance.pct, 99.0);
  assert.ok(typeof s.microMode.instance.label === 'string');
  assert.ok(s.microMode.instance.label.length > 0);
});

test('loading99: each fire-press nudges pct by 0.1', () => {
  const s = makeState();
  loading99.enter(s, {});
  loading99.update(s, {}, 0.016, { firePressedThisFrame: true });
  assert.ok(Math.abs(s.microMode.instance.pct - 99.1) < 0.0001);
  loading99.update(s, {}, 0.016, { firePressedThisFrame: false });
  assert.ok(Math.abs(s.microMode.instance.pct - 99.1) < 0.0001);
});

test('loading99: ~10 presses reach 100% and signal success', () => {
  const s = makeState();
  loading99.enter(s, {});
  let result = null;
  for (let i = 0; i < 10; i++) {
    result = loading99.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  assert.deepEqual(result, { complete: true, outcome: 'success' });
});

test('loading99: pct caps at 100%', () => {
  const s = makeState();
  loading99.enter(s, {});
  for (let i = 0; i < 50; i++) {
    loading99.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  assert.equal(s.microMode.instance.pct, 100);
});

test('loading99: success grants +500 score', () => {
  const s = makeState();
  loading99.enter(s, {});
  for (let i = 0; i < 10; i++) {
    loading99.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  const r = loading99.onExit(s, {});
  assert.equal(r.outcome, 'success');
  assert.equal(s.score, 500);
});

test('loading99: failure does not change score', () => {
  const s = makeState();
  loading99.enter(s, {});
  for (let i = 0; i < 5; i++) {
    loading99.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  loading99.onExit(s, {});
  assert.equal(s.score, 0);
});
