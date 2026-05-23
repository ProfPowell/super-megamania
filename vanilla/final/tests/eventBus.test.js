import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../src/app/eventBus.js';

test('eventBus: emit invokes subscribed handler with payload', () => {
  const bus = createEventBus();
  const calls = [];
  bus.on('FOO', (payload) => calls.push(payload));
  bus.emit('FOO', { x: 1 });
  assert.deepEqual(calls, [{ x: 1 }]);
});

test('eventBus: emit invokes multiple handlers in subscribe order', () => {
  const bus = createEventBus();
  const order = [];
  bus.on('FOO', () => order.push('a'));
  bus.on('FOO', () => order.push('b'));
  bus.on('FOO', () => order.push('c'));
  bus.emit('FOO');
  assert.deepEqual(order, ['a', 'b', 'c']);
});

test('eventBus: off removes a specific handler', () => {
  const bus = createEventBus();
  let aCalls = 0;
  let bCalls = 0;
  const handlerA = () => { aCalls++; };
  const handlerB = () => { bCalls++; };
  bus.on('FOO', handlerA);
  bus.on('FOO', handlerB);
  bus.off('FOO', handlerA);
  bus.emit('FOO');
  assert.equal(aCalls, 0);
  assert.equal(bCalls, 1);
});

test('eventBus: emit with no subscribers does not throw', () => {
  const bus = createEventBus();
  assert.doesNotThrow(() => bus.emit('UNKNOWN', { a: 1 }));
});

test('eventBus: handler that throws does not prevent later handlers', () => {
  const bus = createEventBus();
  const calls = [];
  bus.on('FOO', () => { throw new Error('boom'); });
  bus.on('FOO', () => calls.push('ran'));
  // Bus must catch handler errors so one bad reactor never breaks a frame.
  bus.emit('FOO');
  assert.deepEqual(calls, ['ran']);
});

test('eventBus: on returns an unsubscribe function', () => {
  const bus = createEventBus();
  let n = 0;
  const unsub = bus.on('FOO', () => { n++; });
  bus.emit('FOO');
  unsub();
  bus.emit('FOO');
  assert.equal(n, 1);
});
