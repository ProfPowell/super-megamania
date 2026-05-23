# Phase 1 Smoke Matrix

Manual gameplay verification for the Phase 1 refactor PR. Mark each row PASS / FAIL after running it in a desktop browser.

## How to run

```bash
npm run dev
# open http://localhost:3000
```

## Matrix

| # | Theme | Difficulty | Path | Verify | Result |
|---|---|---|---|---|---|
| 1 | Cats | Normal | Menu → Start → play wave 1 → die intentionally → game over → Restart → quit to menu | All transitions work; HUD updates; high-score prompt appears if score qualifies | ☐ |
| 2 | Absurd | Normal | Menu → Start → play wave 1 → kill ≥ 3 combo → reach inter-wave pause | Background is one of the crazy modes; explosions and screen shake fire on enemy kill; bonus stage triggers at the expected wave | ☐ |
| 3 | Absurd | Hard | Menu → Start → trigger bonus stage → let some enemies escape → survive to end | Bonus announcement, timer, and end-overlay all appear; "PERFECT" vs "N ENEMIES ESCAPED" branch correctly | ☐ |
| 4 | Space | Easy | Menu → Start → pause (Esc) → resume → pause → quit-to-menu | Pause shows menu; resume does not double-input; quit returns to menu and music stops | ☐ |
| 5 | Food | Normal | Menu → Settings → switch theme to Demo → back → Start | New theme loads without errors; menu falling-enemies use new sprites | ☐ |
| 6 | Cats | Normal | Score until extra-life threshold (20000) | Extra-life SFX plays once; lives increments | ☐ |
| 7 | Absurd | Normal | Pick up shield, rapid fire, spread shot power-ups one at a time | Each power-up visibly applies and the pickup SFX plays | ☐ |
| 8 | Cats | Normal | Open browser console for full run | No uncaught errors. (`console.log` from existing debug prints is acceptable.) | ☐ |

## Known notes

- `main.js` was reduced from 1,429 lines → 257 lines (82% reduction). Plan acceptance target was ≤ 150 lines; the actual content from the plan came out to 257. No gameplay logic in `main.js` — all per-frame work is in `src/scenes/`.
- Phase 1 is a zero-behavior-change refactor. Any deviation from pre-refactor behavior is a regression worth investigating before merging.

## Result

PR link: _filled after PR creation_
Overall: PASS / FAIL (delete one)
Tester: _your name_
Date: _yyyy-mm-dd_
