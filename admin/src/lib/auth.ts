export function sessionFromGetSession(res: { data?: { session?: unknown }; error?: unknown }) {
  return { loggedIn: Boolean(res.data?.session), error: res.error ?? null };
}

type AuthUserLike = {
  uid?: unknown;
  id?: unknown;
  user_metadata?: { uid?: unknown };
} | null | undefined;

export function uidFromAuthUser(user: AuthUserLike): string {
  if (!user) return '';
  const raw = user.uid ?? user.user_metadata?.uid ?? user.id;
  return raw == null || raw === '' ? '' : String(raw);
}

export async function readSession() {
  const { auth } = await import('./cloudbase');
  const res = await auth.getSession();
  return sessionFromGetSession(res);
}

export async function readUid() {
  const { auth } = await import('./cloudbase');
  const userRes = await auth.getUser();
  const fromUser = uidFromAuthUser(userRes.data?.user);
  if (fromUser) return fromUser;
  const sessionRes = await auth.getSession();
  return uidFromAuthUser(sessionRes.data?.user ?? sessionRes.data?.session?.user);
}
