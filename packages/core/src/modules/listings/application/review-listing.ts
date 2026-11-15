import type { ListingId, Result } from '../../../shared/index.ts';
import { err, ok } from '../../../shared/index.ts';
import type { Role } from '../../accounts/index.ts';
import { publish, reject, type Listing, type ListingError } from '../domain/listing.ts';
import type { VehicleDetails } from '../domain/vehicle.ts';
import type { ListingRepository } from './ports/listing-repository.ts';

/** Quién puede revisar anuncios. La decisión de negocio vive aquí, no en la interfaz. */
const REVIEWER_ROLES: readonly Role[] = ['advisor', 'admin'];
export const canReview = (role: Role): boolean => REVIEWER_ROLES.includes(role);

export interface ReviewListingDeps {
  readonly listings: ListingRepository;
}

export interface ReviewListingInput {
  readonly listingId: ListingId;
  readonly reviewerRole: Role;
  readonly decision: 'approve' | 'reject';
}

export type ReviewListingError =
  { readonly code: 'forbidden' } | { readonly code: 'listing_not_found' } | ListingError;

export type ReviewListing = (
  input: ReviewListingInput,
) => Promise<Result<Listing, ReviewListingError>>;

export function reviewListing(deps: ReviewListingDeps): ReviewListing {
  return async ({ listingId, reviewerRole, decision }) => {
    if (!canReview(reviewerRole)) return err({ code: 'forbidden' });
    const listing = await deps.listings.findById(listingId);
    if (!listing) return err({ code: 'listing_not_found' });

    const next = decision === 'approve' ? publish(listing) : reject(listing);
    if (!next.ok) return err(next.error);
    await deps.listings.save(next.value);
    return ok(next.value);
  };
}

export interface ListPendingListingsDeps {
  readonly listings: ListingRepository;
}

export interface PendingListing {
  readonly listing: Listing;
  /** Datos del vehículo para que el asesor revise (incluida la placa). Null si faltan. */
  readonly vehicle: VehicleDetails | null;
}

export type ListPendingListings = (input: {
  readonly reviewerRole: Role;
}) => Promise<Result<PendingListing[], { readonly code: 'forbidden' }>>;

/** La cola de revisión: anuncios enviados, del más antiguo al más reciente, con su vehículo. */
export function listPendingListings(deps: ListPendingListingsDeps): ListPendingListings {
  return async ({ reviewerRole }) => {
    if (!canReview(reviewerRole)) return err({ code: 'forbidden' });
    const pending = await deps.listings.findByStatus('pending_review', 50);
    return ok(
      await Promise.all(
        pending.map(async (listing) => ({
          listing,
          vehicle: await deps.listings.findVehicleDetails(listing.id),
        })),
      ),
    );
  };
}
