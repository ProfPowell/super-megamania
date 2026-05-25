# Phase 2E Micromodes Content Smoke Matrix

Automated + manual verification for PR #?? (Loading 99% + CAPTCHA + Emoji Rain, completing Tier E).

## How to run

```bash
npm run dev
# Absurd theme; clear enemies; wait for micromodes (~10–30s first, then 30–60s between).
# A/B: http://localhost:3000/?micromode=0
```

## Matrix

| # | What to verify | Method | Result |
|---|---|---|---|
| 1 | Game loads in Absurd theme, no console errors | Playwright automated (2026-05-24) | ✅ PASS |
| 2 | 133 unit tests pass (108 baseline + 1 arrow-edge + 6 loading99 + 9 captcha + 9 emojiRain) | `npm test` | ✅ PASS |
| 3 | Coffee Break still works with new per-instance state pattern | Coffee Break tests (6) | ✅ PASS (refactor verified by passing test suite) |
| 4 | Loading 99%: mash fire fills bar to 100% → +500 score | Manual | ☐ Triggered randomly in Absurd; mash space; bar hits 100%; HUD score jumps +500. |
| 5 | Loading 99%: timer expires below 100% → no score | Manual | ☐ Hold off mashing; bar stays around 99.x%; timer expires; score unchanged. |
| 6 | CAPTCHA: arrows move yellow selector; fire picks; correct pick = power-up | Manual | ☐ Arrows shift selector between 3 emoji slots; commit on robot = HUD shows a new active power-up. |
| 7 | CAPTCHA: wrong pick = nothing | Manual | ☐ Commit on food emoji → no power-up appears. |
| 8 | Emoji Rain: hot dog dodges falling emojis with arrows | Manual | ☐ Player avatar moves left/right; falling emojis visible; player avoids them. |
| 9 | Emoji Rain: survive untouched → +300 score | Manual | ☐ Dodge entire 5s; score jumps +300. |
| 10 | Emoji Rain: get hit → "OUCH! NO BONUS" overlay, no score change | Manual | ☐ Touch a falling emoji; red overlay appears; on exit, score unchanged. |
| 11 | All 4 micromodes appear over a long play session (random pick from registry) | Manual | ☐ Subjective — over ~30 min of Absurd play, all four should appear at least once each. |
| 12 | `?micromode=0` disables all micromodes | Manual | ☐ Load with flag; play Absurd indefinitely; no micromode fires. |
| 13 | Non-Absurd themes: no micromode ever fires | Manual | ☐ Switch to Cats / Food; play indefinitely; no micromode fires. |
| 14 | Bonus stage: no micromode pushes during the bonus | Manual | ☐ Reach a bonus stage; verify no micromode push during the 20s bonus. |

## Result

PR link: _filled after PR creation_
Overall: **Automated rows 1-3 PASS**; rows 4-14 subjective and pending human verification
Tester: ProfPowell + Claude (Playwright automation)
Date: 2026-05-24

### What automation proved

- Absurd theme + Phase 2E content layer loads cleanly with 0 console errors.
- 133 unit tests cover: arrow-key press-edge detection (microModeScene), Coffee Break's per-instance state semantics (6 existing tests reworked + passing), Loading 99% sip-style mash-fill + score reward + capping (6 tests), CAPTCHA cursor movement + clamping + commit semantics + power-up application + post-commit no-op (9 tests), Emoji Rain player movement + clamping + emoji spawning + falling + collision + scoring (9 tests).
- Coffee Break refactor preserves semantics (the existing test suite still passes against the new instance pattern).

### What needs subjective human verification

The "feel" rows: do the new micromodes feel as satisfying as Coffee Break? Does the random rotation across all four feel varied? Are the rewards balanced? The full A/B comparison (with `?micromode=0`) versus the full Tier E in flight.
