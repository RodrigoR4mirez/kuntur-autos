import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import type { Notifier } from '@kuntur/core';

export interface AuthOptions {
  /** Base de datos de Drizzle (PostgreSQL). La crea la composition root. */
  readonly db: Parameters<typeof drizzleAdapter>[0];
  /** Tablas user, session, account y verification (las define el adaptador de PostgreSQL). */
  readonly schema: Record<string, unknown>;
  /** Secreto para firmar sesiones y tokens. Largo y aleatorio; nunca en el repositorio. */
  readonly secret: string;
  /** URL pública de la API, por ejemplo https://api.kunturautos.pe */
  readonly baseUrl: string;
  /** Orígenes de la web que pueden usar la sesión (CORS y redirecciones). */
  readonly trustedOrigins: readonly string[];
  /** Envía los correos de verificación. Sin él, el registro por correo queda desactivado. */
  readonly mailer: Notifier | null;
  /** Credenciales de Google OAuth. Sin ellas, el inicio con Google queda desactivado. */
  readonly google: { readonly clientId: string; readonly clientSecret: string } | null;
}

/**
 * Better Auth configurado para Kuntur Autos:
 *  - correo y contraseña, con correo verificado obligatorio (solo si hay `mailer`);
 *  - Google (solo si hay credenciales);
 *  - sesiones por cookie (web) y por `Authorization: Bearer` (apps móviles y llamadas entre servidores).
 * Las rutas viven bajo /auth (POST /auth/sign-up/email, /auth/sign-in/email, /auth/sign-in/social...).
 */
export function createAuth(options: AuthOptions) {
  const { mailer } = options;

  // No se espera el envío: así el tiempo de respuesta no revela si el correo existe.
  const sendMail = (to: string, template: string, name: string, url: string): void => {
    if (!mailer) return;
    mailer.send({ channel: 'email', to, template, data: { name, url } }).catch((error: unknown) => {
      console.error(
        JSON.stringify({
          level: 'error',
          msg: 'no se pudo enviar el correo',
          template,
          error: String(error),
        }),
      );
    });
  };

  return betterAuth({
    appName: 'Kuntur Autos',
    baseURL: options.baseUrl,
    basePath: '/auth',
    secret: options.secret,
    trustedOrigins: [...options.trustedOrigins],
    database: drizzleAdapter(options.db, { provider: 'pg', schema: options.schema }),
    emailAndPassword: {
      enabled: mailer !== null,
      requireEmailVerification: true,
      minPasswordLength: 10,
      sendResetPassword: async ({ user, url }) => {
        sendMail(user.email, 'reset-password', user.name, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendMail(user.email, 'verify-email', user.name, url);
      },
    },
    socialProviders: options.google
      ? { google: { clientId: options.google.clientId, clientSecret: options.google.clientSecret } }
      : {},
    plugins: [bearer()],
    user: {
      additionalFields: {
        // Todos nacen como compradores; el rol no se puede elegir al registrarse.
        role: { type: 'string', required: false, defaultValue: 'buyer', input: false },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Entrega las peticiones HTTP de /auth/* a Better Auth. Usa la API estándar Request/Response. */
export function createAuthHandler(
  auth: Pick<Auth, 'handler'>,
): (request: Request) => Promise<Response> {
  return (request) => auth.handler(request);
}
