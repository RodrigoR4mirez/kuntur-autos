import type { ListingId } from '../../../../shared/index.ts';
import type { Listing, VehicleDetails } from '../../../listings/index.ts';

/** Filtros obligatorios descartan; los deseables solo ordenan (ver docs/01-arquitectura.md). */
export interface VehicleSearchQuery {
  readonly required: {
    readonly brandId?: number;
    readonly modelId?: number;
    readonly bodyTypeId?: number;
    readonly department?: string;
    readonly maxPriceMinor?: number;
    readonly minYear?: number;
  };
  readonly preferred: {
    readonly colorId?: number;
    readonly transmission?: VehicleDetails['transmission'];
    readonly fuel?: VehicleDetails['fuel'];
    readonly maxMileageKm?: number;
  };
  /** Paginación por cursor (keyset), nunca por OFFSET. */
  readonly cursor: string | null;
  readonly limit: number;
}

export interface SearchResult {
  readonly ids: readonly ListingId[];
  readonly nextCursor: string | null;
}

export interface SearchIndex {
  searchVehicles(query: VehicleSearchQuery): Promise<SearchResult>;
  index(listing: Listing, vehicle: VehicleDetails): Promise<void>;
  remove(id: ListingId): Promise<void>;
}
