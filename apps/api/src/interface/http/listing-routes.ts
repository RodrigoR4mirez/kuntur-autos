import type { FastifyInstance } from 'fastify';
import { listingParamsSchema } from '@kuntur/contracts';
import type { GetListingView, ListingId } from '@kuntur/core';
import { resolveAccessLevel } from './access-resolver.ts';
import { apiError } from './errors.ts';
import { toListingResponse } from './listing-presenter.ts';

export interface ListingRouteDeps {
  readonly getListingView: GetListingView;
}

/** Controlador delgado: valida la entrada, llama al caso de uso y traduce el resultado a HTTP. */
export function listingRoutes(app: FastifyInstance, deps: ListingRouteDeps): void {
  app.get('/listings/:id', async (request, reply) => {
    const params = listingParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply
        .code(400)
        .send(apiError('invalid_request', 'El identificador del anuncio no es válido.'));
    }

    const result = await deps.getListingView({
      listingId: params.data.id as ListingId,
      access: resolveAccessLevel(request),
    });

    if (!result.ok) {
      return reply.code(404).send(apiError('listing_not_found', 'No encontramos ese anuncio.'));
    }
    return toListingResponse(result.value);
  });
}
