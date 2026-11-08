import { beforeEach, describe, expect, it } from 'vitest';
import type { ListingId, ListingRepository } from '@kuntur/core';
// Datos de ejemplo del núcleo: las filas de catálogo que usan estas fixtures deben existir en el adaptador.
import { NOW, makeListing, makeVehicle } from '@kuntur/core/in-memory';

/**
 * Cualquier implementación de ListingRepository debe pasar esta suite.
 * `create` devuelve un repositorio vacío, con el catálogo de SAMPLE_CATALOG ya cargado si hace falta.
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
  });
}
