import { Events } from '../app/events.js';
import {
  createExplosion,
  createAbsurdExplosion,
  createPlayerExplosion
} from './particleSystem.js';
import { triggerScreenShake } from './screenShake.js';

/**
 * Reactor: subscribes to gameplay events and produces the same juice
 * (audio, screen shake, particles) that was previously inlined in
 * playScene's update loop. Behavior in Phase 1 is identical to the
 * pre-refactor code; Phase 2A is where each reactor gets richer.
 *
 * The reactor holds NO state of its own — it reads only from the ctx
 * passed at subscribe time and the event payload at emit time.
 */
export function installJuiceReactor(ctx) {
  const { bus, audio, state, theme } = ctx;
  const unsubs = [];

  unsubs.push(bus.on(Events.WAVE_START, () => {
    audio.playWaveStart();
  }));

  unsubs.push(bus.on(Events.WAVE_COMPLETE, () => {
    audio.playWaveComplete();
  }));

  unsubs.push(bus.on(Events.ENEMY_KILLED, ({ enemy }) => {
    const isAbsurd = theme && theme.name.toLowerCase().includes('absurd');
    if (isAbsurd) {
      state.particles.push(...createAbsurdExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.color
      ));
      triggerScreenShake(6, 0.2);
    } else {
      state.particles.push(...createExplosion(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.color
      ));
    }
    audio.playEnemyExplode();
  }));

  unsubs.push(bus.on(Events.PLAYER_HIT, () => {
    // Phase 2A enriches this; Phase 1 has no reactor here because
    // the old code did its particles inline at the death site.
  }));

  unsubs.push(bus.on(Events.PLAYER_DIED, ({ player }) => {
    state.particles.push(...createPlayerExplosion(
      player.x + player.width / 2,
      player.y + player.height / 2
    ));
  }));

  unsubs.push(bus.on(Events.POWERUP_PICKUP, () => {
    audio.playPowerUp();
  }));

  return () => unsubs.forEach(u => u());
}
