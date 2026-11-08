import { buildApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createWiring } from './composition-root.ts';

const config = loadConfig(process.env);

const wiring = await createWiring(config);
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

await app.listen({ port: config.port, host: '0.0.0.0' });
