CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vendor_profiles" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ALTER COLUMN "availability" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ALTER COLUMN "availability" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "years_of_experience" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "agencies_served" text[];--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;