import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingId } from '../../../shared/index.ts';
import { money } from '../../../shared/index.ts';
import { InMemoryListingRepository, makeListing, makeVehicle } from '../../../in-memory/index.ts';
import { searchListings } from './search-listings.ts';

async function add(
  repo: InMemoryListingRepository,
  id: string,
  listing: Parameters<typeof makeListing>[0],
  vehicle: Parameters<typeof makeVehicle>[0],
) {
  await repo.save(
    makeListing({ id: id as ListingId, ...listing }),
    makeVehicle({ listingId: id as ListingId, ...vehicle }),
  );
}

describe('searchListings', () => {
  let listings: InMemoryListingRepository;
  const page = { limit: 10, offset: 0 };

  beforeEach(async () => {
    listings = new InMemoryListingRepository();
    await add(listings, 'cheap', { price: money(2_000_000, 'PEN') }, { brandId: 1, year: 2015 });
    await add(listings, 'mid', { price: money(5_000_000, 'PEN') }, { brandId: 2, year: 2020 });
    await add(listings, 'draft', { status: 'draft' }, {});
    await add(listings, 'pending', { status: 'pending_review' }, {});
  });

  it('returns only published listings', async () => {
    const result = await searchListings({ listings })({ access: 'anonymous', filter: page });
    expect(result.map((v) => v.id).sort()).toEqual(['cheap', 'mid']);
  });

  it('filters by brand, max price and minimum year', async () => {
    const search = searchListings({ listings });
    expect(
      (await search({ access: 'anonymous', filter: { ...page, brandId: 2 } })).map((v) => v.id),
    ).toEqual(['mid']);
    expect(
      (await search({ access: 'anonymous', filter: { ...page, maxPriceMinor: 3_000_000 } })).map(
        (v) => v.id,
      ),
    ).toEqual(['cheap']);
    expect(
      (await search({ access: 'anonymous', filter: { ...page, minYear: 2018 } })).map((v) => v.id),
    ).toEqual(['mid']);
  });

  it('paginates', async () => {
    const result = await searchListings({ listings })({
      access: 'anonymous',
      filter: { limit: 1, offset: 1 },
    });
    expect(result).toHaveLength(1);
  });

  it('never exposes the plate, even for the highest access levels', async () => {
    for (const access of ['anonymous', 'registered', 'deposit_paid', 'closed'] as const) {
      const [view] = await searchListings({ listings })({
        access,
        filter: { ...page, brandId: 2 },
      });
      expect(view).toBeDefined();
      expect('plate' in (view as object)).toBe(false);
    }
  });

  it('hides registered-only fields from anonymous visitors', async () => {
    const [anon] = await searchListings({ listings })({
      access: 'anonymous',
      filter: { ...page, brandId: 2 },
    });
    const [reg] = await searchListings({ listings })({
      access: 'registered',
      filter: { ...page, brandId: 2 },
    });
    expect('transmission' in (anon as object)).toBe(false);
    expect('transmission' in (reg as object)).toBe(true);
  });
});
