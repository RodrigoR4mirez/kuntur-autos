import type { BodyType, Brand, Color, Model } from '../../domain/catalog.ts';

export interface CatalogRepository {
  listBrands(): Promise<readonly Brand[]>;
  findBrand(id: number): Promise<Brand | null>;
  listModels(brandId: number): Promise<readonly Model[]>;
  listBodyTypes(): Promise<readonly BodyType[]>;
  listColors(): Promise<readonly Color[]>;
}
