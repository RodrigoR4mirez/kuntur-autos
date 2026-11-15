import { describe, expect, it } from 'vitest';
import { parseTriState } from './tri-state.ts';

describe('parseTriState', () => {
  it('maps the form values to true / false / null', () => {
    expect(parseTriState('yes')).toBe(true);
    expect(parseTriState('no')).toBe(false);
    expect(parseTriState('')).toBeNull();
    expect(parseTriState(null)).toBeNull();
    expect(parseTriState('anything')).toBeNull();
  });
});
