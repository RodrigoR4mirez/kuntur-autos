'use client';

import { useState } from 'react';

export function GoogleButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/auth/sign-in/social', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'google', callbackURL: '/vender' }),
      });
      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) throw new Error('sin url');
      window.location.href = data.url;
    } catch {
      setError('No pudimos iniciar el ingreso con Google. Inténtalo de nuevo.');
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={start} disabled={busy}>
        {busy ? 'Abriendo Google…' : 'Continuar con Google'}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
