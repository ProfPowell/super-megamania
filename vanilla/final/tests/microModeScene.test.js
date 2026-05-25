import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMicroModeScene } from '../src/scenes/microModeScene.js';

function makeFakeController() {
  const stack = [];
  return {
    stack,
    push: (s) => stack.push(s),
    pop: () => stack.pop(),
    current: () => stack[stack.length - 1] || null
  };
}

function makeCtx() {
  const events = [];
  const sc = makeFakeController();
  return {
    events,
    sceneController: sc,
    bus: { emit: (name, p) => events.push({ name, payload: p }) },
    state: {
      gameTime: 0,
      microMode: { safeWindowSec: 0, nextMicroModeAt: 0, activeMicroMode: 'test' }
    },
    input: { getState: () => ({ fire: false, left: false, right: false }) }
  };
}

function makeMicromode(overrides = {}) {
  return {
    name: 'test',
    duration: 0.1,
    enter:  () => {},
    update: () => {},
    render: () => {},
    onExit: () => ({ outcome: 'success' }),
    ...overrides
  };
}

test('microModeScene: enter calls micromode.enter once with state+ctx', () => {
  const ctx = makeCtx();
  let entered = 0;
  const mm = makeMicromode({ enter: () => { entered++; } });
  const scene = createMicroModeScene(mm, ctx);
  scene.enter();
  assert.equal(entered, 1);
});

test('microModeScene: update calls micromode.update each frame with input edge info', () => {
  const ctx = makeCtx();
  const calls = [];
  const mm = makeMicromode({
    update: (state, c, dt, inputInfo) => calls.push({ dt, fire: inputInfo.fire, pressed: inputInfo.firePressedThisFrame })
  });
  const scene = createMicroModeScene(mm, ctx);
  scene.enter();
  scene.update(ctx, 0.016);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].dt, 0.016);
});

test('microModeScene: detects firePressedThisFrame on transition false→true', () => {
  const ctx = makeCtx();
  const events = [];
  let fireState = false;
  ctx.input.getState = () => ({ fire: fireState, left: false, right: false });
  const mm = makeMicromode({
    update: (state, c, dt, info) => events.push(info.firePressedThisFrame)
  });
  const scene = createMicroModeScene(mm, ctx);
  scene.enter();
  scene.update(ctx, 0.016);
  fireState = true;
  scene.update(ctx, 0.016);
  scene.update(ctx, 0.016);
  fireState = false;
  scene.update(ctx, 0.016);
  fireState = true;
  scene.update(ctx, 0.016);
  assert.deepEqual(events, [false, true, false, false, true]);
});

test('microModeScene: auto-pops after duration elapses + emits MICROMODE_END', () => {
  const ctx = makeCtx();
  ctx.sceneController.push({ name: 'play' });
  const mm = makeMicromode({ duration: 0.2 });
  const scene = createMicroModeScene(mm, ctx);
  ctx.sceneController.push(scene);
  scene.enter();
  scene.update(ctx, 0.1);
  assert.equal(ctx.sceneController.stack.length, 2);
  scene.update(ctx, 0.15);
  assert.equal(ctx.sceneController.stack.length, 1);
  const end = ctx.events.find(e => e.name === 'MICROMODE_END');
  assert.ok(end);
  assert.equal(end.payload.name, 'test');
});

test('microModeScene: passes onExit outcome to MICROMODE_END payload', () => {
  const ctx = makeCtx();
  ctx.sceneController.push({ name: 'play' });
  const mm = makeMicromode({
    duration: 0.05,
    onExit: () => ({ outcome: 'fail' })
  });
  const scene = createMicroModeScene(mm, ctx);
  ctx.sceneController.push(scene);
  scene.enter();
  scene.update(ctx, 0.06);
  const end = ctx.events.find(e => e.name === 'MICROMODE_END');
  assert.equal(end.payload.outcome, 'fail');
});

test('microModeScene: micromode update can signal completion early via return value', () => {
  const ctx = makeCtx();
  ctx.sceneController.push({ name: 'play' });
  const mm = makeMicromode({
    duration: 10,
    update: () => ({ complete: true, outcome: 'success' })
  });
  const scene = createMicroModeScene(mm, ctx);
  ctx.sceneController.push(scene);
  scene.enter();
  scene.update(ctx, 0.016);
  assert.equal(ctx.sceneController.stack.length, 1);
});

test('microModeScene: schedules next micromode + clears activeMicroMode on exit', () => {
  const ctx = makeCtx();
  ctx.sceneController.push({ name: 'play' });
  ctx.state.gameTime = 50;
  ctx.state.microMode.activeMicroMode = 'test';
  const mm = makeMicromode({ duration: 0.05 });
  const scene = createMicroModeScene(mm, ctx);
  ctx.sceneController.push(scene);
  scene.enter();
  scene.update(ctx, 0.06);
  assert.equal(ctx.state.microMode.activeMicroMode, null);
  const next = ctx.state.microMode.nextMicroModeAt;
  assert.ok(next >= 60 && next <= 80,
    `next scheduled at ${next}; expected gameTime+10..30 (60-80)`);
});

test('microModeScene: render delegates to micromode.render', () => {
  const ctx = makeCtx();
  let drawCalls = 0;
  const mm = makeMicromode({ render: () => { drawCalls++; } });
  const scene = createMicroModeScene(mm, ctx);
  ctx.ctx2d = { save: () => {}, restore: () => {}, fillRect: () => {}, fillStyle: '' };
  scene.enter();
  scene.render(ctx);
  assert.equal(drawCalls, 1);
});
