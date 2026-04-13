ALTER TYPE "public"."service_category" ADD VALUE 'insurance';--> statement-breakpoint
ALTER TABLE "request_logs" DROP CONSTRAINT "request_logs_service_request_id_service_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "service_requests" DROP CONSTRAINT "service_requests_vendor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_vendor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_profiles" DROP CONSTRAINT "vendor_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "request_logs" ALTER COLUMN "service_request_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "vendor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;