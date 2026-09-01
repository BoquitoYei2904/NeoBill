ALTER TYPE "public"."profile_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TABLE "licitation_items" ADD COLUMN "description" text NOT NULL;