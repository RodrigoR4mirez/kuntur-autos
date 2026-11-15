import { describe, expect, it } from 'vitest';
import { fetchBrands, parseBrands } from './api.ts';

describe('parseBrands', () => {
  it('conserva solo marcas con id y nombre', () => {
    expect(parseBrands({ brands: [{ id: 'a', name: 'Toyota' }, { id: 1 }, null] })).toEqual([
      { id: 'a', name: 'Toyota' },
    ]);
  });
  it('devuelve vacío ante formas inesperadas', () => {
    expect(parseBrands(null)).toEqual([]);
    expect(parseBrands({})).toEqual([]);
    expect(parseBrands({ brands: 'x' })).toEqual([]);
  });
});

describe('fetchBrands', () => {
  it('sin URL configurada no llama a nadie', async () => {
    const fetcher = (() => {
      throw new Error('no debe llamarse');
    }) as unknown as typeof fetch;
    expect(await fetchBrands('', fetcher)).toEqual([]);
  });
  it('devuelve las marcas cuando la API responde', async () => {
    const fetcher = (async () =>
      Response.json({ brands: [{ id: 'b1', name: 'Kia' }] })) as unknown as typeof fetch;
    expect(await fetchBrands('http://api.test', fetcher)).toEqual([{ id: 'b1', name: 'Kia' }]);
  });
  it('si la API falla o responde error, devuelve vacío', async () => {
    const down = (async () => {
      throw new Error('caída');
    }) as unknown as typeof fetch;
    const bad = (async () => new Response('x', { status: 500 })) as unknown as typeof fetch;
    expect(await fetchBrands('http://api.test', down)).toEqual([]);
    expect(await fetchBrands('http://api.test', bad)).toEqual([]);
  });
});
