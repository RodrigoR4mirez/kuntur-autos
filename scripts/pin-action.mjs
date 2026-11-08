// Uso: node scripts/pin-action.mjs actions/checkout [github/codeql-action ...]
// Imprime la última versión estable de cada acción con su SHA de commit, lista para pegar en un flujo:
//   uses: actions/checkout@<sha> # v7.0.1
// Lee los tags del repositorio público con `git ls-remote`; no necesita token.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function isNewer(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function latestStable(lsRemoteOutput) {
  const tags = new Map();
  for (const line of lsRemoteOutput.split('\n')) {
    const [sha, ref] = line.split('\t');
    if (!sha || !ref?.startsWith('refs/tags/')) continue;
    const deref = ref.endsWith('^{}');
    const name = ref.slice('refs/tags/'.length).replace(/\^\{\}$/, '');
    const m = name.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
    if (!m) continue;
    const entry = tags.get(name) ?? { key: m.slice(1).map(Number), sha };
    // Un tag anotado trae dos líneas: la del objeto tag y la del commit (^{}). Vale la del commit.
    if (deref) entry.sha = sha;
    tags.set(name, entry);
  }
  let best = null;
  for (const [name, entry] of tags) {
    if (!best || isNewer(entry.key, best.key)) best = { name, ...entry };
  }
  return best;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repos = process.argv.slice(2);
  if (repos.length === 0) {
    console.error('Uso: node scripts/pin-action.mjs owner/repo [owner/repo ...]');
    process.exit(2);
  }
  for (const repo of repos) {
    const out = execFileSync('git', ['ls-remote', '--tags', `https://github.com/${repo}`], {
      encoding: 'utf8',
    });
    const best = latestStable(out);
    console.log(best ? `uses: ${repo}@${best.sha} # ${best.name}` : `${repo}: sin tags estables`);
  }
}
