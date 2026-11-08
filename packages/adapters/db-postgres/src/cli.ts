// Uso: node packages/adapters/db-postgres/src/cli.ts migrate [--seed]
// Lee DATABASE_URL. Se ejecuta en el despliegue antes de arrancar la nueva versión de la API.
import { connectPostgres } from './connect.ts';
import { runMigrations } from './migrations.ts';
import { seedCatalog } from './seed-catalog.ts';

const [command, ...flags] = process.argv.slice(2);
const url = process.env['DATABASE_URL'];

if (command !== 'migrate' || !url) {
  console.error('Uso: DATABASE_URL=... node cli.ts migrate [--seed]');
  process.exit(2);
}

const connection = connectPostgres(url);
try {
  await runMigrations(connection.db);
  console.log('Migraciones aplicadas.');
  if (flags.includes('--seed')) {
    await seedCatalog(connection.db);
    console.log('Catálogo inicial cargado.');
  }
} finally {
  await connection.close();
}
