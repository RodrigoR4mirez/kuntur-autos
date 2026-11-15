import type { FastifyInstance } from 'fastify';
import {
  createListingSchema,
  listingParamsSchema,
  reviewListingSchema,
  searchListingsQuerySchema,
} from '@kuntur/contracts';
import type {
  CreateDraftListing,
  DetermineAccessLevel,
  GetListingView,
  ListMyListings,
  ListPendingListings,
  ListingId,
  ReviewListing,
  SearchListings,
  SubmitListingForReview,
} from '@kuntur/core';
import { requireSession, sessionOf, type ResolveSession } from './auth.ts';
import { apiError } from './errors.ts';
import {
  toListingResponse,
  toOwnerListingResponse,
  toPendingListingResponse,
} from './listing-presenter.ts';

export interface ListingRouteDeps {
  readonly getListingView: GetListingView;
  readonly determineAccessLevel: DetermineAccessLevel;
  readonly createDraftListing: CreateDraftListing;
  readonly submitListingForReview: SubmitListingForReview;
  readonly searchListings: SearchListings;
  readonly listMyListings: ListMyListings;
  readonly reviewListing: ReviewListing;
  readonly listPendingListings: ListPendingListings;
  readonly resolveSession: ResolveSession;
}

/** Mensajes en español para los errores de negocio al publicar. */
const CREATE_ERRORS: Record<string, string> = {
  invalid_title: 'El título debe tener entre 5 y 100 caracteres.',
  invalid_price: 'El precio debe ser mayor que cero.',
  invalid_year: 'El año del vehículo no es válido.',
  invalid_mileage: 'El kilometraje no es válido.',
  invalid_plate: 'La placa debe tener 6 letras o números.',
};

/** Controladores delgados: validan la entrada, llaman al caso de uso y traducen el resultado a HTTP. */
export function listingRoutes(app: FastifyInstance, deps: ListingRouteDeps): void {
  // Listado público: solo publicados; el nivel de acceso nunca muestra la placa.
  app.get('/listings', async (request, reply) => {
    const query = searchListingsQuerySchema.safeParse(request.query);
    if (!query.success) {
      const field = query.error.issues[0]?.path.join('.') || 'consulta';
      return reply.code(400).send(apiError('invalid_request', `Revisa el filtro "${field}".`));
    }
    const session = await sessionOf(request, deps.resolveSession);
    const views = await deps.searchListings({
      access: session ? 'registered' : 'anonymous',
      filter: {
        limit: query.data.limit,
        offset: query.data.offset,
        ...(query.data.brandId !== undefined ? { brandId: query.data.brandId } : {}),
        ...(query.data.maxPriceMinor !== undefined
          ? { maxPriceMinor: query.data.maxPriceMinor }
          : {}),
        ...(query.data.minYear !== undefined ? { minYear: query.data.minYear } : {}),
      },
    });
    return {
      items: views.map(toListingResponse),
      limit: query.data.limit,
      offset: query.data.offset,
    };
  });

  // La persona de la sesión: la web lo usa para saber si puede ver el panel del asesor.
  app.get('/me', async (request, reply) => {
    const session = await requireSession(request, reply, deps.resolveSession);
    if (!session) return reply;
    return { userId: session.userId, role: session.role };
  });

  app.get('/me/listings', async (request, reply) => {
    const session = await requireSession(request, reply, deps.resolveSession);
    if (!session) return reply;
    const mine = await deps.listMyListings({ ownerId: session.userId });
    return { items: mine.map(toOwnerListingResponse) };
  });

  // Cola de revisión: solo asesores y administradores.
  app.get('/review/listings', async (request, reply) => {
    const session = await requireSession(request, reply, deps.resolveSession);
    if (!session) return reply;
    const result = await deps.listPendingListings({ reviewerRole: session.role });
    if (!result.ok) {
      return reply
        .code(403)
        .send(apiError('forbidden', 'Solo los asesores de Kuntur pueden revisar anuncios.'));
    }
    return { items: result.value.map(toPendingListingResponse) };
  });

  app.post('/listings/:id/review', async (request, reply) => {
    const session = await requireSession(request, reply, deps.resolveSession);
    if (!session) return reply;

    const params = listingParamsSchema.safeParse(request.params);
    const body = reviewListingSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply
        .code(400)
        .send(apiError('invalid_request', 'Indica el anuncio y la decisión (approve o reject).'));
    }

    const result = await deps.reviewListing({
      listingId: params.data.id as ListingId,
      reviewerRole: session.role,
      decision: body.data.decision,
    });
    if (result.ok) return { id: result.value.id, status: result.value.status };

    switch (result.error.code) {
      case 'forbidden':
        return reply
          .code(403)
          .send(apiError('forbidden', 'Solo los asesores de Kuntur pueden revisar anuncios.'));
      case 'listing_not_found':
        return reply.code(404).send(apiError('listing_not_found', 'No encontramos ese anuncio.'));
      case 'invalid_transition':
        return reply
          .code(409)
          .send(apiError('invalid_transition', 'Ese anuncio no está esperando revisión.'));
      default:
        return reply.code(422).send(apiError(result.error.code, 'No pudimos revisar el anuncio.'));
    }
  });

  app.get('/listings/:id', async (request, reply) => {
    const params = listingParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply
        .code(400)
        .send(apiError('invalid_request', 'El identificador del anuncio no es válido.'));
    }
    const listingId = params.data.id as ListingId;

    const session = await sessionOf(request, deps.resolveSession);
    const access = await deps.determineAccessLevel({ session, listingId });
    const result = await deps.getListingView({ listingId, access });

    if (!result.ok) {
      return reply.code(404).send(apiError('listing_not_found', 'No encontramos ese anuncio.'));
    }
    return toListingResponse(result.value);
  });

  app.post('/listings', async (request, reply) => {
    const session = await requireSession(request, reply, deps.resolveSession);
    if (!session) return reply;

    const body = createListingSchema.safeParse(request.body);
    if (!body.success) {
      const field = body.error.issues[0]?.path.join('.') || 'cuerpo';
      return reply.code(400).send(apiError('invalid_request', `Revisa el campo "${field}".`));
    }

    // El dueño sale siempre de la sesión, nunca del cuerpo de la petición.
    const result = await deps.createDraftListing({ ...body.data, ownerId: session.userId });
    if (!result.ok) {
      const message = CREATE_ERRORS[result.error.code] ?? 'No pudimos crear el anuncio.';
      return reply.code(422).send(apiError(result.error.code, message));
    }
    return reply.code(201).send({ id: result.value.id, status: result.value.status });
  });

  app.post('/listings/:id/submit', async (request, reply) => {
    const session = await requireSession(request, reply, deps.resolveSession);
    if (!session) return reply;

    const params = listingParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply
        .code(400)
        .send(apiError('invalid_request', 'El identificador del anuncio no es válido.'));
    }

    const result = await deps.submitListingForReview({
      listingId: params.data.id as ListingId,
      requesterId: session.userId,
    });
    if (result.ok) return { id: result.value.id, status: result.value.status };

    switch (result.error.code) {
      case 'listing_not_found':
        return reply.code(404).send(apiError('listing_not_found', 'No encontramos ese anuncio.'));
      case 'not_owner':
        return reply
          .code(403)
          .send(apiError('not_owner', 'Solo quien publicó el anuncio puede enviarlo a revisión.'));
      case 'invalid_transition':
        return reply
          .code(409)
          .send(
            apiError('invalid_transition', 'El anuncio no está en un estado que permita enviarlo.'),
          );
      default:
        return reply.code(422).send(apiError(result.error.code, 'No pudimos enviar el anuncio.'));
    }
  });
}
