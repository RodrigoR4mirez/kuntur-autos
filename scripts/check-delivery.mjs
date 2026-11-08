// Verifica que la entrega continua sea coherente. Se ejecuta en `pnpm lint` y en CI.
// Detecta los fallos que ya nos costaron tiempo:
//  1. El Dockerfile copia todos los paquetes que necesita apps/api (si falta uno, la imagen no arranca).
//  2. Toda variable o secreto que usan los flujos está documentada en docs/06-ci-cd.md.
//  3. Cada parámetro que el flujo de infraestructura pasa a Bicep existe en infra/azure/main.bicep.
//  4. El flujo de infraestructura no usa una etiqueta móvil por defecto (no cambia la versión sin querer).
//  5. El despliegue usa el entorno `staging` (el subject de la credencial de Azure depende de él).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

/** Paquetes del workspace alcanzables desde `start` por dependencias `workspace:*` de producción. */
export function reachableWorkspaceDirs(root, start, readJson) {
  const seen = new Set();
  const byName = new Map();
  for (const dir of ['apps', 'packages', 'packages/adapters']) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    for (const entry of readdirSync(full, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = posix.join(dir, entry.name);
      const pkgPath = join(root, rel, 'package.json');
      if (existsSync(pkgPath)) byName.set(readJson(pkgPath).name, rel);
    }
  }
  const visit = (rel) => {
    if (seen.has(rel)) return;
    seen.add(rel);
    const pkg = readJson(join(root, rel, 'package.json'));
    for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
      if (String(range).startsWith('workspace:') && byName.has(name)) visit(byName.get(name));
    }
  };
  visit(start);
  return [...seen].sort();
}

export function dockerCopiedPackages(dockerfileText) {
  return new Set([...dockerfileText.matchAll(/^COPY\s+(\S+)\/package\.json\s/gm)].map((m) => m[1]));
}

/** Secretos que GitHub crea solos en cada ejecución: no hay que configurarlos ni documentarlos. */
const BUILT_IN = new Set(['GITHUB_TOKEN']);

export function envNamesUsed(text) {
  return {
    vars: new Set([...text.matchAll(/vars\.([A-Z][A-Z0-9_]*)/g)].map((m) => m[1])),
    secrets: new Set(
      [...text.matchAll(/secrets\.([A-Z][A-Z0-9_]*)/g)]
        .map((m) => m[1])
        .filter((n) => !BUILT_IN.has(n)),
    ),
  };
}

export function bicepParams(bicepText) {
  return new Set([...bicepText.matchAll(/^param\s+(\w+)/gm)].map((m) => m[1]));
}

/** Nombres pasados con `nombre=` dentro de los `--parameters` del flujo de infraestructura. */
export function passedParams(workflowText) {
  const block = workflowText.split('--parameters')[1] ?? '';
  return new Set([...block.matchAll(/(\w+)="\$/g)].map((m) => m[1]));
}

export function checkDelivery(root) {
  const problems = [];
  const add = (msg) => problems.push(msg);
  const read = (rel) => readFileSync(join(root, rel), 'utf8');
  const readJson = (abs) => JSON.parse(readFileSync(abs, 'utf8'));

  // 1. Dockerfile
  const dockerfile = read('apps/api/Dockerfile');
  const needed = reachableWorkspaceDirs(root, 'apps/api', readJson).filter((d) => d !== 'apps/api');
  const copied = dockerCopiedPackages(dockerfile);
  for (const dir of needed) {
    if (!copied.has(dir))
      add(`apps/api/Dockerfile no copia ${dir}/package.json (la imagen no arrancará)`);
  }

  // 2. Documentación de variables y secretos
  const docs = read('docs/06-ci-cd.md');
  const workflowDir = join(root, '.github', 'workflows');
  for (const file of readdirSync(workflowDir).filter((f) => f.endsWith('.yml'))) {
    const text = read(join('.github', 'workflows', file));
    const { vars, secrets } = envNamesUsed(text);
    for (const name of [...vars, ...secrets]) {
      if (!docs.includes(name))
        add(`${file} usa ${name} y no está documentado en docs/06-ci-cd.md`);
    }
  }

  // 3. Parámetros de Bicep
  const infra = read('.github/workflows/infra-azure.yml');
  const params = bicepParams(read('infra/azure/main.bicep'));
  for (const name of passedParams(infra)) {
    if (!params.has(name)) add(`infra-azure.yml pasa "${name}" a Bicep y main.bicep no lo declara`);
  }

  // 4. Sin etiqueta móvil por defecto en el flujo de infraestructura
  const parsedInfra = parse(infra);
  const onDispatch = parsedInfra.on ?? parsedInfra[true];
  const defaultImage = onDispatch?.workflow_dispatch?.inputs?.image?.default ?? '';
  if (defaultImage !== '') {
    add(
      'infra-azure.yml tiene una imagen por defecto: usaría una etiqueta móvil y podría cambiar la versión sin querer',
    );
  }

  // 5. Entornos: cada despliegue corre en su propio entorno de GitHub, usa la acción compartida
  //    y pasa el secreto DATABASE_URL de ese entorno (no desde un flujo reutilizable).
  const callers = {
    'deploy-staging.yml': { env: 'staging', rg: 'rg-kuntur-staging', app: 'kuntur-api-staging' },
    'deploy-production.yml': {
      env: 'production',
      rg: 'rg-kuntur-production',
      app: 'kuntur-api-production',
    },
  };
  for (const [file, want] of Object.entries(callers)) {
    const job = parse(read(join('.github', 'workflows', file))).jobs?.deploy;
    const envName = typeof job?.environment === 'object' ? job.environment.name : job?.environment;
    if (envName !== want.env) add(`${file}: el job deploy debe declarar el entorno "${want.env}"`);
    const step = (job?.steps ?? []).find((st) => st.uses === './.github/actions/deploy-app');
    if (!step) add(`${file}: el job deploy debe usar la acción ./.github/actions/deploy-app`);
    const w = step?.with ?? {};
    if (w.resource_group !== want.rg || w.app_name !== want.app)
      add(`${file}: grupo o app inesperados para ${want.env}`);
    if (w.database_url !== '${{ secrets.DATABASE_URL }}')
      add(`${file}: database_url debe venir de secrets.DATABASE_URL del entorno`);
  }
  if (!existsSync(join(root, '.github', 'actions', 'deploy-app', 'action.yml'))) {
    add('falta la acción .github/actions/deploy-app/action.yml');
  }
  const infraDoc = parse(read('.github/workflows/infra-azure.yml'));
  const infraEnv = infraDoc.on?.workflow_dispatch?.inputs?.environment;
  if (infraEnv?.default !== 'staging')
    add('infra-azure.yml: el entorno por defecto debe ser staging');
  const dbDoc = parse(read('.github/workflows/db-migrate.yml'));
  const dbEnv = (dbDoc.on ?? dbDoc[true])?.workflow_dispatch?.inputs?.environment;
  if (dbEnv?.default !== 'staging') add('db-migrate.yml: el entorno por defecto debe ser staging');

  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const problems = checkDelivery(root);
  if (problems.length > 0) {
    console.error('Entrega continua: incoherencias encontradas:');
    for (const p of problems) console.error(` - ${p}`);
    process.exit(1);
  }
  console.log('Entrega continua: coherente (Dockerfile, documentación, Bicep, versión y entorno).');
}
