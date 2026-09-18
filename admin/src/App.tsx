import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { callFn } from './lib/api';
import { readSession, readUid } from './lib/auth';
import { checkWebAdmin } from './lib/events';
import { EventFormPage } from './pages/EventFormPage';
import { EventListPage } from './pages/EventListPage';
import { LoginPage } from './pages/LoginPage';
import { RunnerFormPage } from './pages/RunnerFormPage';
import { RunnerListPage } from './pages/RunnerListPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import type { Team } from './types';

function ProtectedLayout() {
  const [state, setState] = useState<'loading' | 'anon' | 'denied' | 'ok' | 'error'>('loading');
  const [uid, setUid] = useState('');
  const [msg, setMsg] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await readSession();
        if (cancelled) return;
        if (!session.loggedIn) {
          setState('anon');
          return;
        }
        const currentUid = await readUid();
        if (cancelled) return;
        setUid(currentUid);
        const res = await callFn<{ team: Team }>('getEvents');
        if (cancelled) return;
        if (!res.ok) {
          setMsg(res.msg);
          setState('error');
          return;
        }
        setState(checkWebAdmin(res.data?.team ?? null, currentUid) ? 'ok' : 'denied');
      } catch (err) {
        if (cancelled) return;
        setMsg(err instanceof Error ? err.message : '加载失败');
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retry]);

  function onRetry() {
    setMsg('');
    setState('loading');
    setRetry((n) => n + 1);
  }

  if (state === 'loading') return <p>加载中...</p>;
  if (state === 'anon') return <Navigate to="/login" replace />;
  if (state === 'error') {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p className="auth-error" role="alert">{msg}</p>
          <button type="button" onClick={onRetry}>
            重试
          </button>
        </section>
      </main>
    );
  }
  if (state === 'denied') return <UnauthorizedPage uid={uid} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<EventListPage />} />
        <Route path="/runners" element={<RunnerListPage />} />
        <Route path="/runners/new" element={<RunnerFormPage key="create" mode="create" />} />
        <Route path="/runners/:id" element={<RunnerFormPage mode="edit" />} />
        <Route path="/events/new" element={<EventFormPage key="create" mode="create" />} />
        <Route path="/events/:id" element={<EventFormPage mode="edit" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
