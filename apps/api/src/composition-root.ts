import { getListingView, type ListingId, type UserId, money } from '@kuntur/core';
import { InMemoryListingRepository } from '@kuntur/core/in-memory';
import type { UseCases } from './app.ts';

/**
 * Único lugar que conoce los adaptadores concretos. Cambiar la base de datos o cualquier
 * proveedor significa cambiar este archivo, no el negocio ni los controladores.
 * Hoy usa repositorios en memoria; la Fase 1 los reemplaza por el adaptador de PostgreSQL.
 */
export async function createUseCases(options: { seedDemoData: boolean }): Promise<UseCases> {
  const listings = new InMemoryListingRepository();

  if (options.seedDemoData) {
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

  return { getListingView: getListingView({ listings }) };
}
