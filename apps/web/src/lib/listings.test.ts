import { describe, expect, it } from 'vitest';
import {
  buildListingsQuery,
  formatMoney,
  parseListingCards,
  parseOwnListings,
  parsePendingListings,
} from './listings.ts';

const card = {
  id: 'a',
  title: 'Kia Rio 2020',
  price: { amountMinor: 3_500_000, currency: 'PEN' },
  department: 'Lima',
  city: 'Surco',
  year: 2020,
  mileageKm: 30_000,
};

describe('formatMoney', () => {
  it('shows soles and dollars without decimals', () => {
    expect(formatMoney({ amountMinor: 3_500_000, currency: 'PEN' })).toBe('S/ 35,000');
    expect(formatMoney({ amountMinor: 1_450_000, currency: 'USD' })).toBe('US$ 14,500');
  });
});

describe('parseListingCards', () => {
  it('keeps valid items and drops malformed ones', () => {
    const items = parseListingCards({ items: [card, { ...card, id: 3 }, { id: 'x' }, null, 'no'] });
    expect(items.map((i) => i.id)).toEqual(['a']);
  });
  it('returns [] for anything that is not the expected shape', () => {
    expect(parseListingCards(null)).toEqual([]);
    expect(parseListingCards({ items: 'x' })).toEqual([]);
    expect(
      parseListingCards({ items: [{ ...card, price: { amountMinor: 1, currency: 'EUR' } }] }),
    ).toEqual([]);
  });
});

describe('parseOwnListings / parsePendingListings', () => {
  const own = {
    id: 'a',
    title: 'Kia Rio 2020',
    status: 'draft',
    price: card.price,
    department: 'Lima',
    city: 'Surco',
  };
  it('rejects unknown statuses', () => {
    expect(parseOwnListings({ items: [own, { ...own, status: 'hacked' }] })).toHaveLength(1);
  });
  it('parses the reviewer queue with and without vehicle', () => {
    const vehicle = {
      year: 2020,
      mileageKm: 1,
      transmission: 'manual',
      fuel: 'gasoline',
      plate: 'ABC123',
    };
    const items = parsePendingListings({
      items: [
        { ...own, vehicle },
        { ...own, id: 'b', vehicle: null },
      ],
    });
    expect(items[0]?.vehicle?.plate).toBe('ABC123');
    expect(items[1]?.vehicle).toBeNull();
  });
});

describe('buildListingsQuery', () => {
  it('converts soles to minor units and omits empty or invalid filters', () => {
    const q = new URLSearchParams(
      buildListingsQuery({ brandId: 2, maxPricePen: 35000, minYear: 2018 }),
    );
    expect(q.get('brandId')).toBe('2');
    expect(q.get('maxPriceMinor')).toBe('3500000');
    expect(q.get('minYear')).toBe('2018');
    const empty = new URLSearchParams(
      buildListingsQuery({ brandId: Number.NaN, maxPricePen: -5, minYear: 10 }),
    );
    expect([...empty.keys()]).toEqual(['limit']);
  });
});
