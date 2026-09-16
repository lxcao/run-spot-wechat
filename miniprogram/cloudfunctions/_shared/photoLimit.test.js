const { test } = require('node:test');
const assert = require('node:assert/strict');
const { shouldSkipPerUserLimit } = require('../updateEventPhotos/index.js');

test('web admin skips per-user 9 cap', () => {
  assert.equal(shouldSkipPerUserLimit('web'), true);
});

test('mini program runner does not skip', () => {
  assert.equal(shouldSkipPerUserLimit('mp'), false);
  assert.equal(shouldSkipPerUserLimit(null), false);
});
