ALTER TABLE "user" ADD COLUMN "lastfm_username" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_lastfm_username_key" UNIQUE("lastfm_username");