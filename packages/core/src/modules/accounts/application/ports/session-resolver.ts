import type { Session } from '../../domain/session.ts';

/**
 * Convierte el token de una petición en una sesión. Devuelve null si el token no existe o venció.
 * La interfaz (HTTP) extrae el token; el proveedor de autenticación (librería, servicio) implementa este puerto.
 */
export interface SessionResolver {
  resolve(token: string): Promise<Session | null>;
}
