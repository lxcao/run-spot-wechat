export function sessionFromGetSession(res: { data?: { session?: unknown }; error?: unknown }) {
  return { loggedIn: Boolean(res.data?.session), error: res.error ?? null };
}

export async function readSession() {
  const { auth } = await import('./cloudbase');
  const res = await auth.getSession();
  return sessionFromGetSession(res);
}
