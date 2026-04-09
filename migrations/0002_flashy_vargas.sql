CREATE TYPE "public"."business_type" AS ENUM('commercial', 'government', 'both');--> statement-breakpoint
CREATE TABLE "vendor_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text,
	"total_records" integer DEFAULT 0,
	"processed_records" integer DEFAULT 0,
	"success_records" integer DEFAULT 0,
	"failed_records" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"progress" integer DEFAULT 0,
	"errors" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "gaps" jsonb;--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "escrows" ADD COLUMN "charge_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "plan_name" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "interval" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "amount" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean;--> statement-breakpoint
ALTER TABLE "user_maturity_profiles" ADD COLUMN "gaps" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_type" "business_type" DEFAULT 'commercial';--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "stripe_charges_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "stripe_payouts_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "stripe_details_submitted" boolean DEFAULT false;