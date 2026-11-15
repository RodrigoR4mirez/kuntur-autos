import { describe, expect, it } from 'vitest';
import { fetchBrands, fetchCatalogOptions, parseBrands } from './api.ts';

describe('parseBrands', () => {
  it('conserva solo marcas con id y nombre', () => {
    expect(parseBrands({ brands: [{ id: 7, name: 'Toyota' }, { id: 'x' }, null] })).toEqual([
      { id: 7, name: 'Toyota' },
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
      Response.json({ brands: [{ id: 2, name: 'Kia' }] })) as unknown as typeof fetch;
    expect(await fetchBrands('http://api.test', fetcher)).toEqual([{ id: 2, name: 'Kia' }]);
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

describe('fetchCatalogOptions', () => {
  it('devuelve el JSON cuando la API responde y null cuando no', async () => {
    const ok = (async () => Response.json({ colors: [] })) as unknown as typeof fetch;
    const bad = (async () => new Response('x', { status: 500 })) as unknown as typeof fetch;
    const down = (async () => {
      throw new Error('caída');
    }) as unknown as typeof fetch;
    expect(await fetchCatalogOptions('http://api.test', ok)).toEqual({ colors: [] });
    expect(await fetchCatalogOptions('http://api.test', bad)).toBeNull();
    expect(await fetchCatalogOptions('http://api.test', down)).toBeNull();
    expect(await fetchCatalogOptions('', ok)).toBeNull();
  });
});
