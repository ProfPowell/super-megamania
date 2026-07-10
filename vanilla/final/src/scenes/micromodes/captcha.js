import { applyPowerUp, createPowerUp } from '../../entities/powerup.js';

/**
 * Phase 2E — CAPTCHA micromode.
 *
 * Three emojis displayed in a row. One is "the AI" (robot). Use arrow
 * keys to move a cursor, fire to commit. Correct pick: brief power-up
 * via applyPowerUp. Wrong pick: nothing happens. Upside-only.
 */

const DURATION_SEC = 5;
const HUMAN_EMOJIS = ['🍕', '🌭', '☕', '🥒', '🍔', '🌮'];
const ROBOT_EMOJIS = ['🤖', '👾', '🦾'];
const REWARD_POWERUPS = ['shield', 'rapidFire', 'spreadShot'];

export const captcha = {
  name: 'captcha',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    const robotIdx = Math.floor(Math.random() * 3);
    const slots = [];
    for (let i = 0; i < 3; i++) {
      if (i === robotIdx) {
        slots.push({ emoji: ROBOT_EMOJIS[Math.floor(Math.random() * ROBOT_EMOJIS.length)], isAI: true });
      } else {
        slots.push({ emoji: HUMAN_EMOJIS[Math.floor(Math.random() * HUMAN_EMOJIS.length)], isAI: false });
      }
    }
    state.microMode.instance = {
      slots,
      robotIdx,
      cursor: 1,
      committed: false,
      pickedCorrect: false
    };
  },

  update(state, _ctx, _dt, input) {
    const inst = state.microMode.instance;
    if (inst.committed) return null;

    if (input.leftPressedThisFrame) {
      inst.cursor = Math.max(0, inst.cursor - 1);
    }
    if (input.rightPressedThisFrame) {
      inst.cursor = Math.min(2, inst.cursor + 1);
    }

    if (input.firePressedThisFrame) {
      inst.committed = true;
      inst.pickedCorrect = (inst.cursor === inst.robotIdx);
      const outcome = inst.pickedCorrect ? 'success' : 'fail';
      return { complete: true, outcome };
    }

    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance;
    if (!inst) return;

    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.85)';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#ffffff';
    g.font = "16px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('🤖 WHICH ONE IS THE AI?', 320, 100);
    g.font = "10px 'Press Start 2P', monospace";
    g.fillText('LEFT/RIGHT TO MOVE • FIRE TO PICK', 320, 140);

    // Three slot rects
    const slotW = 120, slotH = 120, gap = 30;
    const totalW = slotW * 3 + gap * 2;
    const startX = (640 - totalW) / 2;
    const y = 220;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (slotW + gap);
      g.fillStyle = '#222222';
      g.fillRect(x, y, slotW, slotH);
      g.strokeStyle = (i === inst.cursor) ? '#ffff00' : '#666666';
      g.lineWidth = (i === inst.cursor) ? 6 : 2;
      g.strokeRect(x, y, slotW, slotH);

      g.font = '64px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      g.fillText(inst.slots[i].emoji, x + slotW / 2, y + slotH / 2);
    }

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || {};
    if (inst.pickedCorrect) {
      const kind = REWARD_POWERUPS[Math.floor(Math.random() * REWARD_POWERUPS.length)];
      // applyPowerUp reads powerUp.type AND powerUp.config.duration, so
      // build a full power-up via createPowerUp rather than a bare {type}.
      applyPowerUp(state, createPowerUp(0, 0, kind));
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
