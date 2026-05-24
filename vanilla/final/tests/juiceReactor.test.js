import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../src/app/eventBus.js';
import { Events } from '../src/app/events.js';
import { installJuiceReactor } from '../src/systems/juice.js';

function makeCtx(overrides = {}) {
  return {
    bus: createEventBus(),
    audio: { playPowerUp: () => {}, playEnemyExplode: () => {} },
    state: {
      hitstopTimer: 0,
      particles: [],
      juiceFx: {
        chromaUntil: 0,
        comboPopUntil: 0,
        comboBreakUntil: 0,
        bonusDrainUntil: 0,
        waveTelegraphGhosts: [],
        waveTelegraphUntil: 0
      },
      gameTime: 0
    },
    theme: { name: 'Absurd' },
    ...overrides
  };
}

test('juice: ENEMY_KILLED sets hitstop scaled by scoreValue', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.bus.emit(Events.ENEMY_KILLED, {
    enemy: { x: 100, y: 100, width: 20, height: 20, color: '#fff' },
    scoreValue: 100,
    comboAfter: 1
  });
  assert.ok(ctx.state.hitstopTimer >= 0.03 && ctx.state.hitstopTimer <= 0.06,
    `chaff hitstop ${ctx.state.hitstopTimer} out of expected 30-60ms range`);
});

test('juice: ENEMY_KILLED with high scoreValue produces longer hitstop', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.bus.emit(Events.ENEMY_KILLED, {
    enemy: { x: 100, y: 100, width: 20, height: 20, color: '#fff' },
    scoreValue: 500,
    comboAfter: 1
  });
  assert.ok(ctx.state.hitstopTimer >= 0.06 && ctx.state.hitstopTimer <= 0.1,
    `big-kill hitstop ${ctx.state.hitstopTimer} out of expected 60-100ms range`);
});

test('juice: ENEMY_KILLED with comboAfter≥10 pushes big-explosion particles', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.state.particles.length = 0;
  ctx.bus.emit(Events.ENEMY_KILLED, {
    enemy: { x: 100, y: 100, width: 20, height: 20, color: '#fff' },
    scoreValue: 100,
    comboAfter: 10
  });
  assert.ok(ctx.state.particles.length >= 24,
    `expected big-explosion ≥24 particles, got ${ctx.state.particles.length}`);
});

test('juice: ENEMY_KILLED with comboAfter NOT divisible by 5 does not flash', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.state.particles.length = 0;
  ctx.bus.emit(Events.ENEMY_KILLED, {
    enemy: { x: 100, y: 100, width: 20, height: 20, color: '#fff' },
    scoreValue: 100,
    comboAfter: 7
  });
  assert.equal(ctx.state.particles.length, 0);
});

test('juice: POWERUP_PICKUP pushes powerup-burst particles at the given position', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.state.particles.length = 0;
  ctx.bus.emit(Events.POWERUP_PICKUP, { kind: 'shield', x: 200, y: 300 });
  assert.ok(ctx.state.particles.length > 0);
  const first = ctx.state.particles[0];
  assert.equal(first.x, 200);
  assert.equal(first.y, 300);
});

test('juice: PLAYER_HIT sets chromaUntil in the future', () => {
  const ctx = makeCtx();
  const beforeNow = Date.now();
  installJuiceReactor(ctx);
  ctx.bus.emit(Events.PLAYER_HIT, { player: { x: 0, y: 0 } });
  assert.ok(ctx.state.juiceFx.chromaUntil > beforeNow,
    'chromaUntil should be a future timestamp');
});

test('juice: COMBO_INCREMENT sets comboPopUntil; COMBO_BROKEN sets comboBreakUntil', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.bus.emit(Events.COMBO_INCREMENT, { combo: 5, multiplier: 2 });
  assert.ok(ctx.state.juiceFx.comboPopUntil > Date.now());
  ctx.bus.emit(Events.COMBO_BROKEN, {});
  assert.ok(ctx.state.juiceFx.comboBreakUntil > Date.now());
});

test('juice: BONUS_END with perfect:true triggers chroma; non-perfect does not', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.bus.emit(Events.BONUS_END, { perfect: false, escaped: 3, score: 0 });
  assert.equal(ctx.state.juiceFx.chromaUntil, 0,
    'non-perfect bonus should not trigger chroma');
  ctx.bus.emit(Events.BONUS_END, { perfect: true, escaped: 0, score: 1000 });
  assert.ok(ctx.state.juiceFx.chromaUntil > Date.now(),
    'perfect bonus should trigger chroma');
});
