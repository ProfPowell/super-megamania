# Phase 2D Micromodes Smoke Matrix

Automated + manual verification for PR #?? (framework + Coffee Break).

## How to run

```bash
npm run dev
# open http://localhost:3000/ with Absurd theme
# A/B: http://localhost:3000/?micromode=0  (disables triggering)
```

## Matrix

| # | What to verify | Method | Result |
|---|---|---|---|
| 1 | Game loads cleanly with Absurd theme, no console errors | Playwright automated (2026-05-24) | ✅ PASS |
| 2 | 88 unit tests pass (63 baseline + 10 trigger + 9 scene + 6 coffeeBreak) | `npm test` | ✅ PASS |
| 3 | Coffee Break activates when battlefield is clear for ≥1s after the scheduled time (10-30s in) | Manual | ☐ Subjective — start game, clear all enemies, sit idle ~30s; Coffee Break should push. |
| 4 | Inside Coffee Break: gameplay frozen (no enemy spawns, no movement) | Manual | ☐ Visual — only the coffee cup overlay should animate; play scene underneath stays static. |
| 5 | Each fire-press fills the cup one sip; 12 sips = early success | Manual | ☐ Mash space; cup fills; ends as soon as 12 sips reached. |
| 6 | Success grants ~15% maxEnergy refill | Manual | ☐ Note energy bar before micromode; reach 12 sips; energy bar should be visibly higher after pop. |
| 7 | Failure (≤11 sips when timer expires) costs nothing | Manual | ☐ Wait out 5s without mashing; bar unchanged. |
| 8 | After exit, gameplay resumes exactly where suspended | Manual | ☐ Enemies were spawning when paused → resume right where left off; no jump. |
| 9 | Cooldown ≥30s between micromodes | Manual | ☐ Wait through one micromode; next should not fire for at least 30s afterward. |
| 10 | Non-Absurd theme: no micromode ever fires | Manual | ☐ Switch to Cats / Food; play indefinitely; no Coffee Break. |
| 11 | `?micromode=0`: no micromode ever fires even in Absurd | Manual | ☐ Load with the flag; play in Absurd; no Coffee Break. |
| 12 | Bonus stage active: no micromode push during bonus | Manual | ☐ Reach a bonus stage (every 5 waves); during the 20s bonus, no Coffee Break can fire. |

## Result

PR link: _filled after PR creation_
Overall: **Automated rows 1-2 PASS**; rows 3-12 subjective and pending human verification
Tester: ProfPowell + Claude (Playwright automation)
Date: 2026-05-24

### What automation proved

- Game loads with the micromode subsystem wired in, 0 console errors.
- 88 unit tests cover: safe-window detection, theme gating, bonus-stage gating, active-micromode gating, scheduling math, scene lifecycle (enter/update/render/exit), fire-press edge detection, auto-pop on duration, early-complete signal handling, MICROMODE_START/END payload shapes, Coffee Break sip counting + energy reward (success + capped + failure), and the regression test for "onExit runs on early-complete signal."

### What needs subjective human verification

The full end-to-end experience: does the Coffee Break feel like a fun interruption, does the energy reward feel earned, does the cooldown feel right? Only play reveals this.
