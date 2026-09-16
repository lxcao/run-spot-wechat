const { test } = require('node:test');
const assert = require('node:assert/strict');
const { removePhoto } = require('../deletePhoto/index.js');

test('removes matching fileID', () => {
  const photos = [
    { fileID: 'cloud://a.jpg' },
    { fileID: 'cloud://b.jpg' },
  ];
  const next = removePhoto(photos, 'cloud://a.jpg');
  assert.equal(next.length, 1);
  assert.equal(next[0].fileID, 'cloud://b.jpg');
});

test('returns null when fileID missing', () => {
  assert.equal(removePhoto([{ fileID: 'cloud://a.jpg' }], 'cloud://nope'), null);
});
