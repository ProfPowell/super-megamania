/**
 * A scene stack. The top scene receives update/render; scenes below it
 * are paused, not torn down. This is what lets a micromode interlude
 * (Phase 2E) push on top of the play scene and pop back without any
 * state desync — the play scene was never disposed, just suspended.
 *
 * Scenes are plain objects with optional enter()/exit() and required
 * update(ctx, dt)/render(ctx).
 */
export function createSceneController() {
  const stack = [];

  function current() {
    return stack.length === 0 ? null : stack[stack.length - 1];
  }

  function push(scene) {
    stack.push(scene);
    if (typeof scene.enter === 'function') scene.enter();
  }

  function pop() {
    const scene = stack.pop();
    if (scene && typeof scene.exit === 'function') scene.exit();
  }

  function replace(scene) {
    pop();
    push(scene);
  }

  function update(ctx, dt) {
    const top = current();
    if (top) top.update(ctx, dt);
  }

  function render(ctx) {
    const top = current();
    if (top) top.render(ctx);
  }

  return { push, pop, replace, current, update, render };
}
