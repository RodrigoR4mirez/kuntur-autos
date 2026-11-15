import { and, asc, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type {
  Listing,
  ListingId,
  ListingRepository,
  ListingStatus,
  ListingWithVehicle,
  PublishedListingsFilter,
  UserId,
  VehicleDetails,
} from '@kuntur/core';
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
    previousOwners: row.previousOwners,
    hasServiceHistory: row.hasServiceHistory,
    soatValid: row.soatValid,
    technicalReviewValid: row.technicalReviewValid,
    hasSpareKey: row.hasSpareKey,
    hasLiens: row.hasLiens,
    hasAccidents: row.hasAccidents,
    description: row.description,
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

  async findPublished(filter: PublishedListingsFilter): Promise<ListingWithVehicle[]> {
    const conditions: SQL[] = [eq(listings.status, 'published')];
    if (filter.brandId !== undefined) conditions.push(eq(vehicleDetails.brandId, filter.brandId));
    if (filter.maxPriceMinor !== undefined)
      conditions.push(lte(listings.priceMinor, filter.maxPriceMinor));
    if (filter.minYear !== undefined) conditions.push(gte(vehicleDetails.year, filter.minYear));
    if (filter.department !== undefined)
      conditions.push(eq(listings.department, filter.department));

    const rows = await this.db
      .select({ listing: listings, vehicle: vehicleDetails })
      .from(listings)
      .innerJoin(vehicleDetails, eq(vehicleDetails.listingId, listings.id))
      .where(and(...conditions))
      .orderBy(desc(listings.createdAt), asc(listings.id))
      .limit(filter.limit)
      .offset(filter.offset);
    return rows.map((r) => ({ listing: toListing(r.listing), vehicle: toVehicle(r.vehicle) }));
  }

  async findByOwner(ownerId: UserId): Promise<Listing[]> {
    const rows = await this.db
      .select()
      .from(listings)
      .where(eq(listings.ownerId, ownerId))
      .orderBy(desc(listings.createdAt), asc(listings.id));
    return rows.map(toListing);
  }

  async findByStatus(status: ListingStatus, limit: number): Promise<Listing[]> {
    const rows = await this.db
      .select()
      .from(listings)
      .where(eq(listings.status, status))
      .orderBy(asc(listings.createdAt), asc(listings.id))
      .limit(limit);
    return rows.map(toListing);
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
          previousOwners: vehicle.previousOwners,
          hasServiceHistory: vehicle.hasServiceHistory,
          soatValid: vehicle.soatValid,
          technicalReviewValid: vehicle.technicalReviewValid,
          hasSpareKey: vehicle.hasSpareKey,
          hasLiens: vehicle.hasLiens,
          hasAccidents: vehicle.hasAccidents,
          description: vehicle.description,
        };
        await tx
          .insert(vehicleDetails)
          .values(vehicleRow)
          .onConflictDoUpdate({ target: vehicleDetails.listingId, set: vehicleRow });
      }
    });
  }
}
