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
