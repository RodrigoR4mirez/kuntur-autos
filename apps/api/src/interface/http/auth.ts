import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Session } from '@kuntur/core';
import { apiError } from './errors.ts';

export type ResolveSession = (token: string) => Promise<Session | null>;

/** Extrae el token de `Authorization: Bearer <token>`. Devuelve null si falta o está mal formado. */
export function bearerToken(header: string | undefined): string | null {
  return header?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

/** Token de la cookie de sesión de Better Auth (con o sin prefijo __Secure-). Es el mismo valor firmado que acepta Bearer. */
export function sessionCookieToken(header: string | undefined): string | null {
  const raw = header?.match(/(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;\s]+)/)?.[1];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

/** Sesión de la petición, o null si es anónima (sin token, o token desconocido o vencido). */
export async function sessionOf(
  request: FastifyRequest,
  resolve: ResolveSession,
): Promise<Session | null> {
  const token =
    bearerToken(request.headers.authorization) ?? sessionCookieToken(request.headers.cookie);
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
