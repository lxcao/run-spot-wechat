export function splitEvents<T extends { id: string; date: string; _status: string }>(events: T[]) {
  const upcoming = events
    .filter((e) => e._status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events
    .filter((e) => e._status === 'past')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { upcoming, past };
}

export function checkWebAdmin(team: { webAdmins?: string[] } | null, uid: string | null) {
  if (!team || !uid) return false;
  return Array.isArray(team.webAdmins) && team.webAdmins.includes(uid);
}

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function annotateEventStatus<T extends { date: string; status?: string }>(
  event: T,
  today = todayISO(),
): T & { _status: string } {
  const _status =
    event.status === 'upcoming' || event.status === 'past'
      ? event.status
      : event.date >= today
        ? 'upcoming'
        : 'past';
  return { ...event, _status };
}

export function isCreateRoute(pathname: string) {
  return pathname.endsWith('/events/new') || pathname === '/events/new';
}
