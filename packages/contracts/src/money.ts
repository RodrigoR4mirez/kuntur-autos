import { z } from 'zod';

export const currencySchema = z.enum(['PEN', 'USD']);

export const moneySchema = z.object({
  amountMinor: z.number().int().safe(),
  currency: currencySchema,
});
