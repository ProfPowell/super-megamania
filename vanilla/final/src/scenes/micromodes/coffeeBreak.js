/**
 * Phase 2D/2E — Coffee Break micromode.
 *
 * A full-screen coffee cup. Each fire-press edge counts as one sip.
 * Goal: SUCCESS_SIPS in DURATION seconds. Success rewards +REWARD_PCT
 * of maxEnergy to current energy (capped at maxEnergy). Failure costs
 * nothing — the spec's upside-only principle.
 *
 * Phase 2E: per-instance state on state.microMode.instance (not module
 * globals). Pattern is shared by all Tier E micromodes.
 */

const SUCCESS_SIPS = 12;
const DURATION_SEC = 5;
const REWARD_PCT = 0.15; // 15% of maxEnergy

export const coffeeBreak = {
  name: 'coffeeBreak',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    state.microMode.instance = { sips: 0 };
  },

  update(state, _ctx, _dt, input) {
    const inst = state.microMode.instance;
    if (input.firePressedThisFrame) {
      inst.sips++;
    }
    if (inst.sips >= SUCCESS_SIPS) {
      return { complete: true, outcome: 'success' };
    }
    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance || { sips: 0 };

    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.75)';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#ffffff';
    g.font = "20px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('☕ COFFEE BREAK', 320, 70);
    g.font = "12px 'Press Start 2P', monospace";
    g.fillText('MASH FIRE TO SIP', 320, 110);

    const cupX = 220, cupY = 160;
    const cupW = 200, cupH = 220;
    g.fillStyle = '#cccccc';
    g.fillRect(cupX, cupY, cupW, cupH);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(cupX, cupY, cupW, cupH);
    g.beginPath();
    g.arc(cupX + cupW + 20, cupY + cupH / 2, 40, -Math.PI / 2, Math.PI / 2);
    g.lineWidth = 8;
    g.strokeStyle = '#cccccc';
    g.stroke();

    const fillPct = Math.min(1, inst.sips / SUCCESS_SIPS);
    const fillH = (cupH - 20) * fillPct;
    g.fillStyle = '#5a3a1a';
    g.fillRect(cupX + 10, cupY + cupH - fillH - 10, cupW - 20, fillH);

    g.fillStyle = '#ffff00';
    g.font = "18px 'Press Start 2P', monospace";
    g.fillText(`${inst.sips} / ${SUCCESS_SIPS}`, 320, 420);

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || { sips: 0 };
    if (inst.sips >= SUCCESS_SIPS) {
      const reward = state.maxEnergy * REWARD_PCT;
      state.energy = Math.min(state.maxEnergy, state.energy + reward);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
