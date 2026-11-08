CREATE TABLE "body_types" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "body_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "colors" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hex" text NOT NULL,
	CONSTRAINT "colors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"vertical" text NOT NULL,
	"owner_id" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"price_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"department" text NOT NULL,
	"city" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "listings_vertical_check" CHECK ("listings"."vertical" in ('vehicle', 'property')),
	CONSTRAINT "listings_status_check" CHECK ("listings"."status" in ('draft','pending_review','published','reserved','sold','rejected','archived')),
	CONSTRAINT "listings_currency_check" CHECK ("listings"."currency" in ('PEN', 'USD')),
	CONSTRAINT "listings_price_check" CHECK ("listings"."price_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" integer PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_details" (
	"listing_id" text PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"model_id" integer NOT NULL,
	"version_id" integer,
	"body_type_id" integer NOT NULL,
	"color_id" integer NOT NULL,
	"year" smallint NOT NULL,
	"mileage_km" integer NOT NULL,
	"transmission" text NOT NULL,
	"fuel" text NOT NULL,
	"plate" text NOT NULL,
	CONSTRAINT "vehicle_transmission_check" CHECK ("vehicle_details"."transmission" in ('manual', 'automatic')),
	CONSTRAINT "vehicle_fuel_check" CHECK ("vehicle_details"."fuel" in ('gasoline','diesel','lpg','gnv','hybrid','electric')),
	CONSTRAINT "vehicle_mileage_check" CHECK ("vehicle_details"."mileage_km" >= 0)
);
--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_body_type_id_body_types_id_fk" FOREIGN KEY ("body_type_id") REFERENCES "public"."body_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_color_id_colors_id_fk" FOREIGN KEY ("color_id") REFERENCES "public"."colors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listings_published_idx" ON "listings" USING btree ("department","price_minor") WHERE "listings"."status" = 'published';--> statement-breakpoint
CREATE INDEX "listings_owner_idx" ON "listings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "models_brand_idx" ON "models" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "vehicle_search_idx" ON "vehicle_details" USING btree ("brand_id","model_id","year");--> statement-breakpoint
CREATE INDEX "vehicle_body_type_idx" ON "vehicle_details" USING btree ("body_type_id");--> statement-breakpoint
CREATE INDEX "vehicle_plate_idx" ON "vehicle_details" USING btree ("plate");