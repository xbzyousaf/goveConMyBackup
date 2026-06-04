CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open',
	"is_read_by_admin" boolean DEFAULT false,
	"is_read_by_user" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "support_messages" DROP CONSTRAINT "support_messages_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "ticket_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "sender_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "support_messages" ADD COLUMN "is_read" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "address_line_1" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "address_line_2" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "support_messages" DROP COLUMN "parent_id";--> statement-breakpoint
ALTER TABLE "support_messages" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "support_messages" DROP COLUMN "support_status";--> statement-breakpoint
ALTER TABLE "support_messages" DROP COLUMN "updated_at";