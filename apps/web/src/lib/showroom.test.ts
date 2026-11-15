import { describe, expect, it } from 'vitest';
import {
  LOCKED_TEXT,
  MASKED_PLATE,
  buildShowroom,
  parseCatalogOptions,
  parseListingDetail,
} from './showroom.ts';

const base = {
  id: 'l1',
  title: 'Toyota Yaris 2019',
  price: { amountMinor: 5_290_000, currency: 'PEN' },
  department: 'Lima',
  city: 'Miraflores',
  year: 2019,
  mileageKm: 54_000,
  access: 'anonymous',
};

const full = {
  ...base,
  access: 'registered',
  transmission: 'automatic',
  fuel: 'gasoline',
  bodyTypeId: 2,
  colorId: 3,
  previousOwners: 1,
  hasServiceHistory: true,
  soatValid: true,
  technicalReviewValid: false,
  hasSpareKey: null,
  hasLiens: false,
  hasAccidents: true,
  description: 'Único dueño.',
};

const options = parseCatalogOptions({
  bodyTypes: [{ id: 2, name: 'Sedán' }],
  colors: [
    { id: 3, name: 'Gris' },
    { id: 'x', name: 'roto' },
  ],
});

describe('parseListingDetail', () => {
  it('rejects payloads without the essentials', () => {
    expect(parseListingDetail(null)).toBeNull();
    expect(parseListingDetail({ ...base, price: { amountMinor: 'x' } })).toBeNull();
    expect(parseListingDetail({ ...base, year: '2019' })).toBeNull();
  });

  it('keeps only the fields the API sent', () => {
    const d = parseListingDetail(base);
    expect(d).not.toBeNull();
    expect(d).not.toHaveProperty('previousOwners');
    expect(d).not.toHaveProperty('plate');
  });

  it('keeps null as "not informed" and drops values of the wrong type', () => {
    const d = parseListingDetail({ ...full, hasSpareKey: null, soatValid: 'yes' });
    expect(d?.hasSpareKey).toBeNull();
    expect(d).not.toHaveProperty('soatValid');
  });
});

describe('parseCatalogOptions', () => {
  it('discards malformed entries and tolerates garbage', () => {
    expect(options.colors).toEqual([{ id: 3, name: 'Gris' }]);
    expect(parseCatalogOptions(undefined)).toEqual({ bodyTypes: [], colors: [] });
  });
});

describe('buildShowroom', () => {
  it('locks every registered-only field for an anonymous visitor', () => {
    const s = buildShowroom(parseListingDetail(base)!, options);
    expect(s.signedIn).toBe(false);
    expect(s.priceText).toBe('S/ 52,900');
    expect(s.place).toBe('Miraflores, Lima');
    expect(s.specs.find((t) => t.key === 'mileage')?.locked).toBe(false);
    expect(s.specs.find((t) => t.key === 'transmission')).toMatchObject({
      locked: true,
      value: LOCKED_TEXT,
    });
    expect(s.history.every((t) => t.locked)).toBe(true);
    expect(s.plate).toMatchObject({ locked: true, value: MASKED_PLATE });
  });

  it('shows names and tones for a signed-in visitor, still masking the plate', () => {
    const s = buildShowroom(parseListingDetail(full)!, options);
    const get = (k: string) => s.history.find((t) => t.key === k)!;
    expect(s.specs.find((t) => t.key === 'body')?.value).toBe('Sedán');
    expect(s.specs.find((t) => t.key === 'color')?.value).toBe('Gris');
    expect(s.specs.find((t) => t.key === 'transmission')?.value).toBe('Automática');
    expect(get('owners')).toMatchObject({ value: '1', tone: 'ok' });
    expect(get('soat')).toMatchObject({ value: 'Sí', tone: 'ok' });
    expect(get('review')).toMatchObject({ value: 'Vencida', tone: 'warn' });
    expect(get('liens')).toMatchObject({ value: 'Sin gravamen', tone: 'ok' });
    expect(get('accidents')).toMatchObject({ value: 'Sí, declara', tone: 'warn' });
    expect(get('key')).toMatchObject({ value: 'No informado', tone: 'neutral', locked: false });
    expect(s.plate.locked).toBe(true);
    expect(s.description).toBe('Único dueño.');
  });

  it('shows the real plate only when the API sent it', () => {
    const s = buildShowroom(parseListingDetail({ ...full, plate: 'KNT482' })!, options);
    expect(s.plate).toMatchObject({ value: 'KNT482', locked: false });
  });

  it('falls back to "No informado" for an unknown catalog id', () => {
    const s = buildShowroom(parseListingDetail({ ...full, colorId: 99 })!, options);
    expect(s.specs.find((t) => t.key === 'color')?.value).toBe('No informado');
  });
});
