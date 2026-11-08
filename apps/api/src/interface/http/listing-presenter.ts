import type { ListingView } from '@kuntur/core';

/**
 * Lista blanca de campos de la respuesta pública. Si el dominio agrega un campo a
 * ListingView, no sale por la API hasta que se agregue aquí a propósito.
 */
const PUBLIC_FIELDS = [
  'id',
  'access',
  'title',
  'price',
  'department',
  'city',
  'brandId',
  'modelId',
  'year',
  'mileageKm',
  'versionId',
  'bodyTypeId',
  'colorId',
  'transmission',
  'fuel',
  'plate',
] as const satisfies readonly (keyof ListingView)[];

export function toListingResponse(view: ListingView): Record<string, unknown> {
  const response: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) {
    if (field in view) response[field] = view[field];
  }
  return response;
}
