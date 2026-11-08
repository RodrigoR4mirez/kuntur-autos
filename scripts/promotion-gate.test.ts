import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { checkStagingApproved } from './promotion-gate.mjs';

const SHA = 'a'.repeat(40);
const run = { head_sha: SHA, conclusion: 'success' };
const jobs = (overrides: Record<string, string> = {}) => ({
  jobs: [
    { name: 'CI / Validar (tipos, formato, dependencias, pruebas)', conclusion: 'success' },
    { name: 'Construir y publicar la imagen', conclusion: overrides.build ?? 'success' },
    {
      name: 'deploy / Desplegar a Azure Container Apps',
      conclusion: overrides.deploy ?? 'success',
    },
  ],
});

describe('checkStagingApproved', () => {
  it('approves a commit whose staging run and deploy job succeeded', () => {
    expect(checkStagingApproved(run, jobs(), SHA).ok).toBe(true);
  });

  it('refuses a SHA that is not a full 40-character hex string', () => {
    expect(checkStagingApproved(run, jobs(), 'abc123').ok).toBe(false);
    expect(checkStagingApproved(run, jobs(), 'A'.repeat(40)).ok).toBe(false);
  });

  it('refuses a run for another commit', () => {
    expect(checkStagingApproved({ ...run, head_sha: 'b'.repeat(40) }, jobs(), SHA).ok).toBe(false);
  });

  it('refuses a failed staging run', () => {
    expect(checkStagingApproved({ ...run, conclusion: 'failure' }, jobs(), SHA).reason).toMatch(
      /failure/,
    );
  });

  it('refuses when the deploy job was skipped (staging not configured)', () => {
    const result = checkStagingApproved(run, jobs({ deploy: 'skipped' }), SHA);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/skipped/);
  });

  it('refuses when a required job is missing', () => {
    expect(checkStagingApproved(run, { jobs: [] }, SHA).ok).toBe(false);
  });
});
