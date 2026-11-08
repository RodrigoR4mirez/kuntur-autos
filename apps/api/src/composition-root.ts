import {
  createDraftListing,
  determineAccessLevel,
  getCatalogOptions,
  getListingView,
  listBrands,
  listModelsOfBrand,
  money,
  submitListingForReview,
  type CatalogRepository,
  type ListingId,
  type ListingRepository,
  type SessionResolver,
  type UserId,
} from '@kuntur/core';
import {
  InMemoryAppointmentRepository,
  InMemoryCatalogRepository,
  InMemoryListingRepository,
  StaticTokenSessionResolver,
} from '@kuntur/core/in-memory';
import { NullSessionResolver, SystemClock, UuidIdGenerator } from '@kuntur/adapter-system';
import {
  connectPostgres,
  PostgresCatalogRepository,
  PostgresListingRepository,
} from '@kuntur/adapter-db-postgres';
import type { UseCases } from './app.ts';

export interface Wiring {
  readonly useCases: UseCases;
  /** Libera conexiones al apagar el proceso. */
  close(): Promise<void>;
}

export interface WiringOptions {
  /** Si viene, se usa PostgreSQL. Si no, repositorios en memoria (solo desarrollo y pruebas). */
  readonly databaseUrl: string | undefined;
  readonly isProduction: boolean;
}

/**
 * Único lugar que conoce los adaptadores concretos. Cambiar la base de datos o cualquier
 * proveedor significa cambiar este archivo, no el negocio ni los controladores.
 */
export async function createWiring(options: WiringOptions): Promise<Wiring> {
  let listings: ListingRepository;
  let catalog: CatalogRepository;
  let close = async () => {};
  // Aún no existe el repositorio de citas en PostgreSQL (llega con el depósito, Fase 2). Mientras
  // no se puedan crear citas, un repositorio vacío da el resultado correcto: nadie tiene depósito pagado.
  const appointments = new InMemoryAppointmentRepository();
  const sessions = createSessionResolver(options.isProduction);

  if (options.databaseUrl) {
    const connection = connectPostgres(options.databaseUrl);
    listings = new PostgresListingRepository(connection.db);
    catalog = new PostgresCatalogRepository(connection.db);
    close = () => connection.close();
  } else if (options.isProduction) {
    throw new Error('DATABASE_URL es obligatoria en producción.');
  } else {
    const memory = new InMemoryListingRepository();
    await seedDemoListing(memory);
    listings = memory;
    catalog = new InMemoryCatalogRepository();
  }

  return {
    close,
    useCases: {
      resolveSession: (token) => sessions.resolve(token),
      determineAccessLevel: determineAccessLevel({ appointments }),
      createDraftListing: createDraftListing({
        listings,
        ids: new UuidIdGenerator(),
        clock: new SystemClock(),
      }),
      submitListingForReview: submitListingForReview({ listings }),
      getListingView: getListingView({ listings }),
      listBrands: listBrands({ catalog }),
      listModelsOfBrand: listModelsOfBrand({ catalog }),
      getCatalogOptions: getCatalogOptions({ catalog }),
    },
  };
}

/**
 * Producción: sin proveedor de autenticación real todavía, nadie tiene sesión (todos anónimos).
 * Desarrollo: tokens fijos para probar las rutas protegidas con curl. Nunca llegan a producción.
 */
function createSessionResolver(isProduction: boolean): SessionResolver {
  if (isProduction) return new NullSessionResolver();
  return new StaticTokenSessionResolver({
    'dev-seller': { userId: 'demo-owner' as UserId, role: 'seller' },
    'dev-buyer': { userId: 'demo-buyer' as UserId, role: 'buyer' },
  });
}

async function seedDemoListing(listings: ListingRepository): Promise<void> {
  const id = 'demo-1' as ListingId;
  await listings.save(
    {
      id,
      vertical: 'vehicle',
      ownerId: 'demo-owner' as UserId,
      status: 'published',
      title: 'Toyota Yaris 2019 en excelente estado',
      price: money(4_890_000, 'PEN'),
      department: 'Lima',
      city: 'Miraflores',
      createdAt: new Date('2026-11-01T12:00:00Z'),
    },
    {
      listingId: id,
      brandId: 1,
      modelId: 10,
      versionId: 100,
      bodyTypeId: 2,
      colorId: 3,
      year: 2019,
      mileageKm: 54_000,
      transmission: 'automatic',
      fuel: 'gasoline',
      plate: 'KNT482',
    },
  );
}
