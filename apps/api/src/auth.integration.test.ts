import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { describe, expect, it } from 'vitest';
import { BetterAuthSessionResolver, createAuth, createAuthHandler } from '@kuntur/adapter-auth';
import {
  insertCatalog,
  MIGRATIONS_FOLDER,
  PostgresCatalogRepository,
  PostgresListingRepository,
  schema,
} from '@kuntur/adapter-db-postgres';
import {
  createDraftListing,
  determineAccessLevel,
  getCatalogOptions,
  getListingView,
  listBrands,
  listModelsOfBrand,
  submitListingForReview,
  type Notification,
  type Notifier,
} from '@kuntur/core';
import {
  InMemoryAppointmentRepository,
  SAMPLE_CATALOG,
  FixedClock,
  NOW,
  SequentialIds,
} from '@kuntur/core/in-memory';
import { buildApp } from './app.ts';

const BASE = 'http://localhost:3000';
const PASSWORD = 'una-clave-larga-123';

/** Better Auth real + PostgreSQL real (PGlite) + la API real, sin servicios externos. */
async function setup(options: { mailer: boolean }) {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await insertCatalog(db, SAMPLE_CATALOG);

  const sent: Notification[] = [];
  const mailer: Notifier = {
    send: (notification) => {
      sent.push(notification);
      return Promise.resolve();
    },
  };

  const auth = createAuth({
    db,
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
    secret: 'x'.repeat(40),
    baseUrl: BASE,
    trustedOrigins: [],
    mailer: options.mailer ? mailer : null,
    google: null,
  });

  const listings = new PostgresListingRepository(db);
  const catalog = new PostgresCatalogRepository(db);
  const sessions = new BetterAuthSessionResolver(auth);

  const app = buildApp({
    resolveSession: (token) => sessions.resolve(token),
    auth: { handler: createAuthHandler(auth), baseUrl: BASE },
    determineAccessLevel: determineAccessLevel({
      appointments: new InMemoryAppointmentRepository(),
    }),
    createDraftListing: createDraftListing({
      listings,
      ids: new SequentialIds('new'),
      clock: new FixedClock(NOW),
    }),
    submitListingForReview: submitListingForReview({ listings }),
    getListingView: getListingView({ listings }),
    listBrands: listBrands({ catalog }),
    listModelsOfBrand: listModelsOfBrand({ catalog }),
    getCatalogOptions: getCatalogOptions({ catalog }),
  });

  const post = (url: string, payload: unknown, headers: Record<string, string> = {}) =>
    app.inject({
      method: 'POST',
      url,
      payload: payload as object,
      headers: { origin: BASE, ...headers },
    });

  /** Registra, verifica el correo con el enlace que recibió y devuelve el token Bearer de una sesión nueva. */
  async function registerVerifyAndSignIn(email: string, extra: object = {}) {
    const signUp = await post('/auth/sign-up/email', {
      email,
      password: PASSWORD,
      name: 'Ana',
      ...extra,
    });
    expect(signUp.statusCode).toBe(200);

    const mail = sent.find((n) => n.to === email && n.template === 'verify-email');
    expect(mail, 'debe llegar el correo de verificación').toBeDefined();
    const link = new URL(mail?.data['url'] ?? '');
    const verify = await app.inject({ method: 'GET', url: link.pathname + link.search });
    expect(verify.statusCode).toBeLessThan(400);

    const signIn = await post('/auth/sign-in/email', { email, password: PASSWORD });
    expect(signIn.statusCode).toBe(200);
    const token = signIn.headers['set-auth-token'];
    expect(typeof token).toBe('string');
    return String(token);
  }

  return { app, db, sent, post, registerVerifyAndSignIn };
}

const listingBody = {
  title: 'Toyota Yaris 2019 en excelente estado',
  price: { amountMinor: 4_890_000, currency: 'PEN' },
  department: 'Lima',
  city: 'Miraflores',
  vehicle: {
    brandId: 1,
    modelId: 10,
    versionId: null,
    bodyTypeId: 2,
    colorId: 3,
    year: 2019,
    mileageKm: 54_000,
    transmission: 'automatic',
    fuel: 'gasoline',
    plate: 'knt-482',
  },
};

describe('inicio de sesión por correo (Better Auth + PostgreSQL + API)', () => {
  it('registra, exige verificar el correo, inicia sesión y publica con el token', async () => {
    const { app, post, sent, registerVerifyAndSignIn } = await setup({ mailer: true });

    // Sin verificar el correo no se puede iniciar sesión.
    await post('/auth/sign-up/email', {
      email: 'ana@example.com',
      password: PASSWORD,
      name: 'Ana',
    });
    expect(sent).toHaveLength(1);
    const early = await post('/auth/sign-in/email', {
      email: 'ana@example.com',
      password: PASSWORD,
    });
    expect(early.statusCode).toBe(403);
    expect(early.headers['set-auth-token']).toBeUndefined();

    // Con el correo verificado, sí.
    const token = await registerVerifyAndSignIn('bea@example.com');

    // El token abre rutas protegidas y el dueño del anuncio es esa persona.
    const created = await app.inject({
      method: 'POST',
      url: '/listings',
      headers: { authorization: `Bearer ${token}` },
      payload: listingBody,
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ status: 'draft' });
  });

  it('rechaza contraseña incorrecta y tokens inventados', async () => {
    const { app, post, registerVerifyAndSignIn } = await setup({ mailer: true });
    await registerVerifyAndSignIn('ana@example.com');

    const wrong = await post('/auth/sign-in/email', {
      email: 'ana@example.com',
      password: 'otra-clave-123',
    });
    expect(wrong.statusCode).toBe(401);

    for (const authorization of ['Bearer inventado', 'Bearer a.b.c']) {
      const res = await app.inject({
        method: 'POST',
        url: '/listings',
        headers: { authorization },
        payload: listingBody,
      });
      expect(res.statusCode).toBe(401);
    }
  });

  it('no deja elegir el rol al registrarse', async () => {
    const { app, registerVerifyAndSignIn, db } = await setup({ mailer: true });
    const token = await registerVerifyAndSignIn('ana@example.com', { role: 'admin' });

    const rows = await db.select({ role: schema.user.role }).from(schema.user);
    expect(rows).toEqual([{ role: 'buyer' }]);
    // y la sesión sigue funcionando como comprador
    const res = await app.inject({
      method: 'GET',
      url: '/listings/nope',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });

  it('exige contraseñas largas', async () => {
    const { post } = await setup({ mailer: true });
    const res = await post('/auth/sign-up/email', {
      email: 'ana@example.com',
      password: 'corta',
      name: 'Ana',
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('sin proveedor de correo el registro por correo queda desactivado', async () => {
    const { post, db } = await setup({ mailer: false });
    const res = await post('/auth/sign-up/email', {
      email: 'ana@example.com',
      password: PASSWORD,
      name: 'Ana',
    });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(await db.select().from(schema.user)).toHaveLength(0);
  });

  it('las rutas /auth responden aunque no haya sesión', async () => {
    const { app } = await setup({ mailer: true });
    const res = await app.inject({ method: 'GET', url: '/auth/get-session' });
    expect(res.statusCode).toBe(200);
  });
});
