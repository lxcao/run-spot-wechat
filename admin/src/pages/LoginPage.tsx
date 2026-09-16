import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const { auth } = await import('../lib/cloudbase');
      const { error: signInError } = await auth.signInWithPassword({ username, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>跑团后台</h1>
        <label htmlFor="username">用户名</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="password">密码</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending}>
          登录
        </button>
      </form>
    </main>
  );
}
