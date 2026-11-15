import type { ListingId, UserId } from '../../../../shared/index.ts';
import type { Listing, ListingStatus } from '../../domain/listing.ts';
import type { VehicleDetails } from '../../domain/vehicle.ts';

/** Filtros del listado público. Todos opcionales salvo la paginación. */
export interface PublishedListingsFilter {
  readonly brandId?: number;
  readonly maxPriceMinor?: number;
  readonly minYear?: number;
  /** Departamento exacto (por ejemplo "Lima"). */
  readonly department?: string;
  readonly limit: number;
  readonly offset: number;
}

export interface ListingWithVehicle {
  readonly listing: Listing;
  readonly vehicle: VehicleDetails;
}

export interface ListingRepository {
  findById(id: ListingId): Promise<Listing | null>;
  findVehicleDetails(id: ListingId): Promise<VehicleDetails | null>;
  save(listing: Listing, vehicle?: VehicleDetails): Promise<void>;
  /** Anuncios publicados con su vehículo, del más reciente al más antiguo. */
  findPublished(filter: PublishedListingsFilter): Promise<ListingWithVehicle[]>;
  /** Todos los anuncios de una persona, del más reciente al más antiguo. */
  findByOwner(ownerId: UserId): Promise<Listing[]>;
  /** Anuncios en un estado (por ejemplo, los que esperan revisión), del más antiguo al más reciente. */
  findByStatus(status: ListingStatus, limit: number): Promise<Listing[]>;
}
