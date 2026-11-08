import { buildApp } from './app.ts';
import { createUseCases } from './composition-root.ts';

const port = Number(process.env['PORT'] ?? 3000);
const isProduction = process.env['NODE_ENV'] === 'production';

const useCases = await createUseCases({ seedDemoData: !isProduction });
const app = buildApp(useCases, { logger: { level: 'info' } });

await app.listen({ port, host: '0.0.0.0' });
