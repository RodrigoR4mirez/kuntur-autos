import type { FastifyRequest } from 'fastify';
import type { AccessLevel } from '@kuntur/core';

/**
 * Decide el nivel de acceso de quien hace la petición.
 * Hasta tener sesiones (Fase 1, autenticación) todos son visitantes anónimos.
 */
export function resolveAccessLevel(_request: FastifyRequest): AccessLevel {
  return 'anonymous';
}
