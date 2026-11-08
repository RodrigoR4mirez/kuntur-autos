import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import {
  bicepParams,
  dockerCopiedPackages,
  envNamesUsed,
  passedParams,
  reachableWorkspaceDirs,
} from './check-delivery.mjs';

function fixtureRepo(
  pkgs: Record<string, { name: string; dependencies?: Record<string, string> }>,
): string {
  const root = mkdtempSync(join(tmpdir(), 'delivery-'));
  for (const [rel, pkg] of Object.entries(pkgs)) {
    mkdirSync(join(root, rel), { recursive: true });
    writeFileSync(join(root, rel, 'package.json'), JSON.stringify(pkg));
  }
  return root;
}

describe('reachableWorkspaceDirs', () => {
  it('follows workspace dependencies transitively and ignores packages the API does not need', () => {
    const root = fixtureRepo({
      'apps/api': {
        name: '@kuntur/api',
        dependencies: { '@kuntur/core': 'workspace:*', '@kuntur/adapter-auth': 'workspace:*' },
      },
      'packages/adapters/auth': {
        name: '@kuntur/adapter-auth',
        dependencies: { '@kuntur/adapter-db-postgres': 'workspace:*' },
      },
      'packages/adapters/db-postgres': {
        name: '@kuntur/adapter-db-postgres',
        dependencies: { '@kuntur/core': 'workspace:*' },
      },
      'packages/core': { name: '@kuntur/core' },
      'packages/contract-tests': { name: '@kuntur/contract-tests' },
    });
    const readJson = (abs: string) => JSON.parse(readFileSync(abs, 'utf8'));
    expect(reachableWorkspaceDirs(root, 'apps/api', readJson)).toEqual([
      'apps/api',
      'packages/adapters/auth',
      'packages/adapters/db-postgres',
      'packages/core',
    ]);
  });
});

describe('check-delivery helpers', () => {
  it('reads the packages copied by the Dockerfile', () => {
    expect(
      dockerCopiedPackages(
        'COPY packages/core/package.json packages/core/\nCOPY apps/api/package.json apps/api/\n',
      ),
    ).toEqual(new Set(['packages/core', 'apps/api']));
  });

  it('ignores GitHub built-in secrets when listing what must be documented', () => {
    const { vars, secrets } = envNamesUsed(
      'client-id: ${{ vars.AZURE_CLIENT_ID }}\nDB: ${{ secrets.DATABASE_URL }}\nTok: ${{ secrets.GITHUB_TOKEN }}\n',
    );
    expect([...vars]).toEqual(['AZURE_CLIENT_ID']);
    expect([...secrets]).toEqual(['DATABASE_URL']);
  });

  it('reads Bicep parameters and the ones passed by the infra workflow', () => {
    expect(bicepParams('param image string\n@secure()\nparam databaseUrl string\n')).toEqual(
      new Set(['image', 'databaseUrl']),
    );
    const wf =
      'run: |\n  az deployment group create --parameters image="$IMAGE" databaseUrl="$DATABASE_URL" \\\n  authSecret="$AUTH_SECRET" --query x\n';
    expect(passedParams(wf)).toEqual(new Set(['image', 'databaseUrl', 'authSecret']));
  });
});
