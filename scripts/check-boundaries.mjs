// Verifica la regla de dependencias de docs/01-arquitectura.md:
//   apps -> adapters -> contracts -> core, y core no importa nada externo.
// Sin dependencias. Los archivos *.test.ts quedan fuera: pueden importar vitest.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, join, posix, relative, sep } from 'node:path';
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

function locate(path) {
  const m = path.match(/^modules\/([^/]+)\/?(domain|application)?/);
  if (m) return { area: 'module', name: m[1], layer: m[2] };
  if (path.startsWith('shared/')) return { area: 'shared' };
  return { area: 'other' };
}

/**
 * Reglas internas del núcleo. `file` es la ruta POSIX relativa a packages/core/src.
 *  - Solo rutas relativas (nada externo).
 *  - `shared` no depende de módulos.
 *  - Un módulo solo usa a otro por su `index.ts`.
 *  - `domain` no depende de `application`.
 */
export function coreViolation(file, spec) {
  if (!isRelative(spec)) return `core solo puede importar rutas relativas, no "${spec}"`;
  const target = posix.normalize(posix.join(posix.dirname(file), spec));
  const from = locate(file);
  const to = locate(target);
  if (from.area === 'shared' && to.area === 'module') {
    return `shared no puede depender de módulos ("${spec}")`;
  }
  const crossesModule = to.area === 'module' && !(from.area === 'module' && from.name === to.name);
  if (crossesModule && !/^modules\/[^/]+(\/index(\.ts)?)?$/.test(target)) {
    return `el módulo "${to.name}" se importa solo por su index.ts, no por "${spec}"`;
  }
  if (
    from.area === 'module' &&
    from.layer === 'domain' &&
    to.area === 'module' &&
    to.name === from.name &&
    to.layer === 'application'
  ) {
    return `domain no puede depender de application ("${spec}")`;
  }
  return null;
}

/** Reglas de las demás capas: devuelve un mensaje si el import está prohibido, o null. */
export function violation(layer, spec, file = '') {
  if (isRelative(spec)) return null;
  if (layer === 'contracts' && spec.startsWith('@kuntur/') && spec !== '@kuntur/core') {
    return `contracts solo puede depender de @kuntur/core, no de "${spec}"`;
  }
  if (layer === 'adapters' && /^@kuntur\/(api|web|mobile)/.test(spec)) {
    return `los adaptadores no pueden depender de apps ("${spec}")`;
  }
  const isAdapterImport = spec.startsWith('@kuntur/adapter') || spec === '@kuntur/core/in-memory';
  if (isAdapterImport && layer !== 'apps') {
    return `solo las apps pueden depender de adaptadores ("${spec}")`;
  }
  if (isAdapterImport && layer === 'apps' && basename(file) !== 'composition-root.ts') {
    return `solo composition-root.ts puede importar adaptadores ("${spec}")`;
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
      const rel = relative(root, file).split(sep).join('/');
      const inCore = relative(join(root, 'packages', 'core', 'src'), file)
        .split(sep)
        .join('/');
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        const msg = layer === 'core' ? coreViolation(inCore, spec) : violation(layer, spec, file);
        if (msg) problems.push(`${rel}: ${msg}`);
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
