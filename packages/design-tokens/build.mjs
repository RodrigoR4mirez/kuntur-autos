// Genera tokens.css a partir de tokens.json. Sin dependencias.
// Más adelante se puede reemplazar por Style Dictionary sin cambiar tokens.json.
import { readFileSync, writeFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url), 'utf8'));

const get = (path) => path.split('.').reduce((o, k) => o?.[k], tokens);

function resolve(value) {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{(.+)\}$/);
  return m ? resolve(get(m[1]).$value) : value;
}

function flatten(node, prefix = []) {
  const out = [];
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && '$value' in val) {
      let v = resolve(val.$value);
      if (Array.isArray(v)) v = v.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ');
      out.push([[...prefix, key].join('-'), v]);
    } else if (val && typeof val === 'object') {
      out.push(...flatten(val, [...prefix, key]));
    }
  }
  return out;
}

const block = (rows, indent = '  ') => rows.map(([k, v]) => `${indent}--${k}: ${v};`).join('\n');

const base = [
  ...flatten(tokens.color, ['color']),
  ...flatten(tokens.font, ['font']),
  ...flatten(tokens.space, ['space']),
  ...flatten(tokens.radius, ['radius']),
  ...flatten(tokens.motion, ['motion']),
];
const light = flatten(tokens.theme.light, ['t']);
const dark = flatten(tokens.theme.dark, ['t']);

const css = `/* Generado por build.mjs. No editar a mano: cambia tokens.json. */
:root {
${block(base)}
${block(light)}
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${block(dark, '    ')}
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
${block(dark)}
  color-scheme: dark;
}
`;

writeFileSync(new URL('./tokens.css', import.meta.url), css);
console.log('tokens.css generado');
