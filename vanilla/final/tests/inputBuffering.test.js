import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInputManager } from '../src/input/inputManager.js';

function fakeModule(initialState = {}) {
  const state = {
    left: false, right: false, fire: false, pause: false, restart: false,
    ...initialState
  };
  return {
    state,
    getState: () => ({ ...state }),
    enable: () => {},
    disable: () => {},
    isTouchDevice: () => false,
    show: () => {},
    hide: () => {}
  };
}

test('inputManager: firePressedAt starts at 0', () => {
  const kb = fakeModule();
  const tc = fakeModule();
  const im = createInputManager({ keyboard: kb, touch: tc });
  assert.equal(im.getState().firePressedAt, 0);
});

test('inputManager: firePressedAt updates on false→true transition', async () => {
  const kb = fakeModule();
  const tc = fakeModule();
  const im = createInputManager({ keyboard: kb, touch: tc });
  // Initial call with fire=false establishes prev state.
  im.getState();
  // Now press fire.
  kb.state.fire = true;
  const before = Date.now();
  const s = im.getState();
  assert.ok(s.firePressedAt >= before);
  assert.ok(s.firePressedAt <= Date.now());
});

test('inputManager: firePressedAt does NOT update on held-fire frames', async () => {
  const kb = fakeModule({ fire: true });
  const tc = fakeModule();
  const im = createInputManager({ keyboard: kb, touch: tc });
  const s1 = im.getState();          // first call — establishes the press edge
  await new Promise(r => setTimeout(r, 10));
  const s2 = im.getState();          // held — should NOT re-stamp
  assert.equal(s1.firePressedAt, s2.firePressedAt);
});

test('inputManager: firePressedAt updates again after release+repress', async () => {
  const kb = fakeModule();
  const tc = fakeModule();
  const im = createInputManager({ keyboard: kb, touch: tc });
  kb.state.fire = true;
  const first = im.getState().firePressedAt;
  kb.state.fire = false;
  im.getState();
  await new Promise(r => setTimeout(r, 5));
  kb.state.fire = true;
  const second = im.getState().firePressedAt;
  assert.ok(second > first, `second press ${second} should be > first ${first}`);
});

test('inputManager: touch fire press also stamps firePressedAt', () => {
  const kb = fakeModule();
  const tc = fakeModule();
  const im = createInputManager({ keyboard: kb, touch: tc });
  im.getState();
  tc.state.fire = true;
  const s = im.getState();
  assert.ok(s.firePressedAt > 0);
});

test('inputManager: getDirection still works with the new field present', () => {
  const kb = fakeModule({ right: true });
  const tc = fakeModule();
  const im = createInputManager({ keyboard: kb, touch: tc });
  assert.equal(im.getDirection(), 1);
});
