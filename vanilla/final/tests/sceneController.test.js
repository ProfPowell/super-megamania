import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSceneController } from '../src/scenes/sceneController.js';

function makeScene(name, log) {
  return {
    name,
    enter() { log.push(`${name}:enter`); },
    exit()  { log.push(`${name}:exit`); },
    update(_ctx, dt) { log.push(`${name}:update:${dt}`); },
    render(_ctx)     { log.push(`${name}:render`); }
  };
}

test('sceneController: push enters the scene and makes it current', () => {
  const log = [];
  const sc = createSceneController();
  const a = makeScene('a', log);
  sc.push(a);
  assert.equal(sc.current(), a);
  assert.deepEqual(log, ['a:enter']);
});

test('sceneController: update and render route to the top scene only', () => {
  const log = [];
  const sc = createSceneController();
  sc.push(makeScene('a', log));
  sc.push(makeScene('b', log));
  log.length = 0;
  sc.update({}, 0.016);
  sc.render({});
  assert.deepEqual(log, ['b:update:0.016', 'b:render']);
});

test('sceneController: pop exits the top scene', () => {
  const log = [];
  const sc = createSceneController();
  const a = makeScene('a', log);
  const b = makeScene('b', log);
  sc.push(a);
  sc.push(b);
  log.length = 0;
  sc.pop();
  assert.equal(sc.current(), a);
  assert.deepEqual(log, ['b:exit']);
});

test('sceneController: replace exits old and enters new', () => {
  const log = [];
  const sc = createSceneController();
  sc.push(makeScene('a', log));
  log.length = 0;
  sc.replace(makeScene('b', log));
  assert.deepEqual(log, ['a:exit', 'b:enter']);
  assert.equal(sc.current().name, 'b');
});

test('sceneController: current returns null when stack is empty', () => {
  const sc = createSceneController();
  assert.equal(sc.current(), null);
});

test('sceneController: scenes without enter/exit hooks are allowed', () => {
  const sc = createSceneController();
  const minimal = { update() {}, render() {} };
  assert.doesNotThrow(() => sc.push(minimal));
  assert.doesNotThrow(() => sc.pop());
});

test('sceneController: update and render on empty stack are no-ops', () => {
  const sc = createSceneController();
  assert.doesNotThrow(() => sc.update({}, 0.016));
  assert.doesNotThrow(() => sc.render({}));
});
