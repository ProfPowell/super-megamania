// vanilla/final/src/scenes/_bonusStateMutations.js
import { addScore } from '../state/gameState.js';

/**
 * Pure state mutations for the bonus stage timer. Behavior wrapping
 * these lives in bonusScene.js — these helpers do not own any side-effect
 * or any timing source other than the dt they are given.
 */

export function startBonusStage(state) {
  state.bonusStageActive = true;
  state.bonusStageTimer = state.bonusStageTimeLimit;
  state.bonusStageEnemiesEscaped = 0;
  state.bonusStageScore = 0;
}

export function updateBonusStage(state, dt) {
  if (!state.bonusStageActive) return false;
  state.bonusStageTimer -= dt;
  if (state.bonusStageTimer <= 0) {
    return endBonusStage(state);
  }
  return false;
}

export function bonusStageEnemyEscaped(state) {
  if (state.bonusStageActive) {
    state.bonusStageEnemiesEscaped++;
  }
}

export function endBonusStage(state) {
  state.bonusStageActive = false;
  state.bonusStageTimer = 0;
  const perfectBonus = state.bonusStageEnemiesEscaped === 0;
  if (perfectBonus) {
    const PERFECT_BONUS = 1000;
    addScore(state, PERFECT_BONUS);
    state.bonusStageScore += PERFECT_BONUS;
  }
  return perfectBonus;
}
