import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { checkWorkflow } from './check-workflows.mjs';

const SHA = '3d3c42e5aac5ba805825da76410c181273ba90b1';

const good = `
name: x
on: [push]
permissions:
  contents: read
jobs:
  a:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@${SHA} # v7.0.1
        with:
          persist-credentials: false
      - run: echo hola
        env:
          X: \${{ github.sha }}
`;

describe('checkWorkflow', () => {
  it('accepts a compliant workflow', () => {
    expect(checkWorkflow('ok.yml', good)).toEqual([]);
  });

  it('rejects actions pinned by tag instead of SHA', () => {
    const bad = good.replace(`@${SHA} # v7.0.1`, '@v4');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/fijarse por SHA/);
  });

  it('requires the version comment next to the SHA', () => {
    const bad = good.replace(' # v7.0.1', '');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/comentario con su versión/);
  });

  it('requires top-level permissions', () => {
    const bad = good.replace('permissions:\n  contents: read\n', '');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/falta `permissions`/);
  });

  it('requires a timeout on every job that runs steps', () => {
    const bad = good.replace('    timeout-minutes: 5\n', '');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/sin timeout-minutes/);
  });

  it('forbids expressions inside run scripts (command injection)', () => {
    const bad = good.replace('echo hola', 'echo ${{ github.head_ref }}');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/pásalo por env/);
  });

  it('requires persist-credentials: false on checkout', () => {
    const bad = good.replace('        with:\n          persist-credentials: false\n', '');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/persist-credentials/);
  });

  it('forbids pull_request_target', () => {
    const bad = good.replace('on: [push]', 'on:\n  pull_request_target:');
    expect(checkWorkflow('bad.yml', bad).join('\n')).toMatch(/pull_request_target/);
  });

  it('lets reusable-workflow calls skip the timeout', () => {
    const reuse = `
name: y
on: [push]
permissions:
  contents: read
jobs:
  call:
    uses: ./.github/workflows/ci.yml
`;
    expect(checkWorkflow('reuse.yml', reuse)).toEqual([]);
  });
});
