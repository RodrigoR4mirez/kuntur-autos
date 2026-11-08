import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { catalogRepositoryContract, listingRepositoryContract } from '@kuntur/contract-tests';
import { OWNER, SAMPLE_CATALOG } from '@kuntur/core/in-memory';
import { connectPostgres } from './connect.ts';
import type { Db } from './db.ts';
import { MIGRATIONS_FOLDER, runMigrations } from './migrations.ts';
import { PostgresCatalogRepository } from './postgres-catalog-repository.ts';
import { PostgresListingRepository } from './postgres-listing-repository.ts';
import { BRAND_SEED } from './catalog-seed-data.ts';
import { insertCatalog, seedCatalog } from './seed-catalog.ts';
import * as schema from './schema.ts';

const TABLES =
  'vehicle_details, listings, models, brands, body_types, colors, session, account, verification, "user"';

/** Base nueva en memoria con PostgreSQL real (PGlite), migraciones aplicadas. */
async function freshPglite(): Promise<Db> {
  const db = drizzlePglite(new PGlite(), { schema });
  await migratePglite(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
}

/** Catálogo de ejemplo y el usuario dueño de los anuncios de prueba (listings.owner_id es una clave foránea). */
async function withSampleCatalog(db: Db): Promise<Db> {
  await insertCatalog(db, SAMPLE_CATALOG);
  await db
    .insert(schema.user)
    .values({ id: OWNER, name: 'Dueño de prueba', email: 'owner@example.com' })
    .onConflictDoNothing();
  return db;
}

// 1. Las suites de contrato contra PostgreSQL real en memoria (siempre corren, sin Docker).
listingRepositoryContract('postgres (PGlite)', async () => {
  return new PostgresListingRepository(await withSampleCatalog(await freshPglite()));
});
catalogRepositoryContract('postgres (PGlite)', async () => {
  return new PostgresCatalogRepository(await withSampleCatalog(await freshPglite()));
});

// 2. Reglas propias de la base de datos.
describe('schema (PGlite)', () => {
  it('rejects a listing with a status outside the lifecycle', async () => {
    const db = await withSampleCatalog(await freshPglite());
    const repo = new PostgresListingRepository(db);
    const { makeListing } = await import('@kuntur/core/in-memory');

    await expect(repo.save(makeListing({ status: 'bogus' as never }))).rejects.toThrow();
  });

  it('rejects a vehicle that points to a brand outside the catalog', async () => {
    const db = await freshPglite();
    const repo = new PostgresListingRepository(db);
    const { makeListing, makeVehicle } = await import('@kuntur/core/in-memory');

    await expect(repo.save(makeListing(), makeVehicle())).rejects.toThrow();
  });

  it('rolls back the listing when its vehicle is rejected', async () => {
    const db = await freshPglite();
    const repo = new PostgresListingRepository(db);
    const { makeListing, makeVehicle } = await import('@kuntur/core/in-memory');

    await expect(repo.save(makeListing(), makeVehicle())).rejects.toThrow();
    expect(await repo.findById(makeListing().id)).toBeNull();
  });

  it('uses the partial index for published listings', async () => {
    const db = await withSampleCatalog(await freshPglite());
    const result = (await db.execute(
      sql`select indexdef from pg_indexes where indexname = 'listings_published_idx'`,
    )) as unknown as { rows: { indexdef: string }[] };
    expect(result.rows[0]?.indexdef).toMatch(/WHERE .*published/);
  });
});

describe('seedCatalog (PGlite)', () => {
  it('loads the initial catalog and is safe to run twice', async () => {
    const db = await freshPglite();
    await seedCatalog(db);
    await seedCatalog(db);

    const repo = new PostgresCatalogRepository(db);
    const brands = await repo.listBrands();
    expect(brands).toHaveLength(BRAND_SEED.length);

    const toyota = await repo.listModels(1);
    expect(toyota.map((m) => m.name)).toContain('Hilux');
    expect(new Set(toyota.map((m) => m.id)).size).toBe(toyota.length);
  });
});

// 3. Las mismas suites contra un PostgreSQL de verdad. Solo corren si hay DATABASE_URL (CI, docker compose).
const databaseUrl = process.env['DATABASE_URL'];

function isLocalDatabase(url: string): boolean {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

describe.skipIf(!databaseUrl)('postgres (servidor real)', () => {
  const connection = connectPostgres(databaseUrl ?? 'postgres://unused');

  async function cleanReal(): Promise<Db> {
    // Estas pruebas vacían las tablas: nunca deben apuntar a una base con datos reales (Neon, staging).
    if (!isLocalDatabase(databaseUrl ?? '')) {
      throw new Error('Las pruebas destructivas solo corren contra una base local o de CI.');
    }
    await runMigrations(connection.db);
    await connection.db.execute(sql.raw(`truncate ${TABLES} restart identity cascade`));
    return withSampleCatalog(connection.db);
  }

  listingRepositoryContract('postgres (servidor real)', async () => {
    return new PostgresListingRepository(await cleanReal());
  });
  catalogRepositoryContract('postgres (servidor real)', async () => {
    return new PostgresCatalogRepository(await cleanReal());
  });
});
