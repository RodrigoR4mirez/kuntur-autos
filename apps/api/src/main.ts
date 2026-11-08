import { buildApp } from './app.ts';
import { createWiring } from './composition-root.ts';

const port = Number(process.env['PORT'] ?? 3000);
const isProduction = process.env['NODE_ENV'] === 'production';

const wiring = await createWiring({ databaseUrl: process.env['DATABASE_URL'], isProduction });
const app = buildApp(wiring.useCases, { logger: { level: 'info' } });

// Cierre ordenado: el orquestador envía SIGTERM al reemplazar una versión.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    app
      .close()
      .then(() => wiring.close())
      .finally(() => process.exit(0));
  });
}

await app.listen({ port, host: '0.0.0.0' });
