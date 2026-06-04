CREATE TYPE "public"."supportStatus" AS ENUM('active', 'resolved');--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "support_status" "supportStatus";