# Super Megamania — Phase 2C Absurd Flavor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Tier D from the spec — the three Absurd-mode-only flavor items: meme intrusions (giant emoji drifting across the background), bonus-stage VHS jitter (background snaps horizontally once per second), and perfect-bonus kaboom (confetti particles + scanline flash on a perfect bonus stage).

**Architecture:** All three items live on `state.juiceFx`. The meme intrusion runs as a small module (`systems/memeIntrusion.js`) called from `playScene.update` and `playScene.render`. The VHS jitter is a render-time canvas translate gated on bonus-active + Absurd. The perfect-bonus kaboom is wired through the existing juice reactor's `BONUS_END` handler — adding confetti particles + a scanline-flash CSS toggle alongside the already-present chromatic aberration.

**Tech Stack:** Vanilla JavaScript, Canvas2D. Node's built-in test runner. No bundler, no deps. All effects are Absurd-theme-gated using the existing `isAbsurd(ctx)` helper from `src/app/context.js`.

**Scope note:** Implements **Tier D only** from `docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md` (items 11, 12, 13). Tier E (micromodes) is a separate plan. This plan branches from `main` and is INDEPENDENT of the unmerged Phase 2B PR — Phase 2B touched the fire-handling block of playScene; Phase 2C touches the render path. If both PRs are open, they should merge cleanly in either order.

**Plan-authoring rule:** All function signatures and field names were verified against the current `main` (post-Phase-2A) code at plan-authoring time:
- `isAbsurd(ctx)` already exists in `src/app/context.js:44` — returns true if `ctx.theme.name.toLowerCase().includes('absurd')`.
- `BackgroundMode.GLITCH` already exists in `src/systems/backgroundSystem.js:18`.
- `juice.js` already has a `BONUS_END` handler that triggers chromatic aberration on perfect bonus — Phase 2C extends that handler.
- `triggerChromaticAberration` from `src/systems/postEffects.js` is the existing CSS-toggle pattern; Phase 2C adds a parallel `triggerScanlineFlash`.
- `state.juiceFx` is initialized in both `createGameState` and `resetGameState` in `src/state/gameState.js` (Phase 2A).

**Working directory:** `vanilla/final/` for all paths.

---

## Files this plan creates / modifies

| File | Action | Responsibility |
|---|---|---|
| `src/systems/particleSystem.js` | Modify | Add `createConfetti(x, y, count)` factory |
| `src/systems/postEffects.js` | Modify | Add `triggerScanlineFlash(durationMs)` |
| `styles/style.css` | Modify | `.scanline-flash` class |
| `src/systems/memeIntrusion.js` | Create | Periodic giant-emoji drift state + update + render |
| `src/state/gameState.js` | Modify | Add `juiceFx.memeIntrusion` and `juiceFx.vhsJitterNextAt` |
| `src/systems/juice.js` | Modify | `BONUS_END` perfect → also push confetti + trigger scanline flash |
| `src/scenes/playScene.js` | Modify | Call `updateMemeIntrusion`, render it, apply VHS jitter during bonus |
| `tests/confetti.test.js` | Create | Tests for the confetti factory |
| `tests/memeIntrusion.test.js` | Create | Tests for the periodic intrusion scheduling |

## Files this plan does NOT touch

`src/entities/*`, `src/input/*`, `src/systems/collision.js`, `src/systems/waveManager.js`, `src/systems/screenShake.js`, `src/systems/backgroundSystem.js`, `src/scenes/menuScene.js`, `src/scenes/gameOverScene.js`, `src/scenes/bonusScene.js`, `src/scenes/sceneController.js`, `src/scenes/_bonusStateMutations.js`, `src/app/*`, `src/audio/*`, `src/assets/*`, `src/config/*`, `src/storage/*`, `src/canvas.js`, `src/gameLoop.js`, `src/main.js`, `src/ui/hud.js`.

---

### Task 1: Confetti particle factory — failing tests

**Files:**
- Create: `vanilla/final/tests/confetti.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConfetti } from '../src/systems/particleSystem.js';

test('createConfetti returns 40+ particles at the given position', () => {
  const ps = createConfetti(320, 240);
  assert.ok(ps.length >= 40, `expected ≥40 particles, got ${ps.length}`);
  for (const p of ps) {
    assert.equal(typeof p.x, 'number');
    assert.equal(typeof p.y, 'number');
    assert.equal(typeof p.vx, 'number');
    assert.equal(typeof p.vy, 'number');
    assert.equal(typeof p.color, 'string');
  }
});

test('createConfetti particles have varied colors (not all the same)', () => {
  const ps = createConfetti(0, 0);
  const colors = new Set(ps.map(p => p.color));
  assert.ok(colors.size >= 3, `expected ≥3 distinct colors, got ${colors.size}`);
});

test('createConfetti starts at the given position', () => {
  const ps = createConfetti(100, 200);
  for (const p of ps) {
    assert.equal(p.x, 100);
    assert.equal(p.y, 200);
  }
});

test('createConfetti respects count override', () => {
  const ps = createConfetti(0, 0, 60);
  assert.equal(ps.length, 60);
});
```

- [ ] **Step 2: Run tests, verify 4 new fail**

```bash
npm test 2>&1 | tail -10
```
Expected: 4 new tests fail (`createConfetti` not exported).

---

### Task 2: Confetti factory — implementation

**Files:**
- Modify: `vanilla/final/src/systems/particleSystem.js`

- [ ] **Step 1: Append to `particleSystem.js`**

Add after the existing `createWaveTelegraphGhosts`:

```javascript
const CONFETTI_COLORS = [
  '#ff00ff', '#00ffff', '#ffff00', '#00ff00',
  '#ff0080', '#80ff00', '#0080ff', '#ff8000'
];

/**
 * Confetti burst for the perfect-bonus kaboom (Phase 2C). Particles fan
 * upward and outward, then fall with a gentle gravity-ish drift baked
 * into the velocity (no actual gravity in the particle system — we just
 * bias initial vy upward and let updateParticles drift them).
 */
export function createConfetti(x, y, count = 40) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // upward fan
    const speed = 120 + Math.random() * 180;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.2 + Math.random() * 0.8,
      maxLife: 2.0,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 2 + Math.random() * 3
    });
  }
  return particles;
}
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 67 tests pass (63 baseline + 4 new confetti). _Adjust baseline if Phase 2B has merged before this PR opens (then baseline is 74, total 78)._

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/systems/particleSystem.js vanilla/final/tests/confetti.test.js
git commit -m "Add confetti particle factory for Phase 2C perfect-bonus kaboom"
```

---

### Task 3: Scanline flash post-effect

**Files:**
- Modify: `vanilla/final/src/systems/postEffects.js`
- Modify: `vanilla/final/styles/style.css`

- [ ] **Step 1: Append `triggerScanlineFlash` to `postEffects.js`**

The file currently exports `triggerChromaticAberration`. Add a parallel `triggerScanlineFlash` that toggles a `.scanline-flash` CSS class on `#gameCanvas` for the given duration. Append to the file (after the existing `triggerChromaticAberration` function):

```javascript
let scanlineTimeout = null;

export function triggerScanlineFlash(durationMs = 350) {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  canvas.classList.add('scanline-flash');
  if (scanlineTimeout) clearTimeout(scanlineTimeout);
  scanlineTimeout = setTimeout(() => {
    canvas.classList.remove('scanline-flash');
    scanlineTimeout = null;
  }, durationMs);
}
```

- [ ] **Step 2: Append CSS for `.scanline-flash`**

Append at the end of `vanilla/final/styles/style.css`:

```css
/* Phase 2C: scanline flash for perfect-bonus kaboom. Brief CRT-style
   horizontal lines applied via a repeating linear gradient overlay.
   Higher-specificity selector ensures it composes with both Absurd-mode
   chroma and CRT mode. */
#gameCanvas.scanline-flash {
  position: relative;
}
#gameCanvas.scanline-flash::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0) 0px,
    rgba(255, 255, 255, 0) 3px,
    rgba(255, 255, 255, 0.18) 3px,
    rgba(255, 255, 255, 0.18) 4px
  );
  animation: scanline-flash-fade 350ms linear forwards;
}
@keyframes scanline-flash-fade {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
```

Note: `::after` on a `<canvas>` element does not render in most browsers (canvas elements don't have a content box for pseudo-elements). **Fall back to applying the class to `#game-container` instead** and use `#game-container.scanline-flash::after` selector. Update the `triggerScanlineFlash` JS to target `#game-container` instead of `#gameCanvas`. Concretely:

```javascript
export function triggerScanlineFlash(durationMs = 350) {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('game-container');
  if (!host) return;
  host.classList.add('scanline-flash');
  if (scanlineTimeout) clearTimeout(scanlineTimeout);
  scanlineTimeout = setTimeout(() => {
    host.classList.remove('scanline-flash');
    scanlineTimeout = null;
  }, durationMs);
}
```

And CSS:

```css
#game-container.scanline-flash {
  position: relative;
}
#game-container.scanline-flash::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0) 0px,
    rgba(255, 255, 255, 0) 3px,
    rgba(255, 255, 255, 0.18) 3px,
    rgba(255, 255, 255, 0.18) 4px
  );
  animation: scanline-flash-fade 350ms linear forwards;
  z-index: 10;
}
@keyframes scanline-flash-fade {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
```

Use the corrected `#game-container` version. The `index.html` already has `<div id="game-container">` wrapping the canvas — verify by `grep id=.game-container vanilla/final/index.html`.

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: still 67 (no test changes; postEffects has no Node tests because of the document guard).

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/systems/postEffects.js vanilla/final/styles/style.css
git commit -m "Add CSS-based scanline flash for Phase 2C perfect-bonus kaboom"
```

---

### Task 4: Extend `juiceFx` state for Phase 2C

**Files:**
- Modify: `vanilla/final/src/state/gameState.js`

The current `juiceFx` (added in Phase 2A) has: `chromaUntil`, `comboPopUntil`, `comboBreakUntil`, `bonusDrainUntil`, `waveTelegraphGhosts`, `waveTelegraphUntil`. Phase 2C adds two more fields.

- [ ] **Step 1: Extend the `juiceFx` object in `createGameState`**

In the `createGameState` function, find the `juiceFx: {` object literal and add two new fields before the closing `}`. The complete extended block should read:

```javascript
    juiceFx: {
      chromaUntil: 0,
      comboPopUntil: 0,
      comboBreakUntil: 0,
      bonusDrainUntil: 0,
      waveTelegraphGhosts: [],
      waveTelegraphUntil: 0,
      // PHASE 2C
      memeIntrusion: null,        // null when inactive; object with {emoji, startTime, duration, startX, endX, y} when active
      memeIntrusionNextAt: 0,     // gameTime seconds; next intrusion scheduled
      vhsJitterNextAt: 0          // gameTime seconds; next 1-frame jitter snap
    }
```

- [ ] **Step 2: Extend the same fields in `resetGameState`**

In `resetGameState`, find the `state.juiceFx = {` block and add the same three fields:

```javascript
  state.juiceFx = {
    chromaUntil: 0,
    comboPopUntil: 0,
    comboBreakUntil: 0,
    bonusDrainUntil: 0,
    waveTelegraphGhosts: [],
    waveTelegraphUntil: 0,
    memeIntrusion: null,
    memeIntrusionNextAt: 0,
    vhsJitterNextAt: 0
  };
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 67 tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/state/gameState.js
git commit -m "Add memeIntrusion + vhsJitter fields to juiceFx state"
```

---

### Task 5: Meme intrusion module — failing tests

**Files:**
- Create: `vanilla/final/tests/memeIntrusion.test.js`

The meme intrusion's timing logic is testable in pure form. We test that:
1. When inactive and `state.gameTime >= memeIntrusionNextAt`, the update activates an intrusion.
2. After `duration` elapses, the intrusion deactivates and a new `memeIntrusionNextAt` is scheduled 20–40s out.
3. If theme is NOT absurd, update is a no-op.
4. Active intrusion has an emoji from the pool.

- [ ] **Step 1: Write the failing tests**

```javascript
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
```

- [ ] **Step 2: Run tests, verify 5 new fail**

Expected: 5 new tests fail (module not found).

---

### Task 6: Meme intrusion module — implementation

**Files:**
- Create: `vanilla/final/src/systems/memeIntrusion.js`

- [ ] **Step 1: Write the module**

```javascript
/**
 * Phase 2C — periodic meme intrusion. Every 20–40s in Absurd mode, a
 * giant emoji drifts across the play area for 1.5s. Purely cosmetic;
 * no hitbox, no gameplay interaction.
 *
 * State lives in state.juiceFx.memeIntrusion / .memeIntrusionNextAt.
 * Theme gating uses ctx.theme.name; this module mirrors that check
 * directly rather than importing isAbsurd to keep the dependency graph
 * shallow for tests.
 */

export const MEME_EMOJIS = ['😱', '🌭', '🤖', '🧨', '👀', '🥒', '🔥', '☕'];

const INTRUSION_DURATION = 1.5;     // seconds
const INTRUSION_INTERVAL_MIN = 20;  // seconds between intrusions
const INTRUSION_INTERVAL_MAX = 40;

const SCREEN_W = 640;
const SCREEN_H = 480;
const EMOJI_SIZE = 96;              // px font size for the drifting emoji

function isAbsurdTheme(theme) {
  return !!(theme && theme.name && theme.name.toLowerCase().includes('absurd'));
}

function scheduleNext(currentTime) {
  const span = INTRUSION_INTERVAL_MAX - INTRUSION_INTERVAL_MIN;
  return currentTime + INTRUSION_INTERVAL_MIN + Math.random() * span;
}

function newIntrusion(startTime) {
  const goingRight = Math.random() < 0.5;
  return {
    emoji: MEME_EMOJIS[Math.floor(Math.random() * MEME_EMOJIS.length)],
    startTime,
    duration: INTRUSION_DURATION,
    startX: goingRight ? -EMOJI_SIZE : SCREEN_W + EMOJI_SIZE,
    endX:   goingRight ? SCREEN_W + EMOJI_SIZE : -EMOJI_SIZE,
    y: 80 + Math.random() * (SCREEN_H - 240)
  };
}

/**
 * Per-frame tick. Activates / deactivates the intrusion and schedules
 * the next one. Pure mutation on ctx.state.juiceFx — no side effects
 * elsewhere.
 */
export function updateMemeIntrusion(ctx, _dt) {
  if (!isAbsurdTheme(ctx.theme)) return;

  const fx = ctx.state.juiceFx;
  const now = ctx.state.gameTime;

  // Schedule the first intrusion if not yet scheduled.
  if (fx.memeIntrusionNextAt === 0) {
    fx.memeIntrusionNextAt = scheduleNext(now);
    return;
  }

  // Active intrusion: check if it expired.
  if (fx.memeIntrusion) {
    const elapsed = now - fx.memeIntrusion.startTime;
    if (elapsed >= fx.memeIntrusion.duration) {
      fx.memeIntrusion = null;
      fx.memeIntrusionNextAt = scheduleNext(now);
    }
    return;
  }

  // Inactive: activate when the scheduled time arrives.
  if (now >= fx.memeIntrusionNextAt) {
    fx.memeIntrusion = newIntrusion(now);
  }
}

/**
 * Render the active intrusion (if any) on the given Canvas2D context.
 * Called from playScene.render before the gameplay sprites so the emoji
 * sits in the background plane.
 */
export function drawMemeIntrusion(g, state) {
  const intr = state.juiceFx && state.juiceFx.memeIntrusion;
  if (!intr) return;
  const t = Math.min(1, (state.gameTime - intr.startTime) / intr.duration);
  const x = intr.startX + (intr.endX - intr.startX) * t;
  g.save();
  g.globalAlpha = 0.55;
  g.font = `${EMOJI_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(intr.emoji, x, intr.y);
  g.restore();
}
```

- [ ] **Step 2: Run tests**

```bash
npm test 2>&1 | tail -10
```
Expected: 72 tests pass (67 + 5 new memeIntrusion).

- [ ] **Step 3: Commit**

```bash
git add vanilla/final/src/systems/memeIntrusion.js vanilla/final/tests/memeIntrusion.test.js
git commit -m "Add memeIntrusion module (Phase 2C giant-emoji drift)"
```

---

### Task 7: Wire meme intrusion + VHS jitter into playScene

**Files:**
- Modify: `vanilla/final/src/scenes/playScene.js`

Two render-side changes plus one update tick:

(a) Import the meme intrusion functions and the `isAbsurd` helper from context.
(b) Call `updateMemeIntrusion(ctx, dt)` once per frame in playScene.update.
(c) Call `drawMemeIntrusion(g, state)` once per frame in playScene.render, in the background plane (after `drawBackground`, before enemies).
(d) Apply VHS jitter horizontal translate during bonus stage in Absurd, once per second for 1 frame.

- [ ] **Step 1: Add imports**

Find the existing import block. Add these two lines near the bottom (next to other systems imports):

```javascript
import { updateMemeIntrusion, drawMemeIntrusion } from '../systems/memeIntrusion.js';
import { isAbsurd } from '../app/context.js';
```

- [ ] **Step 2: Call `updateMemeIntrusion` once per frame**

In `playScene.update`, find the spot right after `updateCombo(state, dt);` (or wherever the combo tick happens) and add:

```javascript
    // PHASE 2C: meme intrusion timer tick.
    updateMemeIntrusion(ctx, dt);
```

- [ ] **Step 3: Render the meme intrusion + apply VHS jitter**

In `playScene.render`, find `drawBackground(g, ctx.backgroundElements, state.gameTime);` (currently the second line after `clearCanvas(g)`).

Right after `drawBackground(...)`, add:

```javascript
    // PHASE 2C: meme intrusion sits in the background plane.
    drawMemeIntrusion(g, state);
```

Then find the existing `g.save(); applyScreenShake(g);` block. Just before `applyScreenShake(g);`, insert the VHS-jitter logic:

```javascript
    // PHASE 2C: VHS jitter — 1 frame per second in Absurd bonus stage.
    if (state.bonusStageActive && isAbsurd(ctx)) {
      if (state.gameTime >= state.juiceFx.vhsJitterNextAt) {
        state.juiceFx.vhsJitterNextAt = state.gameTime + 1.0;
        const jitterX = (Math.random() - 0.5) * 18; // ±9px
        g.translate(jitterX, 0);
      }
    }
```

The `g.save();` two lines above (and the matching `g.restore();` at the end of the render block) means the jitter translate is reset every frame. No further cleanup needed.

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 72 tests pass.

- [ ] **Step 5: Commit**

```bash
git add vanilla/final/src/scenes/playScene.js
git commit -m "Wire meme intrusion + VHS jitter into playScene"
```

---

### Task 8: Wire juice reactor for perfect-bonus kaboom

**Files:**
- Modify: `vanilla/final/src/systems/juice.js`

The current `BONUS_END` reactor (Phase 2A) triggers chromatic aberration on `payload.perfect`. Add confetti particles + scanline flash to that same branch.

- [ ] **Step 1: Add the new imports at the top of `juice.js`**

The current imports:

```javascript
import { Events } from '../app/events.js';
import {
  createBigExplosion,
  createComboFlash,
  createPowerupBurst
} from './particleSystem.js';
import { triggerScreenShake } from './screenShake.js';
import { triggerChromaticAberration } from './postEffects.js';
```

Update the particle-system import to include `createConfetti`, and the postEffects import to include `triggerScanlineFlash`:

```javascript
import { Events } from '../app/events.js';
import {
  createBigExplosion,
  createComboFlash,
  createPowerupBurst,
  createConfetti
} from './particleSystem.js';
import { triggerScreenShake } from './screenShake.js';
import { triggerChromaticAberration, triggerScanlineFlash } from './postEffects.js';
```

- [ ] **Step 2: Extend the BONUS_END handler**

Find the current handler:

```javascript
  unsubs.push(bus.on(Events.BONUS_END, (payload) => {
    if (payload && payload.perfect && isAbsurd(ctx.theme)) {
      ctx.state.juiceFx.chromaUntil = Date.now() + CHROMA_MS;
      triggerChromaticAberration(CHROMA_MS);
    }
  }));
```

Replace with:

```javascript
  unsubs.push(bus.on(Events.BONUS_END, (payload) => {
    if (payload && payload.perfect && isAbsurd(ctx.theme)) {
      ctx.state.juiceFx.chromaUntil = Date.now() + CHROMA_MS;
      triggerChromaticAberration(CHROMA_MS);
      // PHASE 2C: perfect-bonus kaboom — confetti + scanline flash.
      ctx.state.particles.push(...createConfetti(320, 240, 60));
      triggerScanlineFlash(350);
    }
  }));
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```
Expected: 72 tests pass.

- [ ] **Step 4: Commit**

```bash
git add vanilla/final/src/systems/juice.js
git commit -m "Juice reactor: perfect-bonus kaboom (confetti + scanline flash)"
```

---

### Task 9: Smoke matrix + PR

**Files:**
- Create: `docs/superpowers/plans/2026-05-24-phase-2c-smoke-matrix.md`

- [ ] **Step 1: Browser smoke**

```bash
npm run dev
# Open http://localhost:3000/?juice=1
# Settings → Theme → 🌭 ABSURD MODE
```

Manual checks (subjective; Absurd-only):
- Sit on the menu or in gameplay for ~30s — a giant emoji should drift across the background once. Repeat to verify it recurs at 20–40s intervals.
- Reach a bonus stage (every 5 waves) — during the bonus, the background should snap horizontally once per second.
- Survive a bonus stage perfectly — at end, confetti should burst from screen center AND the brief scanline flash should overlay the screen for ~350ms.
- Switch to a non-Absurd theme (e.g., Cats) and verify NONE of the above fires. Verify the perfect-bonus chromatic aberration ALSO doesn't fire (Absurd-gated since Phase 2A).
- Use `?juice=0` URL flag: meme intrusions should NOT appear (reactor is disabled, but updateMemeIntrusion runs from playScene directly — verify the gate works). **This is a subtle case:** the meme intrusion is driven by `updateMemeIntrusion` in playScene, NOT by the reactor. So `?juice=0` does NOT disable meme intrusions in the current design. Either document this in the PR description as a known limitation or wire the meme intrusion behind a `if (!juiceDisabled)` check. **Decide and report.**

- [ ] **Step 2: Record results**

Create `docs/superpowers/plans/2026-05-24-phase-2c-smoke-matrix.md` with PASS/FAIL per item.

- [ ] **Step 3: Open PR**

```bash
git push -u origin HEAD
gh pr create --title "Phase 2C: Tier D Absurd flavor (meme intrusion + VHS jitter + perfect-bonus kaboom)" --body "$(cat <<'EOF'
## Summary

Implements Tier D from the polish spec — three Absurd-mode-only flavor items:

- **Meme intrusion.** Every 20–40s, a giant emoji (😱 🌭 🤖 ☕ and friends) drifts across the background for 1.5s. Purely cosmetic. State and timing live on \`state.juiceFx.memeIntrusion\`; new \`systems/memeIntrusion.js\` owns the logic.
- **Bonus-stage VHS jitter.** When the bonus stage is active in Absurd, the canvas snaps horizontally by ±9px once per second for one frame. Render-time effect; no state outside \`vhsJitterNextAt\`.
- **Perfect-bonus kaboom.** On \`BONUS_END\` with \`perfect:true\` (Absurd only), the existing chromatic aberration is joined by a 60-particle confetti burst plus a 350ms scanline flash overlay.

All three effects are Absurd-theme-gated via \`isAbsurd(ctx)\` and live on top of the merged Phase 2A juice infrastructure. No event-bus changes, no audio changes, no scene-controller changes.

Implements Tier D from \`docs/superpowers/specs/2026-05-22-super-megamania-absurd-polish-design.md\`. Plan: \`docs/superpowers/plans/2026-05-24-super-megamania-phase-2c-absurd-flavor.md\`.

## Test plan
- [x] Baseline tests still pass (Phase 1: 50, +13 from 2A, +11 from 2B if merged).
- [x] 9 new tests pass: 4 confetti factory + 5 meme intrusion timing.
- [ ] Manual smoke in browser: meme intrusion recurs, VHS jitter fires once/sec in bonus, perfect bonus shows confetti + scanline. Non-Absurd themes show none of the above. See \`docs/superpowers/plans/2026-05-24-phase-2c-smoke-matrix.md\`.

## Known limitations
- \`?juice=0\` does NOT disable the meme intrusion since it's driven from playScene's update loop, not the reactor. If you want full A/B parity, gate \`updateMemeIntrusion\` behind the same check in main.js. Or leave it: meme intrusions are an Absurd-mode-only easter egg that the user can just ignore.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- Tier D #11 (meme intrusions) → Tasks 4, 5, 6, 7.
- Tier D #12 (bonus-stage VHS jitter) → Task 4 (state) + Task 7 (render).
- Tier D #13 (perfect-bonus kaboom) → Tasks 1, 2, 3, 4 (state), 8.

**Placeholder scan:** No TBDs. The CSS `::after` on `<canvas>` caveat is called out explicitly in Task 3 with the corrected `#game-container` selector.

**Type consistency:**
- `state.juiceFx.memeIntrusion`: `null` or `{ emoji, startTime, duration, startX, endX, y }`. Consistent across `gameState.js`, `memeIntrusion.js`, and tests.
- `state.juiceFx.memeIntrusionNextAt`: number (gameTime seconds). Consistent.
- `state.juiceFx.vhsJitterNextAt`: number (gameTime seconds). Consistent.
- `MEME_EMOJIS` is an exported const; tests import and check membership.

**Known cross-cutting concerns:**
- Task 3's `triggerScanlineFlash` targets `#game-container` not `#gameCanvas` because pseudo-elements don't render on `<canvas>`. The implementer must verify the `<div id="game-container">` exists in `index.html` (a quick grep at Task 3 time).
- Task 7's VHS jitter is applied via `g.translate(jitterX, 0)` before `applyScreenShake(g)`. Both shake and jitter compound additively inside the same save/restore block; that's intentional — during bonus, you get both effects.
- Phase 2B independence: this plan touches `playScene.js` render section + a new `update` line. Phase 2B touched the fire-handling block in `update`. No textual conflict expected; if there is one, the resolution is mechanically "both" (different lines).
