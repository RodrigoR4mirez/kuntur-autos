export type Currency = 'PEN' | 'USD';

/** Dinero en la unidad menor (céntimos), siempre entero. */
export interface Money {
  readonly amountMinor: number;
  readonly currency: Currency;
}

export function money(amountMinor: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError('amountMinor must be a safe integer');
  }
  return { amountMinor, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new RangeError(`cannot add ${a.currency} and ${b.currency}`);
  }
  return money(a.amountMinor + b.amountMinor, a.currency);
}
