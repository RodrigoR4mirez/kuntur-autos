import type { FastifyInstance, FastifyRequest } from 'fastify';

export type AuthHandler = (request: Request) => Promise<Response>;

export interface AuthRouteDeps {
  readonly handler: AuthHandler;
  /** URL pública de la API; sirve para armar la URL absoluta que espera la API estándar Request. */
  readonly baseUrl: string;
}

function toFetchRequest(request: FastifyRequest, baseUrl: string): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(name, v));
    else if (value !== undefined) headers.set(name, value);
  }

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined) {
    // Fastify ya interpretó el JSON; se vuelve a serializar para el manejador.
    init.body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
  }
  return new Request(new URL(request.url, baseUrl), init);
}

/**
 * Monta /auth/* delegando en el proveedor de autenticación. Esta capa solo traduce entre Fastify y la
 * API estándar Request/Response; no sabe qué librería hay detrás.
 */
export function authRoutes(app: FastifyInstance, deps: AuthRouteDeps): void {
  app.route({
    method: ['GET', 'POST'],
    url: '/auth/*',
    handler: async (request, reply) => {
      const response = await deps.handler(toFetchRequest(request, deps.baseUrl));

      reply.status(response.status);
      response.headers.forEach((value, name) => {
        if (name !== 'set-cookie') reply.header(name, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length > 0) reply.header('set-cookie', cookies);

      return reply.send(response.body ? Buffer.from(await response.arrayBuffer()) : null);
    },
  });
}
