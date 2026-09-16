const { test } = require('node:test');
const assert = require('node:assert/strict');
const { decideAdmin } = require('./assertAdmin');

const team = {
  admins: ['mp-openid-1'],
  webAdmins: ['web-uid-1'],
};

test('mini program openid in admins is mp admin', () => {
  const r = decideAdmin({ openid: 'mp-openid-1', uid: null, team });
  assert.equal(r.ok, true);
  assert.equal(r.kind, 'mp');
  assert.equal(r.id, 'mp-openid-1');
});

test('web uid in webAdmins is web admin', () => {
  const r = decideAdmin({ openid: null, uid: 'web-uid-1', team });
  assert.equal(r.ok, true);
  assert.equal(r.kind, 'web');
  assert.equal(r.id, 'web-uid-1');
});

test('openid wins when both present and openid is admin', () => {
  const r = decideAdmin({ openid: 'mp-openid-1', uid: 'web-uid-1', team });
  assert.equal(r.kind, 'mp');
});

test('unknown caller is denied', () => {
  const r = decideAdmin({ openid: 'x', uid: 'y', team });
  assert.equal(r.ok, false);
  assert.equal(r.code, -1);
  assert.match(r.msg, /未授权/);
});

test('missing team fields are treated as empty arrays', () => {
  const r = decideAdmin({ openid: 'mp-openid-1', uid: null, team: {} });
  assert.equal(r.ok, false);
});

test('permission check failure must deny, never skip', () => {
  const r = decideAdmin({ openid: null, uid: null, team: null });
  assert.equal(r.ok, false);
});
