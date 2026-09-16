import { describe, expect, it } from 'vitest';
import { sessionFromGetSession } from './auth';

describe('sessionFromGetSession', () => {
  it('treats missing session as logged out', () => {
    expect(sessionFromGetSession({ data: { session: undefined }, error: null }).loggedIn).toBe(false);
  });
  it('treats present session as logged in', () => {
    expect(sessionFromGetSession({ data: { session: { access_token: 'x' } }, error: null }).loggedIn).toBe(true);
  });
});
