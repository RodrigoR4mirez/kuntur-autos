import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('currentUser', () => {
  it('lee la cookie antes de revisar la URL de la API (si no, Next congela el encabezado como estático)', () => {
    const src = readFileSync(new URL('./session.ts', import.meta.url), 'utf8');
    const body = src.slice(src.indexOf('export async function currentUser'));
    expect(body.indexOf('cookies()')).toBeGreaterThan(-1);
    expect(body.indexOf('cookies()')).toBeLessThan(body.indexOf('!baseUrl'));
  });
});
