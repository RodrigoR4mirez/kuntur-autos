import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Money } from '@kuntur/core';
import type { z } from 'zod';
import { moneySchema, plateSchema } from './index.ts';

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
