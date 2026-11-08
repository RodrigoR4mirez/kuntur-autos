import type { Db } from './db.ts';
import { bodyTypes, brands, colors, models } from './schema.ts';
import { BODY_TYPE_SEED, BRAND_SEED, COLOR_SEED } from './catalog-seed-data.ts';

export interface CatalogRows {
  readonly brands: readonly { id: number; name: string }[];
  readonly models: readonly { id: number; brandId: number; name: string }[];
  readonly bodyTypes: readonly { id: number; name: string }[];
  readonly colors: readonly { id: number; name: string; hex: string }[];
}

/** Inserta filas de catálogo. Si ya existen, no hace nada: se puede ejecutar varias veces. */
export async function insertCatalog(db: Db, rows: CatalogRows): Promise<void> {
  if (rows.brands.length > 0)
    await db
      .insert(brands)
      .values([...rows.brands])
      .onConflictDoNothing();
  if (rows.models.length > 0)
    await db
      .insert(models)
      .values([...rows.models])
      .onConflictDoNothing();
  if (rows.bodyTypes.length > 0) {
    await db
      .insert(bodyTypes)
      .values([...rows.bodyTypes])
      .onConflictDoNothing();
  }
  if (rows.colors.length > 0)
    await db
      .insert(colors)
      .values([...rows.colors])
      .onConflictDoNothing();
}

/** Catálogo inicial. Los ids de modelo son `marca * 100 + posición`, estables entre ejecuciones. */
export function seedCatalog(db: Db): Promise<void> {
  return insertCatalog(db, {
    brands: BRAND_SEED.map(({ id, name }) => ({ id, name })),
    models: BRAND_SEED.flatMap((brand) =>
      brand.models.map((name, index) => ({
        id: brand.id * 100 + index + 1,
        brandId: brand.id,
        name,
      })),
    ),
    bodyTypes: BODY_TYPE_SEED,
    colors: COLOR_SEED,
  });
}
