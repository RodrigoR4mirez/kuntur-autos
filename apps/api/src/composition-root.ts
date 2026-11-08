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
import { BetterAuthSessionResolver, createAuth, createAuthHandler } from '@kuntur/adapter-auth';
import {
  ConsoleNotifier,
  createSmtpTransport,
  SmtpEmailNotifier,
} from '@kuntur/adapter-notifications';
import { NullSessionResolver, SystemClock, UuidIdGenerator } from '@kuntur/adapter-system';
import {
  connectPostgres,
  PostgresCatalogRepository,
  PostgresListingRepository,
  schema,
} from '@kuntur/adapter-db-postgres';
import type { Config } from './config.ts';
import type { UseCases } from './app.ts';

export interface Wiring {
  readonly useCases: UseCases;
  /** Libera conexiones al apagar el proceso. */
  close(): Promise<void>;
}

/** Si hay `databaseUrl` se usa PostgreSQL; si no, repositorios en memoria (solo desarrollo y pruebas). */
export type WiringOptions = Pick<Config, 'databaseUrl' | 'isProduction' | 'auth'> & {
  readonly port?: number;
};

/**
 * Único lugar que conoce los adaptadores concretos. Cambiar la base de datos o cualquier
 * proveedor significa cambiar este archivo, no el negocio ni los controladores.
 */
export async function createWiring(options: WiringOptions): Promise<Wiring> {
  let listings: ListingRepository;
  let catalog: CatalogRepository;
  let close = async () => {};
  let authentication: Authentication | null = null;
  // Aún no existe el repositorio de citas en PostgreSQL (llega con el depósito, Fase 2). Mientras
  // no se puedan crear citas, un repositorio vacío da el resultado correcto: nadie tiene depósito pagado.
  const appointments = new InMemoryAppointmentRepository();

  if (options.databaseUrl) {
    const connection = connectPostgres(options.databaseUrl);
    listings = new PostgresListingRepository(connection.db);
    catalog = new PostgresCatalogRepository(connection.db);
    close = () => connection.close();
    authentication = createAuthentication(options, connection.db);
  } else if (options.isProduction) {
    throw new Error('DATABASE_URL es obligatoria en producción.');
  } else {
    const memory = new InMemoryListingRepository();
    await seedDemoListing(memory);
    listings = memory;
    catalog = new InMemoryCatalogRepository();
  }
  const sessions = authentication?.sessions ?? createFallbackSessions(options.isProduction);

  return {
    close,
    useCases: {
      resolveSession: (token) => sessions.resolve(token),
      ...(authentication ? { auth: authentication.routes } : {}),
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

interface Authentication {
  readonly sessions: SessionResolver;
  readonly routes: {
    readonly handler: (request: Request) => Promise<Response>;
    readonly baseUrl: string;
  };
}

/**
 * Better Auth sobre la misma base de datos. Solo se activa con AUTH_SECRET:
 *  - correo: SMTP si está configurado; en desarrollo se imprime el enlace en el registro;
 *    en producción sin SMTP el registro por correo queda desactivado (no se aceptan cuentas sin verificar);
 *  - Google: solo con GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.
 */
function createAuthentication(
  options: WiringOptions,
  db: Parameters<typeof createAuth>[0]['db'],
): Authentication | null {
  const { auth: config, isProduction } = options;
  if (!config.secret) return null;

  const baseUrl =
    config.baseUrl ?? (isProduction ? undefined : `http://localhost:${options.port ?? 3000}`);
  if (!baseUrl)
    throw new Error('AUTH_BASE_URL es obligatoria en producción cuando hay AUTH_SECRET.');

  const mailer = config.smtp
    ? new SmtpEmailNotifier(createSmtpTransport(config.smtp.url), config.smtp.from)
    : isProduction
      ? null
      : new ConsoleNotifier();

  const auth = createAuth({
    db,
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
    secret: config.secret,
    baseUrl,
    trustedOrigins: config.trustedOrigins,
    mailer,
    google: config.google,
  });

  return {
    sessions: new BetterAuthSessionResolver(auth),
    routes: { handler: createAuthHandler(auth), baseUrl },
  };
}

/**
 * Sin AUTH_SECRET no hay proveedor de autenticación.
 * Producción: nadie tiene sesión (todos anónimos), con un aviso. Es el valor seguro: no sube privilegios.
 * Desarrollo: tokens fijos para probar las rutas protegidas con curl. Nunca llegan a producción.
 */
function createFallbackSessions(isProduction: boolean): SessionResolver {
  if (isProduction) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        msg: 'AUTH_SECRET no está configurado: el inicio de sesión está desactivado y todos son anónimos.',
      }),
    );
    return new NullSessionResolver();
  }
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
