import { Events } from '../app/events.js';
import {
  createBigExplosion,
  createComboFlash,
  createPowerupBurst,
  createConfetti
} from './particleSystem.js';
import { triggerScreenShake } from './screenShake.js';
import { triggerChromaticAberration, triggerScanlineFlash } from './postEffects.js';

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
 * - Audio pass: micromode start/success/fail stingers, combo milestone
 *   chime (every 5), combo-broken buzz, enemy-escaped blip, and the
 *   perfect-bonus fanfare — all via ctx.audio
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
      ctx.audio.playComboMilestone(comboAfter);
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
    if (payload && payload.perfect) {
      ctx.audio.playPerfectBonus();
    }
    if (payload && payload.perfect && isAbsurd(ctx.theme)) {
      ctx.state.juiceFx.chromaUntil = Date.now() + CHROMA_MS;
      triggerChromaticAberration(CHROMA_MS);
      // PHASE 2C: perfect-bonus kaboom — confetti + scanline flash.
      ctx.state.particles.push(...createConfetti(320, 240, 60));
      triggerScanlineFlash(350);
    }
  }));

  unsubs.push(bus.on(Events.COMBO_INCREMENT, () => {
    ctx.state.juiceFx.comboPopUntil = Date.now() + 200;
  }));

  unsubs.push(bus.on(Events.COMBO_BROKEN, () => {
    ctx.state.juiceFx.comboBreakUntil = Date.now() + 400;
    ctx.audio.playComboBroken();
  }));

  unsubs.push(bus.on(Events.ENEMY_ESCAPED, () => {
    ctx.audio.playEnemyEscaped();
  }));

  unsubs.push(bus.on(Events.MICROMODE_START, () => {
    ctx.audio.playMicroModeStart();
  }));

  unsubs.push(bus.on(Events.MICROMODE_END, (payload) => {
    if (payload && payload.outcome === 'success') {
      ctx.audio.playMicroModeSuccess();
    } else {
      ctx.audio.playMicroModeFail();
    }
  }));

  // Other events stay reserved for later phases.
  unsubs.push(bus.on(Events.WAVE_START,      () => {}));
  unsubs.push(bus.on(Events.WAVE_COMPLETE,   () => {}));
  unsubs.push(bus.on(Events.BONUS_START,     () => {}));
  unsubs.push(bus.on(Events.PLAYER_DIED,     () => {}));

  return () => unsubs.forEach(u => u());
}
