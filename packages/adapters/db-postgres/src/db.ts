import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type * as schema from './schema.ts';

/** Tipo común a cualquier driver de PostgreSQL de Drizzle (node-postgres, PGlite...). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
