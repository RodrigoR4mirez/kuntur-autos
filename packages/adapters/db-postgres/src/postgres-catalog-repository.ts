import { asc, eq } from 'drizzle-orm';
import type { BodyType, Brand, CatalogRepository, Color, Model } from '@kuntur/core';
import type { Db } from './db.ts';
import { bodyTypes, brands, colors, models } from './schema.ts';

export class PostgresCatalogRepository implements CatalogRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  listBrands(): Promise<readonly Brand[]> {
    return this.db.select().from(brands).orderBy(asc(brands.name));
  }

  async findBrand(id: number): Promise<Brand | null> {
    const [row] = await this.db.select().from(brands).where(eq(brands.id, id)).limit(1);
    return row ?? null;
  }

  listModels(brandId: number): Promise<readonly Model[]> {
    return this.db
      .select()
      .from(models)
      .where(eq(models.brandId, brandId))
      .orderBy(asc(models.name));
  }

  listBodyTypes(): Promise<readonly BodyType[]> {
    return this.db.select().from(bodyTypes).orderBy(asc(bodyTypes.id));
  }

  listColors(): Promise<readonly Color[]> {
    return this.db.select().from(colors).orderBy(asc(colors.id));
  }
}
