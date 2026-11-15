import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingId, ListingRepository } from '@kuntur/core';
// Datos de ejemplo del núcleo: las filas de catálogo que usan estas fixtures deben existir en el adaptador.
import { NOW, OWNER, STRANGER, makeListing, makeVehicle } from '@kuntur/core/in-memory';

/**
 * Cualquier implementación de ListingRepository debe pasar esta suite.
 * `create` devuelve un repositorio vacío, con los usuarios OWNER y STRANGER ya creados si hace falta, con el catálogo de SAMPLE_CATALOG ya cargado si hace falta.
 */
export function listingRepositoryContract(
  name: string,
  create: () => Promise<ListingRepository>,
): void {
  describe(`ListingRepository contract: ${name}`, () => {
    let repo: ListingRepository;
    const id = 'listing-1' as ListingId;

    beforeEach(async () => {
      repo = await create();
    });

    it('returns null for unknown listings and vehicles', async () => {
      expect(await repo.findById(id)).toBeNull();
      expect(await repo.findVehicleDetails(id)).toBeNull();
    });

    it('round-trips a listing with its vehicle, including dates and money', async () => {
      await repo.save(makeListing(), makeVehicle());

      expect(await repo.findById(id)).toEqual(makeListing());
      expect(await repo.findVehicleDetails(id)).toEqual(makeVehicle());
    });

    it('keeps the createdAt instant exactly', async () => {
      await repo.save(makeListing({ createdAt: NOW }), makeVehicle());
      expect((await repo.findById(id))?.createdAt.toISOString()).toBe(NOW.toISOString());
    });

    it('updates an existing listing instead of duplicating it', async () => {
      await repo.save(makeListing({ status: 'draft' }), makeVehicle());
      await repo.save(makeListing({ status: 'pending_review' }));

      expect((await repo.findById(id))?.status).toBe('pending_review');
    });

    it('does not drop the vehicle when a listing is saved without one', async () => {
      await repo.save(makeListing(), makeVehicle());
      await repo.save(makeListing({ title: 'Título nuevo del anuncio' }));

      expect(await repo.findVehicleDetails(id)).toEqual(makeVehicle());
    });

    it('stores a vehicle without a version', async () => {
      await repo.save(makeListing(), makeVehicle({ versionId: null }));
      expect((await repo.findVehicleDetails(id))?.versionId).toBeNull();
    });

    describe('queries', () => {
      const id2 = 'listing-2' as ListingId;
      const id3 = 'listing-3' as ListingId;
      const older = new Date('2026-10-01T00:00:00Z');

      it('findPublished returns only published listings with their vehicle', async () => {
        await repo.save(makeListing({ status: 'published' }), makeVehicle());
        await repo.save(
          makeListing({ id: id2, status: 'pending_review' }),
          makeVehicle({ listingId: id2 }),
        );

        const rows = await repo.findPublished({ limit: 10, offset: 0 });
        expect(rows.map((r) => r.listing.id)).toEqual([id]);
        expect(rows[0]?.vehicle).toEqual(makeVehicle());
      });

      it('findPublished filters by brand, max price and minimum year', async () => {
        await repo.save(makeListing(), makeVehicle({ brandId: 1, year: 2019 }));
        await repo.save(
          makeListing({ id: id2, price: { amountMinor: 1_000_000, currency: 'PEN' } }),
          makeVehicle({ listingId: id2, brandId: 2, year: 2012 }),
        );
        const ids = async (f: Partial<Parameters<ListingRepository['findPublished']>[0]>) =>
          (await repo.findPublished({ limit: 10, offset: 0, ...f }))
            .map((r) => r.listing.id)
            .sort();

        expect(await ids({ brandId: 2 })).toEqual([id2]);
        expect(await ids({ maxPriceMinor: 2_000_000 })).toEqual([id2]);
        expect(await ids({ minYear: 2015 })).toEqual([id]);
        expect(await ids({})).toEqual([id, id2]);
      });

      it('findPublished orders newest first and paginates', async () => {
        await repo.save(makeListing({ createdAt: older }), makeVehicle());
        await repo.save(makeListing({ id: id2, createdAt: NOW }), makeVehicle({ listingId: id2 }));
        await repo.save(
          makeListing({ id: id3, createdAt: new Date('2026-10-15T00:00:00Z') }),
          makeVehicle({ listingId: id3 }),
        );

        const all = await repo.findPublished({ limit: 10, offset: 0 });
        expect(all.map((r) => r.listing.id)).toEqual([id2, id3, id]);
        const page = await repo.findPublished({ limit: 1, offset: 1 });
        expect(page.map((r) => r.listing.id)).toEqual([id3]);
      });

      it('findByOwner returns every status for that owner only, newest first', async () => {
        await repo.save(makeListing({ status: 'draft', createdAt: older }), makeVehicle());
        await repo.save(
          makeListing({ id: id2, status: 'published' }),
          makeVehicle({ listingId: id2 }),
        );
        await repo.save(
          makeListing({ id: id3, ownerId: STRANGER }),
          makeVehicle({ listingId: id3 }),
        );

        const mine = await repo.findByOwner(OWNER);
        expect(mine.map((l) => l.id)).toEqual([id2, id]);
      });

      it('findByStatus returns the oldest first and respects the limit', async () => {
        await repo.save(makeListing({ status: 'pending_review', createdAt: NOW }), makeVehicle());
        await repo.save(
          makeListing({ id: id2, status: 'pending_review', createdAt: older }),
          makeVehicle({ listingId: id2 }),
        );
        await repo.save(makeListing({ id: id3, status: 'draft' }), makeVehicle({ listingId: id3 }));

        expect((await repo.findByStatus('pending_review', 10)).map((l) => l.id)).toEqual([id2, id]);
        expect(await repo.findByStatus('pending_review', 1)).toHaveLength(1);
      });
    });
  });
}
