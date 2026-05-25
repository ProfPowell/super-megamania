/**
 * Phase 2A post-effects: lightweight per-frame visual filters applied
 * via CSS classes on the game canvas. Avoids the cost of full Canvas2D
 * channel-splitting at the cost of being slightly less accurate.
 *
 * `triggerChromaticAberration(durationMs)` toggles `.chroma-aberration`
 * on #gameCanvas for the given duration and removes it on a timer.
 */

let activeTimeout = null;

export function triggerChromaticAberration(durationMs = 100) {
  if (typeof document === 'undefined') return; // Node test runtime
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  canvas.classList.add('chroma-aberration');
  if (activeTimeout) clearTimeout(activeTimeout);
  activeTimeout = setTimeout(() => {
    canvas.classList.remove('chroma-aberration');
    activeTimeout = null;
  }, durationMs);
}

let scanlineTimeout = null;

export function triggerScanlineFlash(durationMs = 350) {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('game-container');
  if (!host) return;
  host.classList.add('scanline-flash');
  if (scanlineTimeout) clearTimeout(scanlineTimeout);
  scanlineTimeout = setTimeout(() => {
    host.classList.remove('scanline-flash');
    scanlineTimeout = null;
  }, durationMs);
}
