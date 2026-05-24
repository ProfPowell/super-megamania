# Super Megamania — Phase 2B Controls Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Tier C from the spec — input buffering for fire + edge friction on player movement. Small "feel" pass; no visual effects, no event-bus work. The kind of change a player can't articulate but can feel.

**Architecture:** Two surgical changes. (1) The input manager gains a `firePressedAt` timestamp on every fire-press edge; `playScene` consumes it to fire a buffered shot if the player tapped within ~80 ms before cooldown ended. (2) The player's `updatePlayer` applies a small linear deceleration in a 16 px friction zone near each side of the play area before the hard-clamp safety net.

**Tech Stack:** Vanilla JavaScript, Canvas2D. Node's built-in test runner. No bundler, no deps.

**Scope note:** Implements **Tier C only** from `docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md`. Tier D (Absurd flavor) and Tier E (micromodes) get their own plans. This plan branches from `main` and is INDEPENDENT of the Phase 2A PR — it touches only `input/inputManager.js`, `entities/player.js`, and `scenes/playScene.js`'s fire-handling block.

**Plan-authoring rule:** Every function signature and field name was verified against the current `main` (post-Phase-1) code at plan-authoring time. The relevant signatures:
- `inputManager.getState()` returns `{ left, right, fire, pause, restart }` (line 36-47 of `inputManager.js`).
- `canFire(player, fireRateModifier = 1)` reads `player.lastFireTime` and compares against `Date.now()` (player.js:67).
- `recordFire(player)` sets `player.lastFireTime = Date.now()` (player.js:77).
- `updatePlayer(player, dt, direction)` advances `player.x` then clamps to `gameConfig.player.moveZone` (player.js:46).

**Working directory:** `vanilla/final/` for all paths.

---

## Files this plan modifies

| File | Action | Responsibility |
|---|---|---|
| `src/input/inputManager.js` | Modify | Track fire press-edge; expose `firePressedAt` in state |
| `src/scenes/playScene.js` | Modify | Use `firePressedAt` to fire buffered shots |
| `src/entities/player.js` | Modify | Edge-friction deceleration in `updatePlayer` |
| `tests/inputBuffering.test.js` | Create | Unit tests for press-edge detection |
| `tests/edgeFriction.test.js` | Create | Unit tests for friction behavior near walls |

## Files this plan does NOT touch

All Phase 1 / 2A files except the three above. No event-bus changes, no juice reactor, no HUD, no rendering changes.

---

### Task 1: Input buffering — failing tests

**Files:**
- Create: `vanilla/final/tests/inputBuffering.test.js`

The strategy: the input manager keeps a `prevFire` boolean and a `firePressedAt` timestamp. Each call to `getState()` recomputes the current fire state from keyboard + touch, then on the transition `false → true` updates `firePressedAt` to `Date.now()`. The returned state object includes `firePressedAt`.

We unit-test by constructing a real `inputManager` and driving it through fake keyboard/touch state changes. The keyboard module exposes `enable`/`disable`/`getState` — but the underlying key state is hard to fake from outside without a real DOM. To keep this test pure, we'll refactor input manager to accept injected `keyboard` and `touch` modules (with a default that wires up the real ones). This is the smallest invasive change that lets us test deterministically.

- [ ] **Step 1: Write the failing tests**

```javascript
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
```

- [ ] **Step 2: Run tests and verify all 6 new tests fail**

```bash
npm test 2>&1 | tail -15
```
Expected: 6 new tests fail (`createInputManager` currently doesn't accept injected modules; doesn't expose `firePressedAt`).

---

### Task 2: Input buffering — implementation

**Files:**
- Modify: `vanilla/final/src/input/inputManager.js`

- [ ] **Step 1: Refactor to accept injected modules + track press edge**

Replace the contents of `vanilla/final/src/input/inputManager.js` with:

```javascript
/**
 * @fileoverview Input manager
 * Combines keyboard and touch input into unified interface.
 * Phase 2B: tracks fire-press edge for input buffering.
 */

import { createKeyboardInput } from './keyboard.js';
import { createTouchInput } from './touch.js';

/**
 * @typedef {Object} InputState
 * @property {boolean} left
 * @property {boolean} right
 * @property {boolean} fire
 * @property {boolean} pause
 * @property {boolean} restart
 * @property {number} firePressedAt - ms timestamp of the most recent false→true fire transition; 0 if never pressed.
 */

/**
 * Create input manager.
 *
 * `deps` is optional and used only by tests to inject fake keyboard/touch
 * modules. In normal use, the default real modules are constructed.
 */
export function createInputManager(deps = null) {
  const keyboard = deps && deps.keyboard ? deps.keyboard : createKeyboardInput();
  const touch    = deps && deps.touch    ? deps.touch    : createTouchInput();

  if (touch.isTouchDevice && touch.isTouchDevice()) {
    touch.show();
  }

  let prevFire = false;
  let firePressedAt = 0;

  return {
    getState() {
      const kbState = keyboard.getState();
      const touchState = touch.getState();
      const fire = !!(kbState.fire || touchState.fire);

      if (fire && !prevFire) {
        firePressedAt = Date.now();
      }
      prevFire = fire;

      return {
        left:  !!(kbState.left  || touchState.left),
        right: !!(kbState.right || touchState.right),
        fire,
        pause:   !!kbState.pause,
        restart: !!kbState.restart,
        firePressedAt
      };
    },

    getDirection() {
      const state = this.getState();
      if (state.left && !state.right) return -1;
      if (state.right && !state.left) return 1;
      return 0;
    },

    enable() {
      keyboard.enable();
      touch.enable();
    },

    disable() {
      keyboard.disable();
      touch.disable();
      // Reset press-edge tracking so re-enable doesn't see a stale "still held" state.
      prevFire = false;
    },

    showTouchControls() {
      if (touch.show) touch.show();
    },

    hideTouchControls() {
      if (touch.hide) touch.hide();
    }
  };
}
```

- [ ] **Step 2: Run tests, confirm 6 new pass + existing 50 still pass**

```bash
npm test 2>&1 | tail -10
```
Expected: 56 tests pass (50 baseline + 6 new). (If Phase 2A has merged, the baseline is 63 instead; in that case 69 total.)

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/input/inputManager.js vanilla/final/tests/inputBuffering.test.js
git commit -m "Track fire press-edge in inputManager (firePressedAt)"
```

---

### Task 3: Wire buffered fire in playScene

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`

The existing fire-handling block (around line 244 of the post-Phase-1 file) is:

```javascript
    if (inputState.fire) {
      let fireRateModifier = 1;
      if (hasPowerUp(state, 'rapidFire')) {
        fireRateModifier = 0.33;
      }
      if (canFire(state.player, fireRateModifier)) {
        // ... create bullets ...
        recordFire(state.player);
        audio.playPlayerFire();
      }
    }
```

We need to fire ALSO when fire is currently released but was tapped within the buffer window AND we haven't already fired since that press.

- [ ] **Step 1: Add the buffered-fire helper at the top of `update(ctx, dt)`**

Find the fire-handling block. Replace the outer guard `if (inputState.fire) {` with:

```javascript
    const FIRE_BUFFER_MS = 80;
    const wantsToFire = inputState.fire || (
      inputState.firePressedAt > 0 &&
      Date.now() - inputState.firePressedAt < FIRE_BUFFER_MS &&
      inputState.firePressedAt > state.player.lastFireTime
    );

    if (wantsToFire) {
```

The closing `}` of the `if (inputState.fire) {` block stays where it is.

**Why this works:**
- `inputState.fire` true → currently held, fire as fast as `canFire` allows (preserves existing rapid-fire feel).
- Else `firePressedAt > 0 && within 80ms && press timestamp newer than last fire time` → a buffered tap that hasn't been consumed yet. Fires once when `canFire` is true.
- After firing, `recordFire(state.player)` sets `lastFireTime = Date.now()`, which is now ≥ `firePressedAt`, so the buffer condition becomes false until the next press.

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 56 tests pass.

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "playScene: fire buffered shots within 80ms of late tap"
```

---

### Task 4: Edge friction — failing tests

**Files:**
- Create: `vanilla/final/tests/edgeFriction.test.js`

Test the pure motion math: when the player is near a wall AND moving toward it, the per-frame displacement should be less than `direction * speed * dt`.

- [ ] **Step 1: Write the failing tests**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, updatePlayer } from '../src/entities/player.js';
import { gameConfig } from '../src/config/gameConfig.js';

function makePlayerAt(x) {
  const p = createPlayer();
  p.x = x;
  return p;
}

test('edge friction: far from walls, displacement equals speed*dt', () => {
  const p = makePlayerAt(320); // dead center
  const before = p.x;
  updatePlayer(p, 1 / 60, 1);
  const moved = p.x - before;
  const expected = p.speed * (1 / 60);
  assert.ok(Math.abs(moved - expected) < 0.001,
    `expected unfriction ${expected}, got ${moved}`);
});

test('edge friction: near left wall + moving left, displacement is dampened', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.minX + 4); // 4 px from left
  const before = p.x;
  updatePlayer(p, 1 / 60, -1);
  const moved = before - p.x; // moving left = x decreases
  const fullSpeed = p.speed * (1 / 60);
  assert.ok(moved < fullSpeed,
    `near left wall moved=${moved} should be < fullSpeed=${fullSpeed}`);
  assert.ok(moved > 0, 'should still move a little');
});

test('edge friction: near right wall + moving right, displacement is dampened', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.maxX - p_width(p) - 4);
  const before = p.x;
  updatePlayer(p, 1 / 60, 1);
  const moved = p.x - before;
  const fullSpeed = p.speed * (1 / 60);
  assert.ok(moved < fullSpeed && moved > 0,
    `near right wall moved=${moved} should be 0 < x < ${fullSpeed}`);
});

test('edge friction: near left wall + moving RIGHT (away), no friction', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.minX + 4);
  const before = p.x;
  updatePlayer(p, 1 / 60, 1);
  const moved = p.x - before;
  const expected = p.speed * (1 / 60);
  assert.ok(Math.abs(moved - expected) < 0.001,
    `moving away from wall should not be friction-ed: expected ${expected}, got ${moved}`);
});

test('edge friction: hard clamp still works at the boundary', () => {
  const bounds = gameConfig.player.moveZone;
  const p = makePlayerAt(bounds.minX);
  updatePlayer(p, 1, -1); // big dt, push hard into the wall
  assert.equal(p.x, bounds.minX, 'should clamp to minX');
});

// Helper for the right-wall test above
function p_width(p) { return p.width; }
```

- [ ] **Step 2: Run, verify 5 new tests fail**

```bash
npm test 2>&1 | tail -15
```
Expected: tests that involve friction (the middle 3) fail; the unfriction + clamp tests pass against existing code.

Actually with the current implementation:
- "far from walls" → passes
- "near left + moving left" → fails (displacement equals full speed*dt; hard clamp only at the exact boundary, not 4 px away)
- "near right + moving right" → fails (same)
- "near left + moving right (away)" → passes (no friction either direction in current code)
- "hard clamp at boundary" → passes (existing clamp works)

So 2 tests fail, 3 pass. The pass count after this step is the baseline + 3 (passing tests) — the 2 new failures will pass after Task 5.

---

### Task 5: Edge friction — implementation

**Files:**
- Modify: `vanilla/final/src/entities/player.js`

- [ ] **Step 1: Replace `updatePlayer`**

Currently:

```javascript
export function updatePlayer(player, dt, direction) {
  // Move horizontally
  player.x += direction * player.speed * dt;

  // Clamp to boundaries
  const bounds = gameConfig.player.moveZone;
  player.x = Math.max(bounds.minX, Math.min(bounds.maxX - player.width, player.x));

  // Update invincibility
  const now = Date.now();
  if (player.isInvincible && now - player.hitTime > gameConfig.player.invincibilityTime) {
    player.isInvincible = false;
  }
}
```

Replace with:

```javascript
const EDGE_FRICTION_ZONE = 16;  // px from each wall where friction kicks in
const EDGE_FRICTION_MIN  = 0.3; // minimum speed multiplier at the wall itself

export function updatePlayer(player, dt, direction) {
  const bounds = gameConfig.player.moveZone;
  let speedMult = 1;

  if (direction !== 0) {
    // When moving toward a wall, linearly damp speed inside the friction zone.
    if (direction < 0) {
      const dist = player.x - bounds.minX;
      if (dist < EDGE_FRICTION_ZONE) {
        speedMult = Math.max(EDGE_FRICTION_MIN, dist / EDGE_FRICTION_ZONE);
      }
    } else {
      const dist = (bounds.maxX - player.width) - player.x;
      if (dist < EDGE_FRICTION_ZONE) {
        speedMult = Math.max(EDGE_FRICTION_MIN, dist / EDGE_FRICTION_ZONE);
      }
    }
  }

  player.x += direction * player.speed * speedMult * dt;

  // Hard clamp as a safety net (handles big dt spikes and edge cases).
  player.x = Math.max(bounds.minX, Math.min(bounds.maxX - player.width, player.x));

  // Update invincibility
  const now = Date.now();
  if (player.isInvincible && now - player.hitTime > gameConfig.player.invincibilityTime) {
    player.isInvincible = false;
  }
}
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -10
```
Expected: all 5 new edge-friction tests pass; total 61 (50 baseline + 6 input buffering + 5 friction).

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/entities/player.js vanilla/final/tests/edgeFriction.test.js
git commit -m "Player: edge friction (linear damp in 16px wall zone)"
```

---

### Task 6: Smoke verify + PR

**Files:**
- Create: `docs/superpowers/plans/2026-05-24-phase-2b-smoke-matrix.md`

- [ ] **Step 1: Browser smoke**

```bash
npm run dev
# Open http://localhost:3000
```

Manual checks (subjective):
- Tap fire quickly several times during enemy proximity — does the late tap still register a shot when cooldown clears? Compare with `?juice=0` (which won't affect this; buffering is in inputManager not the reactor).
- Hold left arrow while approaching the left wall — does the player decelerate into the wall instead of stopping cold? Same with right wall.
- Verify nothing else feels different: no firing-rate change while held, no movement-speed change away from walls.

- [ ] **Step 2: Record results**

Create `docs/superpowers/plans/2026-05-24-phase-2b-smoke-matrix.md` with PASS/FAIL per item.

- [ ] **Step 3: Open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 2B: controls feel (input buffering + edge friction)" --body "$(cat <<'EOF'
## Summary
- Input manager now stamps a `firePressedAt` timestamp on each fire-press edge; playScene uses it to fire a buffered shot if the player tapped within 80ms before cooldown ended.
- Player movement applies linear deceleration in a 16px friction zone near each wall (down to 30% speed at the wall itself), keeping the existing hard-clamp as a safety net.
- No event-bus, juice, or render changes. Two surgical files modified plus their tests.

Implements Tier C from \`docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md\`. Plan: \`docs/superpowers/plans/2026-05-24-super-megamania-phase-2b-controls.md\`.

## Test plan
- [x] All baseline tests still pass (Phase 1: 50 / Phase 2A: 63).
- [x] 11 new tests pass: 6 input-buffering + 5 edge-friction.
- [ ] Manual smoke: late-tap fire registers when cooldown clears; player decelerates into walls. See \`docs/superpowers/plans/2026-05-24-phase-2b-smoke-matrix.md\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- Tier C #9 (input buffering) → Tasks 1, 2, 3.
- Tier C #10 (edge friction) → Tasks 4, 5.
- Spec acceptance for Phase 2: each item must still wire through bus events OR be a clear behavior change. Tier C is the only Phase 2 batch that is NOT bus-driven (it's purely input/player mechanics). That's intentional and consistent with the spec text (item 9 says "input buffering" with no event noted).

**Placeholder scan:** None.

**Type consistency:**
- `firePressedAt` is consistently a millisecond timestamp number (0 default).
- `EDGE_FRICTION_ZONE` and `EDGE_FRICTION_MIN` consts are scoped to player.js.
- `inputManager.getState()` return shape gains exactly one field (`firePressedAt`); existing consumers (`getDirection`, downstream `inputState.fire` reads) are untouched.

**Independence from Phase 2A:**
- This plan branches from `main`. It does not depend on Phase 2A's `juice.js`, `juiceFx` state, or particle factories.
- If Phase 2A is merged first, the baseline test count is 63 → 74 after this PR. If 2B merges first, baseline is 50 → 61.
- No file overlap with Phase 2A except `playScene.js`. The 2A edits touched the bonus-stage block, the absurd-trail check, and added bus emits. The 2B edits touch only the fire-handling block. Should merge cleanly either order. If git complains, the conflict is mechanical and the right resolution is "both" (different lines).
