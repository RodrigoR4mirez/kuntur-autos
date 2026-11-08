import { z } from 'zod';

/** El id llega por la URL: se acota para no aceptar cualquier cosa. */
export const listingIdSchema = z.string().min(1).max(64);

export const listingParamsSchema = z.object({ id: listingIdSchema });

/** Los ids del catálogo llegan por la URL como texto: se convierten a entero positivo. */
export const brandParamsSchema = z.object({ id: z.coerce.number().int().positive() });
