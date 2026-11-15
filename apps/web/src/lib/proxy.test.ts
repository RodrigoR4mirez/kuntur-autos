import { describe, expect, it } from 'vitest';
import { proxyToApi } from './proxy.ts';

describe('proxyToApi', () => {
  it('sin API configurada responde 503', async () => {
    const res = await proxyToApi(new Request('http://web.test/api/x'), '/x', '');
    expect(res.status).toBe(503);
  });

  it('reenvía método, cuerpo y cookie, y conserva las cookies de la respuesta', async () => {
    let seen: { url: string; method: string; cookie: string | null; body: string } | undefined;
    const fetcher = (async (url: URL, init: RequestInit) => {
      seen = {
        url: String(url),
        method: String(init.method),
        cookie: new Headers(init.headers).get('cookie'),
        body: new TextDecoder().decode(init.body as ArrayBuffer),
      };
      const headers = new Headers({ 'content-type': 'application/json' });
      headers.append('set-cookie', 'a=1; Path=/');
      headers.append('set-cookie', 'b=2; Path=/');
      return new Response('{"ok":true}', { status: 201, headers });
    }) as unknown as typeof fetch;

    const res = await proxyToApi(
      new Request('http://web.test/api/listings?x=1', {
        method: 'POST',
        headers: { cookie: 'sid=abc', 'content-type': 'application/json' },
        body: '{"t":1}',
      }),
      '/listings',
      'http://api.test',
      fetcher,
    );
    expect(seen).toEqual({
      url: 'http://api.test/listings?x=1',
      method: 'POST',
      cookie: 'sid=abc',
      body: '{"t":1}',
    });
    expect(res.status).toBe(201);
    expect(res.headers.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/']);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('si la API no responde, devuelve 502', async () => {
    const fetcher = (async () => {
      throw new Error('caída');
    }) as unknown as typeof fetch;
    const res = await proxyToApi(
      new Request('http://web.test/api/x'),
      '/x',
      'http://api.test',
      fetcher,
    );
    expect(res.status).toBe(502);
  });
});
