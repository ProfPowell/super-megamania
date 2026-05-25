# Phase 2C Absurd Flavor Smoke Matrix

Automated and manual verification for the Phase 2C PR (Tier D: meme intrusion + VHS jitter + perfect-bonus kaboom).

## How to run

```bash
npm run dev
# Absurd theme (Settings → Theme → 🌭 ABSURD MODE)
# A/B comparison: http://localhost:3000/?juice=0
```

## Matrix

| # | What to verify | Method | Result |
|---|---|---|---|
| 1 | Game loads cleanly with Absurd theme, no console errors | Playwright automated (2026-05-24) | ✅ PASS (0 errors over session) |
| 2 | Trail particles still fire (Phase 2A regression check) | Playwright automated | ✅ PASS — red trail dots visible behind enemies in `phase2c-absurd-start.png` |
| 3 | Unit tests pass (63 baseline + 4 confetti + 5 meme intrusion) | `npm test` | ✅ PASS (72 total) |
| 4 | Meme intrusion: giant emoji drifts across background every 20–40s | Manual | ☐ Subjective — sit in Absurd for ~30s; expect a giant 😱/🌭/🤖/etc. to drift across at semi-transparent alpha. Verify it recurs over multiple intervals. |
| 5 | Meme intrusion does NOT fire in non-Absurd themes | Manual | ☐ Switch to Cats theme, play ~30s; no emoji should appear. |
| 6 | VHS jitter: bonus stage in Absurd snaps horizontally ~once/sec | Manual | ☐ Reach a bonus stage (every 5 waves) in Absurd. Watch for brief horizontal canvas snap once per second. |
| 7 | VHS jitter does NOT fire outside bonus stage or outside Absurd | Manual | ☐ Confirm normal gameplay (any theme) has no jitter; confirm bonus stage in non-Absurd theme also has no jitter. |
| 8 | Perfect-bonus kaboom: confetti burst + 350ms scanline overlay | Manual | ☐ Survive a bonus stage perfectly in Absurd. Expect: chromatic aberration (2A) + multicolor confetti burst from screen center + brief scanline overlay across the whole game-container. |
| 9 | Non-perfect bonus end does NOT trigger kaboom | Manual | ☐ Let enemies escape during a bonus stage; verify only the standard "N ENEMIES ESCAPED" overlay shows, no confetti/scanline. |
| 10 | Non-Absurd perfect bonus: no kaboom | Manual | ☐ Same as #8 but in Cats/Food/etc. — should just show the standard PERFECT! overlay with no flavor effects. |

## Known limitations (documented in PR description)

- `?juice=0` URL flag does NOT disable meme intrusions (the intrusion is driven from playScene's update tick, not from the juice reactor). It only disables reactor-driven effects (hitstop, tiered shake, particle profiles, chromatic aberration, combo HUD juice, confetti, scanline flash). Acceptable for an Absurd-mode flavor easter egg.

## Result

PR link: _filled after PR creation_
Overall: **Automated rows 1-3 PASS**; rows 4-10 are subjective and need human verification
Tester: ProfPowell + Claude (Playwright automation)
Date: 2026-05-24

### What automation proved

- Absurd theme + Phase 2C polish layer loads without console errors.
- Trail particles (the Phase 2A fix) still fire — no regression introduced by 2C.
- 72 unit tests pass (63 prior + 9 new): the confetti factory tests verify particle count, color variety, and start position; the meme-intrusion tests verify scheduling (20-40s window), theme gating (no-op outside Absurd), activation at scheduled gameTime, deactivation after duration + reschedule, and active-window persistence.

### What needs subjective human verification

Whether the meme intrusion, VHS jitter, and perfect-bonus kaboom *feel* like the right amount of absurd. Tests guarantee the math; only play guarantees the joke lands.
