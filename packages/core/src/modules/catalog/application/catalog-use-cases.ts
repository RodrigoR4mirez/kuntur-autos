import { err, ok, type Result } from '../../../shared/index.ts';
import type { BodyType, Brand, Color, Model } from '../domain/catalog.ts';
import type { CatalogRepository } from './ports/catalog-repository.ts';

export interface CatalogDeps {
  readonly catalog: CatalogRepository;
}

export type ListBrands = () => Promise<readonly Brand[]>;

export function listBrands(deps: CatalogDeps): ListBrands {
  return () => deps.catalog.listBrands();
}

export type ListModelsOfBrand = (input: {
  readonly brandId: number;
}) => Promise<Result<readonly Model[], { readonly code: 'brand_not_found' }>>;

export function listModelsOfBrand(deps: CatalogDeps): ListModelsOfBrand {
  return async ({ brandId }) => {
    const brand = await deps.catalog.findBrand(brandId);
    if (!brand) return err({ code: 'brand_not_found' });
    return ok(await deps.catalog.listModels(brandId));
  };
}

export interface CatalogOptions {
  readonly bodyTypes: readonly BodyType[];
  readonly colors: readonly Color[];
}

export type GetCatalogOptions = () => Promise<CatalogOptions>;

export function getCatalogOptions(deps: CatalogDeps): GetCatalogOptions {
  return async () => {
    const [bodyTypes, colors] = await Promise.all([
      deps.catalog.listBodyTypes(),
      deps.catalog.listColors(),
    ]);
    return { bodyTypes, colors };
  };
}
