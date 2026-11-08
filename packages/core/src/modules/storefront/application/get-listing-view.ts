import type { ListingId, Result } from '../../../shared/index.ts';
import { err, ok } from '../../../shared/index.ts';
import type { ListingRepository } from '../../listings/index.ts';
import type { AccessLevel } from '../domain/access-level.ts';
import { projectVehicleListing, type ListingView } from '../domain/listing-view.ts';

export interface GetListingViewDeps {
  readonly listings: ListingRepository;
}

export interface GetListingViewInput {
  readonly listingId: ListingId;
  readonly access: AccessLevel;
}

export type GetListingViewError = { readonly code: 'listing_not_found' };

export type GetListingView = (
  input: GetListingViewInput,
) => Promise<Result<ListingView, GetListingViewError>>;

/** Solo los anuncios publicados son visibles en la vitrina. */
export function getListingView(deps: GetListingViewDeps): GetListingView {
  return async ({ listingId, access }) => {
    const listing = await deps.listings.findById(listingId);
    if (!listing || listing.status !== 'published') return err({ code: 'listing_not_found' });

    const vehicle = await deps.listings.findVehicleDetails(listingId);
    if (!vehicle) return err({ code: 'listing_not_found' });

    return ok(projectVehicleListing(listing, vehicle, access));
  };
}
