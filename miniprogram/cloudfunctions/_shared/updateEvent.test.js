const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pickEventPatch } = require('../updateEvent/index.js');

test('drops id and date', () => {
  const patch = pickEventPatch({
    id: 'hack',
    date: '2099-01-01',
    time: '08:00',
    title: '新标题',
    status: 'past',
    route: 'x',
    note: 'y',
  });
  assert.equal(patch.id, undefined);
  assert.equal(patch.date, undefined);
  assert.equal(patch.time, '08:00');
  assert.equal(patch.title, '新标题');
  assert.equal(patch.status, 'past');
});

test('rejects invalid status', () => {
  const patch = pickEventPatch({ status: 'nope' });
  assert.equal(patch.status, undefined);
});

test('passes meet and starbucks objects through', () => {
  const meet = { name: 'A', lng: 121.5, lat: 31.2 };
  const patch = pickEventPatch({ meet, starbucks: null });
  assert.deepEqual(patch.meet, meet);
  assert.equal(patch.starbucks, null);
});
