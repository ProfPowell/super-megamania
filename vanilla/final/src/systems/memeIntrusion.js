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
