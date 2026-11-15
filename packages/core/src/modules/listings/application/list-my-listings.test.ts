import { expect, it } from 'vitest';
import type { ListingId } from '../../../shared/index.ts';
import {
  InMemoryListingRepository,
  makeListing,
  OWNER,
  STRANGER,
} from '../../../in-memory/index.ts';
import { listMyListings } from './list-my-listings.ts';

it('returns only the requester listings, in any status, newest first', async () => {
  const listings = new InMemoryListingRepository();
  const older = new Date('2026-01-01T00:00:00Z');
  await listings.save(makeListing({ id: 'a' as ListingId, status: 'draft', createdAt: older }));
  await listings.save(makeListing({ id: 'b' as ListingId, status: 'published' }));
  await listings.save(makeListing({ id: 'c' as ListingId, ownerId: STRANGER }));

  const mine = await listMyListings({ listings })({ ownerId: OWNER });
  expect(mine.map((l) => l.id)).toEqual(['b', 'a']);
});
