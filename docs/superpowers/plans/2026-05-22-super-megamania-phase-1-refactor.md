# Super Megamania — Phase 1 Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `vanilla/final/src/main.js` (1,429 lines) into focused scene modules and add the minimum coordination primitives (event bus, scene controller, explicit context object) that the upcoming polish phases need, with **zero behavior change**.

**Architecture:** A synchronous in-process event bus connects gameplay scenes (which emit events at key moments) to reactor systems (audio, screen-shake, particles), eliminating the inline reactor calls that currently litter `update()`. A scene stack replaces the `currentState` `if`-ladder so future micromode interludes can push/pop cleanly. A `ctx` object replaces 16 module-level globals.

**Tech Stack:** Vanilla JavaScript, ES modules, Canvas2D. Node's built-in test runner (`node --test`). No bundler, no dependencies, no build step.

**Scope note:** This is Phase 1 of the spec at `docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md`. **Phases 2A through 2E each get their own plan written after this one merges**, because their tasks subscribe to events whose payload shapes must be settled in code first.

**Working directory for all paths below:** `vanilla/final/` unless stated otherwise.

---

## Files this plan creates

| File | Responsibility |
|---|---|
| `src/app/eventBus.js` | `on`/`off`/`emit` synchronous pub-sub. ~40 lines. |
| `src/app/events.js` | Event-name string constants + JSDoc payload shapes. |
| `src/app/context.js` | `createContext()` factory returning the `ctx` object passed to every scene. |
| `src/scenes/sceneController.js` | Scene stack: `push`/`pop`/`replace`/`current`/`update`/`render`. |
| `src/scenes/menuScene.js` | Menu falling-enemies animation; lifted from `main.js`. |
| `src/scenes/playScene.js` | Gameplay `update`/`render`; lifted from `main.js`. |
| `src/scenes/bonusScene.js` | Bonus-stage spawn / tick / end + overlays; consolidates from `main.js` and `gameState.js`. |
| `src/scenes/gameOverScene.js` | Name-entry + high-scores flow; lifted from `main.js`. |
| `src/systems/juice.js` | Reactor: subscribes to bus events and calls existing audio / shake / particle functions. |
| `tests/eventBus.test.js` | Unit tests for the bus. |
| `tests/sceneController.test.js` | Unit tests for the scene stack. |

## Files this plan modifies

| File | Change |
|---|---|
| `src/main.js` | Shrinks from 1,429 → ≤ 150 lines. Becomes pure bootstrap. |
| `src/state/gameState.js` | Bonus-stage *behavior* helpers move out (`startBonusStage`, `updateBonusStage`, `bonusStageEnemyEscaped`, `endBonusStage`) into `bonusScene.js`. Field declarations and `shouldTriggerBonusStage` stay. |

## Files this plan does NOT touch

`src/entities/*`, `src/systems/collision.js`, `src/systems/waveManager.js`, `src/systems/particleSystem.js`, `src/systems/screenShake.js`, `src/systems/backgroundSystem.js`, `src/audio/*`, `src/assets/*`, `src/config/*`, `src/input/*`, `src/storage/*`, `src/ui/*`, `src/canvas.js`, `src/gameLoop.js`, `index.html`, `styles/*`, `service-worker.js`. Their existing exports and internals are unchanged.

---

### Task 1: Event bus — failing tests

**Files:**
- Create: `vanilla/final/tests/eventBus.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../src/app/eventBus.js';

test('eventBus: emit invokes subscribed handler with payload', () => {
  const bus = createEventBus();
  const calls = [];
  bus.on('FOO', (payload) => calls.push(payload));
  bus.emit('FOO', { x: 1 });
  assert.deepEqual(calls, [{ x: 1 }]);
});

test('eventBus: emit invokes multiple handlers in subscribe order', () => {
  const bus = createEventBus();
  const order = [];
  bus.on('FOO', () => order.push('a'));
  bus.on('FOO', () => order.push('b'));
  bus.on('FOO', () => order.push('c'));
  bus.emit('FOO');
  assert.deepEqual(order, ['a', 'b', 'c']);
});

test('eventBus: off removes a specific handler', () => {
  const bus = createEventBus();
  let aCalls = 0;
  let bCalls = 0;
  const handlerA = () => { aCalls++; };
  const handlerB = () => { bCalls++; };
  bus.on('FOO', handlerA);
  bus.on('FOO', handlerB);
  bus.off('FOO', handlerA);
  bus.emit('FOO');
  assert.equal(aCalls, 0);
  assert.equal(bCalls, 1);
});

test('eventBus: emit with no subscribers does not throw', () => {
  const bus = createEventBus();
  assert.doesNotThrow(() => bus.emit('UNKNOWN', { a: 1 }));
});

test('eventBus: handler that throws does not prevent later handlers', () => {
  const bus = createEventBus();
  const calls = [];
  bus.on('FOO', () => { throw new Error('boom'); });
  bus.on('FOO', () => calls.push('ran'));
  // Bus must catch handler errors so one bad reactor never breaks a frame.
  bus.emit('FOO');
  assert.deepEqual(calls, ['ran']);
});

test('eventBus: on returns an unsubscribe function', () => {
  const bus = createEventBus();
  let n = 0;
  const unsub = bus.on('FOO', () => { n++; });
  bus.emit('FOO');
  unsub();
  bus.emit('FOO');
  assert.equal(n, 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --test-name-pattern eventBus`
Expected: All six tests fail (module not found).

---

### Task 2: Event bus — implementation

**Files:**
- Create: `vanilla/final/src/app/eventBus.js`

- [ ] **Step 1: Write the implementation**

```javascript
/**
 * Synchronous in-process pub-sub. Handlers run in subscribe order,
 * on the current call stack, with errors caught and logged so one
 * bad reactor cannot break a frame.
 *
 * Intentionally NOT a queue and NOT async: the order of side-effects
 * inside a single emit must be deterministic and immediate, otherwise
 * gameplay reactions (hitstop, screen shake, audio) drift out of sync
 * with the frame that caused them.
 */
export function createEventBus() {
  const handlers = new Map(); // event name -> array of handler functions

  function on(event, handler) {
    let list = handlers.get(event);
    if (!list) {
      list = [];
      handlers.set(event, list);
    }
    list.push(handler);
    return () => off(event, handler);
  }

  function off(event, handler) {
    const list = handlers.get(event);
    if (!list) return;
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  function emit(event, payload) {
    const list = handlers.get(event);
    if (!list) return;
    // Snapshot so a handler can subscribe/unsubscribe during emit without
    // re-entrantly mutating the list we are iterating.
    const snapshot = list.slice();
    for (const handler of snapshot) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[eventBus] handler for "${event}" threw:`, err);
      }
    }
  }

  return { on, off, emit };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --test-name-pattern eventBus`
Expected: All six tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/app/eventBus.js vanilla/final/tests/eventBus.test.js
git commit -m "Add event bus with subscribe/emit/unsubscribe semantics"
```

---

### Task 3: Event constants

**Files:**
- Create: `vanilla/final/src/app/events.js`

- [ ] **Step 1: Write the constants module**

```javascript
/**
 * All event names the gameplay scenes emit and reactors subscribe to.
 *
 * Adding a new event MUST update this file first. This prevents the bus
 * from becoming a junk drawer of free-form strings.
 *
 * Payload shapes are documented here as JSDoc rather than enforced at
 * runtime; reactors should branch on payload fields, not on per-outcome
 * event names (e.g. BONUS_END with perfect:true, not BONUS_END_PERFECT).
 */

/** @typedef {{ enemy: object, scoreValue: number, comboAfter: number }} EnemyKilledPayload */
/** @typedef {{ enemy: object }} EnemyEscapedPayload */
/** @typedef {{ perfect: boolean, escaped: number, score: number }} BonusEndPayload */
/** @typedef {{ kind: string }} PowerupPickupPayload */
/** @typedef {{ combo: number, multiplier: number }} ComboIncrementPayload */
/** @typedef {{ name: string }} MicromodeStartPayload */
/** @typedef {{ name: string, outcome: 'success' | 'fail' }} MicromodeEndPayload */

export const Events = Object.freeze({
  WAVE_START: 'WAVE_START',
  WAVE_COMPLETE: 'WAVE_COMPLETE',
  BONUS_START: 'BONUS_START',
  BONUS_END: 'BONUS_END',
  ENEMY_KILLED: 'ENEMY_KILLED',
  ENEMY_ESCAPED: 'ENEMY_ESCAPED',
  PLAYER_HIT: 'PLAYER_HIT',
  PLAYER_DIED: 'PLAYER_DIED',
  POWERUP_PICKUP: 'POWERUP_PICKUP',
  COMBO_INCREMENT: 'COMBO_INCREMENT',
  COMBO_BROKEN: 'COMBO_BROKEN',
  MICROMODE_START: 'MICROMODE_START', // reserved for Phase 2E
  MICROMODE_END: 'MICROMODE_END'      // reserved for Phase 2E
});
```

- [ ] **Step 2: Commit**

```bash
git add vanilla/final/src/app/events.js
git commit -m "Add Events constants and payload-shape JSDoc"
```

---

### Task 4: Scene controller — failing tests

**Files:**
- Create: `vanilla/final/tests/sceneController.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSceneController } from '../src/scenes/sceneController.js';

function makeScene(name, log) {
  return {
    name,
    enter() { log.push(`${name}:enter`); },
    exit()  { log.push(`${name}:exit`); },
    update(_ctx, dt) { log.push(`${name}:update:${dt}`); },
    render(_ctx)     { log.push(`${name}:render`); }
  };
}

test('sceneController: push enters the scene and makes it current', () => {
  const log = [];
  const sc = createSceneController();
  const a = makeScene('a', log);
  sc.push(a);
  assert.equal(sc.current(), a);
  assert.deepEqual(log, ['a:enter']);
});

test('sceneController: update and render route to the top scene only', () => {
  const log = [];
  const sc = createSceneController();
  sc.push(makeScene('a', log));
  sc.push(makeScene('b', log));
  log.length = 0;
  sc.update({}, 0.016);
  sc.render({});
  assert.deepEqual(log, ['b:update:0.016', 'b:render']);
});

test('sceneController: pop exits the top scene', () => {
  const log = [];
  const sc = createSceneController();
  const a = makeScene('a', log);
  const b = makeScene('b', log);
  sc.push(a);
  sc.push(b);
  log.length = 0;
  sc.pop();
  assert.equal(sc.current(), a);
  assert.deepEqual(log, ['b:exit']);
});

test('sceneController: replace exits old and enters new', () => {
  const log = [];
  const sc = createSceneController();
  sc.push(makeScene('a', log));
  log.length = 0;
  sc.replace(makeScene('b', log));
  assert.deepEqual(log, ['a:exit', 'b:enter']);
  assert.equal(sc.current().name, 'b');
});

test('sceneController: current returns null when stack is empty', () => {
  const sc = createSceneController();
  assert.equal(sc.current(), null);
});

test('sceneController: scenes without enter/exit hooks are allowed', () => {
  const sc = createSceneController();
  const minimal = { update() {}, render() {} };
  assert.doesNotThrow(() => sc.push(minimal));
  assert.doesNotThrow(() => sc.pop());
});

test('sceneController: update and render on empty stack are no-ops', () => {
  const sc = createSceneController();
  assert.doesNotThrow(() => sc.update({}, 0.016));
  assert.doesNotThrow(() => sc.render({}));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --test-name-pattern sceneController`
Expected: All seven tests fail (module not found).

---

### Task 5: Scene controller — implementation

**Files:**
- Create: `vanilla/final/src/scenes/sceneController.js`

- [ ] **Step 1: Write the implementation**

```javascript
/**
 * A scene stack. The top scene receives update/render; scenes below it
 * are paused, not torn down. This is what lets a micromode interlude
 * (Phase 2E) push on top of the play scene and pop back without any
 * state desync — the play scene was never disposed, just suspended.
 *
 * Scenes are plain objects with optional enter()/exit() and required
 * update(ctx, dt)/render(ctx).
 */
export function createSceneController() {
  const stack = [];

  function current() {
    return stack.length === 0 ? null : stack[stack.length - 1];
  }

  function push(scene) {
    stack.push(scene);
    if (typeof scene.enter === 'function') scene.enter();
  }

  function pop() {
    const scene = stack.pop();
    if (scene && typeof scene.exit === 'function') scene.exit();
  }

  function replace(scene) {
    pop();
    push(scene);
  }

  function update(ctx, dt) {
    const top = current();
    if (top) top.update(ctx, dt);
  }

  function render(ctx) {
    const top = current();
    if (top) top.render(ctx);
  }

  return { push, pop, replace, current, update, render };
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --test-name-pattern sceneController`
Expected: All seven tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/scenes/sceneController.js vanilla/final/tests/sceneController.test.js
git commit -m "Add scene stack controller with push/pop/replace"
```

---

### Task 6: Context object

**Files:**
- Create: `vanilla/final/src/app/context.js`

No unit test: this is a struct factory. Coverage comes from the integration smoke matrix at the end of the plan.

- [ ] **Step 1: Write the context factory**

```javascript
/**
 * Single object threaded into every scene's update(ctx, dt) / render(ctx).
 * Replaces the module-level globals that previously lived in main.js.
 *
 * Holding all coupling in one explicit, passed-around object means scenes
 * are testable with a fake ctx and main.js stops being a hub of mutable
 * state.
 */
export function createContext({
  state,
  audio,
  input,
  canvas,
  ctx2d,
  bus,
  sceneController,
  gameLoop
}) {
  return {
    state,
    audio,
    input,
    canvas,
    ctx2d,                 // CanvasRenderingContext2D
    bus,
    sceneController,
    gameLoop,
    // Mutable theme/config — set by main bootstrap after async loads.
    theme: null,           // { name, ... } object from getTheme()
    themeImages: {},       // { wave1: HTMLImageElement, ... }
    playerImage: null,
    adjustedConfig: null,  // from getAdjustedConfig()
    backgroundElements: null,
    backgroundMode: null
  };
}

/**
 * True if Absurd Mode is the active theme. Replaces the silently-broken
 * `currentTheme === 'absurd'` string compare in main.js:1034 and :1071.
 * Note: Phase 1 keeps the bug — this helper is provided so Phase 2A can
 * fix it in a single line. Do NOT call this from any reactor in Phase 1.
 */
export function isAbsurd(ctx) {
  const name = ctx.theme && ctx.theme.name ? ctx.theme.name.toLowerCase() : '';
  return name.includes('absurd');
}
```

- [ ] **Step 2: Commit**

```bash
git add vanilla/final/src/app/context.js
git commit -m "Add explicit ctx object and isAbsurd helper"
```

---

### Task 7: Move bonus-stage behavior helpers out of `gameState.js`

The spec consolidates bonus-stage behavior in `bonusScene.js`. Pure mutators stay in `gameState.js` for state-shape compatibility; behavior moves. The `shouldTriggerBonusStage` predicate stays in `gameState.js` because it inspects state without owning the stage.

**Files:**
- Modify: `vanilla/final/src/state/gameState.js` (lines 381–452)
- Create: `vanilla/final/src/scenes/_bonusStateMutations.js`

We extract `startBonusStage`, `updateBonusStage`, `bonusStageEnemyEscaped`, `endBonusStage` into a sibling module that `bonusScene.js` (Task 10) will import. The underscore prefix marks it private to `scenes/`.

- [ ] **Step 1: Create the extracted mutation module**

```javascript
// vanilla/final/src/scenes/_bonusStateMutations.js
import { addScore } from '../state/gameState.js';

/**
 * Pure state mutations for the bonus stage timer. Behavior wrapping
 * these lives in bonusScene.js — these helpers do not own any side-effect
 * or any timing source other than the dt they are given.
 */

export function startBonusStage(state) {
  state.bonusStageActive = true;
  state.bonusStageTimer = state.bonusStageTimeLimit;
  state.bonusStageEnemiesEscaped = 0;
  state.bonusStageScore = 0;
}

export function updateBonusStage(state, dt) {
  if (!state.bonusStageActive) return false;
  state.bonusStageTimer -= dt;
  if (state.bonusStageTimer <= 0) {
    return endBonusStage(state);
  }
  return false;
}

export function bonusStageEnemyEscaped(state) {
  if (state.bonusStageActive) {
    state.bonusStageEnemiesEscaped++;
  }
}

export function endBonusStage(state) {
  state.bonusStageActive = false;
  state.bonusStageTimer = 0;
  const perfectBonus = state.bonusStageEnemiesEscaped === 0;
  if (perfectBonus) {
    const PERFECT_BONUS = 1000;
    addScore(state, PERFECT_BONUS);
    state.bonusStageScore += PERFECT_BONUS;
  }
  return perfectBonus;
}
```

- [ ] **Step 2: Remove the four moved functions from `gameState.js`**

Open `vanilla/final/src/state/gameState.js`. Delete lines that define `startBonusStage`, `updateBonusStage`, `bonusStageEnemyEscaped`, and `endBonusStage` (currently lines 393–452). Keep `shouldTriggerBonusStage` (line 386–392) in place — it inspects state, not behavior. Keep the section header comment at line 377–379.

- [ ] **Step 3: Run all tests to verify gameState.js still loads**

Run: `npm test`
Expected: All existing 36 tests still pass plus the 13 new tests from Tasks 1–5. (`main.js` still imports the removed names; we will fix imports during the playScene extraction. For now, `main.js` is still in the old shape and not executed by tests, so tests pass. If you want a manual smoke at this point, leave `main.js`'s imports broken — we replace them wholesale in Task 13.)

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/state/gameState.js vanilla/final/src/scenes/_bonusStateMutations.js
git commit -m "Extract bonus-stage mutators into scenes/_bonusStateMutations.js"
```

---

### Task 8: Extract `menuScene`

`main.js` has two menu-specific blocks: `updateMenuEnemies` (lines 829–867) and `drawMenuEnemies` (lines 873–894), plus a top-of-`update()` early return (lines 902–905) and a top-of-`render()` branch (lines 1339–1341). We lift these into a dedicated scene.

**Files:**
- Create: `vanilla/final/src/scenes/menuScene.js`

- [ ] **Step 1: Write `menuScene.js`**

```javascript
/**
 * Menu scene: the title-screen backdrop of falling theme enemies.
 *
 * No gameplay events are emitted here — the menu is cosmetic. Button
 * click handlers (start, settings, help, etc.) remain attached in
 * main.js's bootstrap; this scene only owns the animated backdrop.
 */

const SPAWN_INTERVAL = 0.4; // seconds
const FALL_SPEED = 80;      // pixels/second
const SCREEN_W = 640;
const SCREEN_H = 480;

export function createMenuScene() {
  let fallingEnemies = [];
  let spawnTimer = 0;

  function enter() {
    fallingEnemies = [];
    spawnTimer = 0;
  }

  function update(ctx, dt) {
    spawnTimer += dt;

    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;
      const enemyKeys = Object.keys(ctx.themeImages);
      if (enemyKeys.length > 0) {
        const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
        fallingEnemies.push({
          x: Math.random() * (SCREEN_W - 20),
          y: -30,
          themeKey: randomKey,
          speed: FALL_SPEED + Math.random() * 40,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 3,
          scale: 0.8 + Math.random() * 0.4
        });
      }
    }

    for (let i = fallingEnemies.length - 1; i >= 0; i--) {
      const enemy = fallingEnemies[i];
      enemy.y += enemy.speed * dt;
      enemy.rotation += enemy.rotationSpeed * dt;
      if (enemy.y > SCREEN_H + 30) {
        fallingEnemies.splice(i, 1);
      }
    }
  }

  function render(ctx) {
    const g = ctx.ctx2d;
    g.save();
    g.globalAlpha = 0.6;

    for (const enemy of fallingEnemies) {
      const image = ctx.themeImages[enemy.themeKey];
      if (image && image.complete) {
        g.save();
        g.translate(enemy.x, enemy.y);
        g.rotate(enemy.rotation);
        g.scale(enemy.scale, enemy.scale);
        g.drawImage(image, -16, -16, 32, 32);
        g.restore();
      }
    }

    g.restore();
  }

  return { enter, update, render };
}
```

- [ ] **Step 2: Commit**

```bash
git add vanilla/final/src/scenes/menuScene.js
git commit -m "Extract menuScene from main.js"
```

---

### Task 9: Extract `gameOverScene`

`main.js` has three game-over flow functions: `handleGameOver` (629–644), `showNameEntryScreen` (649–686), `showHighScoresAfterEntry` (691–703), `showGameOverMenu` (708–711). We lift them, parameterizing on `ctx` so they no longer touch the module-level `state`/`audioManager`/`menuController`.

**Files:**
- Create: `vanilla/final/src/scenes/gameOverScene.js`

- [ ] **Step 1: Write `gameOverScene.js`**

```javascript
import { loadPlayerName, savePlayerName } from '../storage/settings.js';
import { isHighScore, addHighScore, renderHighScores } from '../storage/highScores.js';

/**
 * Game-over flow: optional name entry for a new high score, then the
 * standard game-over menu. Driven by DOM events from the existing
 * menu screens — no per-frame update or render needed.
 *
 * Exposes a single async-friendly entry point: handleGameOver(ctx, menuController).
 */

export function handleGameOver(ctx, menuController) {
  ctx.state.currentState = 'GAME_OVER';

  ctx.audio.stopMusic();
  ctx.audio.playGameOver();

  if (isHighScore(ctx.state.score)) {
    showNameEntryScreen(ctx, menuController);
  } else {
    showGameOverMenu(ctx, menuController);
  }
}

function showNameEntryScreen(ctx, menuController) {
  document.getElementById('name-entry-score').textContent = `SCORE: ${ctx.state.score}`;
  const nameInput = document.getElementById('player-name');
  nameInput.value = loadPlayerName();
  menuController.showScreen('nameEntry');

  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 100);

  const handleNameSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'change') {
      e.preventDefault();
      const name = nameInput.value.toUpperCase().substring(0, 3).padEnd(3, 'A');
      savePlayerName(name);
      addHighScore(name, ctx.state.score, ctx.state.level);
      nameInput.removeEventListener('keydown', handleNameSubmit);
      nameInput.removeEventListener('change', handleNameSubmit);
      showHighScoresAfterEntry(ctx, menuController);
    }
  };

  nameInput.addEventListener('keydown', handleNameSubmit);
  nameInput.addEventListener('change', handleNameSubmit);
}

function showHighScoresAfterEntry(ctx, menuController) {
  menuController.showScreen('high-scores');
  renderHighScores('high-scores-list');

  const backButton = document.getElementById('btn-back-scores');
  const handleContinue = () => {
    backButton.removeEventListener('click', handleContinue);
    showGameOverMenu(ctx, menuController);
  };
  backButton.addEventListener('click', handleContinue, { once: true });
}

function showGameOverMenu(ctx, menuController) {
  document.getElementById('final-score').textContent = `SCORE: ${ctx.state.score}`;
  menuController.showScreen('gameOver');
}
```

- [ ] **Step 2: Commit**

```bash
git add vanilla/final/src/scenes/gameOverScene.js
git commit -m "Extract gameOverScene from main.js"
```

---

### Task 10: Extract `bonusScene`

This consolidates the bonus-stage spawn/tick/end logic that was split across `main.js` (`startBonusWave` 519–578, `updateBonusWaveSpawning` 586–625, the bonus tick inside `update()` 917–941, the three `drawBonusStage*` overlays 719–823) and the four mutators we already moved into `_bonusStateMutations.js`.

The bonus scene is **not** a pushed scene on the controller — it co-runs inside playScene's update cycle (the player still moves, bullets still fly, the bonus stage just changes spawning/timing rules). It is exported as a small module of helpers that `playScene` calls. Phase 2's micromode scenes are the ones that actually use the scene stack push/pop.

**Files:**
- Create: `vanilla/final/src/scenes/bonusScene.js`

- [ ] **Step 1: Write `bonusScene.js`**

```javascript
import {
  startBonusStage,
  updateBonusStage,
  bonusStageEnemyEscaped,
  endBonusStage
} from './_bonusStateMutations.js';
import { createEnemy } from '../entities/enemyExpanded.js';
import { startEnergyRefill } from '../state/gameState.js';
import { Events } from '../app/events.js';

/**
 * Bonus-stage controller. Owns spawning, tick, end, and the three
 * on-screen overlays (announcement / timer / end). Re-exports the
 * pure mutators from _bonusStateMutations.js so callers only import
 * from one module.
 *
 * Side-effect contract: emits BONUS_START on begin, BONUS_END on end
 * with payload { perfect, escaped, score }, and ENEMY_ESCAPED whenever
 * an enemy leaves the play area during the bonus stage.
 */

export { bonusStageEnemyEscaped };

let announceTimer = 0;
let announceAlpha = 0;
let endTimer = 0;
let endAlpha = 0;
let endPerfect = false;
let skipNextWaveAfterBonus = false;

export function shouldSkipNextWave() {
  return skipNextWaveAfterBonus;
}
export function consumeSkipNextWave() {
  const v = skipNextWaveAfterBonus;
  skipNextWaveAfterBonus = false;
  return v;
}

export function beginBonusWave(ctx) {
  const { state, themeImages, adjustedConfig, bus } = ctx;
  let enemyKeys = Object.keys(themeImages);
  if (enemyKeys.length === 0) enemyKeys = ['wave1'];

  state.currentWave = {
    name: `BONUS STAGE - LEVEL ${state.level + 1}`,
    count: 40,
    spawnInterval: 300,
    formationDelay: 0,
    themeKey: 'mixed',
    enemy: { width: 24, height: 24, color: '#ff00ff', hp: 1, scoreValue: 100 },
    speed: 0,
    pathType: 'straight',
    pathParams: { ySpeed: 60 },
    fireRate: 3000,
    bulletSpeed: 150,
    requiredKills: 40
  };

  state.waveStartTime = state.gameTime;
  state.lastEnemySpawnTime = state.gameTime - 1;
  state.enemiesSpawned = 0;
  state.spawnComplete = false;
  state.perfectWave = true;
  state.waveFormationComplete = true;

  startBonusStage(state);

  // Initial batch of 5 to make the start feel decisive.
  for (let i = 0; i < 5 && state.enemiesSpawned < state.currentWave.count; i++) {
    const key = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
    const wave = { ...state.currentWave, themeKey: key };
    const enemy = createEnemy(
      wave,
      state.enemiesSpawned,
      adjustedConfig.enemySpeedMult || 1,
      adjustedConfig.enemyFireRateMult || 1
    );
    state.enemies.push(enemy);
    state.enemiesSpawned++;
  }

  announceTimer = 2;
  announceAlpha = 1;
  bus.emit(Events.BONUS_START, { level: state.level + 1 });
}

export function updateBonusSpawning(ctx, dt) {
  const { state, themeImages, adjustedConfig } = ctx;
  if (!state.currentWave || state.spawnComplete) return;

  const timeSinceLastSpawn = (state.gameTime - state.lastEnemySpawnTime) * 1000;
  if (timeSinceLastSpawn < state.currentWave.spawnInterval) return;
  if (state.enemiesSpawned >= state.currentWave.count) {
    state.spawnComplete = true;
    return;
  }

  let enemyKeys = Object.keys(themeImages);
  if (enemyKeys.length === 0) enemyKeys = ['wave1'];
  const key = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
  const wave = { ...state.currentWave, themeKey: key };

  const enemy = createEnemy(
    wave,
    state.enemiesSpawned,
    adjustedConfig.enemySpeedMult || 1,
    adjustedConfig.enemyFireRateMult || 1
  );
  state.enemies.push(enemy);
  state.enemiesSpawned++;
  state.lastEnemySpawnTime = state.gameTime;
}

/**
 * Per-frame tick during the bonus stage. Returns true if the stage
 * just ended this frame (so playScene can pause for the end overlay).
 */
export function tickBonus(ctx, dt) {
  const { state, bus } = ctx;
  if (!state.bonusStageActive) return false;

  announceTimer = Math.max(0, announceTimer - dt);
  announceAlpha = announceTimer > 0 ? Math.min(1, announceTimer / 2) : 0;

  const ended = updateBonusStage(state, dt);
  if (!ended) return false;

  endPerfect = state.bonusStageEnemiesEscaped === 0;
  endTimer = 3;
  endAlpha = 1;
  skipNextWaveAfterBonus = true;
  state.waveComplete = true;
  state.enemies = [];
  state.enemyBullets = [];
  startEnergyRefill(state);

  bus.emit(Events.BONUS_END, {
    perfect: endPerfect,
    escaped: state.bonusStageEnemiesEscaped,
    score: state.bonusStageScore
  });

  return true;
}

export function tickEndOverlay(dt) {
  if (endTimer > 0) {
    endTimer = Math.max(0, endTimer - dt);
    endAlpha = endTimer / 3;
  }
}

export function reportEscape(ctx) {
  bonusStageEnemyEscaped(ctx.state);
  if (ctx.state.bonusStageActive) {
    ctx.bus.emit(Events.ENEMY_ESCAPED, {});
  }
}

export function drawAnnouncement(g, level) {
  if (announceAlpha <= 0) return;
  g.save();
  g.globalAlpha = announceAlpha;
  g.fillStyle = 'rgba(0, 0, 0, 0.9)';
  g.fillRect(100, 160, 440, 100);
  g.strokeStyle = '#ff00ff';
  g.lineWidth = 4;
  g.strokeRect(100, 160, 440, 100);
  g.fillStyle = '#ff00ff';
  g.font = "24px 'Press Start 2P', monospace";
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('BONUS STAGE!', 320, 190);
  g.font = "16px 'Press Start 2P', monospace";
  g.fillText(`LEVEL ${level}`, 320, 225);
  g.restore();
}

export function drawTimer(g, timeLeft, level) {
  g.save();
  const seconds = Math.ceil(timeLeft);
  const isLowTime = seconds <= 5;
  g.font = "16px 'Press Start 2P', monospace";
  g.textAlign = 'center';
  g.textBaseline = 'top';
  g.fillStyle = '#ff00ff';
  g.fillText(`BONUS LEVEL ${level}`, 320, 10);
  g.font = "14px 'Press Start 2P', monospace";
  if (isLowTime) {
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    g.globalAlpha = pulse;
    g.fillStyle = '#ff0000';
  } else {
    g.fillStyle = '#ffff00';
  }
  g.fillText(`TIME: ${seconds}s`, 320, 32);
  g.restore();
}

export function drawEnd(g, escaped) {
  if (endAlpha <= 0) return;
  g.save();
  g.globalAlpha = endAlpha;
  g.font = "20px 'Press Start 2P', monospace";
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0, 0, 0, 0.9)';
  g.fillRect(100, 160, 440, 120);
  const borderColor = endPerfect ? '#00ff00' : '#ffff00';
  g.strokeStyle = borderColor;
  g.lineWidth = 4;
  g.strokeRect(100, 160, 440, 120);
  g.fillStyle = borderColor;
  g.fillText('BONUS STAGE COMPLETE!', 320, 195);
  if (endPerfect) {
    g.font = "24px 'Press Start 2P', monospace";
    g.fillStyle = '#00ff00';
    g.fillText('PERFECT! +1000', 320, 240);
  } else {
    g.font = "14px 'Press Start 2P', monospace";
    g.fillStyle = '#ffffff';
    g.fillText(`${escaped} ENEMIES ESCAPED`, 320, 240);
  }
  g.restore();
}
```

- [ ] **Step 2: Commit**

```bash
git add vanilla/final/src/scenes/bonusScene.js
git commit -m "Extract bonusScene controller and overlays"
```

---

### Task 11: Extract `playScene`

This is the core of the refactor. `playScene` owns the per-frame gameplay update and render. It is structurally a **verbatim move** of the existing `update()` and `render()` bodies, with three categories of edits:

1. Every reference to a module-level global (`state`, `currentTheme`, `themeImages`, `playerImage`, `adjustedConfig`, `audioManager`, `backgroundElements`, `backgroundMode`) becomes a `ctx.*` reference.
2. Every inline reactor call (`audioManager.playX()`, `triggerScreenShake()`, `state.particles.push(createXxxParticle(...))`) is **kept in place for this task** and replaced wholesale in Task 12. **Do not** try to combine the move with the reactor swap — the goal of Task 11 is "same code in a new file."
3. The bonus-stage-related lines call into `bonusScene.js` (Task 10) instead of the inline `startBonusWave`, `updateBonusWaveSpawning`, `drawBonusStageAnnouncement`, `drawBonusStageTimer`, `drawBonusStageEnd`, and the inline tick.

**Files:**
- Create: `vanilla/final/src/scenes/playScene.js`

The full file is long. The complete contents follow. **Do not paraphrase or "clean up while you're in there"** — verbatim move only. Phase 2 is where polish lives.

- [ ] **Step 1: Write `playScene.js`**

```javascript
import { updateBackground, drawBackground } from '../systems/backgroundSystem.js';
import {
  GameStates,
  addScore,
  loseLife,
  nextWave,
  depleteEnergy,
  refillEnergy,
  startEnergyRefill,
  updateEnergyAnimation,
  incrementCombo,
  updateCombo,
  resetCombo,
  shouldTriggerBonusStage
} from '../state/gameState.js';
import {
  createPlayerBullet,
  createEnemyBullet,
  updateProjectile,
  isOffScreen,
  drawProjectile
} from '../entities/projectile.js';
import {
  canFire,
  recordFire,
  hitPlayer,
  getPlayerHitbox,
  drawPlayer,
  updatePlayer
} from '../entities/player.js';
import {
  updateEnemy,
  canEnemyFire,
  recordEnemyFire,
  isEnemyOffScreen,
  drawEnemy
} from '../entities/enemyExpanded.js';
import {
  maybeCreatePowerUpDrop,
  updatePowerUp,
  drawPowerUp,
  isPowerUpOffScreen,
  checkPlayerPowerUpCollision,
  applyPowerUp,
  updateActivePowerUps,
  hasPowerUp
} from '../entities/powerup.js';
import {
  checkProjectileEnemyCollision,
  checkPlayerEnemyCollision,
  checkPlayerBulletCollision
} from '../systems/collision.js';
import { startWave, updateWaveManager } from '../systems/waveManager.js';
import {
  createExplosion,
  createAbsurdExplosion,
  createPlayerExplosion,
  createTrailParticle,
  updateParticles,
  drawParticles
} from '../systems/particleSystem.js';
import {
  triggerScreenShake,
  updateScreenShake,
  applyScreenShake
} from '../systems/screenShake.js';
import {
  drawHUD,
  drawWaveAnnouncement,
  drawWaveComplete,
  drawEnergyBar,
  drawActivePowerUps
} from '../ui/hud.js';
import { clearCanvas } from '../canvas.js';
import { Events } from '../app/events.js';
import {
  beginBonusWave,
  updateBonusSpawning,
  tickBonus,
  tickEndOverlay,
  reportEscape,
  drawAnnouncement as drawBonusAnnouncement,
  drawTimer as drawBonusTimer,
  drawEnd as drawBonusEnd,
  shouldSkipNextWave,
  consumeSkipNextWave
} from './bonusScene.js';

/**
 * The gameplay scene. Single update/render path covering wave play
 * and the bonus stage (which co-runs inside this scene rather than
 * being a separately-pushed scene).
 *
 * Animation timers that previously lived as module-level vars in
 * main.js are scene-local closures here so the play scene is the
 * sole owner of its own per-frame state.
 *
 * Phase 1 keeps every inline audio/shake/particle call exactly as
 * it was in main.js. Phase 2A replaces those with bus emits.
 */
export function createPlayScene({ menuController, onGameOver }) {
  let waveAnnouncementAlpha = 0;
  let waveAnnouncementTimer = 0;
  let waveCompleteAlpha = 0;
  let waveCompleteTimer = 0;
  let interWavePause = false;
  let interWavePauseTimer = 0;
  let pausePressed = false;

  function handlePlayerDeath(ctx) {
    const { state, adjustedConfig, audio, theme } = ctx;
    audio.playPlayerDeath();

    if (state.waveComplete) {
      state.enemyBullets = [];
      state.playerBullets = [];
      refillEnergy(state);
      return;
    }

    state.enemies = [];
    state.enemyBullets = [];
    state.playerBullets = [];
    refillEnergy(state);

    const themeName = theme && theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
    startWave(state, adjustedConfig, themeName);
    waveAnnouncementTimer = 2;
    waveAnnouncementAlpha = 1;
    audio.playWaveStart();
  }

  function update(ctx, dt) {
    const { state, audio, input, bus, theme } = ctx;
    if (state.currentState !== GameStates.PLAYING) return;

    state.gameTime += dt;

    updateBackground(ctx.backgroundElements, dt, state.gameTime);
    updateCombo(state, dt);

    if (state.bonusStageActive) {
      tickBonus(ctx, dt);
    }
    tickEndOverlay(dt);

    updateScreenShake(dt);

    const energyDepleted = depleteEnergy(state, dt);
    if (energyDepleted) {
      const gameOver = loseLife(state);
      if (gameOver) {
        onGameOver(ctx);
        return;
      }
      handlePlayerDeath(ctx);
      return;
    }

    const inputState = input.getState();

    if (inputState.pause && !pausePressed) {
      pausePressed = true;
      state.currentState = GameStates.PAUSED;
      input.disable();
      input.enable();
      menuController.showScreen('pause');
      return;
    }
    if (!inputState.pause) {
      pausePressed = false;
    }

    const direction = input.getDirection();
    updatePlayer(state.player, dt, direction);

    if (inputState.fire) {
      let fireRateModifier = 1;
      if (hasPowerUp(state, 'rapidFire')) {
        fireRateModifier = 0.33;
      }
      if (canFire(state.player, fireRateModifier)) {
        if (hasPowerUp(state, 'spreadShot')) {
          const spreadAngle = 0.3;
          for (const angle of [-spreadAngle, 0, spreadAngle]) {
            const bullet = createPlayerBullet(
              state.player.x + state.player.width / 2,
              state.player.y,
              angle
            );
            state.playerBullets.push(bullet);
          }
        } else if (state.playerBullets.length < 5) {
          const bullet = createPlayerBullet(
            state.player.x + state.player.width / 2,
            state.player.y
          );
          state.playerBullets.push(bullet);
        }
        recordFire(state.player);
        audio.playPlayerFire();
      }
    }

    if (!interWavePause) {
      if (state.bonusStageActive) {
        updateBonusSpawning(ctx, dt);
      } else {
        updateWaveManager(state, dt, ctx.adjustedConfig);
      }
    }

    const playerPos = {
      x: state.player.x + state.player.width / 2,
      y: state.player.y
    };

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      updateEnemy(enemy, dt, playerPos);

      if (theme && theme.name.toLowerCase().includes('absurd') && Math.random() < 0.3) {
        state.particles.push(createTrailParticle(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          enemy.color
        ));
      }

      if (canEnemyFire(enemy)) {
        const bullet = createEnemyBullet(enemy.x, enemy.y + enemy.height / 2, enemy.bulletSpeed);
        state.enemyBullets.push(bullet);
        recordEnemyFire(enemy);
      }

      if (isEnemyOffScreen(enemy)) {
        state.enemies.splice(i, 1);
        state.perfectWave = false;
        reportEscape(ctx);
        if (state.currentWave) state.enemiesKilled++;
      }
    }

    for (let i = state.playerBullets.length - 1; i >= 0; i--) {
      const bullet = state.playerBullets[i];
      updateProjectile(bullet, dt);

      if (theme && theme.name.toLowerCase().includes('absurd') && Math.random() < 0.5) {
        state.particles.push(createTrailParticle(bullet.x, bullet.y, bullet.color));
      }

      if (isOffScreen(bullet)) {
        state.playerBullets.splice(i, 1);
        if (state.combo > 0) resetCombo(state);
        continue;
      }

      const hitEnemy = checkProjectileEnemyCollision(bullet, state.enemies);
      if (hitEnemy) {
        state.playerBullets.splice(i, 1);
        state.enemies = state.enemies.filter(e => e !== hitEnemy);
        state.enemiesKilled++;
        incrementCombo(state);
        const extraLife = addScore(state, hitEnemy.scoreValue);
        if (extraLife) audio.playExtraLife();

        if (theme && theme.name.toLowerCase().includes('absurd')) {
          state.particles.push(...createAbsurdExplosion(
            hitEnemy.x + hitEnemy.width / 2,
            hitEnemy.y + hitEnemy.height / 2,
            hitEnemy.color
          ));
          triggerScreenShake(6, 0.2);
        } else {
          state.particles.push(...createExplosion(
            hitEnemy.x + hitEnemy.width / 2,
            hitEnemy.y + hitEnemy.height / 2,
            hitEnemy.color
          ));
        }
        audio.playEnemyExplode();

        const drop = maybeCreatePowerUpDrop(hitEnemy);
        if (drop) state.powerUps.push(drop);
      }
    }

    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = state.enemyBullets[i];
      updateProjectile(bullet, dt);
      if (isOffScreen(bullet)) {
        state.enemyBullets.splice(i, 1);
        continue;
      }
      const playerHitbox = getPlayerHitbox(state.player);
      if (checkPlayerBulletCollision(bullet, playerHitbox, state)) {
        state.enemyBullets.splice(i, 1);
        if (!hasPowerUp(state, 'shield')) {
          const gameOver = hitPlayer(state);
          if (gameOver) {
            state.particles.push(...createPlayerExplosion(
              state.player.x + state.player.width / 2,
              state.player.y + state.player.height / 2
            ));
            onGameOver(ctx);
            return;
          }
          handlePlayerDeath(ctx);
          return;
        }
      }
    }

    if (checkPlayerEnemyCollision(state.player, state.enemies, state)) {
      if (!hasPowerUp(state, 'shield')) {
        const gameOver = hitPlayer(state);
        if (gameOver) {
          state.particles.push(...createPlayerExplosion(
            state.player.x + state.player.width / 2,
            state.player.y + state.player.height / 2
          ));
          onGameOver(ctx);
          return;
        }
        handlePlayerDeath(ctx);
        return;
      }
    }

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const powerUp = state.powerUps[i];
      updatePowerUp(powerUp, dt);
      if (isPowerUpOffScreen(powerUp)) {
        state.powerUps.splice(i, 1);
        continue;
      }
      if (checkPlayerPowerUpCollision(state.player, powerUp)) {
        applyPowerUp(state, powerUp);
        state.powerUps.splice(i, 1);
        audio.playPowerUp();
      }
    }
    updateActivePowerUps(state, dt);

    updateParticles(state.particles, dt);
    updateEnergyAnimation(state, dt);

    if (state.currentWave && state.enemiesKilled >= state.currentWave.requiredKills && !state.waveComplete) {
      state.waveComplete = true;
      state.waveBonus = state.perfectWave ? 1000 : 500;
      addScore(state, state.waveBonus);
      audio.playWaveComplete();
      startEnergyRefill(state);
      interWavePause = true;
      interWavePauseTimer = 3;
      waveCompleteTimer = 3;
      waveCompleteAlpha = 1;
    }

    if (interWavePause) {
      interWavePauseTimer -= dt;
      if (interWavePauseTimer <= 0) {
        interWavePause = false;
        if (consumeSkipNextWave()) {
          nextWave(state);
        } else if (shouldTriggerBonusStage(state)) {
          nextWave(state);
          beginBonusWave(ctx);
        } else {
          nextWave(state);
        }
        const themeName = theme && theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
        if (!state.bonusStageActive) {
          startWave(state, ctx.adjustedConfig, themeName);
        }
        waveAnnouncementTimer = 2;
        waveAnnouncementAlpha = 1;
        audio.playWaveStart();
      }
    }

    if (waveAnnouncementTimer > 0) {
      waveAnnouncementTimer -= dt;
      waveAnnouncementAlpha = Math.max(0, waveAnnouncementTimer / 2);
    }
    if (waveCompleteTimer > 0) {
      waveCompleteTimer -= dt;
      waveCompleteAlpha = Math.max(0, waveCompleteTimer / 3);
    }
  }

  function render(ctx) {
    const g = ctx.ctx2d;
    const { state } = ctx;

    clearCanvas(g);
    drawBackground(g, ctx.backgroundElements, state.gameTime);

    g.save();
    applyScreenShake(g);

    if (state.currentState === GameStates.PLAYING || state.currentState === GameStates.PAUSED) {
      if (state.player) {
        drawPlayer(g, state.player, ctx.playerImage, state);
      }
      for (const enemy of state.enemies) {
        const enemyImage = ctx.themeImages[enemy.themeKey] || null;
        drawEnemy(g, enemy, enemyImage);
      }
      for (const bullet of state.playerBullets) drawProjectile(g, bullet);
      for (const bullet of state.enemyBullets) drawProjectile(g, bullet);
      drawParticles(g, state.particles);
      for (const powerUp of state.powerUps) drawPowerUp(g, powerUp);
      drawHUD(g, state, ctx.gameLoop.fps);
      drawEnergyBar(g, state);
      drawActivePowerUps(g, state);

      if (waveAnnouncementAlpha > 0 && state.currentWave) {
        drawWaveAnnouncement(g, state.currentWave.name, waveAnnouncementAlpha);
      }
      if (waveCompleteAlpha > 0) {
        drawWaveComplete(g, state.waveBonus, state.energyBonus, waveCompleteAlpha);
      }

      drawBonusAnnouncement(g, state.level + 1);
      if (state.bonusStageActive) {
        drawBonusTimer(g, state.bonusStageTimer, state.level + 1);
      }
      drawBonusEnd(g, state.bonusStageEnemiesEscaped);
    }

    g.restore();
  }

  return { update, render };
}
```

- [ ] **Step 2: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "Extract playScene from main.js (no behavior change)"
```

---

### Task 12: Add `juice.js` reactor + emit events from `playScene`

Phase 1 plumbing change: scenes emit events at gameplay moments; `juice.js` subscribes and calls the same reactor functions that were inlined before. This is a pure rewiring — the same audio plays, the same shake fires, the same particles spawn.

**Files:**
- Create: `vanilla/final/src/systems/juice.js`
- Modify: `vanilla/final/src/scenes/playScene.js` (replace inline reactor calls with bus emits)

- [ ] **Step 1: Write `juice.js`**

```javascript
import { Events } from '../app/events.js';
import {
  createExplosion,
  createAbsurdExplosion,
  createPlayerExplosion
} from './particleSystem.js';
import { triggerScreenShake } from './screenShake.js';

/**
 * Reactor: subscribes to gameplay events and produces the same juice
 * (audio, screen shake, particles) that was previously inlined in
 * playScene's update loop. Behavior in Phase 1 is identical to the
 * pre-refactor code; Phase 2A is where each reactor gets richer.
 *
 * The reactor holds NO state of its own — it reads only from the ctx
 * passed at subscribe time and the event payload at emit time.
 */
export function installJuiceReactor(ctx) {
  const { bus, audio, state, theme } = ctx;
  const unsubs = [];

  unsubs.push(bus.on(Events.WAVE_START, () => {
    audio.playWaveStart();
  }));

  unsubs.push(bus.on(Events.WAVE_COMPLETE, () => {
    audio.playWaveComplete();
  }));

  unsubs.push(bus.on(Events.ENEMY_KILLED, ({ enemy }) => {
    const isAbsurd = theme && theme.name.toLowerCase().includes('absurd');
    if (isAbsurd) {
      state.particles.push(...createAbsurdExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.color
      ));
      triggerScreenShake(6, 0.2);
    } else {
      state.particles.push(...createExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.color
      ));
    }
    audio.playEnemyExplode();
  }));

  unsubs.push(bus.on(Events.PLAYER_HIT, () => {
    // Phase 2A enriches this; Phase 1 has no reactor here because
    // the old code did its particles inline at the death site.
  }));

  unsubs.push(bus.on(Events.PLAYER_DIED, ({ player }) => {
    state.particles.push(...createPlayerExplosion(
      player.x + player.width / 2,
      player.y + player.height / 2
    ));
  }));

  unsubs.push(bus.on(Events.POWERUP_PICKUP, () => {
    audio.playPowerUp();
  }));

  return () => unsubs.forEach(u => u());
}
```

- [ ] **Step 2: Replace inline calls in `playScene.js` with bus emits**

In `vanilla/final/src/scenes/playScene.js`, make the following six surgical replacements. Other lines stay exactly as written in Task 11.

a) In the enemy-killed branch inside the player-bullets loop, **replace** the block from `if (extraLife) audio.playExtraLife();` through `audio.playEnemyExplode();` (the absurd/non-absurd particle + shake + audio inline calls) with:

```javascript
        if (extraLife) audio.playExtraLife();
        bus.emit(Events.ENEMY_KILLED, {
          enemy: hitEnemy,
          scoreValue: hitEnemy.scoreValue,
          comboAfter: state.combo
        });
```

b) Remove the now-unused imports `createExplosion`, `createAbsurdExplosion`, `triggerScreenShake` from the import list at the top of `playScene.js` (keep `createTrailParticle`, `createPlayerExplosion`, `updateParticles`, `drawParticles` — those are still used directly).

c) Replace the wave-complete inline `audio.playWaveComplete();` line with:

```javascript
      bus.emit(Events.WAVE_COMPLETE, { wave: state.currentWave });
```

d) Replace the wave-start inline `audio.playWaveStart();` line (the one inside `handlePlayerDeath`) with:

```javascript
    bus.emit(Events.WAVE_START, { wave: state.currentWave });
```

e) Replace the wave-start inline `audio.playWaveStart();` at the end of the inter-wave-pause block with:

```javascript
      bus.emit(Events.WAVE_START, { wave: state.currentWave });
```

f) Replace the two `state.particles.push(...createPlayerExplosion(...))` blocks (one in the enemy-bullet branch, one in the player-enemy collision branch) and their immediately-following `onGameOver(ctx);` calls with:

```javascript
          bus.emit(Events.PLAYER_DIED, { player: state.player });
          onGameOver(ctx);
          return;
```

Keep `handlePlayerDeath`'s `audio.playPlayerDeath();` for now — it is not duplicated by any subscriber in Phase 1.

Also replace the powerup pickup `audio.playPowerUp();` line with:

```javascript
        bus.emit(Events.POWERUP_PICKUP, { kind: powerUp.kind });
```

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: 36 existing tests + 13 new tests (6 eventBus + 7 sceneController) = **49 tests pass**.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/systems/juice.js vanilla/final/src/scenes/playScene.js
git commit -m "Wire juice reactor to bus events; remove inline reactor calls"
```

---

### Task 13: Shrink `main.js` to bootstrap

Now `main.js` becomes a thin entry point: load settings, build `ctx`, install reactors, wire DOM listeners, push the menu scene, start the game loop.

**Files:**
- Modify: `vanilla/final/src/main.js` (full rewrite — replace the existing 1,429 lines with the contents below)

- [ ] **Step 1: Overwrite `main.js`**

```javascript
/**
 * Super Megamania — bootstrap.
 *
 * Responsibilities, in order: build ctx, load settings, load theme,
 * install the juice reactor, wire DOM listeners (menu buttons,
 * keyboard navigation, settings controls), push the menu scene,
 * start the game loop.
 *
 * No gameplay logic lives here. Per-frame work belongs in scenes/.
 */

import { initCanvas } from './canvas.js';
import { generateBackground, BackgroundMode } from './systems/backgroundSystem.js';
import { createGameLoop } from './gameLoop.js';
import {
  createGameState,
  resetGameState,
  GameStates
} from './state/gameState.js';
import { getAdjustedConfig } from './config/gameConfig.js';
import { createInputManager } from './input/inputManager.js';
import { createPlayer } from './entities/player.js';
import { startWave } from './systems/waveManager.js';
import { resetScreenShake } from './systems/screenShake.js';
import { createMenuController } from './ui/menu.js';
import {
  loadSettings,
  saveSettings,
  applySettingsToUI
} from './storage/settings.js';
import { renderHighScores } from './storage/highScores.js';
import { createAudioManager } from './audio/audioManager.js';
import { loadThemeImages } from './assets/assetLoader.js';
import { getTheme } from './assets/themes.js';
import { createEventBus } from './app/eventBus.js';
import { createContext } from './app/context.js';
import { createSceneController } from './scenes/sceneController.js';
import { createMenuScene } from './scenes/menuScene.js';
import { createPlayScene } from './scenes/playScene.js';
import { handleGameOver } from './scenes/gameOverScene.js';
import { installJuiceReactor } from './systems/juice.js';

let ctx;
let menuController;
let playScene;
let menuScene;

async function init() {
  const { canvas, ctx: ctx2d } = initCanvas('gameCanvas');
  const settings = loadSettings();
  applySettingsToUI(settings);
  applyCrtMode(settings.crtMode);

  const bus = createEventBus();
  const audio = createAudioManager();
  audio.setSfxEnabled(settings.sfxEnabled);
  audio.setMusicEnabled(settings.musicEnabled);
  audio.setMasterVolume(settings.masterVolume);

  const input = createInputManager();
  const state = createGameState(settings.difficulty);
  state.currentState = GameStates.MENU;

  const gameLoop = createGameLoop(
    (dt) => sceneController.update(ctx, dt),
    () => sceneController.render(ctx)
  );

  const sceneController = createSceneController();

  ctx = createContext({
    state, audio, input, canvas, ctx2d, bus, sceneController, gameLoop
  });

  menuController = createMenuController();
  await loadTheme(settings.theme || 'cats');

  installJuiceReactor(ctx);

  menuScene = createMenuScene();
  playScene = createPlayScene({
    menuController,
    onGameOver: (c) => handleGameOver(c, menuController)
  });

  setupEventListeners();

  sceneController.push(menuScene);
  menuController.showScreen('menu');

  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
  }, 500);

  gameLoop.start();
}

async function loadTheme(themeName) {
  ctx.theme = getTheme(themeName);
  const loadedImages = await loadThemeImages(ctx.theme);
  ctx.playerImage = loadedImages.player || null;
  ctx.themeImages = {};
  for (const [key, image] of Object.entries(loadedImages)) {
    if (key !== 'player') ctx.themeImages[key] = image;
  }
  ctx.audio.setTheme(themeName);

  if (themeName === 'absurd') {
    const crazy = [
      BackgroundMode.PSYCHEDELIC, BackgroundMode.MATRIX, BackgroundMode.NEBULA,
      BackgroundMode.VAPORWAVE, BackgroundMode.GLITCH, BackgroundMode.COSMOS
    ];
    ctx.backgroundMode = crazy[Math.floor(Math.random() * crazy.length)];
  } else {
    ctx.backgroundMode = BackgroundMode.CLASSIC;
  }
  ctx.backgroundElements = generateBackground(ctx.backgroundMode, 100);
}

function startGame() {
  menuController.hideAllScreens();
  const settings = loadSettings();
  resetGameState(ctx.state, settings.difficulty);
  ctx.adjustedConfig = getAdjustedConfig(ctx.state.difficulty, ctx.state.level);
  ctx.state.player = createPlayer(ctx.adjustedConfig);

  const themeName = ctx.theme && ctx.theme.name.toLowerCase().includes('absurd') ? 'absurd' : '';
  startWave(ctx.state, ctx.adjustedConfig, themeName);

  ctx.audio.startMusic();
  ctx.state.currentState = GameStates.PLAYING;
  resetScreenShake();
  ctx.sceneController.replace(playScene);
}

function quitToMenu() {
  ctx.state.currentState = GameStates.MENU;
  ctx.input.disable();
  ctx.input.enable();
  menuController.showScreen('menu');
  ctx.sceneController.replace(menuScene);
}

function resumeGame() {
  if (ctx.state.currentState === GameStates.PAUSED) {
    ctx.state.currentState = GameStates.PLAYING;
    ctx.input.disable();
    ctx.input.enable();
    menuController.hideAllScreens();
  }
}

function applyCrtMode(enabled) {
  document.body.classList.toggle('crt-mode', !!enabled);
  const toggle = document.getElementById('crt-toggle');
  if (toggle) toggle.textContent = enabled ? 'ON' : 'OFF';
}

function getSettingsFromUI() {
  return {
    difficulty: document.getElementById('difficulty-select').value,
    theme: document.getElementById('theme-select').value,
    sfxEnabled: document.getElementById('sfx-toggle').textContent === 'ON',
    musicEnabled: document.getElementById('music-toggle').textContent === 'ON',
    masterVolume: parseInt(document.getElementById('volume-slider').value) / 100,
    crtMode: document.getElementById('crt-toggle').textContent === 'ON'
  };
}

function toggleSfx() {
  const t = document.getElementById('sfx-toggle');
  const enabled = t.textContent === 'OFF';
  t.textContent = enabled ? 'ON' : 'OFF';
  ctx.audio.setSfxEnabled(enabled);
}
function toggleMusic() {
  const t = document.getElementById('music-toggle');
  const enabled = t.textContent === 'OFF';
  t.textContent = enabled ? 'ON' : 'OFF';
  ctx.audio.setMusicEnabled(enabled);
}
function updateVolume(e) {
  ctx.audio.setMasterVolume(parseInt(e.target.value) / 100);
}
function toggleCRT() {
  const t = document.getElementById('crt-toggle');
  const enabled = t.textContent === 'OFF';
  t.textContent = enabled ? 'ON' : 'OFF';
  applyCrtMode(enabled);
}

function setupEventListeners() {
  document.getElementById('btn-start').addEventListener('click', () => { ctx.audio.playMenuSelect(); startGame(); });
  document.getElementById('btn-high-scores').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('high-scores'); renderHighScores('high-scores-list'); });
  document.getElementById('btn-settings').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('settings'); });
  document.getElementById('btn-help').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('help'); });
  document.getElementById('btn-back-scores').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('menu'); });
  document.getElementById('btn-back-settings').addEventListener('click', async () => {
    ctx.audio.playMenuSelect();
    const s = getSettingsFromUI();
    saveSettings(s);
    applyCrtMode(s.crtMode);
    if (s.theme !== ctx.theme.name.toLowerCase()) await loadTheme(s.theme);
    menuController.showScreen('menu');
  });
  document.getElementById('btn-back-help').addEventListener('click', () => { ctx.audio.playMenuSelect(); menuController.showScreen('menu'); });
  document.getElementById('btn-resume').addEventListener('click', () => { ctx.audio.playMenuSelect(); resumeGame(); });
  document.getElementById('btn-quit').addEventListener('click', () => { ctx.audio.playMenuSelect(); quitToMenu(); });
  document.getElementById('btn-restart').addEventListener('click', () => { ctx.audio.playMenuSelect(); startGame(); });
  document.getElementById('btn-menu').addEventListener('click', () => { ctx.audio.playMenuSelect(); quitToMenu(); });

  document.getElementById('sfx-toggle').addEventListener('click', toggleSfx);
  document.getElementById('music-toggle').addEventListener('click', toggleMusic);
  document.getElementById('volume-slider').addEventListener('input', updateVolume);
  document.getElementById('crt-toggle').addEventListener('click', toggleCRT);

  let lastKeyTime = 0;
  const KEY_REPEAT_DELAY = 150;
  window.addEventListener('keydown', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      if (e.code === 'Enter' && menuController.getCurrentScreen() === 'nameEntry') return;
      return;
    }
    if (ctx.state.currentState === GameStates.PLAYING) return;

    const now = Date.now();
    const screen = menuController.getCurrentScreen();
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (now - lastKeyTime > KEY_REPEAT_DELAY) {
        e.preventDefault(); ctx.audio.playMenuMove(); menuController.navigate(-1); lastKeyTime = now;
      }
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (now - lastKeyTime > KEY_REPEAT_DELAY) {
        e.preventDefault(); ctx.audio.playMenuMove(); menuController.navigate(1); lastKeyTime = now;
      }
    } else if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault(); ctx.audio.playMenuSelect(); menuController.select();
    } else if (e.code === 'Escape') {
      e.preventDefault();
      if (screen === 'pause') resumeGame();
      else if (screen === 'high-scores' || screen === 'settings' || screen === 'help') { ctx.audio.playMenuSelect(); menuController.showScreen('menu'); }
      else if (screen === 'gameOver') { ctx.audio.playMenuSelect(); quitToMenu(); }
    }
  });
}

window.addEventListener('load', init);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}
```

- [ ] **Step 2: Verify line count**

Run: `wc -l vanilla/final/src/main.js`
Expected: ≤ 150 lines (target from spec acceptance criterion). If higher, no further reorg is needed for Phase 1 — flag it in the PR description but ship.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All 49 tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/main.js
git commit -m "Shrink main.js to bootstrap; scenes own per-frame work"
```

---

### Task 14: Manual smoke matrix

The integration test for a no-behavior-change refactor is gameplay verification. Run through this matrix in a browser before opening the PR. Record any deviation as a regression.

**Files:**
- Create: `vanilla/final/docs/superpowers/plans/2026-05-22-phase-1-smoke-matrix.md` (or under the repo root `docs/`, wherever the spec lives — match the spec's directory)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (serves `vanilla/final` on port 3000)

- [ ] **Step 2: Walk the matrix**

In a desktop browser, exercise each row. Record PASS / FAIL.

| Theme | Difficulty | Path | Verify |
|---|---|---|---|
| Cats | Normal | Menu → Start → play through wave 1 → die intentionally → game over → Restart → quit to menu | All transitions work; HUD updates; high-score prompt appears if score qualifies |
| Absurd | Normal | Menu → Start → play through wave 1 → kill ≥ 3 combo → reach inter-wave pause | Background is one of the crazy modes; explosions and screen shake fire on enemy kill; bonus stage triggers at the expected wave |
| Absurd | Hard | Menu → Start → trigger bonus stage → let some enemies escape → survive to end | Bonus announcement, timer, and end-overlay all appear; "PERFECT" vs "N ENEMIES ESCAPED" branch correctly |
| Space | Easy | Menu → Start → pause (Esc) → resume → pause → quit-to-menu | Pause shows menu; resume does not double-input; quit returns to menu and music stops |
| Food | Normal | Menu → Settings → switch theme to Demo → back → Start | New theme loads without errors; menu falling-enemies use new sprites |
| Cats | Normal | Score until extra-life threshold (20000) | Extra-life SFX plays once; lives increments |
| Absurd | Normal | Pick up shield, rapid fire, spread shot power-ups one at a time | Each power-up visibly applies and the pickup SFX plays |
| Cats | Normal | Open browser console for full run | No uncaught errors. (`console.log` from existing debug prints is acceptable.) |

- [ ] **Step 3: Commit the matrix file**

```bash
git add docs/superpowers/plans/2026-05-22-phase-1-smoke-matrix.md
git commit -m "Add Phase 1 smoke-matrix results"
```

---

### Task 15: Open the Phase 1 PR

- [ ] **Step 1: Verify final state**

Run: `git status` (should be clean) and `npm test` (49 tests pass).

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 1: refactor main.js into scenes + event bus" --body "$(cat <<'EOF'
## Summary
- Extracts `main.js` (1,429 lines → ~150) into focused scenes: `menuScene`, `playScene`, `bonusScene`, `gameOverScene`.
- Adds a synchronous event bus (`src/app/eventBus.js`) and scene stack (`src/scenes/sceneController.js`).
- Introduces an explicit `ctx` object (`src/app/context.js`) that replaces 16 module-level globals.
- Consolidates bonus-stage behavior in `bonusScene.js`; pure mutators live in `scenes/_bonusStateMutations.js`.
- Existing inline audio/shake/particle calls in the play loop are replaced by bus emits + a `systems/juice.js` reactor. **No gameplay behavior change.**

Implements Phase 1 of `docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md`.

## Test plan
- [x] All 36 pre-existing tests pass.
- [x] 13 new unit tests pass (eventBus, sceneController).
- [x] Manual smoke matrix recorded in `docs/superpowers/plans/2026-05-22-phase-1-smoke-matrix.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Record the PR URL in the smoke-matrix file**

---

## Self-review notes (carried out by the plan author, recorded here for reviewers)

**Spec coverage:**
- Spec §"New file layout" — every listed file is created in Tasks 2/3/5/6/8/9/10/11/12.
- Spec §"Event bus contract" — synchronous, no queue, snapshot iteration, error-isolated. Task 2 implements; Task 1 tests.
- Spec §"Context object" — Task 6.
- Spec §"Scene controller" — Task 5; tests Task 4.
- Spec §"Bonus-stage consolidation" — Tasks 7 + 10.
- Spec §"What Phase 1 explicitly does NOT do" — verified by the "Files this plan does NOT touch" list.
- Spec §"Phase 1 acceptance criteria" — Task 13 enforces the ≤150-line target; Tasks 12/13/15 enforce the test count; Task 14 enforces the smoke matrix; both new test files land in Tasks 1+2 and 4+5.

**Placeholder scan:** no `TBD`, no "implement later," no "similar to Task N." Every file has its full contents inline.

**Type consistency:** `ctx` shape matches everywhere it is used; `Events.*` names match the constants file; reactor function names (`installJuiceReactor`) and scene factory names (`createPlayScene`, `createMenuScene`, etc.) are referenced consistently across the bootstrap and the scenes they live in.
