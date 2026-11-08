// Compuerta de promoción: decide si un commit ya pasó en staging y puede ir a producción.
// Uso: node scripts/promotion-gate.mjs <run.json> <jobs.json> <sha>
// run.json: respuesta de GET repos/{repo}/actions/runs/{id}
// jobs.json: respuesta de GET repos/{repo}/actions/runs/{id}/jobs
// Sale con código 1 y explica el motivo si el commit no está aprobado.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Nombres de los jobs que deben haber terminado en verde en el despliegue a staging. */
export const REQUIRED_JOBS = ['Construir y publicar la imagen', 'Desplegar a Azure Container Apps'];

export function checkStagingApproved(run, jobsResponse, sha) {
  if (!/^[0-9a-f]{40}$/.test(sha))
    return { ok: false, reason: 'El commit debe ser un SHA completo de 40 caracteres.' };
  if (run?.head_sha !== sha)
    return { ok: false, reason: 'La ejecución de staging no corresponde a este commit.' };
  if (run?.conclusion !== 'success')
    return {
      ok: false,
      reason: `La ejecución de staging terminó en "${run?.conclusion}", no en "success".`,
    };
  const jobs = jobsResponse?.jobs ?? [];
  for (const required of REQUIRED_JOBS) {
    const job = jobs.find((j) => typeof j.name === 'string' && j.name.includes(required));
    if (!job)
      return { ok: false, reason: `Falta el job "${required}" en la ejecución de staging.` };
    if (job.conclusion !== 'success')
      return { ok: false, reason: `El job "${required}" terminó en "${job.conclusion}".` };
  }
  return { ok: true, reason: 'Staging aprobó este commit.' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [runPath, jobsPath, sha] = process.argv.slice(2);
  if (!runPath || !jobsPath || !sha) {
    console.error('Uso: node scripts/promotion-gate.mjs <run.json> <jobs.json> <sha>');
    process.exit(2);
  }
  const result = checkStagingApproved(
    JSON.parse(readFileSync(runPath, 'utf8')),
    JSON.parse(readFileSync(jobsPath, 'utf8')),
    sha,
  );
  if (!result.ok) {
    console.error(`::error::${result.reason}`);
    process.exit(1);
  }
  console.log(result.reason);
}
