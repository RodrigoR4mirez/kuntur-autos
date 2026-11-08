import { describe, expect, it } from 'vitest';
import { withStrictSsl } from './connect.ts';

const base = 'postgresql://user:p%40ss@ep-example.sa-east-1.aws.neon.tech/neondb';

describe('withStrictSsl', () => {
  it.each(['require', 'prefer', 'verify-ca'])('turns sslmode=%s into verify-full', (mode) => {
    expect(withStrictSsl(`${base}?sslmode=${mode}`)).toBe(`${base}?sslmode=verify-full`);
  });

  it('keeps every other parameter and the credentials untouched', () => {
    const url = `${base}?channel_binding=require&sslmode=require&application_name=kuntur`;
    expect(withStrictSsl(url)).toBe(
      `${base}?channel_binding=require&sslmode=verify-full&application_name=kuntur`,
    );
  });

  it('leaves verify-full, disable and URLs without sslmode alone', () => {
    expect(withStrictSsl(`${base}?sslmode=verify-full`)).toBe(`${base}?sslmode=verify-full`);
    expect(withStrictSsl(`${base}?sslmode=disable`)).toBe(`${base}?sslmode=disable`);
    expect(withStrictSsl(base)).toBe(base);
    expect(withStrictSsl('postgres://kuntur:kuntur@localhost:5432/kuntur')).toBe(
      'postgres://kuntur:kuntur@localhost:5432/kuntur',
    );
  });

  it('respects an explicit libpq compatibility request', () => {
    const url = `${base}?uselibpqcompat=true&sslmode=require`;
    expect(withStrictSsl(url)).toBe(url);
  });

  it('does not match a look-alike inside another value', () => {
    expect(withStrictSsl(`${base}?note=sslmode=require`)).toBe(`${base}?note=sslmode=require`);
  });
});
