import { describe, expect, it, vi } from 'vitest';
import { BetterAuthSessionResolver, type SessionSource } from './better-auth-session-resolver.ts';

function source(result: Awaited<ReturnType<SessionSource['api']['getSession']>>) {
  const getSession = vi.fn().mockResolvedValue(result);
  return { getSession, source: { api: { getSession } } as SessionSource };
}

describe('BetterAuthSessionResolver', () => {
  it('returns null when Better Auth finds no session', async () => {
    expect(await new BetterAuthSessionResolver(source(null).source).resolve('x')).toBeNull();
  });

  it('maps the user id and role', async () => {
    const { source: s } = source({ user: { id: 'u-1', role: 'seller' } });
    expect(await new BetterAuthSessionResolver(s).resolve('x')).toEqual({
      userId: 'u-1',
      role: 'seller',
    });
  });

  it.each([undefined, null, 'superuser', 42])(
    'falls back to buyer for the unknown role %j',
    async (role) => {
      const { source: s } = source({ user: { id: 'u-1', role } });
      expect(await new BetterAuthSessionResolver(s).resolve('x')).toMatchObject({ role: 'buyer' });
    },
  );

  it('sends the token as a Bearer header', async () => {
    const { getSession, source: s } = source(null);
    await new BetterAuthSessionResolver(s).resolve('abc.def');
    const headers = getSession.mock.calls[0]?.[0].headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer abc.def');
  });
});
