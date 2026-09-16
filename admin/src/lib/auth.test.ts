import { describe, expect, it } from 'vitest';
import { sessionFromGetSession, uidFromAuthUser } from './auth';

describe('sessionFromGetSession', () => {
  it('treats missing session as logged out', () => {
    expect(sessionFromGetSession({ data: { session: undefined }, error: null }).loggedIn).toBe(false);
  });
  it('treats present session as logged in', () => {
    expect(sessionFromGetSession({ data: { session: { access_token: 'x' } }, error: null }).loggedIn).toBe(true);
  });
});

describe('uidFromAuthUser', () => {
  it('prefers uid, then user_metadata.uid, then id', () => {
    expect(uidFromAuthUser({ uid: 'u1', id: 'id1', user_metadata: { uid: 'meta' } })).toBe('u1');
    expect(uidFromAuthUser({ id: 'id1', user_metadata: { uid: 'meta' } })).toBe('meta');
    expect(uidFromAuthUser({ id: 'id1' })).toBe('id1');
  });
});
