# Phase 2E Micromodes Content Smoke Matrix

Automated + manual verification for the Phase 2E PR (Loading 99% + CAPTCHA + Emoji Rain; Tier E complete).

## How to run

```bash
npm run dev
# open http://localhost:3000/ with Absurd theme
# A/B: http://localhost:3000/?micromode=0  (disables triggering)
```

## Matrix

| # | What to verify | Method | Result |
|---|---|---|---|
| 1 | Game loads cleanly with the 4-entry micromode registry, no console errors | Playwright automated (2026-07-10) | ✅ PASS (only failure: fonts.googleapis.com blocked by sandbox proxy — environment, not code) |
| 2 | 133 unit tests pass (109 post-Task-1 baseline + 6 loading99 + 9 captcha + 9 emojiRain) | `npm test` | ✅ PASS |
| 3 | Each micromode's enter/update/render/onExit runs without error against a real browser Canvas2D | Playwright automated (2026-07-10) | ✅ PASS (all four: coffeeBreak, loading99, captcha, emojiRain) |
| 4 | `microModeTrigger` imports with the full registry without error | Playwright automated (2026-07-10) | ✅ PASS |
| 5 | Loading 99%: mash fire, bar ticks 0.1%/press, hits 100% → score +500 | Manual | ☐ Score HUD should jump by 500 (×difficulty/level/combo multipliers). |
| 6 | Loading 99%: sarcastic label varies across runs | Manual | ☐ Trigger it a few times; label should rotate through 5 variants. |
| 7 | CAPTCHA: left/right arrows move the yellow selector; fire commits | Manual | ☐ Cursor starts center; clamps at ends. |
| 8 | CAPTCHA: picking the robot grants a random power-up (visible in HUD) | Manual | ☐ Shield/rapid-fire/spread-shot indicator appears after pop. |
| 9 | CAPTCHA: wrong pick = nothing lost, nothing gained | Manual | ☐ No HUD change. |
| 10 | Emoji Rain: hot dog dodges with left/right; surviving 5s untouched → +300 score | Manual | ☐ Also verify "OUCH! NO BONUS" overlay when hit, and that being hit costs nothing. |
| 11 | Random rotation: all four micromodes appear across repeated triggers | Manual | ☐ Probabilistic — may take a long session. |
| 12 | Touch controls drive all micromodes on mobile (fire button mash; left/right for CAPTCHA cursor + Emoji Rain dodge) | Manual | ☐ Micromodes read the shared input state, so the on-screen buttons should just work. |
| 13 | Non-Absurd theme / `?micromode=0`: no micromode ever fires | Manual | ☐ Regression of Phase 2D gates. |

## Result

PR link: _filled after PR creation_
Overall: **Automated rows 1-4 PASS**; rows 5-13 subjective and pending human verification
Tester: ProfPowell + Claude (Playwright automation)
Date: 2026-07-10

### What automation proved

- Game loads with the four-micromode registry wired in; the only console error is the Google Fonts CDN being unreachable from the sandbox (loads fine on a normal network).
- Each new micromode's full lifecycle (enter → 10 update frames with mixed input edges → render on a real 640×480 browser canvas → onExit) executes without throwing. Emoji and Press Start 2P font rendering paths exercised in Chromium.
- 133 unit tests cover: arrow-key press-edge detection in the scene wrapper, the per-instance state pattern (Coffee Break refactor), Loading 99% press-count/float-exactness/score reward, CAPTCHA slot setup/cursor clamping/commit semantics/power-up application (via `createPowerUp` so `applyPowerUp` gets a real `config`), and Emoji Rain movement/spawning/AABB collision/score reward.

### Fixes made during implementation (vs the plan)

- **Float accumulation bug in the plan:** `pct += 0.1` ten times gives 99.99999999999997, never 100. Loading 99% now counts presses and derives `pct = 99 + presses * 0.1`, which is exactly 100.0 at 10 presses.
- **`applyPowerUp` contract:** the plan's caveat was correct — it reads `powerUp.config.duration`, so CAPTCHA builds the reward with `createPowerUp(0, 0, kind)` instead of a bare `{ type }`.
- **`addScore` prerequisites:** test states include `difficulty`/`level`/`comboMultiplier` since `addScore` applies those multipliers.

### What needs subjective human verification

Do the three new micromodes feel like fun interruptions? Is 10 presses in 5s the right Loading difficulty, is the CAPTCHA readable at a glance, is Emoji Rain dodgeable but tense? Only play reveals this.
