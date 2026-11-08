import { describe, expect, expectTypeOf, it } from 'vitest';
import type { CreateDraftListingInput, Money } from '@kuntur/core';
import type { z } from 'zod';
import { createListingSchema, moneySchema, plateSchema } from './index.ts';

describe('contracts stay compatible with the core', () => {
  it('money schema output matches the core Money type', () => {
    expectTypeOf<z.infer<typeof moneySchema>>().toEqualTypeOf<{
      amountMinor: number;
      currency: Money['currency'];
    }>();
  });

  it('rejects fractional amounts', () => {
    expect(moneySchema.safeParse({ amountMinor: 10.5, currency: 'PEN' }).success).toBe(false);
  });
});

describe('plateSchema', () => {
  it('normalizes dashes, spaces and case', () => {
    expect(plateSchema.parse(' knt-482 ')).toBe('KNT482');
  });

  it('rejects plates that are not 6 characters', () => {
    expect(plateSchema.safeParse('KNT-48').success).toBe(false);
    expect(plateSchema.safeParse('KNT-4821').success).toBe(false);
  });
});

describe('createListingSchema', () => {
  const valid = {
    title: 'Toyota Yaris 2019',
    price: { amountMinor: 100, currency: 'PEN' },
    department: 'Lima',
    city: 'Surco',
    vehicle: {
      brandId: 1,
      modelId: 10,
      versionId: null,
      bodyTypeId: 2,
      colorId: 3,
      year: 2019,
      mileageKm: 0,
      transmission: 'manual',
      fuel: 'diesel',
      plate: 'abc-123',
    },
  };

  it('parses a valid body and normalizes the plate', () => {
    const parsed = createListingSchema.parse(valid);
    expect(parsed.vehicle.plate).toBe('ABC123');
  });

  it('produces input the core use case accepts (no type drift)', () => {
    type Parsed = z.infer<typeof createListingSchema>;
    expectTypeOf<Parsed['vehicle']>().toExtend<CreateDraftListingInput['vehicle']>();
    expectTypeOf<Parsed['price']>().toExtend<CreateDraftListingInput['price']>();
  });

  it.each(['ownerId', 'status', 'id'])(
    'rejects the unknown field %s (mass assignment)',
    (field) => {
      expect(createListingSchema.safeParse({ ...valid, [field]: 'x' }).success).toBe(false);
    },
  );

  it('rejects ids that are not positive integers and unknown enums', () => {
    const bad = (v: object) =>
      createListingSchema.safeParse({ ...valid, vehicle: { ...valid.vehicle, ...v } });
    expect(bad({ brandId: 0 }).success).toBe(false);
    expect(bad({ brandId: 1.5 }).success).toBe(false);
    expect(bad({ fuel: 'steam' }).success).toBe(false);
    expect(bad({ transmission: 'cvt' }).success).toBe(false);
    expect(bad({ mileageKm: -1 }).success).toBe(false);
  });
});
