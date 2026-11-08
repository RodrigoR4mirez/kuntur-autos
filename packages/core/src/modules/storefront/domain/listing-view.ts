import type { ListingId, Money } from '../../../shared/index.ts';
import type { Fuel, Listing, Transmission, VehicleDetails } from '../../listings/index.ts';
import { atLeast, type AccessLevel } from './access-level.ts';

/**
 * Lo que ve quien mira un anuncio. Nunca incluye el id del dueño ni su contacto.
 * Los campos opcionales aparecen solo cuando el nivel de acceso lo permite.
 */
export interface ListingView {
  readonly id: ListingId;
  readonly access: AccessLevel;
  readonly title: string;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
  readonly brandId: number;
  readonly modelId: number;
  readonly year: number;
  readonly mileageKm: number;
  // Desde 'registered'
  readonly versionId?: number | null;
  readonly bodyTypeId?: number;
  readonly colorId?: number;
  readonly transmission?: Transmission;
  readonly fuel?: Fuel;
  // Desde 'deposit_paid'
  readonly plate?: string;
}

/**
 * Función pura: decide qué campos se muestran según el nivel de acceso.
 * Se ejecuta siempre en el servidor, nunca solo en la interfaz.
 */
export function projectVehicleListing(
  listing: Listing,
  vehicle: VehicleDetails,
  access: AccessLevel,
): ListingView {
  const base = {
    id: listing.id,
    access,
    title: listing.title,
    price: listing.price,
    department: listing.department,
    city: listing.city,
    brandId: vehicle.brandId,
    modelId: vehicle.modelId,
    year: vehicle.year,
    mileageKm: vehicle.mileageKm,
  };

  const registered = atLeast(access, 'registered')
    ? {
        versionId: vehicle.versionId,
        bodyTypeId: vehicle.bodyTypeId,
        colorId: vehicle.colorId,
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
      }
    : {};

  const depositPaid = atLeast(access, 'deposit_paid') ? { plate: vehicle.plate } : {};

  return { ...base, ...registered, ...depositPaid };
}
