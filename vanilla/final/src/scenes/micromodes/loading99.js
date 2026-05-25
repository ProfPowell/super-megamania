import { addScore } from '../../state/gameState.js';

/**
 * Phase 2E — Loading 99% micromode.
 *
 * Fake progress bar stuck near 99%. Each fire-press edge nudges it by
 * NUDGE_PCT. Reaching 100% within DURATION grants SUCCESS_SCORE_BONUS
 * via addScore. Failure: no penalty (upside-only).
 */

const START_PCT = 99.0;
const TARGET_PCT = 100.0;
const NUDGE_PCT = 0.1;          // % per press
const DURATION_SEC = 5;
const SUCCESS_SCORE_BONUS = 500;

const SARCASTIC_LABELS = [
  'INSTALLING UPDATES...',
  'CALIBRATING FLUX CAPACITOR...',
  'CONSULTING THE ORACLE...',
  'TURNING IT OFF AND ON AGAIN...',
  'BLAMING IT ON THE INTERN...'
];

export const loading99 = {
  name: 'loading99',
  duration: DURATION_SEC,

  enter(state, _ctx) {
    state.microMode.instance = {
      pct: START_PCT,
      label: SARCASTIC_LABELS[Math.floor(Math.random() * SARCASTIC_LABELS.length)]
    };
  },

  update(state, _ctx, _dt, input) {
    const inst = state.microMode.instance;
    if (input.firePressedThisFrame) {
      inst.pct = Math.min(TARGET_PCT, inst.pct + NUDGE_PCT);
    }
    if (inst.pct >= TARGET_PCT - 0.0001) {
      inst.pct = TARGET_PCT;
      return { complete: true, outcome: 'success' };
    }
    return null;
  },

  render(g, state, _ctx) {
    const inst = state.microMode.instance || { pct: START_PCT, label: '' };

    g.save();
    g.fillStyle = 'rgba(0, 0, 0, 0.85)';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#00ff00';
    g.font = "20px 'Press Start 2P', monospace";
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('🔄 LOADING...', 320, 140);

    g.font = "10px 'Press Start 2P', monospace";
    g.fillStyle = '#aaaaaa';
    g.fillText(inst.label, 320, 180);

    // Progress bar
    const barX = 80, barY = 230, barW = 480, barH = 40;
    g.fillStyle = '#222222';
    g.fillRect(barX, barY, barW, barH);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.strokeRect(barX, barY, barW, barH);
    const fillW = (barW - 4) * (inst.pct / 100);
    g.fillStyle = '#00ff00';
    g.fillRect(barX + 2, barY + 2, fillW, barH - 4);

    g.fillStyle = '#ffff00';
    g.font = "18px 'Press Start 2P', monospace";
    g.fillText(`${inst.pct.toFixed(1)}%`, 320, 310);

    g.fillStyle = '#ffffff';
    g.font = "12px 'Press Start 2P', monospace";
    g.fillText('MASH FIRE TO NUDGE IT', 320, 380);

    g.restore();
  },

  onExit(state, _ctx) {
    const inst = state.microMode.instance || { pct: START_PCT };
    if (inst.pct >= TARGET_PCT) {
      addScore(state, SUCCESS_SCORE_BONUS);
      return { outcome: 'success' };
    }
    return { outcome: 'fail' };
  }
};
