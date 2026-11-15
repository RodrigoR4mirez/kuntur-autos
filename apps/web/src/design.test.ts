import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tokens = read('../../../packages/design-tokens/tokens.css');

/** Lee las variables --t-* de un bloque del CSS generado (claro o oscuro). */
function themeVars(block: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of block.matchAll(/--t-([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) vars[m[1]!] = m[2]!;
  return vars;
}
const light = themeVars(tokens.slice(0, tokens.indexOf('@media (prefers-color-scheme: dark)')));
const dark = themeVars(tokens.slice(tokens.indexOf('@media (prefers-color-scheme: dark)')));

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// Pares (texto, fondo) que la web usa de verdad.
const pairs: Array<[string, string, number]> = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['on-action', 'action', 4.5], // botón principal (Rocoto)
  ['on-primary', 'primary', 4.5], // número de los pasos
  ['on-verified', 'verified', 4.5], // sello Oro Inca
  ['primary', 'bg', 4.5], // enlaces
];

describe('contraste AA de la web', () => {
  for (const [name, theme] of [
    ['claro', light],
    ['oscuro', dark],
  ] as const) {
    for (const [fg, bg, min] of pairs) {
      it(`${name}: ${fg} sobre ${bg} ≥ ${min}`, () => {
        expect(theme[fg], `falta --t-${fg}`).toBeDefined();
        expect(theme[bg], `falta --t-${bg}`).toBeDefined();
        expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(min);
      });
    }
  }
});

describe('CSS de la web', () => {
  const css = read('./app/globals.css') + read('./app/home.css');

  it('el botón principal y el sello usan los tokens de la marca', () => {
    expect(css).toMatch(/\.btn-primary\s*{[^}]*var\(--t-action\)/);
    expect(css).toMatch(/\.seal\s*{[^}]*var\(--t-verified\)/);
  });
  it('los botones miden al menos 44 px (táctil)', () => {
    expect(css).toMatch(/\.btn\s*{[^}]*min-height:\s*(4[4-9]|[5-9]\d)px/);
  });
  it('el botón del encabezado no se parte en dos líneas en móvil', () => {
    expect(css).toMatch(/\.bar \.btn\s*{[^}]*white-space:\s*nowrap/);
  });
  it('respeta prefers-reduced-motion', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
