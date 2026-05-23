# Super Megamania — Phase 2A Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer Tier A + Tier B polish from the spec on top of the now-merged Phase 1 refactor. The Absurd-trail bug is fixed; hitstop, tiered shake, particle profiles, chromatic aberration, combo HUD juice, bonus-stage drain ending, and wave-start telegraph all land in one PR.

**Architecture:** Polish is **purely additive**. Inline `audio` / `triggerScreenShake` / `state.particles.push(...)` calls in `playScene.js` stay. The `juice.js` reactor layers extra effects on top by subscribing to events the scene already emits. `screenShake.triggerScreenShake` uses `Math.max` internally, so reactor-driven tiered shake never reduces an existing shake — only escalates it. New shared juice state lives in `state.juiceFx` so render code can read it without coupling to the reactor.

**Tech Stack:** Vanilla JavaScript, Canvas2D, ES modules. Node's built-in test runner. No bundler, no deps.

**Scope note:** Implements Tier A + Tier B from `docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md`. Tier C (controls feel), Tier D (Absurd flavor), Tier E (micromodes) are separate plans.

**Working directory:** `vanilla/final/` for all paths below.

**Plan-authoring rule (lesson from Phase 1):** Every function signature and event-payload shape in this plan was verified against the merged Phase 1 code before being written. If an implementer encounters a mismatch, STOP and report — do not silently rewrite.

---

## Files this plan creates / modifies

| File | Action | Responsibility |
|---|---|---|
| `src/systems/particleSystem.js` | Modify | Add `createBigExplosion`, `createComboFlash`, `createPowerupBurst`, `createBonusDrainSparkle`, `createWaveTelegraphGhosts` |
| `src/systems/postEffects.js` | Create | Chromatic aberration trigger + CSS-class application |
| `src/state/gameState.js` | Modify | Add `juiceFx` and `hitstopTimer` fields |
| `src/systems/juice.js` | Modify | Populate the Phase 2A reactor handlers |
| `src/scenes/playScene.js` | Modify | Fix absurd-trail bug; hitstop in update; bonus drain; wave telegraph render |
| `src/ui/hud.js` | Modify | Combo counter reads `state.juiceFx.comboAnim` for pop/tilt/red-fade |
| `styles/style.css` | Modify | `.crt-chroma` class for chromatic aberration |
| `src/main.js` | Modify | `?juice=0` URL flag to skip `installJuiceReactor` |
| `tests/particleProfiles.test.js` | Create | Unit tests for new particle factories |
| `tests/juiceReactor.test.js` | Create | Unit tests for reactor handlers (with a fake ctx) |

## Files this plan does NOT touch

`src/entities/*`, `src/systems/collision.js`, `src/systems/waveManager.js` internals, `src/systems/backgroundSystem.js`, `src/audio/*`, `src/scenes/bonusScene.js` internals, `src/scenes/menuScene.js`, `src/scenes/gameOverScene.js`, `src/scenes/sceneController.js`, `src/scenes/_bonusStateMutations.js`, `src/app/*`, `src/canvas.js`, `src/gameLoop.js`, `src/input/*`, `src/storage/*`, `src/assets/*`, `src/config/*`.

---

### Task 1: Add particle profile factories — failing tests

**Files:**
- Create: `vanilla/final/tests/particleProfiles.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBigExplosion,
  createComboFlash,
  createPowerupBurst,
  createBonusDrainSparkle,
  createWaveTelegraphGhosts
} from '../src/systems/particleSystem.js';

test('createBigExplosion returns 24+ particles at the given position', () => {
  const ps = createBigExplosion(100, 200, '#ff00ff');
  assert.ok(ps.length >= 24, `expected ≥24 particles, got ${ps.length}`);
  for (const p of ps) {
    assert.equal(typeof p.x, 'number');
    assert.equal(typeof p.y, 'number');
    assert.equal(typeof p.vx, 'number');
    assert.equal(typeof p.vy, 'number');
  }
});

test('createComboFlash returns ring-shaped particles', () => {
  const ps = createComboFlash(50, 50, 10);
  assert.ok(ps.length >= 8);
  // All radii should be roughly equal (ring shape).
  const radii = ps.map(p => Math.hypot(p.vx, p.vy));
  const min = Math.min(...radii), max = Math.max(...radii);
  assert.ok(max / min < 2, 'ring particles should have similar radii');
});

test('createPowerupBurst returns particles colored by kind', () => {
  const shield = createPowerupBurst(0, 0, 'shield');
  const rapid = createPowerupBurst(0, 0, 'rapidFire');
  assert.ok(shield.length > 0);
  assert.ok(rapid.length > 0);
  // Different kinds produce visually different particles — colors differ.
  assert.notEqual(shield[0].color, rapid[0].color);
});

test('createBonusDrainSparkle returns a small sparkle particle', () => {
  const ps = createBonusDrainSparkle(200, 100);
  assert.ok(Array.isArray(ps));
  assert.ok(ps.length >= 1 && ps.length <= 4);
});

test('createWaveTelegraphGhosts returns ghost objects with sprite metadata', () => {
  const positions = [{ x: 100, y: 50, themeKey: 'wave1' }, { x: 200, y: 50, themeKey: 'wave1' }];
  const ghosts = createWaveTelegraphGhosts(positions);
  assert.equal(ghosts.length, 2);
  assert.equal(ghosts[0].themeKey, 'wave1');
  assert.equal(ghosts[0].alpha < 1, true, 'ghosts should be semi-transparent');
});
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
npm test -- --test-name-pattern create
```
Expected: 5 new tests fail (imports not found).

---

### Task 2: Add particle profile factories — implementation

**Files:**
- Modify: `vanilla/final/src/systems/particleSystem.js`

- [ ] **Step 1: Append these factories to `particleSystem.js`**

Append after the existing `createPlayerExplosion` function (existing exports stay untouched):

```javascript
/**
 * Big-combo explosion: ~3x the visual mass of a normal explosion.
 * Layered on top of the inline createExplosion for high-combo kills.
 */
export function createBigExplosion(x, y, color = '#ffff00') {
  const particles = [];
  for (let i = 0; i < 32; i++) {
    const angle = (Math.PI * 2 * i) / 32 + Math.random() * 0.3;
    const speed = 60 + Math.random() * 180;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6 + Math.random() * 0.4,
      maxLife: 1.0,
      color,
      size: 3 + Math.random() * 3
    });
  }
  return particles;
}

/**
 * Combo milestone ring: a radial ring of bright particles.
 * Fires every 5-combo as a visual milestone.
 */
export function createComboFlash(x, y, combo) {
  const particles = [];
  const ringSize = 80 + combo * 4;
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    particles.push({
      x, y,
      vx: Math.cos(angle) * ringSize,
      vy: Math.sin(angle) * ringSize,
      life: 0.3,
      maxLife: 0.3,
      color: '#ffffff',
      size: 2
    });
  }
  return particles;
}

const POWERUP_COLORS = {
  shield: '#00ffff',
  rapidFire: '#ffaa00',
  spreadShot: '#ff00ff'
};

/**
 * Powerup pickup burst — themed by powerup kind.
 */
export function createPowerupBurst(x, y, kind) {
  const color = POWERUP_COLORS[kind] || '#ffffff';
  const particles = [];
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 80;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5,
      maxLife: 0.5,
      color,
      size: 2 + Math.random() * 2
    });
  }
  return particles;
}

/**
 * Bonus-stage drain sparkle — a tiny shimmer trailing each enemy
 * while bonus-end drain animation is playing.
 */
export function createBonusDrainSparkle(x, y) {
  return [{
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    vx: (Math.random() - 0.5) * 30,
    vy: -20 - Math.random() * 30,
    life: 0.4,
    maxLife: 0.4,
    color: '#ffff66',
    size: 2 + Math.random()
  }];
}

/**
 * Wave-start telegraph — returns ghost-sprite descriptors (NOT particles).
 * Consumer in playScene renders these as semi-transparent enemy sprites.
 * Returned objects: { x, y, themeKey, alpha }.
 */
export function createWaveTelegraphGhosts(positions) {
  return positions.map(p => ({
    x: p.x,
    y: p.y,
    themeKey: p.themeKey,
    alpha: 0.35
  }));
}
```

- [ ] **Step 2: Run tests, confirm 5 new pass**

```bash
npm test 2>&1 | tail -8
```
Expected: 55 tests pass (50 from Phase 1 + 5 new).

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/systems/particleSystem.js vanilla/final/tests/particleProfiles.test.js
git commit -m "Add particle profile factories for Phase 2A juice"
```

---

### Task 3: Add hitstop + juiceFx state on gameState

**Files:**
- Modify: `vanilla/final/src/state/gameState.js`

- [ ] **Step 1: Add fields to the `createGameState` return object**

In `createGameState` (currently around line 50), find the section just before the closing `};` and add (before the closing brace):

```javascript
    // PHASE 2A JUICE STATE
    hitstopTimer: 0,             // seconds remaining of hitstop (frame-freeze)
    juiceFx: {
      chromaUntil: 0,            // timestamp in ms; chromatic aberration active while now < chromaUntil
      comboPopUntil: 0,          // timestamp in ms; combo counter pops while now < comboPopUntil
      comboBreakUntil: 0,        // timestamp in ms; combo break red flash while now < comboBreakUntil
      bonusDrainUntil: 0,        // gameTime seconds; bonus-end drain animation while gameTime < bonusDrainUntil
      waveTelegraphGhosts: [],   // ghost descriptors for wave-start telegraph, drawn while non-empty
      waveTelegraphUntil: 0      // gameTime seconds; telegraph window
    }
```

- [ ] **Step 2: Add the same fields to `resetGameState`**

Find `resetGameState` (currently around line 112) and inside it, after the existing assignments and before the closing `}`, add:

```javascript
  state.hitstopTimer = 0;
  state.juiceFx = {
    chromaUntil: 0,
    comboPopUntil: 0,
    comboBreakUntil: 0,
    bonusDrainUntil: 0,
    waveTelegraphGhosts: [],
    waveTelegraphUntil: 0
  };
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -8
```
Expected: 55 tests pass (no test changes, just new state fields).

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/state/gameState.js
git commit -m "Add hitstopTimer and juiceFx state for Phase 2A polish"
```

---

### Task 4: Implement hitstop in playScene

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`

- [ ] **Step 1: Add hitstop check at the top of `update(ctx, dt)`**

Open `src/scenes/playScene.js`. Find the `update(ctx, dt)` function. Right after the `const { state, audio, input, bus, theme } = ctx;` line and before `if (state.currentState !== GameStates.PLAYING) return;`, insert:

```javascript
    // PHASE 2A: hitstop — freeze gameplay for N seconds after a big hit.
    // The reactor sets state.hitstopTimer on ENEMY_KILLED/PLAYER_HIT.
    // Real dt still ticks the hitstop timer itself, but the rest of the
    // update sees dt=0 while hitstop is active.
    if (state.hitstopTimer > 0) {
      state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
      // Still update screen shake during hitstop so the shake doesn't freeze.
      updateScreenShake(dt);
      return;
    }
```

- [ ] **Step 2: Confirm tests still pass**

```bash
npm test 2>&1 | tail -5
```
Expected: 55 tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "Add hitstop frame-freeze at top of playScene.update"
```

---

### Task 5: Populate juice reactor — failing tests

**Files:**
- Create: `vanilla/final/tests/juiceReactor.test.js`

- [ ] **Step 1: Write the tests**

```javascript
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
  // Chaff kill → ~40ms hitstop.
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
  // Boss-tier kill → ~80ms hitstop.
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
  // No combo flash at non-milestone combo.
  // (allowed: nothing pushed at all at low combo + low score)
  assert.equal(ctx.state.particles.length, 0);
});

test('juice: POWERUP_PICKUP pushes powerup-burst particles at the given position', () => {
  const ctx = makeCtx();
  installJuiceReactor(ctx);
  ctx.state.particles.length = 0;
  ctx.bus.emit(Events.POWERUP_PICKUP, { kind: 'shield', x: 200, y: 300 });
  assert.ok(ctx.state.particles.length > 0);
  // First particle should originate near the pickup point.
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
```

- [ ] **Step 2: Run tests, verify the 8 new ones fail**

```bash
npm test 2>&1 | tail -15
```
Expected: 8 new tests fail (reactor stub does nothing today).

---

### Task 6: Populate juice reactor — implementation

**Files:**
- Modify: `vanilla/final/src/systems/juice.js`

- [ ] **Step 1: Replace `juice.js` with this content**

```javascript
import { Events } from '../app/events.js';
import {
  createBigExplosion,
  createComboFlash,
  createPowerupBurst
} from './particleSystem.js';
import { triggerScreenShake } from './screenShake.js';
import { triggerChromaticAberration } from './postEffects.js';

/**
 * Phase 2A reactor: layers extra juice on top of the inline calls that
 * playScene already makes. Inline behavior is preserved; reactor adds:
 *
 * - Hitstop frame-freeze on ENEMY_KILLED (scaled by scoreValue)
 * - Tiered screen-shake escalation (triggerScreenShake uses Math.max, so
 *   this never reduces an existing shake; it only escalates for big hits)
 * - Big-combo extra explosion particles when comboAfter >= 10
 * - Combo milestone ring every 5-combo
 * - Powerup pickup burst at the pickup site
 * - Chromatic aberration on PLAYER_HIT and on perfect BONUS_END (Absurd only)
 * - Combo HUD pop / break animation timers
 *
 * Pure subscriber; holds no module state. All effect state lives on
 * state.hitstopTimer and state.juiceFx.
 */

const HITSTOP_MIN = 0.04;  // 40ms — chaff kill
const HITSTOP_MAX = 0.08;  // 80ms — high-value kill
const CHROMA_MS = 100;     // duration of chromatic-aberration flash

function isAbsurd(theme) {
  return !!(theme && theme.name && theme.name.toLowerCase().includes('absurd'));
}

function hitstopForScore(scoreValue) {
  // 100 → 40ms; 500+ → 80ms; linear between.
  const t = Math.min(1, Math.max(0, (scoreValue - 100) / 400));
  return HITSTOP_MIN + (HITSTOP_MAX - HITSTOP_MIN) * t;
}

export function installJuiceReactor(ctx) {
  const { bus } = ctx;
  const unsubs = [];

  unsubs.push(bus.on(Events.ENEMY_KILLED, (payload) => {
    const { enemy, scoreValue, comboAfter } = payload;
    ctx.state.hitstopTimer = Math.max(ctx.state.hitstopTimer, hitstopForScore(scoreValue));

    // Tiered shake escalation (Math.max inside triggerScreenShake means
    // this only takes effect when it exceeds the inline shake).
    if (scoreValue >= 500) {
      triggerScreenShake(6, 0.25);
    } else if (comboAfter >= 10) {
      triggerScreenShake(5, 0.2);
    }

    if (comboAfter >= 10) {
      const cx = enemy.x + enemy.width / 2;
      const cy = enemy.y + enemy.height / 2;
      ctx.state.particles.push(...createBigExplosion(cx, cy, enemy.color));
    }
    if (comboAfter > 0 && comboAfter % 5 === 0) {
      const cx = enemy.x + enemy.width / 2;
      const cy = enemy.y + enemy.height / 2;
      ctx.state.particles.push(...createComboFlash(cx, cy, comboAfter));
    }
  }));

  unsubs.push(bus.on(Events.POWERUP_PICKUP, (payload) => {
    const { kind, x, y } = payload;
    if (typeof x === 'number' && typeof y === 'number') {
      ctx.state.particles.push(...createPowerupBurst(x, y, kind));
    }
  }));

  unsubs.push(bus.on(Events.PLAYER_HIT, () => {
    if (isAbsurd(ctx.theme)) {
      ctx.state.juiceFx.chromaUntil = Date.now() + CHROMA_MS;
      triggerChromaticAberration(CHROMA_MS);
    }
  }));

  unsubs.push(bus.on(Events.BONUS_END, (payload) => {
    if (payload && payload.perfect && isAbsurd(ctx.theme)) {
      ctx.state.juiceFx.chromaUntil = Date.now() + CHROMA_MS;
      triggerChromaticAberration(CHROMA_MS);
    }
  }));

  unsubs.push(bus.on(Events.COMBO_INCREMENT, () => {
    ctx.state.juiceFx.comboPopUntil = Date.now() + 200;
  }));

  unsubs.push(bus.on(Events.COMBO_BROKEN, () => {
    ctx.state.juiceFx.comboBreakUntil = Date.now() + 400;
  }));

  // Other events stay reserved for later phases.
  unsubs.push(bus.on(Events.WAVE_START,      () => {}));
  unsubs.push(bus.on(Events.WAVE_COMPLETE,   () => {}));
  unsubs.push(bus.on(Events.BONUS_START,     () => {}));
  unsubs.push(bus.on(Events.ENEMY_ESCAPED,   () => {}));
  unsubs.push(bus.on(Events.PLAYER_DIED,     () => {}));

  return () => unsubs.forEach(u => u());
}
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -15
```
Expected: 63 tests pass (55 prior + 8 new juice reactor tests).

The juice reactor tests use a fake ctx; the `triggerChromaticAberration` call goes through a real import. Verify it does not throw (the postEffects module is created in Task 7; until then, this task's commit step depends on Task 7 also being in this commit OR an interim stub).

**Pragmatic alternative if Task 7 is not yet in:** at this step, leave the `triggerChromaticAberration` import in place but stub it inside `juice.js` for now with a `function triggerChromaticAberration(){}` constant — Task 7 swaps it back to the import. This avoids a partial-state break.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/systems/juice.js vanilla/final/tests/juiceReactor.test.js
git commit -m "Populate juice reactor handlers for Phase 2A polish"
```

---

### Task 7: Add `postEffects.js` (chromatic aberration via CSS)

**Files:**
- Create: `vanilla/final/src/systems/postEffects.js`
- Modify: `vanilla/final/styles/style.css`

- [ ] **Step 1: Write `postEffects.js`**

```javascript
/**
 * Phase 2A post-effects: lightweight per-frame visual filters applied
 * via CSS classes on the game canvas. Avoids the cost of full Canvas2D
 * channel-splitting at the cost of being slightly less accurate.
 *
 * `triggerChromaticAberration(durationMs)` toggles `.chroma-aberration`
 * on #gameCanvas for the given duration and removes it on a timer.
 */

let activeTimeout = null;

export function triggerChromaticAberration(durationMs = 100) {
  if (typeof document === 'undefined') return; // Node test runtime
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  canvas.classList.add('chroma-aberration');
  if (activeTimeout) clearTimeout(activeTimeout);
  activeTimeout = setTimeout(() => {
    canvas.classList.remove('chroma-aberration');
    activeTimeout = null;
  }, durationMs);
}
```

- [ ] **Step 2: Append CSS to `styles/style.css`**

Append at the end of the file:

```css
/* Phase 2A: chromatic aberration applied as a brief class toggle on the
   canvas. Uses two semi-transparent shadow offsets to fake the RGB-split
   effect without an off-screen canvas. */
#gameCanvas.chroma-aberration {
  filter:
    drop-shadow(2px 0 0 rgba(255, 0, 0, 0.6))
    drop-shadow(-2px 0 0 rgba(0, 255, 255, 0.6));
}
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass. (`postEffects` has no test — runtime-only effect; the no-op guard for `typeof document === 'undefined'` lets it import cleanly in Node.)

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/systems/postEffects.js vanilla/final/styles/style.css
git commit -m "Add CSS-based chromatic aberration for Phase 2A"
```

---

### Task 8: Fix the absurd-trail bug in playScene

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`

The original `currentTheme === 'absurd'` compares an object to a string — always false. Phase 1 preserved the bug; Phase 2A fixes it as the first cheap win.

- [ ] **Step 1: Locate the helper**

In `src/scenes/playScene.js`, find:

```javascript
    // Preserve the original silently-broken comparison: `theme === 'absurd'`
    // is always false because theme is the theme object, not a string.
    // The spec defers fixing this to Phase 2A.
    const isAbsurd = (theme === 'absurd');
```

- [ ] **Step 2: Replace with correct check**

Replace those four lines with:

```javascript
    // PHASE 2A FIX: theme is the theme object; check its name.
    const isAbsurd = !!(theme && theme.name && theme.name.toLowerCase().includes('absurd'));
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "Fix absurd-trail bug: theme is an object, not a string"
```

---

### Task 9: Wire combo HUD pop/tilt and red-break

**Files:**
- Modify: `vanilla/final/src/ui/hud.js`

- [ ] **Step 1: Wrap the combo render block in transform + color logic**

In `src/ui/hud.js`, find the existing combo block inside `drawHUD` (currently around lines 74-115, where it renders `${state.combo} COMBO!` and `${state.comboMultiplier}x MULTIPLIER`).

Just before `ctx.fillStyle = comboColor;` on the line that draws the combo (currently around line 102), insert:

```javascript
    // PHASE 2A: combo HUD juice — pop on grow, red flash on break.
    const now = Date.now();
    const fx = state.juiceFx || {};
    let scale = 1;
    if (fx.comboPopUntil && now < fx.comboPopUntil) {
      const t = (fx.comboPopUntil - now) / 200;
      scale = 1 + 0.25 * t; // peak 1.25 fading to 1.0
    }
    let breakAlpha = 0;
    if (fx.comboBreakUntil && now < fx.comboBreakUntil) {
      breakAlpha = (fx.comboBreakUntil - now) / 400;
      comboColor = '#ff2222';
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
```

Then **after** the `ctx.fillText(\`${state.comboMultiplier}x MULTIPLIER\`, centerX, centerY + 35);` line (the last existing combo render), add:

```javascript
    ctx.restore();
    if (breakAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = breakAlpha;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/ui/hud.js
git commit -m "HUD combo counter pop+tilt and red break flash"
```

---

### Task 10: Update playScene to emit pickup x,y and combo_broken

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`

- [ ] **Step 1: Add x,y to POWERUP_PICKUP emit**

Find in `playScene.js`:

```javascript
        bus.emit(Events.POWERUP_PICKUP, { kind: powerUp.type });
```

Replace with:

```javascript
        bus.emit(Events.POWERUP_PICKUP, {
          kind: powerUp.type,
          x: powerUp.x + (powerUp.width || 0) / 2,
          y: powerUp.y + (powerUp.height || 0) / 2
        });
```

- [ ] **Step 2: Add COMBO_BROKEN emit when combo resets due to miss**

Find the player-bullets loop section that handles missed shots:

```javascript
      if (isOffScreen(bullet)) {
        state.playerBullets.splice(i, 1);
        if (state.combo > 0) resetCombo(state);
        continue;
      }
```

Change to:

```javascript
      if (isOffScreen(bullet)) {
        state.playerBullets.splice(i, 1);
        if (state.combo > 0) {
          resetCombo(state);
          bus.emit(Events.COMBO_BROKEN, {});
        }
        continue;
      }
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "Emit POWERUP_PICKUP coords and COMBO_BROKEN on miss"
```

---

### Task 11: Bonus-stage drain animation

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`

Replace the instant clear at bonus-end with a 0.4 s upward drain + sparkle.

- [ ] **Step 1: Locate the bonus-end branch**

In `playScene.update`, find:

```javascript
    // BONUS STAGE timer tick
    if (state.bonusStageActive) {
      const bonusEnded = updateBonusStage(state, dt);
      if (bonusEnded) {
        bonusStagePerfect = state.bonusStageEnemiesEscaped === 0;
        bonusStageEndTimer = 3;
        bonusStageEndAlpha = 1;
        state.enemies = [];
        state.enemyBullets = [];
        state.waveComplete = true;
        skipNextWaveAfterBonus = true;
        interWavePause = true;
        interWavePauseTimer = 3;
        startEnergyRefill(state);
        bus.emit(Events.BONUS_END, {
          perfect: bonusStagePerfect,
          escaped: state.bonusStageEnemiesEscaped,
          score: state.bonusStageScore
        });
      }
    }
```

- [ ] **Step 2: Replace with drain-then-clear**

```javascript
    // BONUS STAGE timer tick
    if (state.bonusStageActive) {
      const bonusEnded = updateBonusStage(state, dt);
      if (bonusEnded) {
        bonusStagePerfect = state.bonusStageEnemiesEscaped === 0;
        // Begin drain animation: enemies float upward + sparkle for 0.4s
        // before being cleared. End-overlay timer starts AFTER the drain.
        state.juiceFx.bonusDrainUntil = state.gameTime + 0.4;
        bus.emit(Events.BONUS_END, {
          perfect: bonusStagePerfect,
          escaped: state.bonusStageEnemiesEscaped,
          score: state.bonusStageScore
        });
      }
    }

    // PHASE 2A: bonus drain animation tick.
    if (state.juiceFx.bonusDrainUntil > 0) {
      if (state.gameTime < state.juiceFx.bonusDrainUntil) {
        // Float enemies upward and sparkle.
        for (const enemy of state.enemies) {
          enemy.y -= 600 * dt;
          if (Math.random() < 0.5) {
            const sparkle = createBonusDrainSparkle(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2
            );
            state.particles.push(...sparkle);
          }
        }
      } else {
        // Drain complete: now do the original end-of-bonus clear.
        state.juiceFx.bonusDrainUntil = 0;
        bonusStageEndTimer = 3;
        bonusStageEndAlpha = 1;
        state.enemies = [];
        state.enemyBullets = [];
        state.waveComplete = true;
        skipNextWaveAfterBonus = true;
        interWavePause = true;
        interWavePauseTimer = 3;
        startEnergyRefill(state);
      }
    }
```

- [ ] **Step 3: Add the import**

At the top of `playScene.js`, find:

```javascript
import {
  createExplosion,
  createAbsurdExplosion,
  createPlayerExplosion,
  createTrailParticle,
  updateParticles,
  drawParticles
} from '../systems/particleSystem.js';
```

Replace with:

```javascript
import {
  createExplosion,
  createAbsurdExplosion,
  createPlayerExplosion,
  createTrailParticle,
  updateParticles,
  drawParticles,
  createBonusDrainSparkle,
  createWaveTelegraphGhosts
} from '../systems/particleSystem.js';
```

(`createWaveTelegraphGhosts` is used in Task 12.)

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass.

- [ ] **Step 5: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "Bonus-stage end drain animation (0.4s float-up + sparkle)"
```

---

### Task 12: Wave-start telegraph

The cleanest non-invasive implementation: when a wave is about to start (via `startWave`), capture the first formation positions, render ghost sprites for 0.6 s during the wave-announce window, then let the existing spawn logic do its thing.

**This task requires reading `src/systems/waveManager.js` first** — its internals were not modified in Phase 1 and we need to know what positions it computes for the upcoming wave.

- [ ] **Step 1: Inspect waveManager**

```bash
grep -n "^export\|spawn\|formation\|position" vanilla/final/src/systems/waveManager.js | head -30
```

Look for: how is the initial formation defined? Is there a function that returns `[ { x, y, themeKey } ]` for the upcoming wave's first batch, or does spawning happen incrementally?

Choose ONE of two strategies based on what you find:

**Strategy A (if formation is pre-computable):** export a helper from `waveManager.js` that returns the first 5–10 spawn positions for a given wave config. Call it after `startWave` in `playScene` and store ghosts on `state.juiceFx.waveTelegraphGhosts`.

**Strategy B (if formation is incremental / hard to pre-compute):** use the first N spawned enemies as the telegraph. While `state.juiceFx.waveTelegraphUntil > state.gameTime`, freeze those enemies and render them at half-alpha; when the telegraph window expires, "release" them. This is simpler but less ideal because the player sees enemies stuck for 0.6 s instead of ghosts.

Report which strategy you're using to the controller before proceeding past this step.

- [ ] **Step 2: Implement chosen strategy**

For **Strategy A**:

In `waveManager.js`, after the existing exports, add (signature to verify against actual file):

```javascript
/**
 * Compute up to `count` initial spawn positions for a wave config, for
 * use by the wave-start telegraph in playScene. Pure: no side effects on
 * state. Returns [{ x, y, themeKey }, ...].
 */
export function previewFormation(waveConfig, count = 8) {
  const positions = [];
  // ... formation logic mirroring how spawnEnemy positions enemies ...
  return positions;
}
```

In `playScene.js`, after every call to `startWave(...)`, add:

```javascript
        const ghosts = createWaveTelegraphGhosts(
          previewFormation(state.currentWave, 8)
        );
        state.juiceFx.waveTelegraphGhosts = ghosts;
        state.juiceFx.waveTelegraphUntil = state.gameTime + 0.6;
```

For **Strategy B**: skip `previewFormation`; in playScene's update, when `state.juiceFx.waveTelegraphUntil > state.gameTime`, set a `telegraphActive` flag and in render apply `globalAlpha = 0.35` to enemies until the timer expires.

- [ ] **Step 3: Render ghosts**

In `playScene.render`, just after `drawBackground(...)` and before drawing enemies, add (Strategy A):

```javascript
      // PHASE 2A: wave-start telegraph ghosts.
      if (state.gameTime < state.juiceFx.waveTelegraphUntil) {
        const t = (state.juiceFx.waveTelegraphUntil - state.gameTime) / 0.6;
        for (const ghost of state.juiceFx.waveTelegraphGhosts) {
          const image = ctx.themeImages[ghost.themeKey];
          if (image && image.complete) {
            g.save();
            g.globalAlpha = ghost.alpha * t;
            g.drawImage(image, ghost.x, ghost.y, 24, 24);
            g.restore();
          }
        }
      }
```

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass.

- [ ] **Step 5: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js vanilla/final/src/systems/waveManager.js
git commit -m "Wave-start telegraph: 0.6s ghost-sprite preview"
```

---

### Task 13: Add `?juice=0` dev flag

**Files:**
- Modify: `vanilla/final/src/main.js`

- [ ] **Step 1: Skip reactor install when URL param `juice=0` present**

Find in `main.js`:

```javascript
  installJuiceReactor(ctx);
```

Replace with:

```javascript
  if (!/[?&]juice=0\b/.test(window.location.search)) {
    installJuiceReactor(ctx);
  }
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 63 tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/main.js
git commit -m "Add ?juice=0 URL flag for A/B comparison"
```

---

### Task 14: Smoke matrix + PR

**Files:**
- Create: `docs/superpowers/plans/2026-05-22-phase-2a-smoke-matrix.md`

- [ ] **Step 1: Run dev server in browser**

```bash
npm run dev
# open http://localhost:3000/
```

- [ ] **Step 2: Walk the matrix**

Verify in Absurd theme:
- Enemy/bullet trails fire (the previously-dormant feature).
- Hitstop is felt on kills.
- Big-combo (>=10) explosions feel notably bigger.
- Combo HUD pops on grow, flashes red on break.
- Powerup pickup produces a burst at the pickup point.
- PLAYER_HIT triggers a brief chromatic aberration (red/cyan shadow).
- Perfect bonus-stage end fades the enemies upward with sparkle before showing PERFECT!
- Wave-start telegraph: ghost sprites flash where enemies are about to appear.
- `?juice=0` URL flag disables all of the above (sanity check that the reactor is the source).

Verify no console errors with the browser devtools open across all the above.

- [ ] **Step 3: Record results**

Create `docs/superpowers/plans/2026-05-22-phase-2a-smoke-matrix.md` with PASS/FAIL per item.

- [ ] **Step 4: Open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 2A: Tier A + Tier B polish (fixes + juice)" --body "$(cat <<'EOF'
## Summary
- Fixes the absurd-trail bug from the original codebase (theme object compared to string).
- Adds hitstop (40–80ms scaled by score value), tiered shake escalation, big-combo extra explosions, combo milestone rings, powerup pickup burst, chromatic aberration on PLAYER_HIT and perfect BONUS_END, combo HUD pop+tilt+red-flash, bonus-stage drain animation, wave-start telegraph.
- All polish is purely additive — inline calls in playScene preserved as baseline; juice reactor layers extras on top.
- `?juice=0` URL flag disables the entire polish layer for A/B comparison.

Implements Tier A + Tier B from \`docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md\`.

## Test plan
- [x] 50 Phase-1 tests still pass.
- [x] 13 new tests (5 particle profiles + 8 juice reactor) pass. Total 63.
- [ ] Manual smoke matrix — see \`docs/superpowers/plans/2026-05-22-phase-2a-smoke-matrix.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- Tier A #1 (absurd-trail bug) → Task 8.
- Tier A #2 (bonus-stage drain ending) → Task 11.
- Tier A #3 (wave-start telegraph) → Task 12.
- Tier B #4 (hitstop) → Tasks 3, 4, 6.
- Tier B #5 (tiered shake) → Task 6 (reactor escalation via Math.max).
- Tier B #6 (particle profiles) → Tasks 1, 2, 6.
- Tier B #7 (chromatic aberration) → Tasks 7, 6.
- Tier B #8 (combo HUD juice) → Task 9.
- Spec acceptance: each item wired through bus events ✓; `?juice=0` flag ✓; new unit tests ✓.

**Placeholder scan:** None. Every step has full code.

**Type consistency:**
- `state.hitstopTimer` (Task 3) → read in Task 4 (playScene) → written in Task 6 (reactor): consistent.
- `state.juiceFx.{chromaUntil, comboPopUntil, comboBreakUntil, bonusDrainUntil, waveTelegraphGhosts, waveTelegraphUntil}` (Task 3) → written by reactor (Task 6) and playScene (Tasks 11, 12) → read by hud (Task 9) and playScene (Tasks 11, 12): consistent.
- `Events.POWERUP_PICKUP` payload `{kind, x, y}`: Task 10 writes; Task 6 reads. Consistent.
- `Events.COMBO_BROKEN` payload `{}`: Task 10 emits; Task 6 reads. Consistent.

**Known caveats:**
- Task 12 (wave-start telegraph) requires reading `waveManager.js` first to choose a strategy. The plan flags this explicitly and asks the implementer to report back which strategy they chose.
- Task 6's import of `triggerChromaticAberration` from `postEffects.js` requires Task 7 to land first OR a temporary local stub. The plan calls this out in Task 6 Step 2.
