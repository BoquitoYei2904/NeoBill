ALTER TABLE "audit_log" ALTER COLUMN "record_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "record_uuid" uuid;