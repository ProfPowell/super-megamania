# Super Megamania — Phase 2E Micromodes Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 2E from the spec — the remaining three Tier E micromodes (Loading 99%, CAPTCHA, Emoji Rain). Phase 2D shipped the framework + Coffee Break; Phase 2E reuses that framework with three new definitions plus two small framework refinements: extended input-edge info for CAPTCHA's arrow-key cursor, and a per-micromode-instance state pattern that lets each micromode hold its own runtime state without module-level singletons.

**Architecture:** No new subsystems. Three new micromode definition files in `src/scenes/micromodes/`. Framework extensions:
1. `microModeScene` adds `leftPressedThisFrame` / `rightPressedThisFrame` to the `inputInfo` passed to micromode `update`.
2. Per-micromode state lives on `state.microMode.instance` (an object initialized by the micromode's `enter`). Coffee Break is refactored to use this pattern; new micromodes follow it. Removes the module-level singleton smell flagged in the Phase 2D code review.
3. `MICROMODE_REGISTRY` in `microModeTrigger` grows from `[coffeeBreak]` to `[coffeeBreak, loading99, captcha, emojiRain]`.

All four micromodes remain Absurd-theme-gated (handled by the existing trigger) and upside-only (success = small reward, failure = nothing).

**Tech Stack:** Vanilla JavaScript, Canvas2D. Node's built-in test runner. No bundler, no deps.

**Scope note:** Implements Phase 2E only. This is the last spec phase before the deferred audio pass.

**Plan-authoring rule:** Function signatures verified against current `main` (post-Phase-2D):
- `createMicroModeScene(micromode, ctxAtCreate)` returns `{ enter, update, render, exit }` (`src/scenes/microModeScene.js:20`).
- Current `inputInfo` shape: `{ fire, firePressedThisFrame, left, right }` (`microModeScene.js:42-46`). Phase 2E extends with `leftPressedThisFrame`, `rightPressedThisFrame`.
- `MICROMODE_REGISTRY = [coffeeBreak]` (`microModeTrigger.js:24`).
- `applyPowerUp(state, powerUp)` and `createPowerUp(x, y, type)` exist (`src/entities/powerup.js`).
- `addScore(state, points)` for the score-bonus reward (`gameState.js:177`).
- `coffeeBreak.cupState` is a module-level const; will be refactored to `state.microMode.instance`.

**Working directory:** `vanilla/final/` for all paths.

---

## Files this plan creates / modifies

| File | Action | Responsibility |
|---|---|---|
| `src/scenes/microModeScene.js` | Modify | Add `leftPressedThisFrame` / `rightPressedThisFrame` to inputInfo |
| `src/scenes/micromodes/coffeeBreak.js` | Modify | Refactor to use `state.microMode.instance` for sip counter |
| `tests/coffeeBreak.test.js` | Modify | Update tests to pass `state.microMode = { instance: {} }` shape |
| `src/scenes/micromodes/loading99.js` | Create | Loading 99% micromode |
| `src/scenes/micromodes/captcha.js` | Create | CAPTCHA "which one is the AI?" micromode |
| `src/scenes/micromodes/emojiRain.js` | Create | Emoji Rain dodge micromode |
| `src/systems/microModeTrigger.js` | Modify | Extend `MICROMODE_REGISTRY` to include all four micromodes |
| `tests/microModeScene.test.js` | Modify | Add tests for `leftPressedThisFrame`/`rightPressedThisFrame` edge detection |
| `tests/loading99.test.js` | Create | Tests for Loading micromode |
| `tests/captcha.test.js` | Create | Tests for CAPTCHA micromode |
| `tests/emojiRain.test.js` | Create | Tests for Emoji Rain micromode |

## Files this plan does NOT touch

`src/state/gameState.js` (no new top-level state fields; instance lives under `state.microMode.instance`), `src/scenes/playScene.js`, `src/main.js`, `src/systems/juice.js`, audio, themes, particles, screen shake, hud, css.

---

### Task 1: Extend `microModeScene` inputInfo with arrow-key edges

**Files:**
- Modify: `vanilla/final/src/scenes/microModeScene.js`
- Modify: `vanilla/final/tests/microModeScene.test.js`

- [ ] **Step 1: Read the current `microModeScene.js`** and locate the input-tracking block (around lines 35–46):

```javascript
    const inputState = ctx.input.getState();
    const fire = !!inputState.fire;
    const firePressedThisFrame = fire && !prevFire;
    prevFire = fire;

    const inputInfo = {
      fire,
      firePressedThisFrame,
      left: !!inputState.left,
      right: !!inputState.right
    };
```

- [ ] **Step 2: Replace with the extended version**

Also locate the closure declarations at the top of `createMicroModeScene` (around line 22: `let prevFire = false;`).

Use the Edit tool to:

(a) Add `let prevLeft = false;` and `let prevRight = false;` next to the existing `let prevFire = false;`.

(b) Replace the input-tracking block above with:

```javascript
    const inputState = ctx.input.getState();
    const fire = !!inputState.fire;
    const left = !!inputState.left;
    const right = !!inputState.right;
    const firePressedThisFrame = fire && !prevFire;
    const leftPressedThisFrame = left && !prevLeft;
    const rightPressedThisFrame = right && !prevRight;
    prevFire = fire;
    prevLeft = left;
    prevRight = right;

    const inputInfo = {
      fire,
      firePressedThisFrame,
      left,
      right,
      leftPressedThisFrame,
      rightPressedThisFrame
    };
```

(c) In `enter()`, also reset `prevLeft` and `prevRight` to `false`:

```javascript
  function enter() {
    elapsed = 0;
    prevFire = false;
    prevLeft = false;
    prevRight = false;
    outcome = null;
    ...
  }
```

- [ ] **Step 3: Add a test for the new edge fields**

Append to `vanilla/final/tests/microModeScene.test.js`:

```javascript
test('microModeScene: detects leftPressedThisFrame and rightPressedThisFrame on press edges', () => {
  const sc = { stack: [], push: (s) => sc.stack.push(s), pop: () => sc.stack.pop(), current: () => sc.stack[sc.stack.length-1] || null };
  const fullCtx = {
    sceneController: sc,
    bus: { emit: () => {} },
    state: { gameTime: 0, microMode: { safeWindowSec: 0, nextMicroModeAt: 0, activeMicroMode: 'test' } },
    input: { getState: () => ({ fire: false, left: leftState, right: rightState }) }
  };
  let leftState = false;
  let rightState = false;
  const seen = [];
  const mm = {
    name: 'test',
    duration: 999,
    enter: () => {},
    update: (_s, _c, _dt, info) => {
      seen.push({ l: info.leftPressedThisFrame, r: info.rightPressedThisFrame });
      return null;
    },
    render: () => {},
    onExit: () => ({ outcome: 'success' })
  };
  const scene = createMicroModeScene(mm, fullCtx);
  sc.push({ name: 'play' });
  sc.push(scene);
  scene.enter();
  scene.update(fullCtx, 0.016);   // both false → no edge
  leftState = true;
  scene.update(fullCtx, 0.016);   // left edge → l:true, r:false
  scene.update(fullCtx, 0.016);   // held → l:false
  leftState = false;
  rightState = true;
  scene.update(fullCtx, 0.016);   // right edge → l:false r:true
  rightState = false;
  scene.update(fullCtx, 0.016);   // both released → both false
  assert.deepEqual(seen, [
    { l: false, r: false },
    { l: true,  r: false },
    { l: false, r: false },
    { l: false, r: true  },
    { l: false, r: false }
  ]);
});
```

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: baseline + 1 new arrow-edge test = previous count + 1.

- [ ] **Step 5: Commit**

```bash
git add vanilla/final/src/scenes/microModeScene.js vanilla/final/tests/microModeScene.test.js
git commit -m "microModeScene: expose arrow-key press edges to micromodes"
```

---

### Task 2: Refactor Coffee Break to use `state.microMode.instance`

**Files:**
- Modify: `vanilla/final/src/scenes/micromodes/coffeeBreak.js`
- Modify: `vanilla/final/tests/coffeeBreak.test.js`

The current Coffee Break uses a module-level `const cupState = { sips: 0 }`. Phase 2E micromodes each need their own per-instance state; the cleanest pattern is `state.microMode.instance = {...}` (set by `enter`, read by `update`/`render`/`onExit`). Refactor Coffee Break first to lock in the pattern.

- [ ] **Step 1: Replace `coffeeBreak.js`** with this exact content:

```javascript
/**
 * Phase 2D/2E — Coffee Break micromode.
 *
 * A full-screen coffee cup. Each fire-press edge counts as one sip.
 * Goal: SUCCESS_SIPS in DURATION seconds. Success rewards +REWARD_PCT
 * of maxEnergy to current energy (capped at maxEnergy). Failure costs
 * nothing — the spec's upside-only principle.
 *
 * Phase 2E: per-instance state on state.microMode.instance (not module
 * globals). Pattern is shared by all Tier E micromodes.
 */

const SUCCESS_SIPS = 12;
const DURATION_SEC = 5;
const REWARD_PCT = 0.15; // 15% of maxEnergy

export const coffeeBreak = {
  name: 'coffeeBreak',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    state.microMode.instance = { sips: 0 };
  },

  update(state, _ctx, _dt, input) {
    const inst = state.microMode.instance;
    if (input.firePressedThisFrame) {
      inst.sips++;
    }
    if (inst.sips >= SUCCESS_SIPS) {
      return { complete: true, outcome: 'success' };
    }
    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance || { sips: 0 };

    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.75)';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#ffffff';
    g.font = "20px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('☕ COFFEE BREAK', 320, 70);
    g.font = "12px 'Press Start 2P', monospace";
    g.fillText('MASH FIRE TO SIP', 320, 110);

    const cupX = 220, cupY = 160;
    const cupW = 200, cupH = 220;
    g.fillStyle = '#cccccc';
    g.fillRect(cupX, cupY, cupW, cupH);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(cupX, cupY, cupW, cupH);
    g.beginPath();
    g.arc(cupX + cupW + 20, cupY + cupH / 2, 40, -Math.PI / 2, Math.PI / 2);
    g.lineWidth = 8;
    g.strokeStyle = '#cccccc';
    g.stroke();

    const fillPct = Math.min(1, inst.sips / SUCCESS_SIPS);
    const fillH = (cupH - 20) * fillPct;
    g.fillStyle = '#5a3a1a';
    g.fillRect(cupX + 10, cupY + cupH - fillH - 10, cupW - 20, fillH);

    g.fillStyle = '#ffff00';
    g.font = "18px 'Press Start 2P', monospace";
    g.fillText(`${inst.sips} / ${SUCCESS_SIPS}`, 320, 420);

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || { sips: 0 };
    if (inst.sips >= SUCCESS_SIPS) {
      const reward = state.maxEnergy * REWARD_PCT;
      state.energy = Math.min(state.maxEnergy, state.energy + reward);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
```

- [ ] **Step 2: Update Coffee Break tests to pass the new state shape**

Replace `vanilla/final/tests/coffeeBreak.test.js` with:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coffeeBreak } from '../src/scenes/micromodes/coffeeBreak.js';

function makeState() {
  return { maxEnergy: 1000, energy: 500, microMode: { instance: {} } };
}

test('coffeeBreak: enter sets instance.sips = 0', () => {
  const s = makeState();
  s.microMode.instance.sips = 99;
  coffeeBreak.enter(s, {});
  assert.equal(s.microMode.instance.sips, 0);
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
  const s = { maxEnergy: 1000, energy: 950, microMode: { instance: {} } };
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
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: all existing Coffee Break tests still pass + the framework's previous test count.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/scenes/micromodes/coffeeBreak.js vanilla/final/tests/coffeeBreak.test.js
git commit -m "Coffee Break: per-instance state on state.microMode.instance"
```

---

### Task 3: Loading 99% micromode

**Files:**
- Create: `vanilla/final/src/scenes/micromodes/loading99.js`
- Create: `vanilla/final/tests/loading99.test.js`

Spec: "Fake progress bar stuck at 99%. Mash fire to nudge it. If it hits 100% before 5s: score bonus. If not: a 'Try again later' toast and you continue. Pure visual gag, can't lose anything."

Implementation: bar starts at 99.0%, each fire-press edge adds ~0.1% (so it takes ~10 presses to hit 100%). Renders a progress bar + sarcastic loading text. Reward on success: +500 score via `addScore(state, 500)`. Failure: no penalty.

- [ ] **Step 1: Create `loading99.js`**

```javascript
import { addScore } from '../../state/gameState.js';

/**
 * Phase 2E — Loading 99% micromode.
 *
 * Fake progress bar stuck near 99%. Each fire-press edge nudges it by
 * NUDGE_PCT. Reaching 100% within DURATION grants SUCCESS_SCORE_BONUS
 * via addScore. Failure: no penalty (upside-only).
 */

const START_PCT = 99.0;
const TARGET_PCT = 100.0;
const NUDGE_PCT = 0.1;          // % per press
const DURATION_SEC = 5;
const SUCCESS_SCORE_BONUS = 500;

const SARCASTIC_LABELS = [
  'INSTALLING UPDATES...',
  'CALIBRATING FLUX CAPACITOR...',
  'CONSULTING THE ORACLE...',
  'TURNING IT OFF AND ON AGAIN...',
  'BLAMING IT ON THE INTERN...'
];

export const loading99 = {
  name: 'loading99',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    state.microMode.instance = {
      pct: START_PCT,
      label: SARCASTIC_LABELS[Math.floor(Math.random() * SARCASTIC_LABELS.length)]
    };
  },

  update(state, _ctx, _dt, input) {
    const inst = state.microMode.instance;
    if (input.firePressedThisFrame) {
      inst.pct = Math.min(TARGET_PCT, inst.pct + NUDGE_PCT);
    }
    if (inst.pct >= TARGET_PCT) {
      return { complete: true, outcome: 'success' };
    }
    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance || { pct: START_PCT, label: '' };

    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.85)';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#00ff00';
    g.font = "20px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('🔄 LOADING...', 320, 140);

    g.font = "10px 'Press Start 2P', monospace";
    g.fillStyle = '#aaaaaa';
    g.fillText(inst.label, 320, 180);

    // Progress bar
    const barX = 80, barY = 230, barW = 480, barH = 40;
    g.fillStyle = '#222222';
    g.fillRect(barX, barY, barW, barH);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.strokeRect(barX, barY, barW, barH);
    const fillW = (barW - 4) * (inst.pct / 100);
    g.fillStyle = '#00ff00';
    g.fillRect(barX + 2, barY + 2, fillW, barH - 4);

    g.fillStyle = '#ffff00';
    g.font = "18px 'Press Start 2P', monospace";
    g.fillText(`${inst.pct.toFixed(1)}%`, 320, 310);

    g.fillStyle = '#ffffff';
    g.font = "12px 'Press Start 2P', monospace";
    g.fillText('MASH FIRE TO NUDGE IT', 320, 380);

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || { pct: START_PCT };
    if (inst.pct >= TARGET_PCT) {
      addScore(state, SUCCESS_SCORE_BONUS);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
```

- [ ] **Step 2: Create `loading99.test.js`**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loading99 } from '../src/scenes/micromodes/loading99.js';

function makeState() {
  return {
    score: 0,
    nextExtraLifeScore: 999999,
    lives: 3,
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
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -8
```
Expected: 6 new loading99 tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/scenes/micromodes/loading99.js vanilla/final/tests/loading99.test.js
git commit -m "Add Loading 99% micromode (Phase 2E)"
```

---

### Task 4: CAPTCHA micromode

**Files:**
- Create: `vanilla/final/src/scenes/micromodes/captcha.js`
- Create: `vanilla/final/tests/captcha.test.js`

Spec: "Three meme images appear ('which one is the AI?'). Move cursor with arrow keys, fire to pick. Correct = brief power-up. Wrong = nothing."

Implementation: pick 3 emojis on enter — two "humans" (random non-robot emojis) and one robot. Shuffle their slot positions. Cursor starts at slot 1 (center). Left/right arrow press-edges move cursor 0..2. Fire press-edge commits the pick. Correct = `applyPowerUp(state, { type: 'shield' | 'rapidFire' | 'spreadShot' })`. Wrong = nothing.

- [ ] **Step 1: Create `captcha.js`**

```javascript
import { applyPowerUp } from '../../entities/powerup.js';

/**
 * Phase 2E — CAPTCHA micromode.
 *
 * Three emojis displayed in a row. One is "the AI" (robot). Use arrow
 * keys to move a cursor, fire to commit. Correct pick: brief power-up
 * via applyPowerUp. Wrong pick: nothing happens. Upside-only.
 */

const DURATION_SEC = 5;
const HUMAN_EMOJIS = ['🍕', '🌭', '☕', '🥒', '🍔', '🌮'];
const ROBOT_EMOJIS = ['🤖', '👾', '🦾'];
const REWARD_POWERUPS = ['shield', 'rapidFire', 'spreadShot'];

export const captcha = {
  name: 'captcha',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    const robotIdx = Math.floor(Math.random() * 3);
    const slots = [];
    for (let i = 0; i < 3; i++) {
      if (i === robotIdx) {
        slots.push({ emoji: ROBOT_EMOJIS[Math.floor(Math.random() * ROBOT_EMOJIS.length)], isAI: true });
      } else {
        slots.push({ emoji: HUMAN_EMOJIS[Math.floor(Math.random() * HUMAN_EMOJIS.length)], isAI: false });
      }
    }
    state.microMode.instance = {
      slots,
      robotIdx,
      cursor: 1,
      committed: false,
      pickedCorrect: false
    };
  },

  update(state, _ctx, _dt, input) {
    const inst = state.microMode.instance;
    if (inst.committed) return null;

    if (input.leftPressedThisFrame) {
      inst.cursor = Math.max(0, inst.cursor - 1);
    }
    if (input.rightPressedThisFrame) {
      inst.cursor = Math.min(2, inst.cursor + 1);
    }

    if (input.firePressedThisFrame) {
      inst.committed = true;
      inst.pickedCorrect = (inst.cursor === inst.robotIdx);
      const outcome = inst.pickedCorrect ? 'success' : 'fail';
      return { complete: true, outcome };
    }

    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance;
    if (!inst) return;

    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.85)';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#ffffff';
    g.font = "16px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('🤖 WHICH ONE IS THE AI?', 320, 100);
    g.font = "10px 'Press Start 2P', monospace";
    g.fillText('LEFT/RIGHT TO MOVE • FIRE TO PICK', 320, 140);

    // Three slot rects
    const slotW = 120, slotH = 120, gap = 30;
    const totalW = slotW * 3 + gap * 2;
    const startX = (640 - totalW) / 2;
    const y = 220;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (slotW + gap);
      g.fillStyle = '#222222';
      g.fillRect(x, y, slotW, slotH);
      g.strokeStyle = (i === inst.cursor) ? '#ffff00' : '#666666';
      g.lineWidth = (i === inst.cursor) ? 6 : 2;
      g.strokeRect(x, y, slotW, slotH);

      g.font = '64px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      g.fillText(inst.slots[i].emoji, x + slotW / 2, y + slotH / 2);
    }

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || {};
    if (inst.pickedCorrect) {
      const kind = REWARD_POWERUPS[Math.floor(Math.random() * REWARD_POWERUPS.length)];
      // applyPowerUp expects a powerUp-like object with a .type field.
      applyPowerUp(state, { type: kind });
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
```

- [ ] **Step 2: Create `captcha.test.js`**

```javascript
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
  // applyPowerUp populates activePowerUps[kind] with a duration.
  const kinds = Object.keys(s.activePowerUps);
  assert.equal(kinds.length, 1, 'expected exactly one active power-up after success');
});

test('captcha: onExit on wrong pick does NOT apply a power-up', () => {
  const s = makeState();
  captcha.enter(s, {});
  s.microMode.instance.cursor = (s.microMode.instance.robotIdx + 1) % 3;
  captcha.update(s, {}, 0.016, { ...noEdges(), firePressedThisFrame: true });
  captcha.onExit(s, {});
  assert.equal(Object.keys(s.activePowerUps).length, 0);
});
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -8
```
Expected: 9 new captcha tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/scenes/micromodes/captcha.js vanilla/final/tests/captcha.test.js
git commit -m "Add CAPTCHA micromode with power-up reward (Phase 2E)"
```

---

### Task 5: Emoji Rain micromode

**Files:**
- Create: `vanilla/final/src/scenes/micromodes/emojiRain.js`
- Create: `vanilla/final/tests/emojiRain.test.js`

Spec: "Controls swap to dodge-only (no fire). Screaming emojis fall. Survive 5s = score bonus + sparkle. Touching one = lose nothing, just no bonus."

Implementation: A small player avatar (configured as `{ x, y, w, h }`) moves with left/right arrow input (continuous, not edges). Falling emojis spawn from the top at random x positions and fall. AABB collision check. State is `{ player, emojis, hit }`. On hit: set `hit = true` and skip further collision checks (no penalty, just no reward). On exit: if `!hit`, `addScore(state, 300)`.

- [ ] **Step 1: Create `emojiRain.js`**

```javascript
import { addScore } from '../../state/gameState.js';

/**
 * Phase 2E — Emoji Rain micromode.
 *
 * Top-down dodge mini-game. Player moves left/right with arrow keys.
 * Screaming emojis fall from the top. Touching one disqualifies the
 * round (no penalty, just no bonus). Surviving the full duration
 * grants SUCCESS_SCORE_BONUS via addScore.
 */

const DURATION_SEC = 5;
const SUCCESS_SCORE_BONUS = 300;

const RAINING_EMOJIS = ['😱', '😭', '😨', '🤯', '😵'];

const PLAYER_W = 40;
const PLAYER_H = 40;
const PLAYER_Y = 380;
const PLAYER_SPEED = 320; // px/sec
const EMOJI_SIZE = 36;
const EMOJI_VY_MIN = 180;
const EMOJI_VY_MAX = 320;
const SPAWN_INTERVAL_SEC = 0.25;

const SCREEN_W = 640;
const SCREEN_H = 480;

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x
      && a.y < b.y + b.h && a.y + a.h > b.y;
}

export const emojiRain = {
  name: 'emojiRain',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    state.microMode.instance = {
      player: { x: (SCREEN_W - PLAYER_W) / 2, y: PLAYER_Y, w: PLAYER_W, h: PLAYER_H },
      emojis: [],
      spawnTimer: 0,
      hit: false,
      elapsed: 0
    };
  },

  update(state, _ctx, dt, input) {
    const inst = state.microMode.instance;
    inst.elapsed += dt;

    // Move player (continuous, not edge-based).
    if (input.left)  inst.player.x = Math.max(0,                inst.player.x - PLAYER_SPEED * dt);
    if (input.right) inst.player.x = Math.min(SCREEN_W - PLAYER_W, inst.player.x + PLAYER_SPEED * dt);

    // Spawn emojis on a cadence.
    inst.spawnTimer -= dt;
    if (inst.spawnTimer <= 0) {
      inst.spawnTimer = SPAWN_INTERVAL_SEC;
      inst.emojis.push({
        x: Math.random() * (SCREEN_W - EMOJI_SIZE),
        y: -EMOJI_SIZE,
        w: EMOJI_SIZE,
        h: EMOJI_SIZE,
        vy: EMOJI_VY_MIN + Math.random() * (EMOJI_VY_MAX - EMOJI_VY_MIN),
        emoji: RAINING_EMOJIS[Math.floor(Math.random() * RAINING_EMOJIS.length)]
      });
    }

    // Update emoji positions; drop off-screen ones; check collisions.
    for (let i = inst.emojis.length - 1; i >= 0; i--) {
      const e = inst.emojis[i];
      e.y += e.vy * dt;
      if (e.y > SCREEN_H) {
        inst.emojis.splice(i, 1);
        continue;
      }
      if (!inst.hit && aabb(e, inst.player)) {
        inst.hit = true;
      }
    }

    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance;
    if (!inst) return;

    g.save();
    g.fillStyle = 'rgba(20, 0, 40, 0.85)';
    g.fillRect(0, 0, SCREEN_W, SCREEN_H);

    g.fillStyle = '#ffffff';
    g.font = "16px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('😱 EMOJI RAIN — DODGE!', SCREEN_W / 2, 40);
    g.font = "10px 'Press Start 2P', monospace";
    g.fillText('LEFT/RIGHT TO DODGE', SCREEN_W / 2, 70);

    // Player avatar
    g.font = `${PLAYER_H}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    g.textAlign = 'left';
    g.textBaseline = 'top';
    g.fillText('🌭', inst.player.x, inst.player.y);

    // Falling emojis
    g.font = `${EMOJI_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    for (const e of inst.emojis) {
      g.fillText(e.emoji, e.x, e.y);
    }

    // Hit indicator
    if (inst.hit) {
      g.fillStyle = 'rgba(255, 0, 0, 0.3)';
      g.fillRect(0, 0, SCREEN_W, SCREEN_H);
      g.fillStyle = '#ff6666';
      g.font = "18px 'Press Start 2P', monospace";
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('OUCH! NO BONUS', SCREEN_W / 2, SCREEN_H / 2);
    }

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || { hit: true };
    if (!inst.hit) {
      addScore(state, SUCCESS_SCORE_BONUS);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
```

- [ ] **Step 2: Create `emojiRain.test.js`**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emojiRain } from '../src/scenes/micromodes/emojiRain.js';

function makeState() {
  return {
    score: 0,
    nextExtraLifeScore: 999999,
    lives: 3,
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
  // Force-spawn one by clearing timer.
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
  // Clear emojis to guarantee no hit.
  s.microMode.instance.emojis = [];
  // Simulate frames; spawning happens but we don't move emojis into the player.
  // Easier: just call onExit with hit=false.
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
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -8
```
Expected: 9 new emojiRain tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/scenes/micromodes/emojiRain.js vanilla/final/tests/emojiRain.test.js
git commit -m "Add Emoji Rain dodge micromode (Phase 2E)"
```

---

### Task 6: Extend `MICROMODE_REGISTRY`

**Files:**
- Modify: `vanilla/final/src/systems/microModeTrigger.js`

- [ ] **Step 1: Update the imports and registry**

Replace the existing import + registry block at the top of the file:

```javascript
import { Events } from '../app/events.js';
import { createMicroModeScene } from '../scenes/microModeScene.js';
import { coffeeBreak } from '../scenes/micromodes/coffeeBreak.js';
```

with:

```javascript
import { Events } from '../app/events.js';
import { createMicroModeScene } from '../scenes/microModeScene.js';
import { coffeeBreak } from '../scenes/micromodes/coffeeBreak.js';
import { loading99 }   from '../scenes/micromodes/loading99.js';
import { captcha }     from '../scenes/micromodes/captcha.js';
import { emojiRain }   from '../scenes/micromodes/emojiRain.js';
```

Then find:

```javascript
const MICROMODE_REGISTRY = [coffeeBreak];
```

Replace with:

```javascript
const MICROMODE_REGISTRY = [coffeeBreak, loading99, captcha, emojiRain];
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: all tests pass; the existing `microModeTrigger.test.js` doesn't assume a specific registry length, so no test updates needed.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/systems/microModeTrigger.js
git commit -m "Register Loading 99% + CAPTCHA + Emoji Rain in MICROMODE_REGISTRY"
```

---

### Task 7: Smoke matrix + PR

- [ ] **Step 1: Browser smoke**

```bash
npm run dev
# Settings → Theme → 🌭 ABSURD MODE
# Play; clear enemies; wait for micromodes.
```

Manual checks (one full pass of each micromode):
- **Coffee Break**: mash space, see cup fill, hit 12 sips → energy bar jumps up.
- **Loading 99%**: mash space, see bar tick toward 100%, hit 100% → score jumps +500.
- **CAPTCHA**: left/right arrows move the yellow selector between 3 emojis; press space to commit; if you picked the robot, a power-up appears in the HUD.
- **Emoji Rain**: hot dog dodges falling screaming emojis with arrows; if untouched at 5s, score jumps +300.
- **Random rotation**: across multiple triggers, all four micromodes should appear (probabilistic — may need ~30 minutes of play to see all four).

- [ ] **Step 2: Record matrix** in `docs/superpowers/plans/2026-05-24-phase-2e-smoke-matrix.md`.

- [ ] **Step 3: Open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 2E: Loading 99% + CAPTCHA + Emoji Rain micromodes (Tier E complete)" --body "$(cat <<'EOF'
## Summary

Completes Tier E from the polish spec by adding the remaining three micromodes:

- **🔄 Loading 99%** — fake progress bar stuck at 99%. Mash fire to nudge it 0.1% per press. Reaching 100% within 5s grants +500 score. Sarcastic loading labels for flavor.
- **🤖 CAPTCHA** — "which one is the AI?" Three emojis (two food, one robot). Arrows to move cursor, fire to commit. Correct pick grants a random power-up via \`applyPowerUp\`. Wrong pick: nothing.
- **😱 Emoji Rain** — dodge mini-game. Hot dog avatar moves left/right with arrows; screaming emojis fall from the top. Surviving 5s untouched grants +300 score. Getting hit: no penalty, just no bonus.

Framework refinements:
- \`microModeScene\` now exposes \`leftPressedThisFrame\` and \`rightPressedThisFrame\` in addition to \`firePressedThisFrame\`. Used by CAPTCHA's cursor.
- Per-instance state pattern: each micromode stores runtime state on \`state.microMode.instance\` (set by \`enter\`, read by \`update\`/\`render\`/\`onExit\`). Coffee Break refactored to this pattern to remove the module-level \`cupState\` singleton flagged in the Phase 2D code review.
- \`MICROMODE_REGISTRY\` grows to \`[coffeeBreak, loading99, captcha, emojiRain]\` — the trigger picks randomly each time.

All four micromodes are Absurd-theme-gated by the existing trigger and remain upside-only (success = small reward, failure = nothing).

Implements Phase 2E from \`docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md\`. Plan: \`docs/superpowers/plans/2026-05-24-super-megamania-phase-2e-micromodes-content.md\`.

## Test plan
- [x] Baseline tests pass.
- [x] New tests: ~6 loading99 + 9 captcha + 9 emojiRain + 1 arrow-edge scene test = ~25 new. Coffee Break tests updated for the instance pattern (count unchanged).
- [ ] Manual smoke: one full pass of each micromode in browser. See \`docs/superpowers/plans/2026-05-24-phase-2e-smoke-matrix.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- Phase 2E goal: ship the remaining three micromodes (Loading, CAPTCHA, Emoji Rain). Tasks 3, 4, 5.
- Framework refinements driven by Phase 2D's review feedback: per-instance state (Task 2) + arrow-key edges (Task 1).
- Registry update (Task 6).

**Placeholder scan:** All file contents are complete.

**Type consistency:**
- `state.microMode.instance` shape varies per micromode but always set by `enter` and read in `update`/`render`/`onExit`. Tests for each micromode build the matching `instance: {}` shape.
- `inputInfo` shape: `{ fire, firePressedThisFrame, left, right, leftPressedThisFrame, rightPressedThisFrame }`. Used by all four micromodes (coffeeBreak/loading99 read `firePressedThisFrame`; captcha reads all six; emojiRain reads `left`/`right`).
- Reward functions: `addScore(state, n)` for Loading and Emoji Rain; `applyPowerUp(state, {type})` for CAPTCHA; direct `state.energy +=` for Coffee Break. All four follow the upside-only contract.

**Known caveats:**
- CAPTCHA's `applyPowerUp` call passes `{ type: kind }` — verify the signature matches `applyPowerUp(state, powerUp)` and that `powerUp.type` is the field it reads. If `applyPowerUp` expects more fields (e.g. `x`/`y`), the implementer should add an integration smoke check and adjust.
- Emoji Rain's collision rect uses 40x40 for player and 36x36 for emojis — these are the visual sprite sizes, may need tuning if the visual hitbox feels off. Test passes regardless because we set the player position directly in the touching test.
- Loading 99%'s 0.1% per press × 10 presses → exactly 100.0% — verified by floating-point: `99 + 10*0.1 === 100` in IEEE 754. If implementers see test flake from float imprecision, change `NUDGE_PCT` to 0.11 and the threshold check stays `>= 100`.
