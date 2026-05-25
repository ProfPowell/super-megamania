/**
 * Phase 2D — Coffee Break micromode.
 *
 * A full-screen coffee cup. Each fire-press edge counts as one sip.
 * Goal: SUCCESS_SIPS in DURATION seconds. Success rewards +REWARD_PCT
 * of maxEnergy to current energy (capped at maxEnergy). Failure costs
 * nothing — the spec's upside-only principle.
 */

const SUCCESS_SIPS = 12;
const DURATION_SEC = 5;
const REWARD_PCT = 0.15; // 15% of maxEnergy

const cupState = {
  sips: 0
};

export const coffeeBreak = {
  name: 'coffeeBreak',
  duration: DURATION_SEC,

  enter(_state, _ctx) {
    cupState.sips = 0;
  },

  update(_state, _ctx, _dt, input) {
    if (input.firePressedThisFrame) {
      cupState.sips++;
    }
    if (cupState.sips >= SUCCESS_SIPS) {
      return { complete: true, outcome: 'success' };
    }
    return null;
  },

  render(g, _state, _ctx) {
    // Background dim
    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.75)';
    g.fillRect(0, 0, 640, 480);

    // Title
    g.fillStyle = '#ffffff';
    g.font = "20px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('☕ COFFEE BREAK', 320, 70);
    g.font = "12px 'Press Start 2P', monospace";
    g.fillText('MASH FIRE TO SIP', 320, 110);

    // Cup (centered)
    const cupX = 220, cupY = 160;
    const cupW = 200, cupH = 220;
    // outer cup
    g.fillStyle = '#cccccc';
    g.fillRect(cupX, cupY, cupW, cupH);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.strokeRect(cupX, cupY, cupW, cupH);
    // handle
    g.beginPath();
    g.arc(cupX + cupW + 20, cupY + cupH / 2, 40, -Math.PI / 2, Math.PI / 2);
    g.lineWidth = 8;
    g.strokeStyle = '#cccccc';
    g.stroke();

    // Coffee fill level (rises as sips accumulate)
    const fillPct = Math.min(1, cupState.sips / SUCCESS_SIPS);
    const fillH = (cupH - 20) * fillPct;
    g.fillStyle = '#5a3a1a';
    g.fillRect(cupX + 10, cupY + cupH - fillH - 10, cupW - 20, fillH);

    // Sip counter
    g.fillStyle = '#ffff00';
    g.font = "18px 'Press Start 2P', monospace";
    g.fillText(`${cupState.sips} / ${SUCCESS_SIPS}`, 320, 420);

    g.restore();
  },

  onExit(state, _ctx) {
    if (cupState.sips >= SUCCESS_SIPS) {
      const reward = state.maxEnergy * REWARD_PCT;
      state.energy = Math.min(state.maxEnergy, state.energy + reward);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
