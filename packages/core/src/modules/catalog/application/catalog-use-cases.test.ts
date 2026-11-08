import { describe, expect, it } from 'vitest';
import { InMemoryCatalogRepository } from '../../../in-memory/index.ts';
import { getCatalogOptions, listBrands, listModelsOfBrand } from './catalog-use-cases.ts';

const catalog = new InMemoryCatalogRepository();

describe('catalog use cases', () => {
  it('lists brands', async () => {
    const brands = await listBrands({ catalog })();
    expect(brands.map((b) => b.name)).toEqual(['Toyota', 'Kia', 'Hyundai']);
  });

  it('lists only the models of the requested brand', async () => {
    const result = await listModelsOfBrand({ catalog })({ brandId: 1 });
    expect(result.ok && result.value.map((m) => m.name)).toEqual(['Yaris', 'Corolla']);
  });

  it('answers brand_not_found for an unknown brand', async () => {
    expect(await listModelsOfBrand({ catalog })({ brandId: 999 })).toEqual({
      ok: false,
      error: { code: 'brand_not_found' },
    });
  });

  it('returns body types and colors together', async () => {
    const options = await getCatalogOptions({ catalog })();
    expect(options.bodyTypes).toHaveLength(3);
    expect(options.colors[2]).toEqual({ id: 3, name: 'Rojo', hex: '#B3261E' });
  });
});
