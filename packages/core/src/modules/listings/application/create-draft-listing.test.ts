import { beforeEach, describe, expect, it } from 'vitest';
import { money, type ListingId } from '../../../shared/index.ts';
import {
  FixedClock,
  InMemoryListingRepository,
  NOW,
  OWNER,
  SequentialIds,
  makeVehicle,
} from '../../../in-memory/index.ts';
import { createDraftListing, type CreateDraftListingInput } from './create-draft-listing.ts';

let listings: InMemoryListingRepository;
let run: ReturnType<typeof createDraftListing>;

const { listingId: _ignored, ...vehicleInput } = makeVehicle();

const input: CreateDraftListingInput = {
  ownerId: OWNER,
  title: 'Toyota Yaris 2019 en excelente estado',
  price: money(4_890_000, 'PEN'),
  department: 'Lima',
  city: 'Miraflores',
  vehicle: vehicleInput,
};

beforeEach(() => {
  listings = new InMemoryListingRepository();
  run = createDraftListing({
    listings,
    ids: new SequentialIds('listing'),
    clock: new FixedClock(NOW),
  });
});

describe('createDraftListing', () => {
  it('saves a draft listing together with its vehicle', async () => {
    const result = await run(input);

    expect(result.ok).toBe(true);
    const id = 'listing-1' as ListingId;
    expect(await listings.findById(id)).toMatchObject({ status: 'draft', ownerId: OWNER });
    expect(await listings.findVehicleDetails(id)).toMatchObject({ listingId: id, plate: 'KNT482' });
  });

  it('does not save anything when the listing is invalid', async () => {
    const result = await run({ ...input, title: 'Kia' });

    expect(result).toEqual({ ok: false, error: { code: 'invalid_title' } });
    expect(await listings.findById('listing-1' as ListingId)).toBeNull();
  });

  it('does not save anything when the vehicle is invalid', async () => {
    const result = await run({ ...input, vehicle: { ...vehicleInput, year: 1900 } });

    expect(result).toEqual({ ok: false, error: { code: 'invalid_year' } });
    expect(await listings.findById('listing-1' as ListingId)).toBeNull();
  });

  it('judges the model year against the clock, not the machine date', async () => {
    const early = createDraftListing({
      listings,
      ids: new SequentialIds('listing'),
      clock: new FixedClock(new Date('2019-06-01T00:00:00Z')),
    });
    const result = await early({ ...input, vehicle: { ...vehicleInput, year: 2022 } });

    expect(result).toEqual({ ok: false, error: { code: 'invalid_year' } });
  });
});
