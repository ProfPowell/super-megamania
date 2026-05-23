/**
 * Synchronous in-process pub-sub. Handlers run in subscribe order,
 * on the current call stack, with errors caught and logged so one
 * bad reactor cannot break a frame.
 *
 * Intentionally NOT a queue and NOT async: the order of side-effects
 * inside a single emit must be deterministic and immediate, otherwise
 * gameplay reactions (hitstop, screen shake, audio) drift out of sync
 * with the frame that caused them.
 */
export function createEventBus() {
  const handlers = new Map(); // event name -> array of handler functions

  function on(event, handler) {
    let list = handlers.get(event);
    if (!list) {
      list = [];
      handlers.set(event, list);
    }
    list.push(handler);
    return () => off(event, handler);
  }

  function off(event, handler) {
    const list = handlers.get(event);
    if (!list) return;
    const idx = list.indexOf(handler);
    if (idx >= 0) list.splice(idx, 1);
  }

  function emit(event, payload) {
    const list = handlers.get(event);
    if (!list) return;
    // Snapshot so a handler can subscribe/unsubscribe during emit without
    // re-entrantly mutating the list we are iterating.
    const snapshot = list.slice();
    for (const handler of snapshot) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[eventBus] handler for "${event}" threw:`, err);
      }
    }
  }

  return { on, off, emit };
}
