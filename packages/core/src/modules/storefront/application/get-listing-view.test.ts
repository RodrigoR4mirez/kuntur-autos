import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingId } from '../../../shared/index.ts';
import { InMemoryListingRepository, makeListing, makeVehicle } from '../../../in-memory/index.ts';
import { getListingView } from './get-listing-view.ts';

const id = 'listing-1' as ListingId;
let listings: InMemoryListingRepository;
let run: ReturnType<typeof getListingView>;

beforeEach(async () => {
  listings = new InMemoryListingRepository();
  await listings.save(makeListing(), makeVehicle());
  run = getListingView({ listings });
});

describe('getListingView', () => {
  it('returns the view for a published listing, shaped by the access level', async () => {
    const anonymous = await run({ listingId: id, access: 'anonymous' });
    const registered = await run({ listingId: id, access: 'registered' });

    expect(anonymous.ok && 'transmission' in anonymous.value).toBe(false);
    expect(registered.ok && 'transmission' in registered.value).toBe(true);
  });

  it('hides listings that are not published', async () => {
    await listings.save(makeListing({ status: 'draft' }), makeVehicle());

    expect(await run({ listingId: id, access: 'closed' })).toEqual({
      ok: false,
      error: { code: 'listing_not_found' },
    });
  });

  it('answers not found for an unknown id', async () => {
    expect(
      await run({ listingId: 'nope' as ListingId, access: 'anonymous' }).then((r) => r.ok),
    ).toBe(false);
  });

  it('answers not found when the vehicle data is missing', async () => {
    const empty = new InMemoryListingRepository();
    await empty.save(makeListing());

    const result = await getListingView({ listings: empty })({
      listingId: id,
      access: 'anonymous',
    });
    expect(result.ok).toBe(false);
  });
});
