import { defineRelations } from "drizzle-orm";
import * as app from "./schemas/app";
import * as auth from "./schemas/auth";

export const relations = defineRelations({ ...auth, ...app }, (r) => ({
  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
    charts: r.many.chart(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  artist: {
    tracks: r.many.track({
      from: r.artist.id.through(r.trackArtist.artistId),
      to: r.track.id.through(r.trackArtist.trackId),
    }),
    albums: r.many.album({
      from: r.artist.id.through(r.albumArtist.artistId),
      to: r.album.id.through(r.albumArtist.albumId),
    }),
  },
  track: {
    artists: r.many.artist(),
    albums: r.many.album({
      from: r.track.id.through(r.albumTrack.trackId),
      to: r.album.id.through(r.albumTrack.albumId),
    }),
    chartEntries: r.many.chartEntry(),
  },
  album: {
    parent: r.one.album({
      from: r.album.parentAlbumId,
      to: r.album.id,
      alias: "album_parent",
    }),
    editions: r.many.album({
      from: r.album.id,
      to: r.album.parentAlbumId,
      alias: "album_parent",
    }),
    artists: r.many.artist(),
    tracks: r.many.track(),
    chartEntries: r.many.chartEntry(),
  },
  chart: {
    user: r.one.user({
      from: r.chart.userId,
      to: r.user.id,
      optional: false,
    }),
    entries: r.many.chartEntry(),
  },
  chartEntry: {
    chart: r.one.chart({
      from: r.chartEntry.chartId,
      to: r.chart.id,
      optional: false,
    }),
    track: r.one.track({
      from: r.chartEntry.trackId,
      to: r.track.id,
    }),
    album: r.one.album({
      from: r.chartEntry.albumId,
      to: r.album.id,
    }),
  },
  // junction tables, for when role/sort_order/track_number are needed
  trackArtist: {
    track: r.one.track({ from: r.trackArtist.trackId, to: r.track.id }),
    artist: r.one.artist({ from: r.trackArtist.artistId, to: r.artist.id }),
  },
  albumArtist: {
    album: r.one.album({ from: r.albumArtist.albumId, to: r.album.id }),
    artist: r.one.artist({ from: r.albumArtist.artistId, to: r.artist.id }),
  },
  albumTrack: {
    album: r.one.album({ from: r.albumTrack.albumId, to: r.album.id }),
    track: r.one.track({ from: r.albumTrack.trackId, to: r.track.id }),
  },
}));
