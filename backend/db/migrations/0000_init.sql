CREATE TYPE "public"."category" AS ENUM('Music', 'Arts', 'Food & Markets', 'Talks', 'Sport', 'Community', 'Nightlife', 'Family');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('pending', 'published', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"category" "category" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"venue_id" uuid NOT NULL,
	"price_kes" integer,
	"organiser" text NOT NULL,
	"link" text NOT NULL,
	"image_url" text,
	"status" "event_status" DEFAULT 'published' NOT NULL,
	"submission_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(80) NOT NULL,
	"category" "category" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"venue_name" text NOT NULL,
	"neighbourhood" text NOT NULL,
	"address" text NOT NULL,
	"price_kes" integer,
	"description" varchar(1000) NOT NULL,
	"link" text NOT NULL,
	"contact" text NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"event_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"neighbourhood" text NOT NULL,
	"address" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_updated_at" ON "events" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "events_ends_at" ON "events" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "submissions_status_created" ON "submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_name_neighbourhood" ON "venues" USING btree ("name","neighbourhood");--> statement-breakpoint
CREATE INDEX "venues_updated_at" ON "venues" USING btree ("updated_at");