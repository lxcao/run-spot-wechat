import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { callFn } from '../lib/api';
import { formatDrinkLine } from '../lib/runners';
import type { Runner } from '../types';

export function RunnerListPage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const res = await callFn<{ runners: Runner[] }>('listRunners');
      if (cancelled) return;
      if (!res.ok) {
        setError(res.msg);
        setRunners([]);
      } else {
        setRunners(res.data?.runners ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [retry]);

  async function onDelete(runner: Runner) {
    if (!window.confirm(`确定删除 ${runner.nickname}？删除后需重新录入`)) return;
    setBusyId(runner.id);
    const res = await callFn('deleteRunner', { id: runner.id });
    setBusyId('');
    if (!res.ok) {
      setError(res.msg || '删除失败，请重试');
      return;
    }
    setRetry((n) => n + 1);
  }

  return (
    <main className="list-page">
      <header className="list-header">
        <div>
          <p className="list-nav">
            <Link to="/">活动</Link>
            <span> / 跑友口味</span>
          </p>
          <h1>跑友口味</h1>
        </div>
        <Link to="/runners/new" className="list-new">
          + 新跑友
        </Link>
      </header>
      {loading ? <p>加载中...</p> : null}
      {error ? (
        <section className="list-error">
          <p className="auth-error" role="alert">{error}</p>
          <button type="button" onClick={() => setRetry((n) => n + 1)}>重试</button>
        </section>
      ) : null}
      {!loading && !error && runners.length === 0 ? (
        <p className="list-empty">还没有跑友口味</p>
      ) : null}
      <ul className="event-list">
        {runners.map((runner) => (
          <li key={runner.id} className="runner-row">
            <Link to={`/runners/${runner.id}`} className="event-card">
              <strong>{runner.nickname}</strong>
              <span className="event-meta">
                咖啡 {runner.drinks.length} · 餐 {runner.foods.length}
              </span>
              {runner.drinks.slice(0, 2).map((d, i) => (
                <span key={i} className="event-meta">{formatDrinkLine(d)}</span>
              ))}
            </Link>
            <button
              type="button"
              className="runner-delete"
              disabled={busyId === runner.id}
              onClick={() => onDelete(runner)}
            >
              删除
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
