CREATE TYPE "chart_kind" AS ENUM('track', 'album');--> statement-breakpoint
CREATE TYPE "chart_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "movement" AS ENUM('new', 're-entry', 'up', 'down', 'same');--> statement-breakpoint
CREATE TYPE "period_type" AS ENUM('week', 'year');--> statement-breakpoint
CREATE TABLE "album" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"title" text NOT NULL,
	"parent_album_id" uuid
);
--> statement-breakpoint
CREATE TABLE "album_artist" (
	"album_id" uuid,
	"artist_id" uuid,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "album_artist_pkey" PRIMARY KEY("album_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "album_track" (
	"album_id" uuid,
	"track_id" uuid,
	"track_number" integer,
	CONSTRAINT "album_track_pkey" PRIMARY KEY("album_id","track_number")
);
--> statement-breakpoint
CREATE TABLE "artist" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chart" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "chart_kind" NOT NULL,
	"period_type" "period_type" NOT NULL,
	"period_start" date NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "chart_user_id_kind_period_type_period_start_unique" UNIQUE("user_id","kind","period_type","period_start"),
	CONSTRAINT "chart_year_starts_jan1" CHECK ("period_type" <> 'year' OR EXTRACT(DOY FROM "period_start") = 1)
);
--> statement-breakpoint
CREATE TABLE "chart_entry" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chart_id" uuid NOT NULL,
	"track_id" uuid,
	"album_id" uuid,
	"position" integer NOT NULL,
	"points" numeric NOT NULL,
	"previous_pos" integer,
	"peak_pos" integer,
	"periods_on_chart" integer,
	"movement" "movement",
	CONSTRAINT "chart_entry_chart_id_position_unique" UNIQUE("chart_id","position"),
	CONSTRAINT "chart_entry_position_positive" CHECK ("position" > 0),
	CONSTRAINT "chart_entry_track_xor_album" CHECK (("track_id" IS NULL) <> ("album_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "track" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"title" text NOT NULL,
	"release_date" date
);
--> statement-breakpoint
CREATE TABLE "track_artist" (
	"track_id" uuid,
	"artist_id" uuid,
	"role" text DEFAULT 'primary',
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "track_artist_pkey" PRIMARY KEY("track_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "album_artist_artist_id_index" ON "album_artist" ("artist_id");--> statement-breakpoint
CREATE INDEX "album_track_track_id_index" ON "album_track" ("track_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chart_entry_chart_id_track_id_index" ON "chart_entry" ("chart_id","track_id") WHERE "track_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "chart_entry_chart_id_album_id_index" ON "chart_entry" ("chart_id","album_id") WHERE "album_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "chart_entry_track_id_index" ON "chart_entry" ("track_id") WHERE "track_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "chart_entry_album_id_index" ON "chart_entry" ("album_id") WHERE "album_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "track_artist_artist_id_index" ON "track_artist" ("artist_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_parent_album_id_album_id_fkey" FOREIGN KEY ("parent_album_id") REFERENCES "album"("id");--> statement-breakpoint
ALTER TABLE "album_artist" ADD CONSTRAINT "album_artist_album_id_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id");--> statement-breakpoint
ALTER TABLE "album_artist" ADD CONSTRAINT "album_artist_artist_id_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id");--> statement-breakpoint
ALTER TABLE "album_track" ADD CONSTRAINT "album_track_album_id_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id");--> statement-breakpoint
ALTER TABLE "album_track" ADD CONSTRAINT "album_track_track_id_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "track"("id");--> statement-breakpoint
ALTER TABLE "chart" ADD CONSTRAINT "chart_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chart_entry" ADD CONSTRAINT "chart_entry_chart_id_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "chart"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chart_entry" ADD CONSTRAINT "chart_entry_track_id_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "track"("id");--> statement-breakpoint
ALTER TABLE "chart_entry" ADD CONSTRAINT "chart_entry_album_id_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "album"("id");--> statement-breakpoint
ALTER TABLE "track_artist" ADD CONSTRAINT "track_artist_track_id_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "track"("id");--> statement-breakpoint
ALTER TABLE "track_artist" ADD CONSTRAINT "track_artist_artist_id_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artist"("id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;