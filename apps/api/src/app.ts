import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import type { GetListingView } from '@kuntur/core';
import { apiError } from './interface/http/errors.ts';
import { healthRoutes } from './interface/http/health-routes.ts';
import { listingRoutes } from './interface/http/listing-routes.ts';

/** Casos de uso que la API expone. La composition root decide con qué adaptadores se construyen. */
export interface UseCases {
  readonly getListingView: GetListingView;
}

export function buildApp(useCases: UseCases, options: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify(options);

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send(apiError('not_found', 'La ruta no existe.')),
  );

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    return reply.code(500).send(apiError('internal_error', 'Ocurrió un error inesperado.'));
  });

  healthRoutes(app);
  listingRoutes(app, { getListingView: useCases.getListingView });

  return app;
}
