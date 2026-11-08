import type { ListingId } from '../shared/index.ts';
import type { Listing, ListingRepository, VehicleDetails } from '../modules/listings/index.ts';

/** Implementación en memoria del puerto, para pruebas y desarrollo local. */
export class InMemoryListingRepository implements ListingRepository {
  private readonly listings = new Map<ListingId, Listing>();
  private readonly vehicles = new Map<ListingId, VehicleDetails>();

  findById(id: ListingId): Promise<Listing | null> {
    return Promise.resolve(this.listings.get(id) ?? null);
  }

  findVehicleDetails(id: ListingId): Promise<VehicleDetails | null> {
    return Promise.resolve(this.vehicles.get(id) ?? null);
  }

  save(listing: Listing, vehicle?: VehicleDetails): Promise<void> {
    this.listings.set(listing.id, listing);
    if (vehicle) this.vehicles.set(listing.id, vehicle);
    return Promise.resolve();
  }
}
