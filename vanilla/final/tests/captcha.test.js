import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captcha } from '../src/scenes/micromodes/captcha.js';

function makeState() {
  return {
    activePowerUps: {},
    microMode: { instance: {} }
  };
}

function noEdges() {
  return { firePressedThisFrame: false, leftPressedThisFrame: false, rightPressedThisFrame: false };
}

test('captcha: enter sets up 3 slots with exactly one AI', () => {
  const s = makeState();
  captcha.enter(s, {});
  const inst = s.microMode.instance;
  assert.equal(inst.slots.length, 3);
  const aiCount = inst.slots.filter(x => x.isAI).length;
  assert.equal(aiCount, 1);
  assert.equal(inst.cursor, 1);
  assert.equal(inst.committed, false);
});

test('captcha: left arrow press moves cursor left', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = 2;
  captcha.update(s, {}, 0.016, { ...noEdges(), leftPressedThisFrame: true });
  assert.equal(s.microMode.instance.cursor, 1);
});

test('captcha: right arrow press moves cursor right; cursor clamps at 2', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = 1;
  captcha.update(s, {}, 0.016, { ...noEdges(), rightPressedThisFrame: true });
  assert.equal(s.microMode.instance.cursor, 2);
  captcha.update(s, {}, 0.016, { ...noEdges(), rightPressedThisFrame: true });
  assert.equal(s.microMode.instance.cursor, 2);
});

test('captcha: cursor clamps at 0 on left edge', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = 0;
  captcha.update(s, {}, 0.016, { ...noEdges(), leftPressedThisFrame: true });
  assert.equal(s.microMode.instance.cursor, 0);
});

test('captcha: fire commits the pick; correct → success outcome', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = s.microMode.instance.robotIdx;
  const r = captcha.update(s, {}, 0.016, { ...noEdges(), firePressedThisFrame: true });
  assert.deepEqual(r, { complete: true, outcome: 'success' });
  assert.equal(s.microMode.instance.committed, true);
  assert.equal(s.microMode.instance.pickedCorrect, true);
});

test('captcha: fire commits a wrong pick → fail outcome', () => {
  const s = makeState();
  captcha.enter(s, {});
  // pick a slot that is NOT the robotIdx
  s.microMode.instance.cursor = (s.microMode.instance.robotIdx + 1) % 3;
  const r = captcha.update(s, {}, 0.016, { ...noEdges(), firePressedThisFrame: true });
  assert.equal(r.outcome, 'fail');
  assert.equal(s.microMode.instance.pickedCorrect, false);
});

test('captcha: after commit, update is a no-op', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = s.microMode.instance.robotIdx;
  captcha.update(s, {}, 0.016, { ...noEdges(), firePressedThisFrame: true });
  // Subsequent updates should not change anything.
  const cursorBefore = s.microMode.instance.cursor;
  captcha.update(s, {}, 0.016, { ...noEdges(), leftPressedThisFrame: true });
  assert.equal(s.microMode.instance.cursor, cursorBefore);
});

test('captcha: onExit on correct pick applies a power-up', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = s.microMode.instance.robotIdx;
  captcha.update(s, {}, 0.016, { ...noEdges(), firePressedThisFrame: true });
  const r = captcha.onExit(s, {});
  assert.equal(r.outcome, 'success');
  // applyPowerUp populates activePowerUps[kind] with an expiry.
  const kinds = Object.keys(s.activePowerUps);
  assert.equal(kinds.length, 1, 'expected exactly one active power-up after success');
  assert.ok(s.activePowerUps[kinds[0]].expiresAt > Date.now() - 1000);
});

test('captcha: onExit on wrong pick does NOT apply a power-up', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = (s.microMode.instance.robotIdx + 1) % 3;
  captcha.update(s, {}, 0.016, { ...noEdges(), firePressedThisFrame: true });
  captcha.onExit(s, {});
  assert.equal(Object.keys(s.activePowerUps).length, 0);
});
