// Política de seguridad de los flujos de GitHub Actions. Se ejecuta en `pnpm lint` y en CI.
// Reglas (ver docs/06-ci-cd.md):
//  1. Toda acción externa va fijada por SHA de commit completo, con su versión en un comentario.
//  2. Cada flujo declara `permissions` al nivel superior (mínimo privilegio).
//  3. Cada job tiene `timeout-minutes` (salvo los que llaman a otro flujo).
//  4. Ningún `run` usa expresiones `${{ }}`: se pasan por `env` para evitar inyección de comandos.
//  5. `actions/checkout` usa `persist-credentials: false`.
//  6. Se prohíbe `pull_request_target`.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const PINNED = /^[\w.-]+\/[\w.-]+(\/[\w./-]+)?@[0-9a-f]{40}$/;

export function checkWorkflow(file, text) {
  const problems = [];
  const add = (msg) => problems.push(`${file}: ${msg}`);

  // Regla 1 (por líneas, para poder leer el comentario de versión).
  text.split('\n').forEach((line, i) => {
    const m = line.match(/^\s*-?\s*uses:\s*(\S+)(.*)$/);
    if (!m) return;
    const [, ref, rest] = m;
    if (ref.startsWith('./')) return;
    if (!PINNED.test(ref)) add(`línea ${i + 1}: "${ref}" debe fijarse por SHA de 40 caracteres`);
    else if (!/#\s*v?\d/.test(rest))
      add(`línea ${i + 1}: "${ref}" necesita un comentario con su versión`);
  });

  let doc;
  try {
    doc = parse(text);
  } catch (error) {
    add(`YAML inválido: ${error.message}`);
    return problems;
  }

  const on = doc.on ?? doc[true];
  if (on && typeof on === 'object' && 'pull_request_target' in on)
    add('no se permite pull_request_target');
  if (!doc.permissions) add('falta `permissions` al nivel superior');

  for (const [jobName, job] of Object.entries(doc.jobs ?? {})) {
    if (!job.uses && job['timeout-minutes'] === undefined)
      add(`job "${jobName}" sin timeout-minutes`);
    for (const step of job.steps ?? []) {
      if (typeof step.run === 'string' && step.run.includes('${{')) {
        add(`job "${jobName}": un \`run\` usa \${{ }}; pásalo por env`);
      }
      if (
        step.uses?.startsWith('actions/checkout@') &&
        step.with?.['persist-credentials'] !== false
      ) {
        add(`job "${jobName}": actions/checkout sin persist-credentials: false`);
      }
    }
  }
  return problems;
}

export function checkAll(root) {
  const dirs = [join(root, '.github', 'workflows'), join(root, '.github', 'actions')];
  const files = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const walk = (d) => {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.ya?ml$/.test(entry.name)) files.push(full);
      }
    };
    walk(dir);
  }
  const problems = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const rel = file.slice(root.length);
    // Las acciones compuestas solo revisan la regla de fijado por SHA.
    const isWorkflow = rel.includes('/workflows/');
    const found = checkWorkflow(rel, text);
    problems.push(
      ...(isWorkflow ? found : found.filter((p) => p.includes('SHA') || p.includes('versión'))),
    );
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const problems = checkAll(root);
  if (problems.length > 0) {
    console.error('Política de flujos de GitHub Actions incumplida:');
    for (const p of problems) console.error(` - ${p}`);
    process.exit(1);
  }
  console.log('Flujos de GitHub Actions: cumplen la política.');
}
