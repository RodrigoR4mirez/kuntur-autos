import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDraftListing,
  determineAccessLevel,
  getCatalogOptions,
  getListingView,
  listBrands,
  listModelsOfBrand,
  submitListingForReview,
  type AppointmentId,
  type ListingId,
  type UserId,
} from '@kuntur/core';
import {
  FixedClock,
  InMemoryAppointmentRepository,
  InMemoryCatalogRepository,
  InMemoryListingRepository,
  NOW,
  OWNER,
  SequentialIds,
  StaticTokenSessionResolver,
  STRANGER,
  makeListing,
  makeVehicle,
} from '@kuntur/core/in-memory';
import { buildApp } from './app.ts';

const BUYER = 'user-buyer' as UserId;
const auth = (token: string) => ({ authorization: `Bearer ${token}` });

let listings: InMemoryListingRepository;
let appointments: InMemoryAppointmentRepository;
let app: ReturnType<typeof buildApp>;

const validBody = {
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

beforeEach(async () => {
  listings = new InMemoryListingRepository();
  appointments = new InMemoryAppointmentRepository();
  await listings.save(makeListing(), makeVehicle());

  const catalog = new InMemoryCatalogRepository();
  const sessions = new StaticTokenSessionResolver({
    'token-owner': { userId: OWNER, role: 'seller' },
    'token-buyer': { userId: BUYER, role: 'buyer' },
    'token-stranger': { userId: STRANGER, role: 'buyer' },
  });

  app = buildApp({
    resolveSession: (token) => sessions.resolve(token),
    determineAccessLevel: determineAccessLevel({ appointments }),
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
});

describe('health', () => {
  it('answers ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /listings/:id', () => {
  it('returns only the public basics to an anonymous visitor', async () => {
    const res = await app.inject({ method: 'GET', url: '/listings/listing-1' });
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body).toMatchObject({ id: 'listing-1', access: 'anonymous', year: 2019 });
    expect(body).not.toHaveProperty('transmission');
    expect(body).not.toHaveProperty('plate');
  });

  it('adds the full spec for a signed-in user, still without the plate', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/listings/listing-1',
      headers: auth('token-buyer'),
    });
    expect(res.json()).toMatchObject({ access: 'registered', transmission: 'automatic' });
    expect(res.json()).not.toHaveProperty('plate');
  });

  it('shows the plate only to the buyer whose deposit is paid for that listing', async () => {
    await appointments.save({
      id: 'appt-1' as AppointmentId,
      listingId: 'listing-1' as ListingId,
      buyerId: BUYER,
      advisorId: null,
      scheduledAt: null,
      status: 'scheduled',
    });

    const paid = await app.inject({
      method: 'GET',
      url: '/listings/listing-1',
      headers: auth('token-buyer'),
    });
    const other = await app.inject({
      method: 'GET',
      url: '/listings/listing-1',
      headers: auth('token-stranger'),
    });

    expect(paid.json()).toMatchObject({ access: 'deposit_paid', plate: 'KNT482' });
    expect(other.json()).not.toHaveProperty('plate');
  });

  it('treats an unknown or malformed token as anonymous, not as an error', async () => {
    for (const authorization of ['Bearer nope', 'Basic abc', 'garbage']) {
      const res = await app.inject({
        method: 'GET',
        url: '/listings/listing-1',
        headers: { authorization },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ access: 'anonymous' });
    }
  });

  it('never leaks the owner', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/listings/listing-1',
      headers: auth('token-buyer'),
    });
    expect(res.body).not.toContain(OWNER);
    expect(res.json()).not.toHaveProperty('ownerId');
  });

  it('answers 404 with a stable error code for unknown listings', async () => {
    const res = await app.inject({ method: 'GET', url: '/listings/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: 'listing_not_found' } });
  });

  it('hides listings that are not published', async () => {
    await listings.save(makeListing({ status: 'draft' }), makeVehicle());
    const res = await app.inject({ method: 'GET', url: '/listings/listing-1' });
    expect(res.statusCode).toBe(404);
  });

  it('rejects an absurdly long id with 400', async () => {
    const res = await app.inject({ method: 'GET', url: `/listings/${'x'.repeat(65)}` });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: { code: 'invalid_request' } });
  });
});

describe('POST /listings', () => {
  it('requires a session', async () => {
    const res = await app.inject({ method: 'POST', url: '/listings', payload: validBody });
    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
    expect(res.json()).toMatchObject({ error: { code: 'unauthorized' } });
  });

  it('creates a draft owned by the person in the session and normalizes the plate', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/listings',
      headers: auth('token-owner'),
      payload: validBody,
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toEqual({ id: 'new-1', status: 'draft' });
    expect(await listings.findById('new-1' as ListingId)).toMatchObject({
      ownerId: OWNER,
      status: 'draft',
    });
    expect(await listings.findVehicleDetails('new-1' as ListingId)).toMatchObject({
      plate: 'KNT482',
    });
  });

  it('refuses to let the body choose the owner or the status (mass assignment)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/listings',
      headers: auth('token-buyer'),
      payload: { ...validBody, ownerId: OWNER, status: 'published' },
    });

    expect(res.statusCode).toBe(400);
    expect(await listings.findById('new-1' as ListingId)).toBeNull();
  });

  it('answers 400 and names the bad field when the shape is wrong', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/listings',
      headers: auth('token-owner'),
      payload: { ...validBody, vehicle: { ...validBody.vehicle, mileageKm: -5 } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.message).toContain('vehicle.mileageKm');
  });

  it.each([
    ['invalid_title', { title: 'Kia' }],
    ['invalid_price', { price: { amountMinor: 0, currency: 'PEN' } }],
    ['invalid_year', { vehicle: { ...validBody.vehicle, year: 1900 } }],
  ])('answers 422 with %s for a business rule violation', async (code, change) => {
    const res = await app.inject({
      method: 'POST',
      url: '/listings',
      headers: auth('token-owner'),
      payload: { ...validBody, ...change },
    });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ error: { code } });
  });
});

describe('POST /listings/:id/submit', () => {
  beforeEach(async () => {
    await listings.save(makeListing({ id: 'draft-1' as ListingId, status: 'draft' }));
  });

  it('requires a session', async () => {
    const res = await app.inject({ method: 'POST', url: '/listings/draft-1/submit' });
    expect(res.statusCode).toBe(401);
  });

  it('lets the owner send the draft to review', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/listings/draft-1/submit',
      headers: auth('token-owner'),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ id: 'draft-1', status: 'pending_review' });
  });

  it('answers 403 to anyone else and leaves the listing untouched', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/listings/draft-1/submit',
      headers: auth('token-stranger'),
    });
    expect(res.statusCode).toBe(403);
    expect((await listings.findById('draft-1' as ListingId))?.status).toBe('draft');
  });

  it('answers 404 for an unknown listing and 409 when it was already submitted', async () => {
    const missing = await app.inject({
      method: 'POST',
      url: '/listings/nope/submit',
      headers: auth('token-owner'),
    });
    expect(missing.statusCode).toBe(404);

    await app.inject({
      method: 'POST',
      url: '/listings/draft-1/submit',
      headers: auth('token-owner'),
    });
    const twice = await app.inject({
      method: 'POST',
      url: '/listings/draft-1/submit',
      headers: auth('token-owner'),
    });
    expect(twice.statusCode).toBe(409);
  });
});

describe('unknown routes', () => {
  it('answer 404 with the same error shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: 'not_found' } });
  });
});

describe('catalog', () => {
  it('lists brands', async () => {
    const res = await app.inject({ method: 'GET', url: '/catalog/brands' });
    expect(res.statusCode).toBe(200);
    expect(res.json().brands.map((b: { name: string }) => b.name)).toEqual([
      'Toyota',
      'Kia',
      'Hyundai',
    ]);
  });

  it('lists the models of one brand', async () => {
    const res = await app.inject({ method: 'GET', url: '/catalog/brands/2/models' });
    expect(res.json().models).toEqual([{ id: 20, brandId: 2, name: 'Rio' }]);
  });

  it('answers 404 for an unknown brand and 400 for a malformed id', async () => {
    expect(
      (await app.inject({ method: 'GET', url: '/catalog/brands/999/models' })).statusCode,
    ).toBe(404);
    expect(
      (await app.inject({ method: 'GET', url: '/catalog/brands/abc/models' })).statusCode,
    ).toBe(400);
    expect((await app.inject({ method: 'GET', url: '/catalog/brands/-1/models' })).statusCode).toBe(
      400,
    );
  });

  it('returns body types and colors', async () => {
    const res = await app.inject({ method: 'GET', url: '/catalog/options' });
    expect(res.json()).toMatchObject({ bodyTypes: expect.any(Array), colors: expect.any(Array) });
  });
});

describe('login test page (temporal, solo con la opción activa)', () => {
  it('is absent by default', async () => {
    const res = await app.inject({ method: 'GET', url: '/login-test' });
    expect(res.statusCode).toBe(404);
  });

  it('serves a page that starts the sign-in from the browser when enabled', async () => {
    const catalog = new InMemoryCatalogRepository();
    const enabled = buildApp({
      resolveSession: async () => null,
      determineAccessLevel: determineAccessLevel({ appointments }),
      createDraftListing: createDraftListing({
        listings,
        ids: new SequentialIds('x'),
        clock: new FixedClock(NOW),
      }),
      submitListingForReview: submitListingForReview({ listings }),
      getListingView: getListingView({ listings }),
      listBrands: listBrands({ catalog }),
      listModelsOfBrand: listModelsOfBrand({ catalog }),
      getCatalogOptions: getCatalogOptions({ catalog }),
      loginTestPage: true,
    });
    const res = await enabled.inject({ method: 'GET', url: '/login-test' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.body).toContain('/auth/sign-in/social');
    expect(res.body).not.toMatch(/secret/i);
  });
});
