import type { UserId } from '../../../shared/index.ts';
import type { Listing } from '../domain/listing.ts';
import type { ListingRepository } from './ports/listing-repository.ts';

export interface ListMyListingsDeps {
  readonly listings: ListingRepository;
}

export type ListMyListings = (input: { readonly ownerId: UserId }) => Promise<Listing[]>;

/** Los anuncios de la persona, en cualquier estado (borrador, en revisión, publicado...). */
export function listMyListings(deps: ListMyListingsDeps): ListMyListings {
  return ({ ownerId }) => deps.listings.findByOwner(ownerId);
}
