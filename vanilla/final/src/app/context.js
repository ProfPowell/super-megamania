/**
 * Single object threaded into every scene's update(ctx, dt) / render(ctx).
 * Replaces the module-level globals that previously lived in main.js.
 *
 * Holding all coupling in one explicit, passed-around object means scenes
 * are testable with a fake ctx and main.js stops being a hub of mutable
 * state.
 */
export function createContext({
  state,
  audio,
  input,
  canvas,
  ctx2d,
  bus,
  sceneController,
  gameLoop
}) {
  return {
    state,
    audio,
    input,
    canvas,
    ctx2d,                 // CanvasRenderingContext2D
    bus,
    sceneController,
    gameLoop,
    // Mutable theme/config — set by main bootstrap after async loads.
    theme: null,           // { name, ... } object from getTheme()
    themeImages: {},       // { wave1: HTMLImageElement, ... }
    playerImage: null,
    adjustedConfig: null,  // from getAdjustedConfig()
    backgroundElements: null,
    backgroundMode: null
  };
}

/**
 * True if Absurd Mode is the active theme. Replaces the silently-broken
 * `currentTheme === 'absurd'` string compare in main.js:1034 and :1071.
 * Note: Phase 1 keeps the bug — this helper is provided so Phase 2A can
 * fix it in a single line. Do NOT call this from any reactor in Phase 1.
 */
export function isAbsurd(ctx) {
  const name = ctx.theme && ctx.theme.name ? ctx.theme.name.toLowerCase() : '';
  return name.includes('absurd');
}
