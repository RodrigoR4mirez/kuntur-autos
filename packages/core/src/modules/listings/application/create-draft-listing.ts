import type {
  Clock,
  IdGenerator,
  ListingId,
  Money,
  Result,
  UserId,
} from '../../../shared/index.ts';
import { err, ok } from '../../../shared/index.ts';
import { createDraft, type Listing, type ListingError } from '../domain/listing.ts';
import { validateVehicle, type VehicleDetails, type VehicleError } from '../domain/vehicle.ts';
import type { ListingRepository } from './ports/listing-repository.ts';

export interface CreateDraftListingDeps {
  readonly listings: ListingRepository;
  readonly ids: IdGenerator;
  readonly clock: Clock;
}

export interface CreateDraftListingInput {
  readonly ownerId: UserId;
  readonly title: string;
  readonly price: Money;
  readonly department: string;
  readonly city: string;
  readonly vehicle: Omit<VehicleDetails, 'listingId'>;
}

export type CreateDraftListingError = ListingError | VehicleError;

export type CreateDraftListing = (
  input: CreateDraftListingInput,
) => Promise<Result<Listing, CreateDraftListingError>>;

export function createDraftListing(deps: CreateDraftListingDeps): CreateDraftListing {
  return async (input) => {
    const now = deps.clock.now();
    const id = deps.ids.next() as ListingId;

    const listing = createDraft({
      id,
      vertical: 'vehicle',
      ownerId: input.ownerId,
      title: input.title,
      price: input.price,
      department: input.department,
      city: input.city,
      now,
    });
    if (!listing.ok) return err(listing.error);

    const vehicle = validateVehicle({ ...input.vehicle, listingId: id }, now.getUTCFullYear());
    if (!vehicle.ok) return err(vehicle.error);

    await deps.listings.save(listing.value, vehicle.value);
    return ok(listing.value);
  };
}
