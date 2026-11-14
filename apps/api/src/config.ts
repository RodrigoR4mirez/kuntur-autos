export interface AuthConfig {
  /** Secreto de sesiones. Si falta: en producción nadie puede iniciar sesión; en desarrollo se usan tokens fijos. */
  readonly secret: string | undefined;
  /** URL pública de la API (obligatoria en producción cuando hay secreto). */
  readonly baseUrl: string | undefined;
  /** Orígenes de la web autorizados a usar la sesión. */
  readonly trustedOrigins: readonly string[];
  readonly google: { readonly clientId: string; readonly clientSecret: string } | null;
  /** Proveedor de correo por SMTP. Sin él, en producción el registro por correo queda desactivado. */
  readonly smtp: { readonly url: string; readonly from: string } | null;
}

export interface Config {
  readonly port: number;
  readonly isProduction: boolean;
  /** Página temporal de prueba del inicio con Google (solo staging). */
  readonly loginTestPage: boolean;
  readonly databaseUrl: string | undefined;
  readonly auth: AuthConfig;
}

const SECRET_MIN_LENGTH = 32;

/** Lee y valida la configuración desde variables de entorno. Falla pronto y con un mensaje claro. */
export function loadConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const get = (name: string): string | undefined => env[name]?.trim() || undefined;

  const secret = get('AUTH_SECRET');
  if (secret !== undefined && secret.length < SECRET_MIN_LENGTH) {
    throw new Error(`AUTH_SECRET debe tener al menos ${SECRET_MIN_LENGTH} caracteres.`);
  }

  const googleId = get('GOOGLE_CLIENT_ID');
  const googleSecret = get('GOOGLE_CLIENT_SECRET');
  if ((googleId === undefined) !== (googleSecret === undefined)) {
    throw new Error('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben definirse juntos.');
  }

  const smtpUrl = get('SMTP_URL');
  const mailFrom = get('MAIL_FROM');
  if ((smtpUrl === undefined) !== (mailFrom === undefined)) {
    throw new Error('SMTP_URL y MAIL_FROM deben definirse juntos.');
  }

  const port = Number(get('PORT') ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un número de puerto válido.');
  }

  return {
    port,
    isProduction: get('NODE_ENV') === 'production',
    loginTestPage: get('LOGIN_TEST_PAGE') === 'true',
    databaseUrl: get('DATABASE_URL'),
    auth: {
      secret,
      baseUrl: get('AUTH_BASE_URL'),
      trustedOrigins: (get('AUTH_TRUSTED_ORIGINS') ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      google: googleId && googleSecret ? { clientId: googleId, clientSecret: googleSecret } : null,
      smtp: smtpUrl && mailFrom ? { url: smtpUrl, from: mailFrom } : null,
    },
  };
}
