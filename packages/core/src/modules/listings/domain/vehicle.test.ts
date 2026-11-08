import { describe, expect, it } from 'vitest';
import { makeVehicle } from '../../../in-memory/fixtures.ts';
import { validateVehicle } from './vehicle.ts';

describe('validateVehicle', () => {
  it('accepts a valid vehicle', () => {
    expect(validateVehicle(makeVehicle(), 2026).ok).toBe(true);
  });

  it('accepts the next model year but not later ones', () => {
    expect(validateVehicle(makeVehicle({ year: 2027 }), 2026).ok).toBe(true);
    expect(validateVehicle(makeVehicle({ year: 2028 }), 2026)).toEqual({
      ok: false,
      error: { code: 'invalid_year' },
    });
  });

  it('rejects years before 1950', () => {
    expect(validateVehicle(makeVehicle({ year: 1949 }), 2026).ok).toBe(false);
  });

  it('rejects negative or fractional mileage', () => {
    expect(validateVehicle(makeVehicle({ mileageKm: -1 }), 2026).ok).toBe(false);
    expect(validateVehicle(makeVehicle({ mileageKm: 10.5 }), 2026).ok).toBe(false);
  });

  it('rejects plates that are not 6 uppercase alphanumerics', () => {
    expect(validateVehicle(makeVehicle({ plate: 'knt482' }), 2026).ok).toBe(false);
    expect(validateVehicle(makeVehicle({ plate: 'KNT-482' }), 2026).ok).toBe(false);
  });
});
