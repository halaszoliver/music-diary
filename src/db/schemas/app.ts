import { sql } from "drizzle-orm";
import { user } from "./auth";
import {
  type AnyPgColumn,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Postgres 18 native uuidv7()
const id = () => uuid("id").primaryKey().default(sql`uuidv7()`);
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// ---

export const movement = pgEnum("movement", ["new", "re-entry", "up", "down", "same"]);
export const periodType = pgEnum("period_type", ["week", "year"]);
export const chartKind = pgEnum("chart_kind", ["track", "album"]);
export const chartStatus = pgEnum("chart_status", ["draft", "published"]);

// ---

export const artist = pgTable("artist", {
  id: id(), // TODO: check
  name: text("name").notNull(),
});

// ---

export const track = pgTable("track", {
  id: id(), // TODO: check
  title: text("title").notNull(),
  releaseDate: date("release_date"), // ?
});

// Many-to-many so features/collabs work ("A feat. B")
export const trackArtist = pgTable(
  "track_artist",
  {
    trackId: uuid("track_id").references(() => track.id),
    artistId: uuid("artist_id").references(() => artist.id),
    role: text("role").default("primary"), // 'primary', 'featured'
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [
    primaryKey({ columns: [t.trackId, t.artistId] }),
    index().on(t.artistId),
  ],
);

// ---

export const album = pgTable("album", {
  id: id(), // TODO: check
  title: text("title").notNull(),
  // deluxe/remaster points to the original
  parentAlbumId: uuid("parent_album_id").references((): AnyPgColumn => album.id),
});

export const albumArtist = pgTable(
  "album_artist",
  {
    albumId: uuid("album_id").references(() => album.id),
    artistId: uuid("artist_id").references(() => artist.id),
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.artistId] }),
    index().on(t.artistId),
  ],
);

export const albumTrack = pgTable(
  "album_track",
  {
    albumId: uuid("album_id").references(() => album.id),
    trackId: uuid("track_id").references(() => track.id),
    trackNumber: integer("track_number").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.trackNumber] }),
    index().on(t.trackId),
  ],
);

// ---

export const chart = pgTable(
  "chart",
  {
    id: id(),
    createdAt: createdAt(),
    userId: text("user_id") // better-auth ids are text
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: chartKind("kind").notNull(),
    periodType: periodType("period_type").notNull(),
    periodStart: date("period_start").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }), // NULL = not yet published
  },
  (t) => [
    unique().on(t.userId, t.kind, t.periodType, t.periodStart),
    check(
      "chart_year_starts_jan1",
      sql`${t.periodType} <> 'year' OR EXTRACT(DOY FROM ${t.periodStart}) = 1`,
    ),
  ],
);

// ---

export const chartEntry = pgTable(
  "chart_entry",
  {
    id: id(),
    createdAt: createdAt(),
    chartId: uuid("chart_id")
      .notNull()
      .references(() => chart.id, { onDelete: "cascade" }),
    trackId: uuid("track_id").references(() => track.id),
    albumId: uuid("album_id").references(() => album.id),
    position: integer("position").notNull(),
    points: numeric("points").notNull(),

    // comparison stats: NULL where they don't apply
    previousPos: integer("previous_pos"), // last week / last year; NULL = new or re-entry
    peakPos: integer("peak_pos"), // weekly chart only
    periodsOnChart: integer("periods_on_chart"), // weekly chart only
    movement: movement("movement"),
  },
  (t) => [
    check("chart_entry_position_positive", sql`${t.position} > 0`),
    check(
      "chart_entry_track_xor_album",
      sql`(${t.trackId} IS NULL) <> (${t.albumId} IS NULL)`,
    ),
    unique().on(t.chartId, t.position),
    uniqueIndex()
      .on(t.chartId, t.trackId)
      .where(sql`${t.trackId} IS NOT NULL`),
    uniqueIndex()
      .on(t.chartId, t.albumId)
      .where(sql`${t.albumId} IS NOT NULL`),
    index().on(t.trackId).where(sql`${t.trackId} IS NOT NULL`),
    index().on(t.albumId).where(sql`${t.albumId} IS NOT NULL`),
  ],
);
