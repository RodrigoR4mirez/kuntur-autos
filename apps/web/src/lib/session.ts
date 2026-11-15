import { cookies } from 'next/headers';

export interface CurrentUser {
  readonly name: string;
  readonly email: string;
}

/** Usuario de la sesión actual, o null. Pregunta a la API reenviando la cookie del navegador. */
export async function currentUser(
  baseUrl: string | undefined = process.env['KUNTUR_API_URL'],
): Promise<CurrentUser | null> {
  // Leer la cookie SIEMPRE primero: así Next sabe que toda página con encabezado depende de la
  // sesión y no la congela como estática (en el build no hay URL de la API).
  const cookie = (await cookies()).toString();
  if (!baseUrl || !cookie) return null;
  try {
    const res = await fetch(new URL('/auth/get-session', baseUrl), {
      headers: { cookie },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const user = (data as { user?: { name?: unknown; email?: unknown } } | null)?.user;
    if (typeof user?.name === 'string' && typeof user.email === 'string') {
      return { name: user.name, email: user.email };
    }
    return null;
  } catch {
    return null;
  }
}
