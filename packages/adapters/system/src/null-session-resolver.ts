import type { Session, SessionResolver } from '@kuntur/core';

/**
 * Sin proveedor de autenticación: nadie tiene sesión, todos son anónimos.
 * Es el valor seguro por defecto en producción hasta conectar el proveedor real.
 */
export class NullSessionResolver implements SessionResolver {
  resolve(_token: string): Promise<Session | null> {
    return Promise.resolve(null);
  }
}
