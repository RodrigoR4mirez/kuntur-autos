import type { Listing, ListingView, PendingListing } from '@kuntur/core';

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
  'previousOwners',
  'hasServiceHistory',
  'soatValid',
  'technicalReviewValid',
  'hasSpareKey',
  'hasLiens',
  'hasAccidents',
  'description',
  'plate',
] as const satisfies readonly (keyof ListingView)[];

export function toListingResponse(view: ListingView): Record<string, unknown> {
  const response: Record<string, unknown> = {};
  for (const field of PUBLIC_FIELDS) {
    if (field in view) response[field] = view[field];
  }
  return response;
}

/** Fila de "mis anuncios" y de la cola de revisión. Nunca incluye el dueño ni la placa. */
export function toOwnerListingResponse(listing: Listing): Record<string, unknown> {
  return {
    id: listing.id,
    title: listing.title,
    status: listing.status,
    price: listing.price,
    department: listing.department,
    city: listing.city,
    createdAt: listing.createdAt.toISOString(),
  };
}

/** Fila de la cola de revisión: los datos del anuncio y del vehículo, incluida la placa, solo para asesores. */
export function toPendingListingResponse({
  listing,
  vehicle,
}: PendingListing): Record<string, unknown> {
  return {
    ...toOwnerListingResponse(listing),
    vehicle: vehicle
      ? {
          brandId: vehicle.brandId,
          modelId: vehicle.modelId,
          year: vehicle.year,
          mileageKm: vehicle.mileageKm,
          transmission: vehicle.transmission,
          fuel: vehicle.fuel,
          plate: vehicle.plate,
          previousOwners: vehicle.previousOwners,
          hasServiceHistory: vehicle.hasServiceHistory,
          soatValid: vehicle.soatValid,
          technicalReviewValid: vehicle.technicalReviewValid,
          hasSpareKey: vehicle.hasSpareKey,
          hasLiens: vehicle.hasLiens,
          hasAccidents: vehicle.hasAccidents,
          description: vehicle.description,
        }
      : null,
  };
}
