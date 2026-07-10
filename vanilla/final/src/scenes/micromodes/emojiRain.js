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
    if (input.left)  inst.player.x = Math.max(0, inst.player.x - PLAYER_SPEED * dt);
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
