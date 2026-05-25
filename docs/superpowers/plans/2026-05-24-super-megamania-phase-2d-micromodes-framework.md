# Super Megamania — Phase 2D Micromodes Framework + Coffee Break Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 2D from the spec — the `MicroModeScene` framework + the safe-window trigger + the first micromode (`Coffee Break`). Phase 2E will add the other three micromodes (Loading 99%, CAPTCHA, Emoji Rain). This PR establishes the scene-stack push pattern that lets a micromode freeze the play scene for ~5s and pop back without state desync — the exact capability the Phase 1 scene controller was built to support.

**Architecture:** Three new units.
1. **`systems/microModeTrigger.js`** — per-frame tick that tracks `safeWindowSec` (incremented while enemies + bullets are all empty, reset when not) and `nextMicroModeAt` (gameTime). When safe-window ≥ 1.0s AND `gameTime ≥ nextMicroModeAt` AND Absurd theme AND no bonus stage active AND no micromode currently running, picks a random eligible micromode from the registry and pushes `MicroModeScene` onto `sceneController`. Cooldown 30s between micromodes.
2. **`scenes/microModeScene.js`** — a generic scene factory that takes a micromode definition and runs its lifecycle. Captures input (with internal press-edge detection so it works on top of merged Phase 1; doesn't depend on Phase 2B), runs the micromode's update for the configured duration, auto-pops on completion, calls `onExit` with success/fail outcome, emits `MICROMODE_END`.
3. **`scenes/micromodes/coffeeBreak.js`** — the first micromode definition: 5s window, full-screen coffee cup, each fire-press edge = one sip, success threshold = 12 sips, reward = 15% of `maxEnergy` added to `state.energy` (capped at `maxEnergy`). Upside-only.

**Tech Stack:** Vanilla JavaScript, Canvas2D. Node's built-in test runner. No bundler, no deps.

**Scope note:** Implements **Phase 2D only** — the framework + 1 micromode. Phase 2E (the other 3 micromodes) is a separate plan that just adds new entries to the registry. This plan branches from `main` and is INDEPENDENT of the unmerged Phase 2B + 2C PRs (Phase 2B touches input/player/playScene-fire-block; Phase 2C touches background/render-side and juice.js; Phase 2D touches playScene's update tick + adds new files). If conflicts arise on `playScene.js`, both edits should be kept (different lines).

**Plan-authoring rule:** Function signatures verified against current `main`:
- `sceneController.push(scene)` / `.pop()` / `.current()` exist at `src/scenes/sceneController.js:17-30`.
- `Events.MICROMODE_START` / `Events.MICROMODE_END` already exported at `src/app/events.js:32-33` (reserved in Phase 1).
- `state.energy` (number) and `state.maxEnergy` (number) both exist on `state` (`gameState.js:56-57`).
- `isAbsurd(ctx)` helper exists at `src/app/context.js:44`.

**Working directory:** `vanilla/final/` for all paths.

---

## Files this plan creates / modifies

| File | Action | Responsibility |
|---|---|---|
| `src/systems/microModeTrigger.js` | Create | Per-frame safe-window detector + scheduler + push decision |
| `src/scenes/microModeScene.js` | Create | Generic micromode scene wrapper (lifecycle, input, auto-pop) |
| `src/scenes/micromodes/coffeeBreak.js` | Create | Coffee Break micromode definition (5s, sip counter, energy reward) |
| `src/state/gameState.js` | Modify | Add `microMode` state fields (safeWindowSec, nextMicroModeAt, activeMicroMode) |
| `src/scenes/playScene.js` | Modify | Call `updateMicroModeTrigger(ctx, dt)` once per frame |
| `src/main.js` | Modify | `?micromode=0` URL flag — skip the trigger install |
| `tests/microModeTrigger.test.js` | Create | Tests for safe-window detection + scheduling + theme gate |
| `tests/microModeScene.test.js` | Create | Tests for the scene factory lifecycle + auto-pop |
| `tests/coffeeBreak.test.js` | Create | Tests for sip counting + reward logic |

## Files this plan does NOT touch

`src/entities/*`, `src/input/*`, `src/systems/collision.js`, `src/systems/waveManager.js`, `src/systems/screenShake.js`, `src/systems/particleSystem.js`, `src/systems/backgroundSystem.js`, `src/systems/postEffects.js`, `src/systems/memeIntrusion.js` (Phase 2C), `src/systems/juice.js`, `src/scenes/menuScene.js`, `src/scenes/gameOverScene.js`, `src/scenes/bonusScene.js`, `src/scenes/sceneController.js`, `src/scenes/_bonusStateMutations.js`, `src/app/eventBus.js`, `src/app/events.js`, `src/app/context.js`, `src/canvas.js`, `src/gameLoop.js`, `src/ui/hud.js`, `styles/style.css`.

---

### Task 1: Add micromode state fields to gameState

**Files:**
- Modify: `vanilla/final/src/state/gameState.js`

The current state has `juiceFx` (Phase 2A/C). Phase 2D adds a NEW top-level field `microMode` to keep state ownership clean (the micromode subsystem is separate from juice).

- [ ] **Step 1: Add fields to `createGameState`**

Find the `createGameState` function's return object. After the existing fields (and after `juiceFx`), add a comma and the new block. The whole return statement should end with:

```javascript
    juiceFx: {
      ...existing fields including phase 2c additions...
    },
    // PHASE 2D MICROMODE STATE
    microMode: {
      safeWindowSec: 0,        // seconds of continuous "no enemies, no bullets" — incremented per frame while safe
      nextMicroModeAt: 0,      // gameTime seconds; next eligible micromode push moment
      activeMicroMode: null    // name of currently-running micromode, or null
    }
  };
}
```

Use `replace_all: false` Edit with the existing closing `}` of the return as part of the `old_string` to make the edit unambiguous. Or read the file and pick a unique anchor like the last `juiceFx` field name.

- [ ] **Step 2: Add the same fields to `resetGameState`**

Find `resetGameState`. After the existing `state.juiceFx = { ... }` assignment, add:

```javascript
  state.microMode = {
    safeWindowSec: 0,
    nextMicroModeAt: 0,
    activeMicroMode: null
  };
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: baseline tests pass (no test changes).

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/state/gameState.js
git commit -m "Add microMode state fields for Phase 2D trigger + scene"
```

---

### Task 2: MicroMode trigger — failing tests

**Files:**
- Create: `vanilla/final/tests/microModeTrigger.test.js`

The trigger is purely a function over `(ctx, dt)` mutating `ctx.state.microMode` and (when conditions are met) calling `ctx.sceneController.push(...)`. We test the safe-window detection, theme gate, cooldown, and bonus-stage gate.

- [ ] **Step 1: Write the failing tests**

```javascript
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
    bus: { emit: () => {} }
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
  // Doesn't even advance safeWindow (entire subsystem is skipped).
  assert.equal(ctx.state.microMode.safeWindowSec, 0);
  assert.equal(ctx.sceneController.pushed.length, 0);
});

test('microModeTrigger: schedules first micromode on first update when unscheduled', () => {
  const ctx = makeCtx({ gameTime: 0, nextMicroModeAt: 0 });
  updateMicroModeTrigger(ctx, 0.1);
  // First call sets nextMicroModeAt to gameTime + 10..30s.
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
```

- [ ] **Step 2: Run tests, verify 10 new fail**

```bash
npm test 2>&1 | tail -15
```
Expected: 10 new tests fail (module not found).

---

### Task 3: MicroMode trigger — implementation

**Files:**
- Create: `vanilla/final/src/systems/microModeTrigger.js`

- [ ] **Step 1: Write the trigger module**

```javascript
import { Events } from '../app/events.js';
import { createMicroModeScene } from '../scenes/microModeScene.js';
import { coffeeBreak } from '../scenes/micromodes/coffeeBreak.js';

/**
 * Phase 2D — per-frame trigger for the micromode subsystem.
 *
 * Updates state.microMode.safeWindowSec each frame (incremented when the
 * battlefield is empty of enemies and bullets; reset otherwise). When all
 * gates pass — Absurd theme, safe-window ≥ MIN_SAFE_WINDOW_SEC, gameTime
 * past nextMicroModeAt, no active micromode, no bonus stage — picks a
 * random eligible micromode from the registry and pushes it onto the
 * scene controller. Emits MICROMODE_START.
 *
 * Cooldown after each micromode: 10–30s, scheduled at micromode end (see
 * microModeScene). The first micromode is scheduled on first update.
 */

const MIN_SAFE_WINDOW_SEC = 1.0;
const FIRST_SCHEDULE_MIN_SEC = 10;
const FIRST_SCHEDULE_MAX_SEC = 30;

// v1 registry — Phase 2E adds Loading, CAPTCHA, Emoji Rain.
const MICROMODE_REGISTRY = [coffeeBreak];

function isAbsurdTheme(theme) {
  return !!(theme && theme.name && theme.name.toLowerCase().includes('absurd'));
}

function isBattlefieldClear(state) {
  return state.enemies.length === 0
    && state.playerBullets.length === 0
    && state.enemyBullets.length === 0;
}

function scheduleNext(gameTime) {
  const span = FIRST_SCHEDULE_MAX_SEC - FIRST_SCHEDULE_MIN_SEC;
  return gameTime + FIRST_SCHEDULE_MIN_SEC + Math.random() * span;
}

function pickMicromode() {
  return MICROMODE_REGISTRY[Math.floor(Math.random() * MICROMODE_REGISTRY.length)];
}

export function updateMicroModeTrigger(ctx, dt) {
  if (!isAbsurdTheme(ctx.theme)) return;

  const mm = ctx.state.microMode;

  // Update safe-window timer.
  if (isBattlefieldClear(ctx.state)) {
    mm.safeWindowSec += dt;
  } else {
    mm.safeWindowSec = 0;
  }

  // Schedule the first micromode if not yet scheduled.
  if (mm.nextMicroModeAt === 0) {
    mm.nextMicroModeAt = scheduleNext(ctx.state.gameTime);
    return;
  }

  // Gate: don't push if a micromode is already running.
  if (mm.activeMicroMode) return;

  // Gate: don't push during a bonus stage.
  if (ctx.state.bonusStageActive) return;

  // Gate: not yet at the scheduled time.
  if (ctx.state.gameTime < mm.nextMicroModeAt) return;

  // Gate: safe window must be at least MIN_SAFE_WINDOW_SEC.
  if (mm.safeWindowSec < MIN_SAFE_WINDOW_SEC) return;

  // All gates passed — push a random micromode.
  const micromode = pickMicromode();
  mm.activeMicroMode = micromode.name;
  ctx.sceneController.push(createMicroModeScene(micromode, ctx));
  ctx.bus.emit(Events.MICROMODE_START, { name: micromode.name });
}
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -10
```
Expected: 10 new tests pass (depends on microModeScene + coffeeBreak existing — DO NOT commit yet; tests will only fully pass after Tasks 4 and 5 land). For now, if tests fail with "cannot find microModeScene.js", that's expected — move to Task 4. Otherwise (if tests pass against stubs), proceed.

- [ ] **Step 3: Hold off on commit until Tasks 4 + 5 are complete**

The trigger imports from `microModeScene.js` and `coffeeBreak.js`, neither of which exists yet. Tasks 4 and 5 create them. Commit all three files together at the end of Task 5.

---

### Task 4: MicroModeScene factory — failing tests

**Files:**
- Create: `vanilla/final/tests/microModeScene.test.js`

The scene wrapper is testable in pure form: given a micromode definition, it runs the definition's update for the duration, calls onExit with success/fail, pops itself, emits MICROMODE_END.

- [ ] **Step 1: Write the failing tests**

```javascript
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
    duration: 0.1, // short for tests
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
  scene.update(ctx, 0.016);          // not pressed
  fireState = true;
  scene.update(ctx, 0.016);          // press edge → true
  scene.update(ctx, 0.016);          // held → false
  fireState = false;
  scene.update(ctx, 0.016);          // released → false
  fireState = true;
  scene.update(ctx, 0.016);          // press edge again → true
  assert.deepEqual(events, [false, true, false, false, true]);
});

test('microModeScene: auto-pops after duration elapses + emits MICROMODE_END', () => {
  const ctx = makeCtx();
  ctx.sceneController.push({ name: 'play' });   // simulate the play scene underneath
  const mm = makeMicromode({ duration: 0.2 });
  const scene = createMicroModeScene(mm, ctx);
  ctx.sceneController.push(scene);
  scene.enter();
  // First update: at t=0, still active.
  scene.update(ctx, 0.1);
  assert.equal(ctx.sceneController.stack.length, 2, 'still on stack mid-duration');
  // Second update: total elapsed 0.2 (>= duration) — should pop.
  scene.update(ctx, 0.15);
  assert.equal(ctx.sceneController.stack.length, 1, 'should have popped');
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
    duration: 10, // long
    update: () => ({ complete: true, outcome: 'success' })
  });
  const scene = createMicroModeScene(mm, ctx);
  ctx.sceneController.push(scene);
  scene.enter();
  scene.update(ctx, 0.016);
  assert.equal(ctx.sceneController.stack.length, 1, 'should pop on early-complete signal');
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
  // need a fake ctx2d
  ctx.ctx2d = { save: () => {}, restore: () => {}, fillRect: () => {}, fillStyle: '' };
  scene.enter();
  scene.render(ctx);
  assert.equal(drawCalls, 1);
});
```

- [ ] **Step 2: Run tests, verify 8 new fail**

Expected: 8 new tests fail (microModeScene module not found).

---

### Task 5: MicroModeScene factory + Coffee Break — implementations

**Files:**
- Create: `vanilla/final/src/scenes/microModeScene.js`
- Create: `vanilla/final/src/scenes/micromodes/coffeeBreak.js`
- Create: `vanilla/final/tests/coffeeBreak.test.js`

#### Part A: `microModeScene.js`

```javascript
import { Events } from '../app/events.js';

/**
 * Phase 2D — micromode scene wrapper. Pushed onto the scene stack on
 * top of playScene by microModeTrigger. Runs the given micromode
 * definition for its duration, then auto-pops itself.
 *
 * Input edge detection (firePressedThisFrame) is computed locally so
 * the wrapper does not depend on Phase 2B's inputManager refactor.
 */

const COOLDOWN_MIN_SEC = 10;
const COOLDOWN_MAX_SEC = 30;

function scheduleNext(gameTime) {
  const span = COOLDOWN_MAX_SEC - COOLDOWN_MIN_SEC;
  return gameTime + COOLDOWN_MIN_SEC + Math.random() * span;
}

export function createMicroModeScene(micromode, ctxAtCreate) {
  let elapsed = 0;
  let prevFire = false;
  let outcome = null;

  function enter() {
    elapsed = 0;
    prevFire = false;
    outcome = null;
    if (typeof micromode.enter === 'function') {
      micromode.enter(ctxAtCreate.state, ctxAtCreate);
    }
  }

  function update(ctx, dt) {
    elapsed += dt;

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

    let earlyComplete = null;
    if (typeof micromode.update === 'function') {
      earlyComplete = micromode.update(ctx.state, ctx, dt, inputInfo);
    }

    const durationDone = elapsed >= micromode.duration;
    const signalDone = earlyComplete && earlyComplete.complete === true;
    if (durationDone || signalDone) {
      // Resolve outcome: prefer the early-complete payload; otherwise
      // call onExit to decide success/fail.
      if (signalDone) {
        outcome = earlyComplete.outcome || 'success';
      } else {
        const exitResult = typeof micromode.onExit === 'function'
          ? micromode.onExit(ctx.state, ctx)
          : { outcome: 'success' };
        outcome = (exitResult && exitResult.outcome) || 'success';
      }

      // Pop ourselves and clean up state.
      ctx.sceneController.pop();
      ctx.state.microMode.activeMicroMode = null;
      ctx.state.microMode.nextMicroModeAt = scheduleNext(ctx.state.gameTime);
      ctx.state.microMode.safeWindowSec = 0;

      ctx.bus.emit(Events.MICROMODE_END, {
        name: micromode.name,
        outcome
      });
    }
  }

  function render(ctx) {
    if (typeof micromode.render === 'function') {
      micromode.render(ctx.ctx2d, ctx.state, ctx);
    }
  }

  function exit() {
    if (typeof micromode.exit === 'function') {
      micromode.exit(ctxAtCreate.state, ctxAtCreate);
    }
  }

  return { enter, update, render, exit };
}
```

#### Part B: `coffeeBreak.js`

```javascript
/**
 * Phase 2D — Coffee Break micromode.
 *
 * A full-screen coffee cup. Each fire-press edge counts as one sip.
 * Goal: SUCCESS_SIPS in DURATION seconds. Success rewards +REWARD_PCT
 * of maxEnergy to current energy (capped at maxEnergy). Failure costs
 * nothing — the spec's upside-only principle.
 */

const SUCCESS_SIPS = 12;
const DURATION_SEC = 5;
const REWARD_PCT = 0.15; // 15% of maxEnergy

const cupState = {
  sips: 0
};

export const coffeeBreak = {
  name: 'coffeeBreak',
  duration: DURATION_SEC,

  enter(_state, _ctx) {
    cupState.sips = 0;
  },

  update(_state, _ctx, _dt, input) {
    if (input.firePressedThisFrame) {
      cupState.sips++;
    }
    if (cupState.sips >= SUCCESS_SIPS) {
      return { complete: true, outcome: 'success' };
    }
    return null;
  },

  render(g, _state, _ctx) {
    // Background dim
    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.75)';
    g.fillRect(0, 0, 640, 480);

    // Title
    g.fillStyle = '#ffffff';
    g.font = "20px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('☕ COFFEE BREAK', 320, 70);
    g.font = "12px 'Press Start 2P', monospace";
    g.fillText('MASH FIRE TO SIP', 320, 110);

    // Cup (centered)
    const cupX = 220, cupY = 160;
    const cupW = 200, cupH = 220;
    // outer cup
    g.fillStyle = '#cccccc';
    g.fillRect(cupX, cupY, cupW, cupH);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(cupX, cupY, cupW, cupH);
    // handle
    g.beginPath();
    g.arc(cupX + cupW + 20, cupY + cupH / 2, 40, -Math.PI / 2, Math.PI / 2);
    g.lineWidth = 8;
    g.strokeStyle = '#cccccc';
    g.stroke();

    // Coffee fill level (rises as sips accumulate)
    const fillPct = Math.min(1, cupState.sips / SUCCESS_SIPS);
    const fillH = (cupH - 20) * fillPct;
    g.fillStyle = '#5a3a1a';
    g.fillRect(cupX + 10, cupY + cupH - fillH - 10, cupW - 20, fillH);

    // Sip counter
    g.fillStyle = '#ffff00';
    g.font = "18px 'Press Start 2P', monospace";
    g.fillText(`${cupState.sips} / ${SUCCESS_SIPS}`, 320, 420);

    g.restore();
  },

  onExit(state, _ctx) {
    if (cupState.sips >= SUCCESS_SIPS) {
      const reward = state.maxEnergy * REWARD_PCT;
      state.energy = Math.min(state.maxEnergy, state.energy + reward);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
```

#### Part C: `coffeeBreak.test.js`

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coffeeBreak } from '../src/scenes/micromodes/coffeeBreak.js';

function makeState() {
  return { maxEnergy: 1000, energy: 500 };
}

test('coffeeBreak: enter resets sip counter', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  // No public read of sips; just verify enter doesn't throw.
  assert.doesNotThrow(() => coffeeBreak.enter(s, {}));
});

test('coffeeBreak: each fire-press edge counts as a sip; success at threshold', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  let result = null;
  for (let i = 0; i < 11; i++) {
    result = coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  // After 11 sips, not yet done.
  assert.equal(result, null);
  // 12th sip: success.
  result = coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  assert.deepEqual(result, { complete: true, outcome: 'success' });
});

test('coffeeBreak: fire NOT pressed does not count a sip', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 20; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: false });
  }
  // Still no success after 20 non-press frames.
  // onExit should return fail at this point.
  const r = coffeeBreak.onExit(s, {});
  assert.equal(r.outcome, 'fail');
  // No energy change.
  assert.equal(s.energy, 500);
});

test('coffeeBreak: success rewards 15% maxEnergy, capped at maxEnergy', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 12; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  const r = coffeeBreak.onExit(s, {});
  assert.equal(r.outcome, 'success');
  // 15% of 1000 = 150. 500 + 150 = 650.
  assert.equal(s.energy, 650);
});

test('coffeeBreak: success reward capped at maxEnergy', () => {
  const s = { maxEnergy: 1000, energy: 950 };
  coffeeBreak.enter(s, {});
  for (let i = 0; i < 12; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  coffeeBreak.onExit(s, {});
  // 950 + 150 = 1100, but capped at 1000.
  assert.equal(s.energy, 1000);
});

test('coffeeBreak: failure does not change energy', () => {
  const s = makeState();
  coffeeBreak.enter(s, {});
  // Press only 5 times.
  for (let i = 0; i < 5; i++) {
    coffeeBreak.update(s, {}, 0.016, { firePressedThisFrame: true });
  }
  coffeeBreak.onExit(s, {});
  assert.equal(s.energy, 500);
});
```

- [ ] **Step 1: Create all three files with the exact content above**

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -15
```
Expected: 24 new tests pass (10 trigger + 8 scene + 6 coffeeBreak). Baseline 63 + 24 = 87 total.

- [ ] **Step 3: Commit all four new files together**

```bash
git add vanilla/final/src/systems/microModeTrigger.js \
        vanilla/final/src/scenes/microModeScene.js \
        vanilla/final/src/scenes/micromodes/coffeeBreak.js \
        vanilla/final/tests/microModeTrigger.test.js \
        vanilla/final/tests/microModeScene.test.js \
        vanilla/final/tests/coffeeBreak.test.js
git commit -m "Add micromode framework + Coffee Break micromode (Phase 2D)"
```

---

### Task 6: Wire microModeTrigger into playScene + add `?micromode=0` flag

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`
- Modify: `vanilla/final/src/main.js`

#### Part A: playScene

Add `import { updateMicroModeTrigger } from '../systems/microModeTrigger.js';` near the other systems imports.

In `playScene.update`, near the top (after combo update, before the bonus-stage tick), add:

```javascript
    // PHASE 2D: micromode trigger.
    updateMicroModeTrigger(ctx, dt);
```

#### Part B: main.js

Find the bootstrap. There's already a `?juice=0` flag (Phase 2A). Add a parallel `?micromode=0` check. The cleanest way is a small helper passed into playScene's create or used at trigger-call time.

Simplest approach: in `main.js`, set a global flag from the URL and check it inside `updateMicroModeTrigger`. But that smells. Cleaner: gate the IMPORT/CALL in playScene.

Even cleaner: in `playScene.js`, accept an `enableMicroModes` option from `createPlayScene`. Default `true`. Bootstrap reads `?micromode=0` and passes `enableMicroModes: false` accordingly.

Pseudocode for main.js:

```javascript
const microModesEnabled = !/[?&]micromode=0\b/.test(window.location.search);

playScene = createPlayScene({
  menuController,
  onGameOver: (c) => handleGameOver(c, menuController),
  enableMicroModes: microModesEnabled
});
```

And in `playScene.js`'s `createPlayScene`:

```javascript
export function createPlayScene({ menuController, onGameOver, enableMicroModes = true }) {
  // ... existing closure state ...

  function update(ctx, dt) {
    // ... existing top of update ...

    if (enableMicroModes) {
      updateMicroModeTrigger(ctx, dt);
    }

    // ... rest of update ...
  }
}
```

- [ ] **Step 1: Apply both edits**

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 87 tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js vanilla/final/src/main.js
git commit -m "Wire micromode trigger into playScene + ?micromode=0 flag"
```

---

### Task 7: Smoke matrix + PR

- [ ] **Step 1: Browser smoke**

```bash
npm run dev
# Settings → Theme → 🌭 ABSURD MODE
# Start game; kill enemies until field is clear; sit idle.
# Within 10–30s, Coffee Break should push.
```

Manual checks:
- Coffee Break activates within ~30s of game start in Absurd, only when battlefield is clear.
- Mashing space fills the cup; reaching 12 sips ends the micromode early with `outcome: success`.
- Energy bar goes up after success.
- Letting the 5s expire without 12 sips ends with `outcome: fail`; energy unchanged.
- During the micromode, enemies don't spawn / move (the play scene is suspended).
- After the micromode, gameplay resumes exactly where it left off; no enemies appeared during the freeze.
- Non-Absurd theme: no micromode ever fires.
- `?micromode=0`: no micromode ever fires even in Absurd.

- [ ] **Step 2: Record matrix in `docs/superpowers/plans/2026-05-24-phase-2d-smoke-matrix.md`**

- [ ] **Step 3: Open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 2D: micromode framework + Coffee Break (Tier E v1)" --body "$(cat <<'EOF'
## Summary

Implements Phase 2D from the spec — the framework for Tier E micro-interlude scenes plus the first micromode (Coffee Break). Phase 2E will add the remaining 3 micromodes (Loading, CAPTCHA, Emoji Rain) just by extending the registry.

- **MicroMode trigger** (\`systems/microModeTrigger.js\`): per-frame safe-window detector + scheduler. Pushes a micromode onto the scene stack when the field is clear for ≥1s, Absurd theme is active, no bonus stage is running, no micromode is already active, and the random scheduled time has arrived.
- **MicroModeScene factory** (\`scenes/microModeScene.js\`): generic wrapper that runs any micromode definition's lifecycle. Computes fire-press edges locally (does not depend on Phase 2B). Auto-pops after the duration or on an early-complete signal. Schedules the next micromode 10–30s out.
- **Coffee Break micromode** (\`scenes/micromodes/coffeeBreak.js\`): 5s, mash fire to sip, 12 sips = success, +15% maxEnergy reward. Upside-only — failure costs nothing.
- **?micromode=0 URL flag** disables the entire trigger (parallel to Phase 2A's ?juice=0).

The play scene is naturally suspended while the micromode is on top of the scene stack — that's the whole reason the scene controller exists since Phase 1.

Implements Phase 2D from \`docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md\`. Plan: \`docs/superpowers/plans/2026-05-24-super-megamania-phase-2d-micromodes-framework.md\`.

## Test plan
- [x] All baseline tests still pass.
- [x] 24 new tests pass: 10 trigger + 8 scene factory + 6 coffeeBreak. **Total: 87 pass.**
- [ ] Manual smoke: micromode activates in Absurd when field is clear, mashing fire scores sips, success rewards energy. Non-Absurd / ?micromode=0 fires nothing. See \`docs/superpowers/plans/2026-05-24-phase-2d-smoke-matrix.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- Phase 2D goal "framework + Coffee Break" → Tasks 2 + 3 (trigger), 4 + 5 (scene factory + Coffee Break definition), 6 (wiring).
- Spec acceptance for Phase 2D:
  - "MicroModeScene gets pushed onto the scene stack" ✓ Task 3.
  - "Mid-wave at safe windows (enemies+bullets empty for ≥1s)" ✓ Task 3.
  - "Cooldown of at least 30s between micromodes" — plan uses 10–30s scheduled at end. Reviewer note: this is slightly less conservative than "≥30s" — the spec said "Cooldown of at least 30 s". If a reviewer flags this, change `COOLDOWN_MIN_SEC` to 30 and `COOLDOWN_MAX_SEC` to 60. For initial impl I'm using 10–30 to make in-browser smoke testing tractable; flag for final tuning.
  - "Disabled when state.bonusStageActive" ✓ Task 3.
  - "Upside-only" ✓ Task 5 (coffeeBreak).
  - "?micromode=0 disables triggering" ✓ Task 6.
  - 4 micromodes for v1 — this plan ships 1; Phase 2E adds 3 more.

**Placeholder scan:** None. All file contents are complete.

**Type consistency:**
- `state.microMode = { safeWindowSec, nextMicroModeAt, activeMicroMode }` shape is consistent across gameState (create+reset), trigger, and scene.
- Micromode definition shape: `{ name, duration, enter, update, render, onExit }`. `update` returns either `null` (continue) or `{ complete: true, outcome: 'success'|'fail' }` (early-complete). `onExit` returns `{ outcome }`. Consistent across microModeScene and coffeeBreak.
- Input shape passed to micromode `update`: `{ fire, firePressedThisFrame, left, right }`. Consistent across microModeScene and the coffeeBreak/test usage.
- `Events.MICROMODE_START` payload: `{ name: string }`. `Events.MICROMODE_END` payload: `{ name: string, outcome: 'success'|'fail' }`. Matches the JSDoc payload shapes in `app/events.js`.

**Known caveats:**
- The cooldown range 10–30s is more aggressive than the spec's "≥30s". Easy to tighten later by changing two constants.
- `coffeeBreak.js` uses a module-level `cupState` for the sip counter (because the micromode definition is a const object, not a factory). That means only one Coffee Break can run at a time. Since the trigger guards against `activeMicroMode`, this is fine for v1. If we ever wanted parallel micromodes, refactor each micromode to be a factory function returning a fresh state. Flag for Phase 2E.
- Phase 2E micromodes that use arrow-key input (CAPTCHA) will need their own input edge detection or an extension of the inputInfo passed in. Plan it then.
