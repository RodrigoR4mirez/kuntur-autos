import type { BodyType, Brand, CatalogRepository, Color, Model } from '../modules/catalog/index.ts';

export interface CatalogData {
  readonly brands: readonly Brand[];
  readonly models: readonly Model[];
  readonly bodyTypes: readonly BodyType[];
  readonly colors: readonly Color[];
}

/** Datos mínimos para pruebas y desarrollo. El catálogo real vive en la base de datos. */
export const SAMPLE_CATALOG: CatalogData = {
  brands: [
    { id: 1, name: 'Toyota' },
    { id: 2, name: 'Kia' },
    { id: 3, name: 'Hyundai' },
  ],
  models: [
    { id: 10, brandId: 1, name: 'Yaris' },
    { id: 11, brandId: 1, name: 'Corolla' },
    { id: 20, brandId: 2, name: 'Rio' },
  ],
  bodyTypes: [
    { id: 1, name: 'Sedán' },
    { id: 2, name: 'Hatchback' },
    { id: 3, name: 'SUV' },
  ],
  colors: [
    { id: 1, name: 'Blanco', hex: '#FFFFFF' },
    { id: 2, name: 'Negro', hex: '#111111' },
    { id: 3, name: 'Rojo', hex: '#B3261E' },
  ],
};

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly data: CatalogData;

  constructor(data: CatalogData = SAMPLE_CATALOG) {
    this.data = data;
  }

  listBrands() {
    return Promise.resolve(this.data.brands);
  }

  findBrand(id: number) {
    return Promise.resolve(this.data.brands.find((b) => b.id === id) ?? null);
  }

  listModels(brandId: number) {
    return Promise.resolve(this.data.models.filter((m) => m.brandId === brandId));
  }

  listBodyTypes() {
    return Promise.resolve(this.data.bodyTypes);
  }

  listColors() {
    return Promise.resolve(this.data.colors);
  }
}
