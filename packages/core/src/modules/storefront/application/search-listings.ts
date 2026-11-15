import type { ListingRepository, PublishedListingsFilter } from '../../listings/index.ts';
import type { AccessLevel } from '../domain/access-level.ts';
import { projectVehicleListing, type ListingView } from '../domain/listing-view.ts';

export interface SearchListingsDeps {
  readonly listings: ListingRepository;
}

export interface SearchListingsInput {
  readonly access: AccessLevel;
  readonly filter: PublishedListingsFilter;
}

export type SearchListings = (input: SearchListingsInput) => Promise<ListingView[]>;

/**
 * Listado público: solo anuncios publicados, y cada uno pasa por la misma proyección por nivel de
 * acceso que la ficha. En el listado nunca se pide un nivel que muestre la placa.
 */
export function searchListings(deps: SearchListingsDeps): SearchListings {
  return async ({ access, filter }) => {
    // Un listado no puede mostrar la placa: se limita al nivel "registrado" como máximo.
    const level: AccessLevel = access === 'anonymous' ? 'anonymous' : 'registered';
    const rows = await deps.listings.findPublished(filter);
    return rows.map(({ listing, vehicle }) => projectVehicleListing(listing, vehicle, level));
  };
}
