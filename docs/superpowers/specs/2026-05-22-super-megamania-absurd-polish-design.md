# Super Megamania — Absurd Mode Refactor & Polish

**Date:** 2026-05-22
**Author:** ProfPowell (with Claude)
**Status:** Draft for review

## Goal

Turn the existing Super Megamania into a noticeably better version of itself, with Absurd Mode as the primary target. Students liked Absurd Mode for the **vibe and aesthetic** — that is what we protect and amplify. We do this in two sequenced phases inside a single project:

1. A surgical refactor that consolidates the messy parts of the codebase and introduces the minimum coordination primitives the polish work needs.
2. A polish & juice pass that adds feel, weight, on-brand chaos, and short interlude micro-scenes.

The tech stack stays as it is: vanilla JavaScript, ES modules, Canvas2D, no build step, no dependencies, Node's built-in test runner. The README's "intentionally simple and well-documented" framing must still be true at the end.

## Non-goals

- No audio changes. Audio is reserved for a separate, later phase.
- No new permanent enemies, waves, themes, or power-ups.
- No core-loop redesign. Wave/energy mechanics remain.
- No leaderboard, backend, or multiplayer.
- No bundler, no dependencies, no new build step.
- No rewrites of `enemyExpanded.js`, `wavesExpanded.js`, `powerup.js`, `collision.js`, or `assetLoader.js`. Their callers get updated; their internals do not.
- No mobile-specific work beyond not breaking existing touch input.

## Audit findings (the issues this project addresses)

Concrete, file-specific issues in the current code:

1. **`main.js` is 1,429 lines.** It owns init, theme loading, event listeners, menu animation, the bonus-stage controller, game-over name entry, render, and a 430-line `update()` function (`main.js:900–1328`). Sixteen module-level mutable variables couple everything together.
2. **Bonus-stage logic is split across `main.js`, `gameState.js`, and the update loop.** Recent commit history (PRs #15–#21 all titled "fix bonus stage…") confirms this is where bugs cluster.
3. **Cross-cutting concerns are inlined.** Audio calls, screen-shake triggers, and particle pushes happen at every gameplay event inside `update()`. This is exactly the wiring an event bus removes.
4. **Module-level globals in `main.js`** (`state`, `currentTheme`, `themeImages`, `playerImage`, `adjustedConfig`, `backgroundElements`, `backgroundMode`, plus animation timers) make the file untestable as a whole and couple everything to import order.
5. **Latent bug:** `main.js:1034` and `main.js:1071` compare `currentTheme === 'absurd'`, but `currentTheme` is the theme object returned by `getTheme(themeName)`, not the string. **Absurd-mode bullet and enemy trails — one of the juice features the README brags about — never actually fire.** This is fixed in Phase 2 Tier A.
6. Wave transitions feel abrupt: a 2-second announce, then enemies appear. No telegraph of the formation.
7. No hitstop on enemy death. Every kill feels the same weight.
8. Screen shake uses one magnitude regardless of event.
9. Bonus-stage ends by instantly clearing enemies and bullets — anticlimactic.

## Phase 1 — Surgical refactor

**Goal:** make Phase 2 polish straightforward without rewriting subsystems that already work.

### New file layout

Only additions are listed; existing systems keep their files and exports.

```
src/
  main.js                  ← shrinks to ≤150 lines: bootstrap only
  app/
    context.js             ← single object holding state, audio, input, ctx, theme, config; passed explicitly
    eventBus.js            ← ~30 lines: on / off / emit (synchronous, no queue)
    events.js              ← string constants for every event the bus carries
  scenes/
    sceneController.js     ← owns scene stack; routes update/render to the active scene
    menuScene.js           ← menu enemies + menu draw (lifted from main.js)
    playScene.js           ← gameplay update/render path (lifted from main.js update/render)
    bonusScene.js          ← bonus-stage spawn / tick / end + announce / timer / end overlays (consolidates the cross-file mess)
    gameOverScene.js       ← name entry + high score display
  systems/
    juice.js               ← Phase-2 reactor. In Phase 1 this is the relocation target for existing audio/shake/particle calls. Subscribes to bus events.
```

### Event bus contract

- The only new abstraction we introduce.
- Subsystems that **react** (audio, particles, screen-shake, future juice) **subscribe** to events.
- Scenes (`playScene`, `bonusScene`) **emit** events at gameplay moments instead of calling reactor subsystems directly.
- One-way: scenes emit; reactors listen. No request/response. No async. No queue. Handlers run in emit order, synchronously, in the order they subscribed.
- Event names live as string constants in `app/events.js`. The Phase 1 set is roughly: `WAVE_START`, `WAVE_COMPLETE`, `BONUS_START`, `BONUS_END`, `ENEMY_KILLED`, `ENEMY_ESCAPED`, `PLAYER_HIT`, `PLAYER_DIED`, `POWERUP_PICKUP`, `COMBO_INCREMENT`, `COMBO_BROKEN`, `MICROMODE_START`, `MICROMODE_END`. (Last two added in Phase 2D.)
- Events carry a payload object. Notable shapes: `ENEMY_KILLED { enemy, scoreValue, comboAfter }`, `BONUS_END { perfect: boolean, escaped: number, score: number }`, `POWERUP_PICKUP { kind }`, `COMBO_INCREMENT { combo }`. Reactors branch on payload (e.g., `BONUS_END` with `perfect: true` triggers the perfect-bonus kaboom) — we do not split into per-outcome event names.

### Context object

- One `ctx` object created in `init`, threaded into every scene's `update(ctx, dt)` and `render(ctx)`.
- Holds: `state`, `audio`, `input`, `canvas`, `theme`, `themeImages`, `playerImage`, `adjustedConfig`, `bus`, `screenShake`, `bg`.
- Not a global. Passed explicitly. Tests can construct a fake `ctx`.

### Scene controller

- Holds a stack of scenes. The top scene receives `update`/`render`; scenes below it are paused (not torn down).
- API: `push(scene)`, `pop()`, `replace(scene)`, `current()`.
- Today's `GameStates` enum stays in `gameState.js` for save compatibility, but transition logic moves to `sceneController.js`.
- Push/pop is what makes Phase 2D's micromode interludes a clean ~50-line scene rather than a tangle.

### Bonus-stage consolidation

- All bonus-stage **gameplay state** stays as fields on `state` (run serialization is unchanged).
- All bonus-stage **behavior** — start, tick, spawn, end, announce overlay, timer overlay, end overlay — moves into `scenes/bonusScene.js`.
- `gameState.js` keeps only the field declarations and pure mutation helpers.

### What Phase 1 explicitly does NOT do

- No ECS, component system, or entity registry.
- No touching of enemy/wave/projectile/powerup internals.
- No audio architecture changes.
- No asset-loader or theme-format changes.
- No new build step. No dependencies.

### Phase 1 acceptance criteria

- `main.js` is ≤ 150 lines.
- All 36 existing tests pass unchanged.
- Two new unit-test files added: `eventBus.test.js` (subscribe / emit / unsubscribe), `sceneController.test.js` (push / pop / current / state-routing).
- Manual smoke matrix passes: menu → start → die → game-over → high-score entry → return to menu; bonus stage triggers, runs, and ends correctly; all eight themes load.

## Phase 2 — Polish & juice pass

**Guiding principle:** every change emits from or subscribes to an event the bus already publishes. Juice code lives in `systems/juice.js` and never tangles back into the scenes. If a polish item cannot be wired through the bus, it does not ship in this phase.

### Tier A — fixes and cheap wins

1. **Fix the `currentTheme === 'absurd'` bug** (`main.js:1034`, `:1071`). Replace with an `isAbsurd(ctx)` helper. Restores enemy trails and bullet trails that have been silently broken.
2. **Bonus-stage drain ending.** Instead of an instant clear, freeze enemies, drain them upward over 0.4 s with sparkle particles, then show the end overlay.
3. **Wave-start telegraph.** A 0.6 s pre-spawn flash where the upcoming formation is previewed as ghost sprites. Gives the player a beat to read the pattern.

### Tier B — feel and juice (the core of the pass)

4. **Hitstop.** A 40–80 ms time-freeze on enemy death, scaled by score value. Implemented as a global `dt *= 0` window inside the loop; the `ENEMY_KILLED` bus event carries the weight as payload.
5. **Tiered screen shake.** Replace single-magnitude shake with `{ intensity, duration, frequency }` profiles per event. Order of weight: player-hit > bonus-end > big-combo enemy-killed > standard enemy-killed > bullet-hit-shield. `screenShake.js` already does most of this; we expose curves and select via the bus.
6. **Particle profiles.** Today there are three explosion functions. Add `createBigExplosion` (triggered at combo ≥ 10), `createComboFlash` (every 5-combo milestone), and `createPowerupBurst` (on `POWERUP_PICKUP`). All driven by bus events.
7. **Chromatic aberration on big events** (Absurd-only). After `PLAYER_HIT`, or `BONUS_END` with `perfect: true`, the frame is drawn with small R/G/B channel offsets for 100 ms. Pure Canvas2D — no WebGL.
8. **Combo HUD juice.** The combo counter pops and tilts when it grows, fades out red when it breaks. Pure `hud.js`.

### Tier C — controls and feel

9. **Input buffering.** A fire tap within ~80 ms before fire is off cooldown queues and fires at first eligibility. Removes "I pressed it!" frustration.
10. **Edge friction.** Tiny deceleration when the player hits a wall instead of a hard stop. Pure `player.js`.

### Tier D — Absurd-mode flavor

11. **Meme intrusions.** Every 20–40 s, a giant emoji (😱 🌭 🤖) drifts across the background for 1.5 s. Purely cosmetic, no hitbox. Absurd-theme-gated.
12. **Bonus-stage VHS jitter.** When the bonus stage is active in Absurd mode, the background gets a 1-frame-per-second horizontal jitter. The codebase already has `BackgroundMode.GLITCH`; this gates it on bonus-active.
13. **Perfect-bonus kaboom.** A perfect bonus stage triggers a unique on-screen finale: confetti particles plus a brief CRT-style scanline flash even when CRT mode is off.

### Tier E — micro-interlude scenes (Absurd-only)

A new `MicroModeScene` is pushed onto the scene stack. `playScene` (or `bonusScene`) freezes — enemies, bullets, timers, combo all paused. The micromode runs for ~5 s with its own update/render. On exit, the scene controller pops back to the paused scene; no state desync, because the underlying scene was never torn down.

This is precisely what the Phase 1 scene stack is for.

**Input during a micromode.** `MicroModeScene` receives input directly from the existing `inputManager` (the same arrow keys, fire button, and touch buttons) and routes them per-micromode. The play-scene player object does not move; bullets and enemies do not advance. On exit, the input manager is cycled (`disable`/`enable`) once to clear any held keys, matching the pattern `pauseGame`/`resumeGame` already uses.

**Upside-only principle.** Players never lose energy, lives, or combo to a micromode. Surprise minigames that *take* resources are the fastest way to make students quit. Success grants a small reward. Failure grants a small wink and the run continues.

**Trigger rule.** The safe-window detector reports `true` only when both `state.enemies` and `state.playerBullets` (and `state.enemyBullets`) have been empty for ≥ 1.0 continuous second. While safe, a weighted roll fires the next eligible micromode. Cooldown of at least 30 s between micromodes. Disabled when `state.bonusStageActive`.

**v1 micromode library (4):**
1. **☕ Coffee Break** — full-screen coffee cup. Each `fire` press = one sip. Goal: fill it in 5 s. Reward: small energy refill (~15% of max). Fail: no reward, no penalty.
2. **🔄 Loading… 99%** — fake progress bar stuck at 99%. Mash fire to nudge it. Hit 100% within 5 s = score bonus. Otherwise: a "Try again later" toast and you continue.
3. **🤖 CAPTCHA** — three meme images appear ("which one is the AI?"). Move cursor with arrow keys, fire to pick. Correct = brief power-up (one of the existing three, randomly chosen). Wrong = nothing.
4. **😱 Emoji Rain** — controls swap to dodge-only (no fire). Screaming emojis fall. Survive 5 s = score bonus and a sparkle effect. Touching an emoji = no bonus, no penalty.

**Dev flag:** `?micromode=0` URL parameter disables micromode triggering entirely.

### Phase 2 acceptance criteria

- Every Tier A / B / C item is wired through one or more bus events. No direct calls from scenes into `juice.js`.
- `?juice=0` URL parameter disables `systems/juice.js` subscriptions for A/B comparison.
- `?micromode=0` URL parameter disables Tier E triggering.
- Manual smoke matrix: Absurd theme + each difficulty × {full run from menu to game-over, bonus stage triggered, perfect bonus, player death mid-wave, at least one micromode of each type triggered}.
- New unit tests:
  - Tiered-shake config returns the expected profile per event.
  - Particle-profile router picks the expected profile for an `ENEMY_KILLED` event with varying score weights.
  - Safe-window detector returns `true` only when enemies + bullets are empty for ≥ 1.0 s.
  - Micromode pause invariant: `playScene.state.gameTime` does not advance while a micromode scene is on top.

## Sequencing

One PR per phase. Each PR is mergeable independently.

1. **Phase 1 — Refactor.** No behavior changes. Event bus, scene controller, ctx object, scene extractions, bonus-stage consolidation. Existing audio/shake/particle calls move out of scenes into `juice.js` reactor subscriptions; the reactor initially calls the same functions, so this is a pure plumbing change.
2. **Phase 2A — Tier A + Tier B.** Bug fixes + core juice.
3. **Phase 2B — Tier C.** Input buffering + edge friction.
4. **Phase 2C — Tier D.** Absurd-mode flavor.
5. **Phase 2D — Tier E framework + Coffee Break.**
6. **Phase 2E — Tier E remaining three micromodes** (Loading, CAPTCHA, Emoji Rain).

## Testing strategy

- The existing 36 tests stay green at every PR boundary.
- Each phase adds the unit tests listed in its acceptance criteria.
- Each phase has a manual smoke matrix recorded in a short companion file alongside this spec.
- Dev URL flags (`?juice=0`, `?micromode=0`) make A/B comparison straightforward during the polish phases.

## Risks and mitigations

- **Risk:** the event bus becomes a junk drawer. **Mitigation:** event names live in `app/events.js` as constants; adding a new event requires adding it there first, which makes review easy.
- **Risk:** scene extraction subtly changes order of operations inside `update()`, introducing a bug that smoke tests miss. **Mitigation:** Phase 1 is a no-behavior-change PR; we keep the order inside `playScene.update()` identical to the current `update()`, line-for-line where feasible, before any later phase refactors it.
- **Risk:** micromode interruptions feel annoying in practice. **Mitigation:** safe-window detector is conservative (no enemies *and* no bullets for ≥ 1.0 s), 30 s cooldown, upside-only payoff, and the `?micromode=0` kill switch lets students opt out.
- **Risk:** scope creep on Tier E content. **Mitigation:** v1 is exactly four micromodes; more are explicitly a follow-up phase.
