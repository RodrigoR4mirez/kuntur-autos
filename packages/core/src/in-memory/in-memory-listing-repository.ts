import type { ListingId, UserId } from '../shared/index.ts';
import type {
  Listing,
  ListingRepository,
  ListingStatus,
  ListingWithVehicle,
  PublishedListingsFilter,
  VehicleDetails,
} from '../modules/listings/index.ts';

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

  findPublished(filter: PublishedListingsFilter): Promise<ListingWithVehicle[]> {
    const rows: ListingWithVehicle[] = [];
    for (const listing of this.listings.values()) {
      const vehicle = this.vehicles.get(listing.id);
      if (listing.status !== 'published' || !vehicle) continue;
      if (filter.brandId !== undefined && vehicle.brandId !== filter.brandId) continue;
      if (filter.maxPriceMinor !== undefined && listing.price.amountMinor > filter.maxPriceMinor)
        continue;
      if (filter.minYear !== undefined && vehicle.year < filter.minYear) continue;
      rows.push({ listing, vehicle });
    }
    rows.sort((a, b) => b.listing.createdAt.getTime() - a.listing.createdAt.getTime());
    return Promise.resolve(rows.slice(filter.offset, filter.offset + filter.limit));
  }

  findByOwner(ownerId: UserId): Promise<Listing[]> {
    const rows = [...this.listings.values()].filter((l) => l.ownerId === ownerId);
    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(rows);
  }

  findByStatus(status: ListingStatus, limit: number): Promise<Listing[]> {
    const rows = [...this.listings.values()].filter((l) => l.status === status);
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return Promise.resolve(rows.slice(0, limit));
  }
}
