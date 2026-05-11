CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key" text,
	"description" text,
	"key_deliverables" text[],
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_related_request_id_service_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_related_message_id_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "user_maturity_profiles" ALTER COLUMN "subscription_tier" SET DEFAULT 'beta';--> statement-breakpoint
ALTER TABLE "vendor_profiles" ALTER COLUMN "subscription_tier" SET DEFAULT 'beta';--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "category_ids" uuid[];--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_request_id_service_requests_id_fk" FOREIGN KEY ("related_request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_message_id_messages_id_fk" FOREIGN KEY ("related_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public"."user_maturity_profiles" ALTER COLUMN "subscription_tier" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."vendor_profiles" ALTER COLUMN "subscription_tier" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."subscription_tier";--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('beta', 'pilot');--> statement-breakpoint
ALTER TABLE "public"."user_maturity_profiles" ALTER COLUMN "subscription_tier" SET DATA TYPE "public"."subscription_tier" USING "subscription_tier"::"public"."subscription_tier";--> statement-breakpoint
ALTER TABLE "public"."vendor_profiles" ALTER COLUMN "subscription_tier" SET DATA TYPE "public"."subscription_tier" USING "subscription_tier"::"public"."subscription_tier";