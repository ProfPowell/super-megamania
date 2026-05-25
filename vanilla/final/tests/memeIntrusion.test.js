import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateMemeIntrusion, MEME_EMOJIS } from '../src/systems/memeIntrusion.js';

function makeCtx(themeName = 'Absurd', gameTime = 0, overrides = {}) {
  return {
    theme: { name: themeName },
    state: {
      gameTime,
      juiceFx: {
        memeIntrusion: null,
        memeIntrusionNextAt: 0,
        ...overrides
      }
    }
  };
}

test('memeIntrusion: schedules first intrusion within 20-40s on first update if unscheduled', () => {
  const ctx = makeCtx('Absurd', 0);
  updateMemeIntrusion(ctx, 1 / 60);
  const next = ctx.state.juiceFx.memeIntrusionNextAt;
  assert.ok(next >= 20 && next <= 40, `next intrusion scheduled at ${next}s, expected 20-40`);
});

test('memeIntrusion: does nothing when theme is not Absurd', () => {
  const ctx = makeCtx('Cats', 0);
  updateMemeIntrusion(ctx, 1 / 60);
  assert.equal(ctx.state.juiceFx.memeIntrusion, null);
  assert.equal(ctx.state.juiceFx.memeIntrusionNextAt, 0);
});

test('memeIntrusion: activates when gameTime reaches the scheduled time', () => {
  const ctx = makeCtx('Absurd', 25, { memeIntrusionNextAt: 25 });
  updateMemeIntrusion(ctx, 1 / 60);
  const intr = ctx.state.juiceFx.memeIntrusion;
  assert.ok(intr, 'intrusion should be active');
  assert.ok(MEME_EMOJIS.includes(intr.emoji));
  assert.equal(intr.startTime, 25);
  assert.equal(intr.duration, 1.5);
});

test('memeIntrusion: deactivates after duration elapses + schedules next intrusion', () => {
  const ctx = makeCtx('Absurd', 26.6, {
    memeIntrusion: { emoji: '😱', startTime: 25, duration: 1.5, startX: 0, endX: 640, y: 100 },
    memeIntrusionNextAt: 25
  });
  updateMemeIntrusion(ctx, 1 / 60);
  assert.equal(ctx.state.juiceFx.memeIntrusion, null);
  const next = ctx.state.juiceFx.memeIntrusionNextAt;
  assert.ok(next >= 26.6 + 20 && next <= 26.6 + 40,
    `next intrusion ${next} should be 20-40s after current ${26.6}`);
});

test('memeIntrusion: active intrusion stays active during its window', () => {
  const ctx = makeCtx('Absurd', 25.5, {
    memeIntrusion: { emoji: '😱', startTime: 25, duration: 1.5, startX: 0, endX: 640, y: 100 },
    memeIntrusionNextAt: 25
  });
  updateMemeIntrusion(ctx, 1 / 60);
  assert.ok(ctx.state.juiceFx.memeIntrusion, 'should still be active mid-window');
});
