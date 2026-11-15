import type { FastifyInstance } from 'fastify';
import { brandParamsSchema } from '@kuntur/contracts';
import type { GetCatalogOptions, ListBrands, ListModelsOfBrand } from '@kuntur/core';
import { apiError } from './errors.ts';

export interface CatalogRouteDeps {
  readonly listBrands: ListBrands;
  readonly listModelsOfBrand: ListModelsOfBrand;
  readonly getCatalogOptions: GetCatalogOptions;
}

/** El catálogo casi no cambia: el navegador y la web pueden guardarlo unos minutos. */
export const CATALOG_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=3600';

export function catalogRoutes(app: FastifyInstance, deps: CatalogRouteDeps): void {
  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/catalog/') && reply.statusCode === 200) {
      reply.header('cache-control', CATALOG_CACHE_CONTROL);
    }
  });

  app.get('/catalog/brands', async () => ({ brands: await deps.listBrands() }));

  app.get('/catalog/brands/:id/models', async (request, reply) => {
    const params = brandParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send(apiError('invalid_request', 'La marca no es válida.'));
    }
    const result = await deps.listModelsOfBrand({ brandId: params.data.id });
    if (!result.ok) {
      return reply.code(404).send(apiError('brand_not_found', 'No encontramos esa marca.'));
    }
    return { models: result.value };
  });

  app.get('/catalog/options', async () => deps.getCatalogOptions());
}
