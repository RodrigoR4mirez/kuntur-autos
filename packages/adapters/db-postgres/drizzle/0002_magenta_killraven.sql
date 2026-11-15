ALTER TABLE "vehicle_details" ADD COLUMN "previous_owners" smallint;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "has_service_history" boolean;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "soat_valid" boolean;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "technical_review_valid" boolean;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "has_spare_key" boolean;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "has_liens" boolean;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "has_accidents" boolean;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_owners_check" CHECK ("vehicle_details"."previous_owners" is null or ("vehicle_details"."previous_owners" >= 0 and "vehicle_details"."previous_owners" <= 20));