import { describe, expect, it } from 'vitest';
import { bearerToken } from './auth.ts';

describe('bearerToken', () => {
  it('extracts the token', () => {
    expect(bearerToken('Bearer abc123')).toBe('abc123');
    expect(bearerToken('bearer abc123')).toBe('abc123');
  });

  it.each([undefined, '', 'abc123', 'Basic abc123', 'Bearer', 'Bearer a b', 'Bearer  '])(
    'returns null for %j',
    (header) => {
      expect(bearerToken(header)).toBeNull();
    },
  );
});
