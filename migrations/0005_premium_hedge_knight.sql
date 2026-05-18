CREATE TYPE "public"."platform_fee_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contractor_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"service_request_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_fee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "platform_fee_type" NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "service_request_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_maturity_profiles" ALTER COLUMN "subscription_tier" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "conversation_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "category_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "platform_fee_id" uuid;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "platform_fee_type" "platform_fee_type";--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "platform_fee_value" integer;--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "platform_fee_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "service_requests" ADD COLUMN "vendor_earning" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contractor_id_users_id_fk" FOREIGN KEY ("contractor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_platform_fee_id_platform_fee_id_fk" FOREIGN KEY ("platform_fee_id") REFERENCES "public"."platform_fee"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "vendor_profiles" DROP COLUMN "categories";--> statement-breakpoint
DROP TYPE "public"."service_category";