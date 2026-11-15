/**
 * Reenvía /api/* y /auth/* de la web a la API de Kuntur. Así el navegador habla solo con un origen
 * (sin CORS) y la cookie de sesión queda en el dominio de la web. La dirección de la API se lee al
 * ejecutar, no al construir la imagen.
 */
/**
 * En staging la API escala a cero: la primera petición tras un rato sin uso debe despertar la API y
 * la base (Neon), y puede pasar de los 15 s. Esperamos hasta 45 s y, si la conexión falla, un reintento.
 */
export const UPSTREAM_TIMEOUT_MS = 45000;
const HOP_BY_HOP = ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive'];

export async function proxyToApi(
  request: Request,
  upstreamPath: string,
  baseUrl: string | undefined = process.env['KUNTUR_API_URL'],
  fetcher: typeof fetch = fetch,
  timeoutMs: number = UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  if (!baseUrl) {
    return Response.json(
      { error: { code: 'api_not_configured', message: 'La API no está configurada.' } },
      { status: 503 },
    );
  }
  const incoming = new URL(request.url);
  const target = new URL(upstreamPath + incoming.search, baseUrl);

  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  headers.set('x-forwarded-host', incoming.host);
  headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;
  const send = () =>
    fetcher(target, {
      method: request.method,
      headers,
      ...(body ? { body } : {}),
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

  let upstream: Response;
  try {
    upstream = await send();
  } catch {
    // Un reintento solo si el método es seguro de repetir (no duplicar un POST).
    const retryable = request.method === 'GET' || request.method === 'HEAD';
    try {
      if (!retryable) throw new Error('no reintentable');
      upstream = await send();
    } catch {
      return Response.json(
        {
          error: {
            code: 'api_unreachable',
            message: 'El servicio está despertando. Inténtalo de nuevo en unos segundos.',
          },
        },
        { status: 502 },
      );
    }
  }

  const out = new Headers();
  upstream.headers.forEach((value, name) => {
    if (['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding'].includes(name)) {
      return;
    }
    out.set(name, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) out.append('set-cookie', cookie);
  return new Response(upstream.status === 204 || upstream.status === 304 ? null : upstream.body, {
    status: upstream.status,
    headers: out,
  });
}
