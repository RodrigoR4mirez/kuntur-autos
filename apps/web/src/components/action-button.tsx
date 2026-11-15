'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Botón que hace un POST a la API (por el reenvío de la web) y refresca la pantalla. */
export function ActionButton({
  url,
  body,
  label,
  className = 'btn btn-dark btn-sm',
}: {
  url: string;
  body?: Record<string, unknown>;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        ...(body
          ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
          : {}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? 'No pudimos completar la acción. Inténtalo de nuevo.');
      } else {
        router.refresh();
      }
    } catch {
      setError('No pudimos conectar con el servicio. Inténtalo de nuevo en unos segundos.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="action">
      <button type="button" className={className} onClick={run} disabled={busy}>
        {busy ? 'Un momento…' : label}
      </button>
      {error && (
        <span role="alert" className="error">
          {error}
        </span>
      )}
    </span>
  );
}
