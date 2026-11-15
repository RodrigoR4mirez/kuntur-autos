import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHOTO_WIDTHS, photoVariant } from './photo.ts';
import { EXAMPLES, exampleCardData, exampleShowroom, findExample } from './examples.ts';

describe('autos de ejemplo', () => {
  it('son cinco, con slugs e ids únicos', () => {
    expect(EXAMPLES).toHaveLength(5);
    expect(new Set(EXAMPLES.map((e) => e.slug)).size).toBe(5);
    expect(new Set(EXAMPLES.map((e) => e.detail.id)).size).toBe(5);
  });

  it('cada foto existe en public/ y tiene texto alternativo y crédito', () => {
    for (const e of EXAMPLES) {
      expect(existsSync(resolve(import.meta.dirname, '../../public', `.${e.photo.src}`))).toBe(
        true,
      );
      for (const w of PHOTO_WIDTHS) {
        const file = resolve(
          import.meta.dirname,
          '../../public',
          `.${photoVariant(e.photo.src, w)}`,
        );
        expect(existsSync(file)).toBe(true);
      }
      expect(e.photo.alt.length).toBeGreaterThan(10);
      expect(e.photo.credit).toContain('No es un anuncio real');
    }
  });

  it('cada ficha se arma sin datos vacíos y se encuentra por slug', () => {
    for (const e of EXAMPLES) {
      const s = exampleShowroom(e);
      expect(s.title).toBe(e.detail.title);
      expect(s.specs.length).toBeGreaterThan(0);
      expect(findExample(e.slug)).toBe(e);
    }
    expect(findExample('no-existe')).toBeUndefined();
  });

  it('la tarjeta apunta a la ficha de ejemplo y muestra el precio con moneda', () => {
    const ram = EXAMPLES.find((e) => e.slug === 'ram-1500-2021');
    expect(ram && exampleCardData(ram).href).toBe('/ejemplo/ram-1500-2021');
    expect(ram && exampleCardData(ram).priceText).toMatch(/^US\$ /);
  });
});
