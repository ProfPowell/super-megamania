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
