import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const brands = pgTable('brands', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const models = pgTable(
  'models',
  {
    id: integer('id').primaryKey(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id),
    name: text('name').notNull(),
  },
  (t) => [index('models_brand_idx').on(t.brandId)],
);

export const bodyTypes = pgTable('body_types', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const colors = pgTable('colors', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  hex: text('hex').notNull(),
});

/** Anuncio genérico. El dueño se enlaza a `users` cuando exista la autenticación. */
export const listings = pgTable(
  'listings',
  {
    id: text('id').primaryKey(),
    vertical: text('vertical').notNull(),
    ownerId: text('owner_id').notNull(),
    status: text('status').notNull(),
    title: text('title').notNull(),
    priceMinor: bigint('price_minor', { mode: 'number' }).notNull(),
    currency: text('currency').notNull(),
    department: text('department').notNull(),
    city: text('city').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    check('listings_vertical_check', sql`${t.vertical} in ('vehicle', 'property')`),
    check(
      'listings_status_check',
      sql`${t.status} in ('draft','pending_review','published','reserved','sold','rejected','archived')`,
    ),
    check('listings_currency_check', sql`${t.currency} in ('PEN', 'USD')`),
    check('listings_price_check', sql`${t.priceMinor} > 0`),
    // Índice parcial: la búsqueda pública solo mira anuncios publicados.
    index('listings_published_idx')
      .on(t.department, t.priceMinor)
      .where(sql`${t.status} = 'published'`),
    index('listings_owner_idx').on(t.ownerId),
  ],
);

/** Extensión de listings para la vertical 'vehicle'. Catálogo cerrado con claves foráneas. */
export const vehicleDetails = pgTable(
  'vehicle_details',
  {
    listingId: text('listing_id')
      .primaryKey()
      .references(() => listings.id, { onDelete: 'cascade' }),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    versionId: integer('version_id'),
    bodyTypeId: integer('body_type_id')
      .notNull()
      .references(() => bodyTypes.id),
    colorId: integer('color_id')
      .notNull()
      .references(() => colors.id),
    year: smallint('year').notNull(),
    mileageKm: integer('mileage_km').notNull(),
    transmission: text('transmission').notNull(),
    fuel: text('fuel').notNull(),
    plate: text('plate').notNull(),
  },
  (t) => [
    check('vehicle_transmission_check', sql`${t.transmission} in ('manual', 'automatic')`),
    check(
      'vehicle_fuel_check',
      sql`${t.fuel} in ('gasoline','diesel','lpg','gnv','hybrid','electric')`,
    ),
    check('vehicle_mileage_check', sql`${t.mileageKm} >= 0`),
    // Coincide con el filtro más común: marca + modelo + año.
    index('vehicle_search_idx').on(t.brandId, t.modelId, t.year),
    index('vehicle_body_type_idx').on(t.bodyTypeId),
    index('vehicle_plate_idx').on(t.plate),
  ],
);
