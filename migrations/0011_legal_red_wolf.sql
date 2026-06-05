ALTER TABLE "support_messages" ALTER COLUMN "support_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "support_messages" ALTER COLUMN "support_status" DROP NOT NULL;