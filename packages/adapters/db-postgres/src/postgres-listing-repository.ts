import { eq } from 'drizzle-orm';
import type { Listing, ListingId, ListingRepository, UserId, VehicleDetails } from '@kuntur/core';
import type { Db } from './db.ts';
import { listings, vehicleDetails } from './schema.ts';

type ListingRow = typeof listings.$inferSelect;
type VehicleRow = typeof vehicleDetails.$inferSelect;

function toListing(row: ListingRow): Listing {
  return {
    id: row.id as ListingId,
    vertical: row.vertical as Listing['vertical'],
    ownerId: row.ownerId as UserId,
    status: row.status as Listing['status'],
    title: row.title,
    price: { amountMinor: row.priceMinor, currency: row.currency as Listing['price']['currency'] },
    department: row.department,
    city: row.city,
    createdAt: row.createdAt,
  };
}

function toVehicle(row: VehicleRow): VehicleDetails {
  return {
    listingId: row.listingId as ListingId,
    brandId: row.brandId,
    modelId: row.modelId,
    versionId: row.versionId,
    bodyTypeId: row.bodyTypeId,
    colorId: row.colorId,
    year: row.year,
    mileageKm: row.mileageKm,
    transmission: row.transmission as VehicleDetails['transmission'],
    fuel: row.fuel as VehicleDetails['fuel'],
    plate: row.plate,
  };
}

export class PostgresListingRepository implements ListingRepository {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async findById(id: ListingId): Promise<Listing | null> {
    const [row] = await this.db.select().from(listings).where(eq(listings.id, id)).limit(1);
    return row ? toListing(row) : null;
  }

  async findVehicleDetails(id: ListingId): Promise<VehicleDetails | null> {
    const [row] = await this.db
      .select()
      .from(vehicleDetails)
      .where(eq(vehicleDetails.listingId, id))
      .limit(1);
    return row ? toVehicle(row) : null;
  }

  async save(listing: Listing, vehicle?: VehicleDetails): Promise<void> {
    const listingRow = {
      id: listing.id,
      vertical: listing.vertical,
      ownerId: listing.ownerId,
      status: listing.status,
      title: listing.title,
      priceMinor: listing.price.amountMinor,
      currency: listing.price.currency,
      department: listing.department,
      city: listing.city,
      createdAt: listing.createdAt,
    };

    await this.db.transaction(async (tx) => {
      await tx
        .insert(listings)
        .values(listingRow)
        .onConflictDoUpdate({ target: listings.id, set: listingRow });

      if (vehicle) {
        const vehicleRow = {
          listingId: vehicle.listingId,
          brandId: vehicle.brandId,
          modelId: vehicle.modelId,
          versionId: vehicle.versionId,
          bodyTypeId: vehicle.bodyTypeId,
          colorId: vehicle.colorId,
          year: vehicle.year,
          mileageKm: vehicle.mileageKm,
          transmission: vehicle.transmission,
          fuel: vehicle.fuel,
          plate: vehicle.plate,
        };
        await tx
          .insert(vehicleDetails)
          .values(vehicleRow)
          .onConflictDoUpdate({ target: vehicleDetails.listingId, set: vehicleRow });
      }
    });
  }
}
