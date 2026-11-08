// Verifica la regla de dependencias de docs/01-arquitectura.md:
//   apps -> adapters -> contracts -> core, y core no importa nada externo.
// Sin dependencias. Los archivos *.test.ts quedan fuera: pueden importar vitest.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function listSourceFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx|mjs|js)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

export function importSpecifiers(source) {
  const specs = [];
  const re =
    /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of source.matchAll(re)) specs.push(m[1] ?? m[2] ?? m[3]);
  return specs;
}

const isRelative = (s) => s.startsWith('./') || s.startsWith('../');

/** Reglas: devuelve un mensaje si el import está prohibido en esa capa, o null. */
export function violation(layer, spec) {
  if (isRelative(spec)) return null;
  if (layer === 'core') return `core solo puede importar rutas relativas, no "${spec}"`;
  if (layer === 'contracts' && spec.startsWith('@kuntur/') && spec !== '@kuntur/core') {
    return `contracts solo puede depender de @kuntur/core, no de "${spec}"`;
  }
  if (layer === 'adapters' && /^@kuntur\/(api|web|mobile)/.test(spec)) {
    return `los adaptadores no pueden depender de apps ("${spec}")`;
  }
  if (spec.startsWith('@kuntur/adapter') && layer !== 'apps') {
    return `solo las apps pueden depender de adaptadores ("${spec}")`;
  }
  return null;
}

export function check(root) {
  const layers = [
    ['core', join(root, 'packages', 'core', 'src')],
    ['contracts', join(root, 'packages', 'contracts', 'src')],
    ['adapters', join(root, 'packages', 'adapters')],
    ['apps', join(root, 'apps')],
  ];
  const problems = [];
  for (const [layer, dir] of layers) {
    for (const file of listSourceFiles(dir)) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        const msg = violation(layer, spec);
        if (msg) problems.push(`${relative(root, file).split(sep).join('/')}: ${msg}`);
      }
    }
  }
  const corePkg = join(root, 'packages', 'core', 'package.json');
  if (existsSync(corePkg)) {
    const pkg = JSON.parse(readFileSync(corePkg, 'utf8'));
    for (const key of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      if (pkg[key] && Object.keys(pkg[key]).length > 0) {
        problems.push(`packages/core/package.json: core no puede tener ${key}`);
      }
    }
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const problems = check(root);
  if (problems.length > 0) {
    console.error('Violaciones de la regla de dependencias:');
    for (const p of problems) console.error(` - ${p}`);
    process.exit(1);
  }
  console.log('Regla de dependencias: sin violaciones.');
}
