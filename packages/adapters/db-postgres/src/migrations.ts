import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema.ts';

/** Carpeta con los SQL generados por drizzle-kit. */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../drizzle', import.meta.url));

export function runMigrations(db: NodePgDatabase<typeof schema>): Promise<void> {
  return migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
