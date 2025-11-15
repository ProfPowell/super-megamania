# super-megamania - Megamania-Style JavaScript Game Tutorial 

A JavaScript tutorial project that reimplements the ancient Activision game Megamania using modern Web tech.

# Project Plan

This document is a **project plan & scaffold spec** for building a Megamania-style arcade shooter in JavaScript in two ways:

1. **Phase 1 – Vanilla JS + Canvas API**
2. **Phase 2 – Game Library (e.g. Phaser/Kaboom) for comparison**

The plan is designed so you can feed each step to a code-generation LLM and have it create the files and code incrementally.

---

## 1. Game Overview & Goals

**Game inspiration:** Atari 2600 *Megamania*  
**Core gameplay:**

- Player ship at the bottom of the screen.
- Waves of enemies sweeping/falling in patterns from the top.
- Player can move horizontally and shoot.
- Player has limited lives; enemies/lasers kill the player.
- Increasing difficulty through faster enemies, more bullets, and pattern changes.

**Engineering goals:**

- Modern JavaScript (ES modules, `const`/`let`, arrow functions where appropriate).
- Canvas 2D rendering (Phase 1) and common JS game library (Phase 2).
- Separation of concerns (game loop, input, rendering, config, UI).
- JSDoc comments for main classes/functions.
- Node-based unit tests (e.g. using `node:test`).
- High scores persisted in `localStorage`.
- Configurable assets & settings (tuning difficulty and swapping sprites/sounds).
- Input support:
  - Desktop: keyboard.
  - Mobile: on-screen touch controls.
- PWA packaging at the end (installable on mobile/desktop).
- Demonstrate quality practices: directory structure, small modules, configs, testing.

---

## 2. Repository Structure

Target top-level structure:

```text
megamania-js/
  README.md
  package.json
  .gitignore
  /shared/
    game-design-notes.md
    assets-spec.md
    config-schema.md
  /vanilla/
    /step-00-boilerplate/
    /step-01-canvas-setup/
    /step-02-game-loop/
    /step-03-player-control/
    /step-04-basic-enemy-wave/
    /step-05-projectiles-collisions/
    /step-06-multiple-waves-difficulty/
    /step-07-hud-lives-score/
    /step-08-high-scores-localstorage/
    /step-09-audio-and-assets/
    /step-10-mobile-controls/
    /step-11-settings-menu/
    /step-12-polish-refactor-tests/
    /step-13-pwa-packaging/
    /final/
  /library/
    /step-00-boilerplate/
    /step-01-basic-scene/
    /step-02-player-and-input/
    /step-03-enemy-waves/
    /step-04-scoring-highscores/
    /step-05-settings-and-pwa/
    /final/
```

Each step-XX-* directory is a self-contained demo with:
	•	index.html
	•	src/ JS modules
	•	styles/ CSS
	•	assets/ (optional in early steps; shared via ../../shared/assets-spec.md)
	•	tests/ Node-based tests (from the first step that needs them)
	•	README.md describing that step.

⸻

3. Shared Design & Config Documents

Create these upfront (can be refined as you go):

3.1 /shared/game-design-notes.md
	•	Brief description of Megamania-like rules.
	•	Player:
	•	Horizontal movement zone
	•	Speed
	•	Fire rate, bullet speed
	•	Lives and hit behavior
	•	Enemy waves:
	•	Each wave definition: pattern, speed, spawn interval, HP
	•	Number of waves before looping or ending
	•	Difficulty:
	•	How parameters change with level/wave.
	•	Win/lose conditions.

3.2 /shared/assets-spec.md
	•	List of planned assets (even if placeholders at first):
	•	Sprites: player ship, enemy variants, bullets, background.
	•	Audio: firing, explosion, player hit, wave start, game over.
	•	Fonts: for score and HUD (or fallback to generic).
	•	File naming conventions & recommended formats (e.g. .png, .wav).
	•	Resolution guidance (e.g. base logical size 320×180, scaled for modern displays).

3.3 /shared/config-schema.md

Define a JSON (or JS) schema for configuration:
	•	gameConfig:
	•	canvas.width, canvas.height.
	•	player:
	•	speed, bulletSpeed, fireCooldown.
	•	waves: array of wave configs:
	•	id, spawnPattern, enemySpeed, enemyRows, enemyColumns, pathType.
	•	difficultySettings:
	•	easy, normal, hard objects with modifiers.
	•	audio:
	•	flags for sound on/off, volume.
	•	controls:
	•	keyboard mapping, touch control zones/buttons.

This document guides both the vanilla and library builds.

⸻

4. Phase 1 – Vanilla JS + Canvas Tutorial Steps

Each step below maps to a directory and has clear goals. Feed each step’s description to an LLM to generate/update code.

⸻

Step 00 – Boilerplate & Tooling

Dir: /vanilla/step-00-boilerplate/

Goal: Minimal project scaffold and tooling.

Files:
	•	index.html – simple HTML shell with <canvas> placeholder.
	•	styles/style.css – basic layout (centered canvas, background color).
	•	src/main.js – entry point (empty or “Hello, Canvas!”).
	•	package.json – dev dependencies only if needed (e.g. "type": "module").
	•	.gitignore – node_modules, etc.
	•	README.md – explains this step.

Key requirements:
	•	Set up npm scripts:
	•	"test": "node --test" (even if no tests yet).
	•	"serve" script suggestion (can be npx serve or similar, but keep instructions generic).
	•	Use ES modules: type="module" in <script>.

LLM prompt focus:
	•	“Create these files with minimal content so the page loads and shows a blank canvas and a console log message.”

⸻

Step 01 – Canvas Setup & Resize

Dir: /vanilla/step-01-canvas-setup/

Goal: Draw a solid background on canvas and handle resize.

Files (new/updated):
	•	index.html – <canvas id="gameCanvas"></canvas>.
	•	src/canvas.js – module to:
	•	Get canvas context.
	•	Set logical resolution (e.g. 320×180).
	•	Handle scaling for device pixel ratio.
	•	src/main.js – import canvas.js and fill background.

Key points:
	•	JSDoc for:
	•	getCanvasContext()
	•	resizeCanvas(canvas, width, height)
	•	Show a static background color.

Acceptance criteria:
	•	Canvas fills part of the screen.
	•	Resizes on window resize while maintaining aspect ratio.

⸻

Step 02 – Game Loop & Basic State

Dir: /vanilla/step-02-game-loop/

Goal: Implement a basic game loop with requestAnimationFrame.

New/updated:
	•	src/gameLoop.js:
	•	startGameLoop(update, render) with delta time.
	•	src/state/gameState.js:
	•	Stores simple state: time, fps.
	•	src/main.js:
	•	Initializes state and calls startGameLoop.

JSDoc:
	•	For game loop functions; describe parameters and return types.

Tests:
	•	tests/gameLoop.test.js:
	•	Test pure helpers (e.g. FPS calculation, clamping).

⸻

Step 03 – Player Ship & Keyboard Input

Dir: /vanilla/step-03-player-control/

Goal: Add a player ship rectangle that can move left/right via keyboard.

New/updated:
	•	src/input/keyboard.js:
	•	Key state tracking (ArrowLeft, ArrowRight, Space reserved).
	•	src/entities/player.js:
	•	Player object with position, speed, width/height.
	•	updatePlayer(player, dt, input, boundaries).
	•	drawPlayer(ctx, player).
	•	src/main.js:
	•	Integrate player into update/render.

JSDoc:
	•	For Player type (typedef) and functions.

Tests:
	•	tests/player.test.js:
	•	Movement clamping within screen boundaries.
	•	Speed application based on dt.

⸻

Step 04 – Basic Enemy Wave (Static Pattern)

Dir: /vanilla/step-04-basic-enemy-wave/

Goal: Render a simple row of enemies at the top, moving horizontally back and forth.

New/updated:
	•	src/entities/enemy.js:
	•	createEnemy(x, y, patternConfig)
	•	updateEnemy(enemy, dt) – simple horizontal oscillation.
	•	drawEnemy(ctx, enemy).
	•	src/entities/enemyWave.js:
	•	createEnemyWave(config) – uses config from config/waves.js.
	•	updateWave(wave, dt), drawWave(ctx, wave).
	•	src/config/waves.js:
	•	Single basic wave definition.

Tests:
	•	tests/enemyWave.test.js – e.g., verifying enemy positions after updateWave.

⸻

Step 05 – Player Projectiles & Collision Detection

Dir: /vanilla/step-05-projectiles-collisions/

Goal: Allow player to shoot and destroy enemies.

New/updated:
	•	src/entities/projectile.js:
	•	createProjectile(x, y).
	•	updateProjectile(projectile, dt).
	•	drawProjectile(ctx, projectile).
	•	src/systems/collision.js:
	•	AABB collision detection (rectsOverlap(a, b)).
	•	src/main.js:
	•	Handle firing (Space key).
	•	Update bullet list.
	•	Detect bullet–enemy collisions and remove both.

JSDoc:
	•	For collision helpers and projectile types.

Tests:
	•	tests/collision.test.js – pure collision logic tests.

⸻

Step 06 – Multiple Waves & Difficulty Progression

Dir: /vanilla/step-06-multiple-waves-difficulty/

Goal: Implement multiple waves and simple difficulty progression.

New/updated:
	•	src/config/waves.js:
	•	Multiple wave configs with varying speed/pattern.
	•	src/state/gameState.js:
	•	Fields for currentWaveIndex, lives, score, difficultyLevel.
	•	src/systems/waveManager.js:
	•	startWave(index), updateWaveManager(...).
	•	Difficulty adjustment:
	•	e.g. enemy speed multiplier per level/wave.

Tests:
	•	tests/waveManager.test.js – ensures correct wave progression logic.

⸻

Step 07 – HUD, Score, Lives & Game Over

Dir: /vanilla/step-07-hud-lives-score/

Goal: Render HUD with score, lives, current wave. Implement game over/restart.

New/updated:
	•	src/ui/hud.js:
	•	drawHUD(ctx, gameState) with text rendering.
	•	src/ui/screens.js:
	•	Simple start, pause, game over overlays.
	•	src/main.js:
	•	Track score (per enemy killed).
	•	Decrement lives on player hit or missed waves (if applicable).
	•	Game over state and restart key.

Tests:
	•	tests/score.test.js – scoring logic (pure functions).

⸻

Step 08 – High Scores with localStorage

Dir: /vanilla/step-08-high-scores-localstorage/

Goal: Persist high scores in localStorage and display a high-score table.

New/updated:
	•	src/storage/highScores.js:
	•	HIGH_SCORE_KEY constant.
	•	loadHighScores(), saveHighScores(scores).
	•	updateHighScores(scores, newScore, playerName?).
	•	src/ui/highScores.js:
	•	drawHighScores(ctx, scores) or DOM overlay.
	•	src/main.js:
	•	On game over, compare score and update high scores.

JSDoc:
	•	For storage API, including expected data shape.

Tests:
	•	tests/highScores.test.js
	•	NOTE: use a test-double for localStorage (pure function tests where possible).

⸻

Step 09 – Audio & Assets Config

Dir: /vanilla/step-09-audio-and-assets/

Goal: Introduce configurable assets (sounds & graphics) via config.

New/updated:
	•	src/assets/assetLoader.js:
	•	Generic loader for images & audio.
	•	src/config/assets.js:
	•	Exports asset URLs & IDs; align with /shared/assets-spec.md.
	•	Integrate assets into:
	•	player.js (sprite instead of rectangle).
	•	enemy.js (sprites).
	•	audio module for firing/explosion sounds.

Tests:
	•	Minimal tests for pure helper functions (e.g. asset map building).

⸻

Step 10 – Mobile Touch Controls

Dir: /vanilla/step-10-mobile-controls/

Goal: Add touch controls for mobile usage.

New/updated:
	•	src/input/touch.js:
	•	Touch zones for left/right buttons and fire button overlaid on canvas.
	•	styles/style.css:
	•	Simple on-screen button layout for mobile (responsive).
	•	Integrate combined input:
	•	getInput() merges keyboard and touch states into a common inputState.

Tests:
	•	Pure tests for mapping touch events to inputState (simulate events).

⸻

Step 11 – Settings Menu (Difficulty, Sound, Controls)

Dir: /vanilla/step-11-settings-menu/

Goal: Implement an in-game settings screen with persisted settings.

New/updated:
	•	src/config/settingsDefaults.js:
	•	Default difficulty (easy, normal, hard).
	•	Sound on/off, volume.
	•	src/storage/settings.js:
	•	loadSettings(), saveSettings(settings).
	•	src/ui/settingsMenu.js:
	•	Render as DOM overlay or canvas-based menu.
	•	Options to set difficulty, sound on/off.
	•	src/main.js:
	•	Apply difficulty modifiers from settings to waves & player.
	•	Apply sound settings to audio.

Tests:
	•	tests/settings.test.js – correctness of update/merge logic.

⸻

Step 12 – Polish, Refactor & Testing

Dir: /vanilla/step-12-polish-refactor-tests/

Goal: Clean architecture, ensure JSDoc coverage, expand tests, and improve readability.

Activities:
	•	Introduce simple module boundaries:
	•	entities, systems, ui, config, state, input, storage, assets.
	•	Add JSDoc comments for:
	•	All public functions.
	•	Major typedefs (Player, Enemy, Wave, GameState, etc.).
	•	Increase test coverage for pure logic modules.
	•	Minor UX polish:
	•	Smooth transitions between screens.
	•	Better HUD typography.

LLM prompt guidance:
	•	Emphasize refactoring, not new features.
	•	Ask to keep functions small and pure where possible.

⸻

Step 13 – PWA Packaging

Dir: /vanilla/step-13-pwa-packaging/

Goal: Turn the vanilla game into an installable PWA.

New/updated:
	•	manifest.webmanifest:
	•	Name, icons, theme colors, start URL.
	•	service-worker.js:
	•	Cache static assets (index.html, JS, CSS, sprites, audio).
	•	Cache strategy: simple “cache first” for offline play.
	•	index.html:
	•	Link to manifest.
	•	Register service worker in main.js.

Acceptance criteria:
	•	Game can be installed (via browser “Install app”).
	•	Works offline after initial load.

⸻

Vanilla Final Build

Dir: /vanilla/final/
	•	Consolidates the best version from step 13 (no tutorial artifacts).
	•	Clean, production-style code (but still readable and documented).
	•	Separate README.md explaining build and run instructions.

⸻

5. Phase 2 – Library-Based Version (e.g. Phaser or Kaboom)

This phase is shorter and focuses on comparing a game library implementation to the vanilla version.

Pick one library:
Examples: Phaser 3, Kaboom.js, MelonJS, etc. (document the chosen one in library/README.md).

⸻

Library Step 00 – Boilerplate & Library Setup

Dir: /library/step-00-boilerplate/

Goal: Basic HTML page with library loaded.

Files:
	•	index.html – library script tag or ES module import.
	•	src/main.js – create a basic game instance with one empty scene.
	•	README.md – note how to run and which library version is used.

⸻

Library Step 01 – Basic Scene, Player & Input

Dir: /library/step-01-basic-scene/

Goal: Set up a single scene/state with the player sprite and movement.
	•	Create a scene with:
	•	Player sprite at bottom of screen.
	•	Keyboard input mapped to left/right moves.
	•	Show static background.

Note: Reuse ideas from vanilla gameConfig where possible.

⸻

Library Step 02 – Enemy Waves & Firing

Dir: /library/step-02-enemy-waves/

Goal: Implement basic enemy wave and player projectiles using built-in physics/events.
	•	Add enemies with motion patterns using library’s update/physics hooks.
	•	Player firing bullets.
	•	Collisions handled via library’s collision system.

⸻

Library Step 03 – HUD, Scoring & High Scores

Dir: /library/step-03-hud-highscores/

Goal: HUD overlay and high scores (localStorage again).
	•	Display score, lives in HUD.
	•	High-score logic similar to vanilla version (storage/highScores.js can be re-used or adapted).
	•	Simple game over screen with restart option.

⸻

Library Step 04 – Settings, Touch Controls & PWA

Dir: /library/step-04-settings-and-pwa/

Goal: Add settings, touch controls, and PWA support.
	•	Settings menu:
	•	Difficulty, sound toggle, maybe screen orientation.
	•	Touch controls:
	•	Use library’s input handling or DOM overlays as needed.
	•	PWA:
	•	Reuse manifest and service worker from vanilla (if feasible) or create a simplified version.

⸻

Library Final Build

Dir: /library/final/
	•	Clean final version with:
	•	Scene organization.
	•	Configurable levels/waves.
	•	Settings, high scores, and PWA support (if practical).
	•	JSDoc where appropriate, even though library hides some boilerplate.

⸻

6. Comparison & Documentation

Add a document at the repo root:

/COMPARISON.md

Content outline:
	1.	Architecture differences:
	•	Game loop, entity management, input handling.
	2.	Complexity & code size:
	•	Lines of code (rough).
	3.	Extensibility:
	•	Adding new enemy patterns or assets.
	4.	Performance:
	•	Observations on desktop vs mobile.
	5.	Developer experience:
	•	Vanilla vs library for:
	•	Testing.
	•	Debugging.
	•	Asset management.
	6.	Educational takeaways:
	•	What students learn from each approach.

⸻

7. Quality & JSDoc / Testing Guidelines

General guidance (for the LLM tool):
	•	Use ES modules and avoid global variables.
	•	Add JSDoc for:
	•	Public functions, class constructors.
	•	Core data structures (GameState, Player, Enemy, Wave).
	•	Prefer pure functions for logic (movement, collision, scoring) so they can be unit tested.
	•	Use Node’s built-in node:test (or another simple test runner) with no extra dependencies unless explicitly requested.
	•	Keep tests under /tests/ in each step directory, focusing on logic modules, not Canvas or library-specific rendering.

Sample JSDoc pattern to use:
```js
/**
 * @typedef {Object} Player
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} speed
 */

/**
 * Update the player's horizontal position.
 * @param {Player} player
 * @param {number} dt - Delta time in seconds.
 * @param {number} direction - -1 for left, 1 for right, 0 for none.
 * @param {{ minX: number, maxX: number }} bounds
 * @returns {Player} Updated player (same object or new).
 */
export function updatePlayerPosition(player, dt, direction, bounds) {
  // ...
}
```

