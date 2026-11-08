// Uso (lee DATABASE_URL):
//   node packages/adapters/db-postgres/src/cli.ts migrate [--seed]   aplica migraciones y, si se pide, el catálogo
//   node packages/adapters/db-postgres/src/cli.ts check              comprueba la conexión y cuenta datos
// `migrate` se ejecuta en el despliegue antes de arrancar la nueva versión de la API.
import { count } from 'drizzle-orm';
import { connectPostgres } from './connect.ts';
import { runMigrations } from './migrations.ts';
import { brands, listings, models } from './schema.ts';
import { seedCatalog } from './seed-catalog.ts';

const [command, ...flags] = process.argv.slice(2);
const url = process.env['DATABASE_URL'];

if ((command !== 'migrate' && command !== 'check') || !url) {
  console.error('Uso: DATABASE_URL=... node cli.ts migrate [--seed] | check');
  process.exit(2);
}

const connection = connectPostgres(url);
try {
  if (command === 'migrate') {
    await runMigrations(connection.db);
    console.log('Migraciones aplicadas.');
    if (flags.includes('--seed')) {
      await seedCatalog(connection.db);
      console.log('Catálogo inicial cargado.');
    }
  } else {
    // Una consulta tras otra: es un chequeo puntual y así funciona con cualquier límite de conexiones.
    const brandRows = await connection.db.select({ n: count() }).from(brands);
    const modelRows = await connection.db.select({ n: count() }).from(models);
    const listingRows = await connection.db.select({ n: count() }).from(listings);
    // Nunca se imprime la dirección de conexión: solo lo que encontramos en la base.
    console.log(
      `Conexión correcta. Marcas: ${brandRows[0]?.n ?? 0}. Modelos: ${modelRows[0]?.n ?? 0}. Anuncios: ${listingRows[0]?.n ?? 0}.`,
    );
  }
} finally {
  await connection.close();
}
