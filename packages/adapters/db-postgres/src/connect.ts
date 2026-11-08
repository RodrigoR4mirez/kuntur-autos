import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export interface PostgresConnection {
  readonly db: ReturnType<typeof createDb>;
  close(): Promise<void>;
}

function createDb(pool: Pool) {
  return drizzle(pool, { schema });
}

/**
 * Deja explícito el modo SSL estricto. La librería `pg` hoy trata `sslmode=require` como `verify-full`
 * (comprueba el certificado del servidor), pero en su próxima versión mayor `require` dejará de comprobarlo.
 * Convertimos `prefer`, `require` y `verify-ca` a `verify-full` para conservar la protección contra
 * servidores falsos. Si la URL pide `uselibpqcompat`, se respeta tal cual. No toca el resto de la URL.
 */
export function withStrictSsl(connectionString: string): string {
  if (/[?&]uselibpqcompat=/.test(connectionString)) return connectionString;
  return connectionString.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/,
    '$1verify-full',
  );
}

/** Abre un pool de conexiones. `connectionString` viene de DATABASE_URL (en Neon incluye sslmode=require). */
export function connectPostgres(connectionString: string): PostgresConnection {
  const pool = new Pool({ connectionString: withStrictSsl(connectionString), max: 10 });
  return { db: createDb(pool), close: () => pool.end() };
}
