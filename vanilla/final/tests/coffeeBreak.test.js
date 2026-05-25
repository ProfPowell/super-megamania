import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coffeeBreak } from '../src/scenes/micromodes/coffeeBreak.js';

function makeState() {
  return { maxEnergy: 1000, energy: 500 };
}

test('coffeeBreak: enter resets sip counter', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  assert.doesNotThrow(() => coffeeBreak.enter(s, {}));
});

test('coffeeBreak: each fire-press edge counts as a sip; success at threshold', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  let result = null;
  for (let i = 0; i < 11; i++) {
    result = coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  assert.equal(result, null);
  result = coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  assert.deepEqual(result, { complete: true, outcome: 'success' });
});

test('coffeeBreak: fire NOT pressed does not count a sip', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 20; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: false });
  }
  const r = coffeeBreak.onExit(s, {});
  assert.equal(r.outcome, 'fail');
  assert.equal(s.energy, 500);
});

test('coffeeBreak: success rewards 15% maxEnergy', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 12; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  const r = coffeeBreak.onExit(s, {});
  assert.equal(r.outcome, 'success');
  assert.equal(s.energy, 650);
});

test('coffeeBreak: success reward capped at maxEnergy', () => {
  const s = { maxEnergy: 1000, energy: 950 };
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 12; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  coffeeBreak.onExit(s, {});
  assert.equal(s.energy, 1000);
});

test('coffeeBreak: failure does not change energy', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 5; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  coffeeBreak.onExit(s, {});
  assert.equal(s.energy, 500);
});
