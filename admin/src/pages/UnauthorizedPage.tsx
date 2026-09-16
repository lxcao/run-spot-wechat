import { useState } from 'react';

export function UnauthorizedPage({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);

  async function copyUid() {
    await navigator.clipboard.writeText(uid);
    setCopied(true);
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>未授权</h1>
        <p>把 uid 发给群主，加到 team.webAdmins</p>
        <p className="uid-value">{uid || '未知 uid'}</p>
        <button type="button" onClick={copyUid} disabled={!uid}>
          复制 uid
        </button>
        {copied ? <p>已复制</p> : null}
      </section>
    </main>
  );
}
