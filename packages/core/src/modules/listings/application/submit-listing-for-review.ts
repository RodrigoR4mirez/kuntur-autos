import type { ListingId, Result, UserId } from '../../../shared/index.ts';
import { err, ok } from '../../../shared/index.ts';
import { submitForReview, type Listing, type ListingError } from '../domain/listing.ts';
import type { ListingRepository } from './ports/listing-repository.ts';

export interface SubmitListingForReviewDeps {
  readonly listings: ListingRepository;
}

export interface SubmitListingForReviewInput {
  readonly listingId: ListingId;
  readonly requesterId: UserId;
}

export type SubmitListingForReviewError =
  { readonly code: 'listing_not_found' } | { readonly code: 'not_owner' } | ListingError;

export type SubmitListingForReview = (
  input: SubmitListingForReviewInput,
) => Promise<Result<Listing, SubmitListingForReviewError>>;

export function submitListingForReview(deps: SubmitListingForReviewDeps): SubmitListingForReview {
  return async ({ listingId, requesterId }) => {
    const listing = await deps.listings.findById(listingId);
    if (!listing) return err({ code: 'listing_not_found' });
    if (listing.ownerId !== requesterId) return err({ code: 'not_owner' });

    const submitted = submitForReview(listing);
    if (!submitted.ok) return err(submitted.error);

    await deps.listings.save(submitted.value);
    return ok(submitted.value);
  };
}
