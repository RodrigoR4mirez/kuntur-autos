import type { Session, SessionResolver } from '../modules/accounts/index.ts';

/**
 * Sesiones con tokens fijos. SOLO para pruebas y desarrollo local: cualquiera que conozca el token entra.
 * Nunca se conecta en producción.
 */
export class StaticTokenSessionResolver implements SessionResolver {
  private readonly sessions: Readonly<Record<string, Session>>;

  constructor(sessions: Readonly<Record<string, Session>>) {
    this.sessions = sessions;
  }

  resolve(token: string): Promise<Session | null> {
    return Promise.resolve(
      Object.hasOwn(this.sessions, token) ? (this.sessions[token] ?? null) : null,
    );
  }
}
