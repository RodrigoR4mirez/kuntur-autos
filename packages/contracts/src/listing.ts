import { z } from 'zod';

/** El id llega por la URL: se acota para no aceptar cualquier cosa. */
export const listingIdSchema = z.string().min(1).max(64);

export const listingParamsSchema = z.object({ id: listingIdSchema });
