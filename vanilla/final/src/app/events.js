/**
 * All event names the gameplay scenes emit and reactors subscribe to.
 *
 * Adding a new event MUST update this file first. This prevents the bus
 * from becoming a junk drawer of free-form strings.
 *
 * Payload shapes are documented here as JSDoc rather than enforced at
 * runtime; reactors should branch on payload fields, not on per-outcome
 * event names (e.g. BONUS_END with perfect:true, not BONUS_END_PERFECT).
 */

/** @typedef {{ enemy: object, scoreValue: number, comboAfter: number }} EnemyKilledPayload */
/** @typedef {{ enemy: object }} EnemyEscapedPayload */
/** @typedef {{ perfect: boolean, escaped: number, score: number }} BonusEndPayload */
/** @typedef {{ kind: string }} PowerupPickupPayload */
/** @typedef {{ combo: number, multiplier: number }} ComboIncrementPayload */
/** @typedef {{ name: string }} MicromodeStartPayload */
/** @typedef {{ name: string, outcome: 'success' | 'fail' }} MicromodeEndPayload */

export const Events = Object.freeze({
  WAVE_START: 'WAVE_START',
  WAVE_COMPLETE: 'WAVE_COMPLETE',
  BONUS_START: 'BONUS_START',
  BONUS_END: 'BONUS_END',
  ENEMY_KILLED: 'ENEMY_KILLED',
  ENEMY_ESCAPED: 'ENEMY_ESCAPED',
  PLAYER_HIT: 'PLAYER_HIT',
  PLAYER_DIED: 'PLAYER_DIED',
  POWERUP_PICKUP: 'POWERUP_PICKUP',
  COMBO_INCREMENT: 'COMBO_INCREMENT',
  COMBO_BROKEN: 'COMBO_BROKEN',
  MICROMODE_START: 'MICROMODE_START', // reserved for Phase 2E
  MICROMODE_END: 'MICROMODE_END'      // reserved for Phase 2E
});
