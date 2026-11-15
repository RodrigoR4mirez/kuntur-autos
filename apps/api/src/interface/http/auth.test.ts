import { describe, expect, it } from 'vitest';
import { bearerToken, sessionCookieToken } from './auth.ts';

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

describe('sessionCookieToken', () => {
  it('lee la cookie de sesión con y sin prefijo seguro', () => {
    expect(sessionCookieToken('a=1; better-auth.session_token=abc%2E123; b=2')).toBe('abc.123');
    expect(sessionCookieToken('__Secure-better-auth.session_token=xyz')).toBe('xyz');
  });
  it.each([undefined, '', 'otra=1', 'better-auth.session_token=%E0%A4%A'])(
    'devuelve null para %j',
    (header) => {
      expect(sessionCookieToken(header)).toBeNull();
    },
  );
});
