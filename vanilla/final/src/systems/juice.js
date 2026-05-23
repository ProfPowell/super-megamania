import { Events } from '../app/events.js';

/**
 * Reactor scaffold. In Phase 1, subscribers are no-ops because the
 * gameplay code in playScene.js still owns every audio/shake/particle
 * call inline — this keeps the "zero behavior change" Phase 1 contract.
 *
 * Phase 2A populates these handlers (with hitstop, tiered shake,
 * particle profiles, chromatic aberration, etc.) and removes the
 * matching inline calls from playScene. Until then, the bus emits
 * from scenes flow through here harmlessly, proving the wiring works.
 *
 * The reactor holds NO state of its own — Phase 2A reactors should
 * read from the ctx passed at subscribe time and the event payload
 * at emit time.
 */
export function installJuiceReactor(ctx) {
  const { bus } = ctx;
  const unsubs = [
    bus.on(Events.WAVE_START,        () => { /* Phase 2A: wave-start telegraph */ }),
    bus.on(Events.WAVE_COMPLETE,     () => { /* Phase 2A: wave-clear sparkle */ }),
    bus.on(Events.BONUS_START,       () => { /* Phase 2A: bonus-start flourish */ }),
    bus.on(Events.BONUS_END,         () => { /* Phase 2A: perfect-bonus kaboom */ }),
    bus.on(Events.ENEMY_KILLED,      () => { /* Phase 2A: hitstop, tiered shake, big-combo profile */ }),
    bus.on(Events.ENEMY_ESCAPED,     () => { /* Phase 2A reserved */ }),
    bus.on(Events.PLAYER_HIT,        () => { /* Phase 2A: chromatic aberration, hitstop */ }),
    bus.on(Events.PLAYER_DIED,       () => { /* Phase 2A reserved */ }),
    bus.on(Events.POWERUP_PICKUP,    () => { /* Phase 2A: powerup burst */ }),
    bus.on(Events.COMBO_INCREMENT,   () => { /* Phase 2A: combo HUD juice */ }),
    bus.on(Events.COMBO_BROKEN,      () => { /* Phase 2A: combo break flash */ })
  ];
  return () => unsubs.forEach(u => u());
}
