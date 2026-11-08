import {
  bigint,
  boolean,
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

/**
 * Tablas de autenticación. Las gestiona Better Auth con estos nombres y columnas; una prueba del
 * adaptador de autenticación verifica que coinciden con lo que la librería espera.
 * `role` es un campo propio nuestro (ver módulo accounts).
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('buyer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_idx').on(t.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('account_user_idx').on(t.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);

/** Anuncio genérico. El dueño es un usuario de autenticación. */
export const listings = pgTable(
  'listings',
  {
    id: text('id').primaryKey(),
    vertical: text('vertical').notNull(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id),
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
