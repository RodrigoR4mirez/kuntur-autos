import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingId } from '../../../shared/index.ts';
import {
  InMemoryListingRepository,
  OWNER,
  STRANGER,
  makeListing,
} from '../../../in-memory/index.ts';
import { submitListingForReview } from './submit-listing-for-review.ts';

const id = 'listing-1' as ListingId;
let listings: InMemoryListingRepository;
let run: ReturnType<typeof submitListingForReview>;

beforeEach(async () => {
  listings = new InMemoryListingRepository();
  await listings.save(makeListing({ status: 'draft' }));
  run = submitListingForReview({ listings });
});

describe('submitListingForReview', () => {
  it('moves the owner draft to pending_review and saves it', async () => {
    const result = await run({ listingId: id, requesterId: OWNER });

    expect(result).toMatchObject({ ok: true, value: { status: 'pending_review' } });
    expect(await listings.findById(id)).toMatchObject({ status: 'pending_review' });
  });

  it('answers listing_not_found for an unknown id', async () => {
    const result = await run({ listingId: 'nope' as ListingId, requesterId: OWNER });
    expect(result).toEqual({ ok: false, error: { code: 'listing_not_found' } });
  });

  it('refuses anyone who is not the owner and leaves the listing untouched', async () => {
    const result = await run({ listingId: id, requesterId: STRANGER });

    expect(result).toEqual({ ok: false, error: { code: 'not_owner' } });
    expect(await listings.findById(id)).toMatchObject({ status: 'draft' });
  });

  it('refuses to submit twice', async () => {
    await run({ listingId: id, requesterId: OWNER });
    const second = await run({ listingId: id, requesterId: OWNER });

    expect(second).toEqual({
      ok: false,
      error: { code: 'invalid_transition', from: 'pending_review', to: 'pending_review' },
    });
  });
});
