import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emojiRain } from '../src/scenes/micromodes/emojiRain.js';

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

function input(left, right) {
  return {
    fire: false, firePressedThisFrame: false,
    left: !!left, right: !!right,
    leftPressedThisFrame: false, rightPressedThisFrame: false
  };
}

test('emojiRain: enter sets up player at screen center, no emojis, not hit', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  const inst = s.microMode.instance;
  assert.equal(inst.hit, false);
  assert.equal(inst.emojis.length, 0);
  assert.ok(inst.player.x >= 280 && inst.player.x <= 320,
    `player x ${inst.player.x} should be near center`);
});

test('emojiRain: left input moves player left over time', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  const before = s.microMode.instance.player.x;
  for (let i = 0; i < 30; i++) {
    emojiRain.update(s, {}, 1 / 60, input(true, false));
  }
  assert.ok(s.microMode.instance.player.x < before,
    `player should have moved left from ${before} but is at ${s.microMode.instance.player.x}`);
});

test('emojiRain: right input moves player right over time', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  const before = s.microMode.instance.player.x;
  for (let i = 0; i < 30; i++) {
    emojiRain.update(s, {}, 1 / 60, input(false, true));
  }
  assert.ok(s.microMode.instance.player.x > before);
});

test('emojiRain: player clamps to left edge', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  for (let i = 0; i < 600; i++) {
    emojiRain.update(s, {}, 1 / 60, input(true, false));
  }
  assert.equal(s.microMode.instance.player.x, 0);
});

test('emojiRain: emojis spawn over time', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  for (let i = 0; i < 30; i++) {
    emojiRain.update(s, {}, 1 / 60, input(false, false));
  }
  assert.ok(s.microMode.instance.emojis.length > 0,
    'expected at least one emoji to have spawned in ~0.5s');
});

test('emojiRain: emojis fall (y increases)', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  s.microMode.instance.emojis = [{ x: 100, y: 0, w: 36, h: 36, vy: 200, emoji: '😱' }];
  emojiRain.update(s, {}, 1 / 60, input(false, false));
  assert.ok(s.microMode.instance.emojis[0].y > 0);
});

test('emojiRain: emoji touching player sets hit=true', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  const inst = s.microMode.instance;
  // Place an emoji on top of the player.
  inst.emojis.push({ x: inst.player.x + 5, y: inst.player.y + 5, w: 36, h: 36, vy: 0, emoji: '😱' });
  emojiRain.update(s, {}, 1 / 60, input(false, false));
  assert.equal(inst.hit, true);
});

test('emojiRain: surviving (no hit) grants +300 score on exit', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  s.microMode.instance.hit = false;
  const r = emojiRain.onExit(s, {});
  assert.equal(r.outcome, 'success');
  assert.equal(s.score, 300);
});

test('emojiRain: getting hit gives no score', () => {
  const s = makeState();
  emojiRain.enter(s, {});
  s.microMode.instance.hit = true;
  const r = emojiRain.onExit(s, {});
  assert.equal(r.outcome, 'fail');
  assert.equal(s.score, 0);
});
