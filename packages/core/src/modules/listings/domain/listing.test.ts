import { describe, expect, it } from 'vitest';
import { money, type ListingId, type UserId } from '../../../shared/index.ts';
import { createDraft, submitForReview, transition, type NewListingProps } from './listing.ts';
import { makeListing } from '../../../in-memory/fixtures.ts';

const props: NewListingProps = {
  id: 'l-1' as ListingId,
  vertical: 'vehicle',
  ownerId: 'u-1' as UserId,
  title: '  Kia Rio 2020 único dueño  ',
  price: money(3_500_000, 'PEN'),
  department: 'Lima',
  city: 'Surco',
  now: new Date('2026-01-01T00:00:00Z'),
};

describe('createDraft', () => {
  it('creates a draft with a trimmed title', () => {
    const result = createDraft(props);
    expect(result).toMatchObject({
      ok: true,
      value: { status: 'draft', title: 'Kia Rio 2020 único dueño' },
    });
  });

  it('rejects titles that are too short or too long', () => {
    expect(createDraft({ ...props, title: 'Kia' })).toEqual({
      ok: false,
      error: { code: 'invalid_title' },
    });
    expect(createDraft({ ...props, title: 'x'.repeat(101) })).toEqual({
      ok: false,
      error: { code: 'invalid_title' },
    });
  });

  it('rejects zero or negative prices', () => {
    expect(createDraft({ ...props, price: money(0, 'PEN') })).toEqual({
      ok: false,
      error: { code: 'invalid_price' },
    });
  });
});

describe('transition', () => {
  it('moves a draft to pending_review', () => {
    const result = submitForReview(makeListing({ status: 'draft' }));
    expect(result).toMatchObject({ ok: true, value: { status: 'pending_review' } });
  });

  it('refuses transitions outside the lifecycle', () => {
    expect(transition(makeListing({ status: 'published' }), 'draft')).toEqual({
      ok: false,
      error: { code: 'invalid_transition', from: 'published', to: 'draft' },
    });
  });

  it('treats sold as final', () => {
    for (const to of ['draft', 'published', 'archived'] as const) {
      expect(transition(makeListing({ status: 'sold' }), to).ok).toBe(false);
    }
  });
});
