const { test } = require('node:test');
const assert = require('node:assert/strict');
const { todayISO, annotateEventStatus, expireStoredStatus } = require('./eventStatus');

const today = '2026-09-30';

test('past date with stored upcoming is past', () => {
  assert.equal(
    annotateEventStatus({ date: '2026-09-19', status: 'upcoming' }, today)._status,
    'past',
  );
});

test('today is upcoming', () => {
  assert.equal(annotateEventStatus({ date: '2026-09-30' }, today)._status, 'upcoming');
});

test('future handwritten past stays past', () => {
  assert.equal(
    annotateEventStatus({ date: '2030-01-01', status: 'past' }, today)._status,
    'past',
  );
});

test('expireStoredStatus rewrites past-dated upcoming for old clients', () => {
  const e = expireStoredStatus({ date: '2026-09-19', status: 'upcoming', title: '滨江' }, today);
  assert.equal(e.status, 'past');
  assert.equal(e._status, 'past');
  assert.equal(e.title, '滨江');
});

test('expireStoredStatus leaves future upcoming alone', () => {
  const e = expireStoredStatus({ date: '2026-10-10', status: 'upcoming' }, today);
  assert.equal(e.status, 'upcoming');
  assert.equal(e._status, 'upcoming');
});

test('todayISO is the Shanghai calendar date', () => {
  assert.equal(todayISO(new Date('2026-09-30T00:30:00+08:00')), '2026-09-30');
  assert.equal(todayISO(new Date('2026-09-29T23:30:00+08:00')), '2026-09-29');
  assert.equal(todayISO(new Date('2026-09-30T16:00:00Z')), '2026-10-01');
});
