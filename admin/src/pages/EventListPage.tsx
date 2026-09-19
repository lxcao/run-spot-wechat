import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { callFn } from '../lib/api';
import { annotateEventStatus, splitEvents, todayISO } from '../lib/events';
import type { EventItem, Team } from '../types';

type Filter = 'all' | 'upcoming' | 'past';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'upcoming', label: '即将' },
  { key: 'past', label: '历史' },
];

export function EventListPage() {
  const [events, setEvents] = useState<(EventItem & { _status: string })[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await callFn<{ team: Team; events: EventItem[] }>('getEvents');
        if (cancelled) return;
        if (!res.ok) {
          setError(res.msg);
          setEvents([]);
          setTeam(null);
          return;
        }
        const today = todayISO();
        setTeam(res.data?.team ?? null);
        setEvents((res.data?.events ?? []).map((event) => annotateEventStatus(event, today)));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '加载失败');
        setEvents([]);
        setTeam(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retry]);

  const { upcoming, past } = useMemo(() => splitEvents(events), [events]);
  const visible = filter === 'upcoming' ? upcoming : filter === 'past' ? past : [...upcoming, ...past];

  return (
    <main className="list-page">
      <header className="list-header">
        <div>
          <h1>{team?.name || '活动列表'}</h1>
          {team?.slogan ? <p className="list-slogan">{team.slogan}</p> : null}
        </div>
        <div>
          <Link to="/runners" className="list-secondary">跑友口味</Link>
          <Link to="/events/new" className="list-new">
            + 新活动
          </Link>
        </div>
      </header>

      <div className="list-filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'is-active' : undefined}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p>加载中...</p> : null}
      {error ? (
        <section className="list-error">
          <p className="auth-error" role="alert">{error}</p>
          <button
            type="button"
            onClick={() => {
              setRetry((n) => n + 1);
            }}
          >
            重试
          </button>
        </section>
      ) : null}

      {!loading && !error && visible.length === 0 ? <p className="list-empty">暂无活动</p> : null}

      <ul className="event-list">
        {visible.map((event) => (
          <li key={event.id}>
            <Link to={`/events/${event.id}`} className="event-card">
              <span className={`event-status event-status--${event._status}`}>
                {event._status === 'upcoming' ? '即将' : '历史'}
              </span>
              <strong>{event.title || event.meet?.name || event.date}</strong>
              <span className="event-meta">
                {event.date}
                {event.time ? ` · ${event.time}` : ''}
                {event.meet?.name ? ` · ${event.meet.name}` : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
