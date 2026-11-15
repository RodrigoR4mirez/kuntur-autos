import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingId } from '../../../shared/index.ts';
import { InMemoryListingRepository, makeListing, makeVehicle } from '../../../in-memory/index.ts';
import { canReview, listPendingListings, reviewListing } from './review-listing.ts';

const id = 'listing-1' as ListingId;

describe('reviewListing', () => {
  let listings: InMemoryListingRepository;
  beforeEach(async () => {
    listings = new InMemoryListingRepository();
    await listings.save(makeListing({ status: 'pending_review' }));
  });

  it('lets an advisor approve a pending listing', async () => {
    const result = await reviewListing({ listings })({
      listingId: id,
      reviewerRole: 'advisor',
      decision: 'approve',
    });
    expect(result.ok && result.value.status).toBe('published');
    expect((await listings.findById(id))?.status).toBe('published');
  });

  it('lets an admin reject a pending listing', async () => {
    const result = await reviewListing({ listings })({
      listingId: id,
      reviewerRole: 'admin',
      decision: 'reject',
    });
    expect(result.ok && result.value.status).toBe('rejected');
  });

  it.each(['buyer', 'seller', 'dealer'] as const)(
    'forbids the %s role and changes nothing',
    async (role) => {
      const result = await reviewListing({ listings })({
        listingId: id,
        reviewerRole: role,
        decision: 'approve',
      });
      expect(!result.ok && result.error.code).toBe('forbidden');
      expect((await listings.findById(id))?.status).toBe('pending_review');
    },
  );

  it('reports an unknown listing', async () => {
    const result = await reviewListing({ listings })({
      listingId: 'nope' as ListingId,
      reviewerRole: 'advisor',
      decision: 'approve',
    });
    expect(!result.ok && result.error.code).toBe('listing_not_found');
  });

  it('refuses to review a listing that is not pending', async () => {
    await listings.save(makeListing({ status: 'draft' }));
    const result = await reviewListing({ listings })({
      listingId: id,
      reviewerRole: 'advisor',
      decision: 'approve',
    });
    expect(!result.ok && result.error.code).toBe('invalid_transition');
  });

  it('knows which roles can review', () => {
    expect(canReview('advisor')).toBe(true);
    expect(canReview('admin')).toBe(true);
    expect(canReview('buyer')).toBe(false);
  });
});

describe('listPendingListings', () => {
  it('returns the queue to reviewers only', async () => {
    const listings = new InMemoryListingRepository();
    await listings.save(makeListing({ status: 'pending_review' }), makeVehicle());
    await listings.save(makeListing({ id: 'listing-2' as ListingId, status: 'draft' }));

    const ok = await listPendingListings({ listings })({ reviewerRole: 'advisor' });
    expect(ok.ok && ok.value.map((p) => p.listing.id)).toEqual(['listing-1']);
    expect(ok.ok && ok.value[0]?.vehicle?.plate).toBe('KNT482');

    const denied = await listPendingListings({ listings })({ reviewerRole: 'buyer' });
    expect(!denied.ok && denied.error.code).toBe('forbidden');
  });
});
