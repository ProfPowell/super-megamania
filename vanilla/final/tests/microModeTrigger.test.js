import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateMicroModeTrigger } from '../src/systems/microModeTrigger.js';

function fakeSceneController() {
  const pushed = [];
  return {
    pushed,
    push: (s) => pushed.push(s),
    pop: () => {},
    current: () => null,
    update: () => {},
    render: () => {}
  };
}

function makeCtx(opts = {}) {
  const {
    themeName = 'Absurd',
    enemies = [],
    playerBullets = [],
    enemyBullets = [],
    bonusActive = false,
    gameTime = 0,
    safeWindowSec = 0,
    nextMicroModeAt = 0,
    activeMicroMode = null
  } = opts;
  return {
    theme: { name: themeName },
    state: {
      gameTime,
      enemies, playerBullets, enemyBullets,
      bonusStageActive: bonusActive,
      microMode: { safeWindowSec, nextMicroModeAt, activeMicroMode }
    },
    sceneController: fakeSceneController(),
    bus: { emit: () => {} },
    input: { getState: () => ({ fire: false, left: false, right: false }) }
  };
}

test('microModeTrigger: increments safeWindowSec when no enemies/bullets', () => {
  const ctx = makeCtx({ gameTime: 5, safeWindowSec: 0.5 });
  updateMicroModeTrigger(ctx, 0.1);
  assert.ok(Math.abs(ctx.state.microMode.safeWindowSec - 0.6) < 0.001);
});

test('microModeTrigger: resets safeWindowSec to 0 when enemies present', () => {
  const ctx = makeCtx({ enemies: [{}], safeWindowSec: 0.5 });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.state.microMode.safeWindowSec, 0);
});

test('microModeTrigger: resets safeWindowSec to 0 when player bullets in flight', () => {
  const ctx = makeCtx({ playerBullets: [{}], safeWindowSec: 0.5 });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.state.microMode.safeWindowSec, 0);
});

test('microModeTrigger: does nothing in non-Absurd themes', () => {
  const ctx = makeCtx({ themeName: 'Cats', gameTime: 30, nextMicroModeAt: 0 });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.state.microMode.safeWindowSec, 0);
  assert.equal(ctx.sceneController.pushed.length, 0);
});

test('microModeTrigger: schedules first micromode on first update when unscheduled', () => {
  const ctx = makeCtx({ gameTime: 0, nextMicroModeAt: 0 });
  updateMicroModeTrigger(ctx, 0.1);
  const next = ctx.state.microMode.nextMicroModeAt;
  assert.ok(next >= 10 && next <= 30, `nextMicroModeAt=${next}, expected 10-30`);
});

test('microModeTrigger: does NOT push while bonus stage is active', () => {
  const ctx = makeCtx({
    gameTime: 30,
    safeWindowSec: 2,
    nextMicroModeAt: 25,
    bonusActive: true
  });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.sceneController.pushed.length, 0);
});

test('microModeTrigger: does NOT push while a micromode is already active', () => {
  const ctx = makeCtx({
    gameTime: 30,
    safeWindowSec: 2,
    nextMicroModeAt: 25,
    activeMicroMode: 'coffeeBreak'
  });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.sceneController.pushed.length, 0);
});

test('microModeTrigger: pushes when all conditions are met', () => {
  const ctx = makeCtx({
    gameTime: 30,
    safeWindowSec: 1.5,
    nextMicroModeAt: 25
  });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.sceneController.pushed.length, 1,
    'expected exactly one push when safe and scheduled');
});

test('microModeTrigger: does NOT push when safe window < 1.0s', () => {
  const ctx = makeCtx({
    gameTime: 30,
    safeWindowSec: 0.5,
    nextMicroModeAt: 25
  });
  updateMicroModeTrigger(ctx, 0.1);
  assert.equal(ctx.sceneController.pushed.length, 0);
});

test('microModeTrigger: emits MICROMODE_START on push', () => {
  const events = [];
  const ctx = makeCtx({
    gameTime: 30, safeWindowSec: 2, nextMicroModeAt: 25
  });
  ctx.bus.emit = (name, payload) => events.push({ name, payload });
  updateMicroModeTrigger(ctx, 0.1);
  const start = events.find(e => e.name === 'MICROMODE_START');
  assert.ok(start, 'should emit MICROMODE_START');
  assert.ok(typeof start.payload.name === 'string', 'payload should include a name');
});
