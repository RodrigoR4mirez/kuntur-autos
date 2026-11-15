/**
 * Reenvía /api/* y /auth/* de la web a la API de Kuntur. Así el navegador habla solo con un origen
 * (sin CORS) y la cookie de sesión queda en el dominio de la web. La dirección de la API se lee al
 * ejecutar, no al construir la imagen.
 */
const HOP_BY_HOP = ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive'];

export async function proxyToApi(
  request: Request,
  upstreamPath: string,
  baseUrl: string | undefined = process.env['KUNTUR_API_URL'],
  fetcher: typeof fetch = fetch,
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
  let upstream: Response;
  try {
    upstream = await fetcher(target, {
      method: request.method,
      headers,
      ...(hasBody ? { body: await request.arrayBuffer() } : {}),
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return Response.json(
      { error: { code: 'api_unreachable', message: 'No pudimos conectar con el servicio.' } },
      { status: 502 },
    );
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
