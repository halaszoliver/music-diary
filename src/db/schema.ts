import { defineRelations, sql } from "drizzle-orm";
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

export const users = pgTable("users", {
  id: id(),
  username: text("username").notNull().unique(),
  // TODO
  createdAt: createdAt(),
});

// ---

export const artists = pgTable("artists", {
  id: id(), // TODO: check
  name: text("name").notNull(),
});

// ---

export const tracks = pgTable("tracks", {
  id: id(), // TODO: check
  title: text("title").notNull(),
  releaseDate: date("release_date"), // ?
});

// Many-to-many so features/collabs work ("A feat. B")
export const trackArtists = pgTable(
  "track_artists",
  {
    trackId: uuid("track_id").references(() => tracks.id),
    artistId: uuid("artist_id").references(() => artists.id),
    role: text("role").default("primary"), // 'primary', 'featured'
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [
    primaryKey({ columns: [t.trackId, t.artistId] }),
    index().on(t.artistId),
  ],
);

// ---

export const albums = pgTable("albums", {
  id: id(), // TODO: check
  title: text("title").notNull(),
  // deluxe/remaster points to the original
  parentAlbumId: uuid("parent_album_id").references((): AnyPgColumn => albums.id),
});

export const albumArtists = pgTable(
  "album_artists",
  {
    albumId: uuid("album_id").references(() => albums.id),
    artistId: uuid("artist_id").references(() => artists.id),
    sortOrder: integer("sort_order").default(0),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.artistId] }),
    index().on(t.artistId),
  ],
);

export const albumTracks = pgTable(
  "album_tracks",
  {
    albumId: uuid("album_id").references(() => albums.id),
    trackId: uuid("track_id").references(() => tracks.id),
    trackNumber: integer("track_number").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.albumId, t.trackNumber] }),
    index().on(t.trackId),
  ],
);

// ---

export const charts = pgTable(
  "charts",
  {
    id: id(),
    createdAt: createdAt(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    kind: chartKind("kind").notNull(),
    periodType: periodType("period_type").notNull(),
    periodStart: date("period_start").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }), // NULL = not yet published
  },
  (t) => [
    unique().on(t.userId, t.kind, t.periodType, t.periodStart),
    check(
      "charts_year_starts_jan1",
      sql`${t.periodType} <> 'year' OR EXTRACT(DOY FROM ${t.periodStart}) = 1`,
    ),
  ],
);

// ---

export const chartEntries = pgTable(
  "chart_entries",
  {
    id: id(),
    createdAt: createdAt(),

    chartId: uuid("chart_id")
      .notNull()
      .references(() => charts.id, { onDelete: "cascade" }),
    trackId: uuid("track_id").references(() => tracks.id),
    albumId: uuid("album_id").references(() => albums.id),
    position: integer("position").notNull(),
    points: numeric("points").notNull(),

    // comparison stats: NULL where they don't apply
    previousPos: integer("previous_pos"), // last week / last year; NULL = new or re-entry
    peakPos: integer("peak_pos"), // weekly charts only
    periodsOnChart: integer("periods_on_chart"), // weekly charts only
    movement: movement("movement"),
  },
  (t) => [
    check("chart_entries_position_positive", sql`${t.position} > 0`),
    check(
      "chart_entries_track_xor_album",
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

// ---

export const relations = defineRelations(
  {
    users,
    artists,
    tracks,
    trackArtists,
    albums,
    albumArtists,
    albumTracks,
    charts,
    chartEntries,
  },
  (r) => ({
    users: {
      charts: r.many.charts(),
    },
    artists: {
      tracks: r.many.tracks({
        from: r.artists.id.through(r.trackArtists.artistId),
        to: r.tracks.id.through(r.trackArtists.trackId),
      }),
      albums: r.many.albums({
        from: r.artists.id.through(r.albumArtists.artistId),
        to: r.albums.id.through(r.albumArtists.albumId),
      }),
    },
    tracks: {
      artists: r.many.artists(),
      albums: r.many.albums({
        from: r.tracks.id.through(r.albumTracks.trackId),
        to: r.albums.id.through(r.albumTracks.albumId),
      }),
      chartEntries: r.many.chartEntries(),
    },
    albums: {
      parent: r.one.albums({
        from: r.albums.parentAlbumId,
        to: r.albums.id,
        alias: "album_parent",
      }),
      editions: r.many.albums({
        from: r.albums.id,
        to: r.albums.parentAlbumId,
        alias: "album_parent",
      }),
      artists: r.many.artists(),
      tracks: r.many.tracks(),
      chartEntries: r.many.chartEntries(),
    },
    charts: {
      user: r.one.users({
        from: r.charts.userId,
        to: r.users.id,
        optional: false,
      }),
      entries: r.many.chartEntries(),
    },
    chartEntries: {
      chart: r.one.charts({
        from: r.chartEntries.chartId,
        to: r.charts.id,
        optional: false,
      }),
      track: r.one.tracks({
        from: r.chartEntries.trackId,
        to: r.tracks.id,
      }),
      album: r.one.albums({
        from: r.chartEntries.albumId,
        to: r.albums.id,
      }),
    },
    // junction tables, for when role/sort_order/track_number are needed
    trackArtists: {
      track: r.one.tracks({ from: r.trackArtists.trackId, to: r.tracks.id }),
      artist: r.one.artists({ from: r.trackArtists.artistId, to: r.artists.id }),
    },
    albumArtists: {
      album: r.one.albums({ from: r.albumArtists.albumId, to: r.albums.id }),
      artist: r.one.artists({ from: r.albumArtists.artistId, to: r.artists.id }),
    },
    albumTracks: {
      album: r.one.albums({ from: r.albumTracks.albumId, to: r.albums.id }),
      track: r.one.tracks({ from: r.albumTracks.trackId, to: r.tracks.id }),
    },
  }),
);
