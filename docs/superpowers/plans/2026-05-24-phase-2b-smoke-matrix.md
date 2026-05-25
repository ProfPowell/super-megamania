# Phase 2B Controls Feel Smoke Matrix

Automated and manual verification for the Phase 2B PR (Tier C: input buffering + edge friction).

## How to run

```bash
npm run dev
# open http://localhost:3000/
```

## Matrix

| # | What to verify | Method | Result |
|---|---|---|---|
| 1 | Game loads cleanly with no console errors | Playwright automated (2026-05-24) | ✅ PASS (0 errors over full session) |
| 2 | Game starts, menu → play transition works | Playwright automated | ✅ PASS (Enter started a game; cats theme; enemies visible; player at default position) |
| 3 | 74 unit tests pass (50 baseline + 13 from Phase 2A + 6 input buffering + 5 friction) | `npm test` | ✅ PASS |
| 4 | Input buffering: late tap fires when cooldown clears | Manual | ☐ Subjective — tap fire just before cooldown ends; expect the next shot to fire as cooldown clears even if you released the key. Compare to pre-2B by reverting branch or using a separate clone. |
| 5 | Held fire still cadences at normal rate | Manual | ☐ Hold space and verify fire rate is unchanged from before (should be identical) |
| 6 | Edge friction: player decelerates into walls | Manual | ☐ Subjective — press and hold left or right; the player should slow noticeably in the last 16px before the wall instead of stopping abruptly |
| 7 | Edge friction does not affect movement away from walls | Manual | ☐ Sit at a wall, then press the opposite direction; full speed should resume immediately |
| 8 | Pause/resume cycle does not produce phantom buffered shot | Manual | ☐ Hold fire, press Esc to pause, release fire, press Esc to resume; should not auto-fire on resume |

## Result

PR link: _filled in after PR creation_
Overall: **Automated rows 1-3 PASS**; rest pending subjective user verification
Tester: ProfPowell + Claude (Playwright automation)
Date: 2026-05-24

### What automation proved

- Game loads with the controls changes and runs cleanly across menu → start → gameplay; 0 console errors.
- All 74 unit tests pass: the 6 input-buffering tests verify the `firePressedAt` press-edge contract; the 5 friction tests verify the linear damp math (including the new tightened assertions that compare against the expected 0.3 × fullSpeed value at the wall, so they actually catch the new behavior rather than the pre-existing hard-clamp).

### What needs subjective human verification

The "feel" of input buffering and edge friction is the whole point of Phase 2B — only you can confirm whether a late-tap fire and a wall-decel arc feels noticeably better than before. Tests guarantee correctness of the math; only play guarantees the math feels right.
