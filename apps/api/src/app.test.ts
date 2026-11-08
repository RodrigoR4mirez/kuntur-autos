import { beforeEach, describe, expect, it } from 'vitest';
import { getListingView } from '@kuntur/core';
import { InMemoryListingRepository, makeListing, makeVehicle, OWNER } from '@kuntur/core/in-memory';
import { buildApp } from './app.ts';

let listings: InMemoryListingRepository;
let app: ReturnType<typeof buildApp>;

beforeEach(async () => {
  listings = new InMemoryListingRepository();
  await listings.save(makeListing(), makeVehicle());
  app = buildApp({ getListingView: getListingView({ listings }) });
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

  it('never leaks the owner', async () => {
    const res = await app.inject({ method: 'GET', url: '/listings/listing-1' });
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

describe('unknown routes', () => {
  it('answer 404 with the same error shape', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: 'not_found' } });
  });
});
