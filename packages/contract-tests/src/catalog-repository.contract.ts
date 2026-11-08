import { beforeEach, describe, expect, it } from 'vitest';
import type { CatalogRepository } from '@kuntur/core';
import { SAMPLE_CATALOG } from '@kuntur/core/in-memory';

/** Cualquier implementación de CatalogRepository cargada con SAMPLE_CATALOG debe pasar esta suite. */
export function catalogRepositoryContract(
  name: string,
  create: () => Promise<CatalogRepository>,
): void {
  describe(`CatalogRepository contract: ${name}`, () => {
    let repo: CatalogRepository;

    beforeEach(async () => {
      repo = await create();
    });

    it('lists every brand', async () => {
      const names = (await repo.listBrands()).map((b) => b.name).sort();
      expect(names).toEqual(SAMPLE_CATALOG.brands.map((b) => b.name).sort());
    });

    it('finds a brand by id and answers null for an unknown one', async () => {
      expect(await repo.findBrand(1)).toEqual({ id: 1, name: 'Toyota' });
      expect(await repo.findBrand(999)).toBeNull();
    });

    it('lists only the models of the requested brand', async () => {
      const models = await repo.listModels(1);
      expect(models.map((m) => m.name).sort()).toEqual(['Corolla', 'Yaris']);
      expect(models.every((m) => m.brandId === 1)).toBe(true);
      expect(await repo.listModels(999)).toEqual([]);
    });

    it('lists body types and colors', async () => {
      expect((await repo.listBodyTypes()).map((b) => b.name).sort()).toEqual(
        SAMPLE_CATALOG.bodyTypes.map((b) => b.name).sort(),
      );
      expect(await repo.listColors()).toEqual(expect.arrayContaining([...SAMPLE_CATALOG.colors]));
    });
  });
}
