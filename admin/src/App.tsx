import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { callFn } from './lib/api';
import { readSession, readUid } from './lib/auth';
import { checkWebAdmin } from './lib/events';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import type { Team } from './types';

function EventListPlaceholder() {
  return <p>events</p>;
}

function ProtectedLayout() {
  const [state, setState] = useState<'loading' | 'anon' | 'denied' | 'ok' | 'error'>('loading');
  const [uid, setUid] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') return <p>加载中...</p>;
  if (state === 'anon') return <Navigate to="/login" replace />;
  if (state === 'error') return <p role="alert">{msg}</p>;
  if (state === 'denied') return <UnauthorizedPage uid={uid} />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<EventListPlaceholder />} />
      </Route>
    </Routes>
  );
}
