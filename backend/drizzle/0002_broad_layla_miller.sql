CREATE TYPE "public"."profile_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "discounts" ADD COLUMN "status" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "status" "profile_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "taxes" ADD COLUMN "status" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "types_client" ADD COLUMN "status" boolean DEFAULT true NOT NULL;