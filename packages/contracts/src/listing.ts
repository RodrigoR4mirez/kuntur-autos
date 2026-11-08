import { z } from 'zod';
import { moneySchema } from './money.ts';
import { plateSchema } from './plate.ts';

/** El id llega por la URL: se acota para no aceptar cualquier cosa. */
export const listingIdSchema = z.string().min(1).max(64);

export const listingParamsSchema = z.object({ id: listingIdSchema });

/** Los ids del catálogo llegan por la URL como texto: se convierten a entero positivo. */
export const brandParamsSchema = z.object({ id: z.coerce.number().int().positive() });

const positiveId = z.number().int().positive();

/** Datos del vehículo al publicar. Los ids salen del catálogo cerrado. */
export const vehicleInputSchema = z.strictObject({
  brandId: positiveId,
  modelId: positiveId,
  versionId: positiveId.nullable(),
  bodyTypeId: positiveId,
  colorId: positiveId,
  year: z.number().int(),
  mileageKm: z.number().int().min(0),
  transmission: z.enum(['manual', 'automatic']),
  fuel: z.enum(['gasoline', 'diesel', 'lpg', 'gnv', 'hybrid', 'electric']),
  plate: plateSchema,
});

/**
 * Cuerpo de POST /listings. `strictObject` rechaza campos desconocidos: nadie puede enviar
 * `ownerId` ni `status` por su cuenta (asignación masiva). El dueño sale siempre de la sesión.
 * Las reglas de negocio (largo del título, año válido) las aplica el dominio, no este esquema.
 */
export const createListingSchema = z.strictObject({
  title: z.string().min(1).max(200),
  price: moneySchema,
  department: z.string().min(1).max(60),
  city: z.string().min(1).max(60),
  vehicle: vehicleInputSchema,
});
