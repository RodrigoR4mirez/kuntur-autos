import type { ListingId } from '../../../../shared/index.ts';
import type { Listing } from '../../domain/listing.ts';
import type { VehicleDetails } from '../../domain/vehicle.ts';

export interface ListingRepository {
  findById(id: ListingId): Promise<Listing | null>;
  findVehicleDetails(id: ListingId): Promise<VehicleDetails | null>;
  save(listing: Listing, vehicle?: VehicleDetails): Promise<void>;
}
