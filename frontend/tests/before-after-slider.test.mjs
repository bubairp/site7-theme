// Before/After Slider logic, with Node's own test runner (no dependencies):
//   node --test 'frontend/tests/*.test.mjs'
// The interaction itself (mouse, touch, keyboard on the range input) is tested in a
// browser by the site's QA script (rp-craft .claude/skills/site7-block-authoring).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampPosition, valueText } from '../src/js/components/before-after-slider.js';

test('positions stay between 0 and 100', () => {
  assert.equal(clampPosition(40), 40);
  assert.equal(clampPosition('73'), 73);
  assert.equal(clampPosition(-5), 0);
  assert.equal(clampPosition(140), 100);
  assert.equal(clampPosition(33.6), 34);
});

test('anything unreadable is the middle', () => {
  assert.equal(clampPosition(''), 50);
  assert.equal(clampPosition(undefined), 50);
  assert.equal(clampPosition('abc'), 50);
  assert.equal(clampPosition(Number.NaN), 50);
});

test('the value text names both sides', () => {
  assert.equal(valueText('Before', 'After', 40), 'Before 40%, After 60%');
  assert.equal(valueText('Kitchen 2019', 'Kitchen 2024', 100), 'Kitchen 2019 100%, Kitchen 2024 0%');
});

test('empty labels fall back to Before and After', () => {
  assert.equal(valueText('', undefined, 25), 'Before 25%, After 75%');
});
