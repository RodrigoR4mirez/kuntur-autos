import type { Role, Session, SessionResolver, UserId } from '@kuntur/core';

/** Lo mínimo que usamos de Better Auth. Permite probar el mapeo sin levantar la librería. */
export interface SessionSource {
  readonly api: {
    getSession(input: { headers: Headers }): Promise<{
      user: { id: string; role?: unknown };
    } | null>;
  };
}

const ROLES: readonly Role[] = ['buyer', 'seller', 'dealer', 'advisor', 'admin'];
const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

/** Implementa el puerto SessionResolver con Better Auth (token Bearer = token de sesión). */
export class BetterAuthSessionResolver implements SessionResolver {
  private readonly source: SessionSource;

  constructor(source: SessionSource) {
    this.source = source;
  }

  async resolve(token: string): Promise<Session | null> {
    const result = await this.source.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token}` }),
    });
    if (!result) return null;
    // Un rol desconocido nunca sube privilegios: se trata como comprador.
    const role = isRole(result.user.role) ? result.user.role : 'buyer';
    return { userId: result.user.id as UserId, role };
  }
}
