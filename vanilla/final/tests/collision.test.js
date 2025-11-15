/**
 * @fileoverview Tests for collision detection
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { rectsOverlap, pointInRect, getEntityRect } from '../src/systems/collision.js';

test('rectsOverlap - overlapping rectangles', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 5, y: 5, width: 10, height: 10 };
  assert.strictEqual(rectsOverlap(a, b), true);
});

test('rectsOverlap - non-overlapping rectangles', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 20, y: 20, width: 10, height: 10 };
  assert.strictEqual(rectsOverlap(a, b), false);
});

test('rectsOverlap - adjacent rectangles', () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };
  const b = { x: 10, y: 0, width: 10, height: 10 };
  assert.strictEqual(rectsOverlap(a, b), false);
});

test('rectsOverlap - contained rectangle', () => {
  const a = { x: 0, y: 0, width: 20, height: 20 };
  const b = { x: 5, y: 5, width: 5, height: 5 };
  assert.strictEqual(rectsOverlap(a, b), true);
});

test('pointInRect - point inside rectangle', () => {
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  assert.strictEqual(pointInRect(5, 5, rect), true);
});

test('pointInRect - point outside rectangle', () => {
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  assert.strictEqual(pointInRect(15, 15, rect), false);
});

test('pointInRect - point on edge', () => {
  const rect = { x: 0, y: 0, width: 10, height: 10 };
  assert.strictEqual(pointInRect(10, 10, rect), true);
});

test('getEntityRect - non-centered entity', () => {
  const entity = { x: 10, y: 20, width: 5, height: 8 };
  const rect = getEntityRect(entity, false);
  assert.deepStrictEqual(rect, { x: 10, y: 20, width: 5, height: 8 });
});

test('getEntityRect - centered entity', () => {
  const entity = { x: 10, y: 20, width: 4, height: 6 };
  const rect = getEntityRect(entity, true);
  assert.deepStrictEqual(rect, { x: 8, y: 17, width: 4, height: 6 });
});
