import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Session } from '@kuntur/core';
import { apiError } from './errors.ts';

export type ResolveSession = (token: string) => Promise<Session | null>;

/** Extrae el token de `Authorization: Bearer <token>`. Devuelve null si falta o está mal formado. */
export function bearerToken(header: string | undefined): string | null {
  return header?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

/** Sesión de la petición, o null si es anónima (sin token, o token desconocido o vencido). */
export async function sessionOf(
  request: FastifyRequest,
  resolve: ResolveSession,
): Promise<Session | null> {
  const token = bearerToken(request.headers.authorization);
  return token ? resolve(token) : null;
}

/** Responde 401 y devuelve null cuando la ruta exige sesión y no hay. */
export async function requireSession(
  request: FastifyRequest,
  reply: FastifyReply,
  resolve: ResolveSession,
): Promise<Session | null> {
  const session = await sessionOf(request, resolve);
  if (!session) {
    await reply
      .code(401)
      .header('www-authenticate', 'Bearer')
      .send(apiError('unauthorized', 'Inicia sesión para continuar.'));
    return null;
  }
  return session;
}
