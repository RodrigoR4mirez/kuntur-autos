import { money, type ListingId, type UserId } from '../shared/index.ts';
import type { Listing, VehicleDetails } from '../modules/listings/index.ts';

export const NOW = new Date('2026-11-08T12:00:00Z');
export const OWNER = 'user-owner' as UserId;
export const STRANGER = 'user-stranger' as UserId;

export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1' as ListingId,
    vertical: 'vehicle',
    ownerId: OWNER,
    status: 'published',
    title: 'Toyota Yaris 2019 en excelente estado',
    price: money(4_890_000, 'PEN'),
    department: 'Lima',
    city: 'Miraflores',
    createdAt: NOW,
    ...overrides,
  };
}

export function makeVehicle(overrides: Partial<VehicleDetails> = {}): VehicleDetails {
  return {
    listingId: 'listing-1' as ListingId,
    brandId: 1,
    modelId: 10,
    versionId: 100,
    bodyTypeId: 2,
    colorId: 3,
    year: 2019,
    mileageKm: 54_000,
    transmission: 'automatic',
    fuel: 'gasoline',
    plate: 'KNT482',
    ...overrides,
  };
}
