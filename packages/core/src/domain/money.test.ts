import { describe, expect, it } from 'vitest';
import { addMoney, money } from './money.ts';

describe('money', () => {
  it('stores amounts in minor units as integers', () => {
    expect(money(1000, 'PEN')).toEqual({ amountMinor: 1000, currency: 'PEN' });
  });

  it('rejects fractional minor units', () => {
    expect(() => money(10.5, 'PEN')).toThrow(RangeError);
  });

  it('adds amounts of the same currency', () => {
    expect(addMoney(money(1000, 'PEN'), money(250, 'PEN'))).toEqual(money(1250, 'PEN'));
  });

  it('refuses to add different currencies', () => {
    expect(() => addMoney(money(1, 'PEN'), money(1, 'USD'))).toThrow(RangeError);
  });
});
