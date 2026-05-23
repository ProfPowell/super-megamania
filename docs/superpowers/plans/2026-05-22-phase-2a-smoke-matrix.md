# Phase 2A Polish Smoke Matrix

Automated and manual verification for PR #?? (Phase 2A: Tier A + Tier B polish).

## How to run

```bash
npm run dev
# open http://localhost:3000/ ; for A/B comparison: http://localhost:3000/?juice=0
```

## Matrix

| # | What to verify | Method | Result |
|---|---|---|---|
| 1 | Game loads cleanly with Absurd theme, no console errors | Playwright automated (2026-05-22) | ✅ PASS (0 errors over full session) |
| 2 | Lives still decrement on collision, full gameplay loop intact | Playwright automated | ✅ PASS (lives 3 → 2 on enemy hit; player movement, firing, scoring all functional) |
| 3 | Absurd-mode trail particles fire (the bug fix) | Playwright automated visual | ✅ PASS — colored trail dots visible scattered around enemies/bullets in screenshot (`phase2a-mid-combat.png`). Previously these never fired because `theme === 'absurd'` was always false. |
| 4 | Hitstop on enemy death (subjective feel) | Manual | ☐ Subjective — needs human to feel the brief freeze on kills |
| 5 | Tiered shake escalation on big-combo / high-score kills | Manual | ☐ Subjective — needs human to feel |
| 6 | Big-combo explosion at combo ≥ 10 | Manual | ☐ Hard to reach combo 10 in automated test; user should verify with high-combo play |
| 7 | Combo flash ring every 5-combo | Manual | ☐ Same as above |
| 8 | Powerup pickup produces colored burst at pickup point | Manual | ☐ User should pick up a power-up and confirm visible burst |
| 9 | Chromatic aberration on PLAYER_HIT (Absurd only) | Manual | ☐ User should let player get hit in Absurd mode and watch for brief red/cyan offset |
| 10 | Combo HUD pops + tilts on grow | Manual | ☐ User confirms |
| 11 | Combo HUD red flash on break | Manual | ☐ User confirms (miss or combo timeout) |
| 12 | Bonus-stage end: 0.4s drain (enemies float up + sparkle) then end overlay | Manual | ☐ User must reach bonus stage (every 5 waves) and observe |
| 13 | Wave-start telegraph: 0.6s ghost-sprite preview | Manual | ☐ User watches the start of each wave |
| 14 | `?juice=0` URL flag disables all polish | Manual A/B | ☐ Load with and without the flag; verify difference |

## Result

PR link: _filled in after PR creation_
Overall: **Automated rows 1-3 PASS**; rest pending subjective user verification
Tester: ProfPowell + Claude (Playwright automation)
Date: 2026-05-22

### What automation proved

- Absurd theme + Phase 2A polish loads with 0 console errors.
- Full gameplay loop runs (movement, firing, collision, scoring, life decrement).
- Trail particles are visibly active in the rendered frame — the once-dormant Absurd-mode trails are now firing thanks to the bug fix.
- 63 unit tests pass (50 Phase 1 + 5 particle profile + 8 juice reactor).

### What needs subjective human verification

The "feel" rows — hitstop weight, shake intensity tiers, combo flash satisfaction, chromatic aberration intensity, drain animation pacing, telegraph ghost legibility — all require a human at the keyboard to judge. The A/B comparison via `?juice=0` is the best tool: side-by-side play with and without polish.
