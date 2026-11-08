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

/** Abre un pool de conexiones. `connectionString` viene de DATABASE_URL (en Neon incluye sslmode=require). */
export function connectPostgres(connectionString: string): PostgresConnection {
  const pool = new Pool({ connectionString, max: 10 });
  return { db: createDb(pool), close: () => pool.end() };
}
