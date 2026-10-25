CREATE TYPE movement AS ENUM ('new', 're-entry', 'up', 'down', 'same');

CREATE TABLE chart_entries
(
    id               UUID PRIMARY KEY     DEFAULT uuidv7(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    chart_id         UUID        NOT NULL REFERENCES charts (id) ON DELETE CASCADE,
    track_id          UUID REFERENCES tracks (id),
    album_id         UUID REFERENCES albums (id),
    position         INT         NOT NULL CHECK (position > 0),
    points           NUMERIC     NOT NULL,

    -- comparison stats: NULL where they don't apply
    previous_pos     INT, -- last week / last year; NULL = new or re-entry
    peak_pos         INT, -- weekly charts only
    periods_on_chart INT, -- weekly charts only
    movement         movement,

    CHECK ((track_id IS NULL) <> (album_id IS NULL)),
    UNIQUE (chart_id, position)
);

CREATE UNIQUE INDEX ON chart_entries (chart_id, track_id) WHERE track_id IS NOT NULL;
CREATE UNIQUE INDEX ON chart_entries (chart_id, album_id) WHERE album_id IS NOT NULL;
CREATE INDEX ON chart_entries (track_id) WHERE track_id IS NOT NULL;
CREATE INDEX ON chart_entries (album_id) WHERE album_id IS NOT NULL;

---

CREATE TYPE period_type AS ENUM ('week', 'year');
CREATE TYPE chart_kind AS ENUM ('track', 'album');
CREATE TYPE chart_status AS ENUM ('draft', 'published');

CREATE TABLE charts
(
    id           UUID PRIMARY KEY     DEFAULT uuidv7(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id      UUID        NOT NULL REFERENCES users (id),
    kind         chart_kind  NOT NULL,
    period_type  period_type NOT NULL,
    period_start DATE        NOT NULL,
    published_at TIMESTAMPTZ, -- NULL = not yet published
    UNIQUE (user_id, kind, period_type, period_start),
    CHECK (period_type <> 'year' OR EXTRACT(DOY FROM period_start) = 1)
);

---

CREATE TABLE users
(
    id         UUID PRIMARY KEY     DEFAULT uuidv7(),
    username   TEXT        NOT NULL UNIQUE,
    --// TODO
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

---

CREATE TABLE tracks
(
    id           UUID PRIMARY KEY DEFAULT uuidv7(), --TODO: check
    title        TEXT NOT NULL,
    release_date DATE                               -- ?
);

-- Many-to-many so features/collabs work ("A feat. B")
CREATE TABLE track_artists
(
    track_id    INT REFERENCES tracks (id),
    artist_id  INT REFERENCES artists (id),
    role       TEXT DEFAULT 'primary', -- 'primary', 'featured'
    sort_order INT  DEFAULT 0,
    PRIMARY KEY (track_id, artist_id)
);

CREATE INDEX ON track_artists (artist_id);

---

CREATE TABLE albums
(
    id              UUID PRIMARY KEY DEFAULT uuidv7(), --TODO: check
    title           TEXT NOT NULL,
    parent_album_id UUID REFERENCES albums (id)        -- deluxe/remaster points to the original
);

CREATE TABLE album_artists
(
    album_id   UUID REFERENCES albums (id),
    artist_id  UUID REFERENCES artists (id),
    sort_order INT DEFAULT 0,
    PRIMARY KEY (album_id, artist_id)
);

CREATE INDEX ON album_artists (artist_id);

CREATE TABLE album_tracks
(
    album_id     UUID REFERENCES albums (id),
    track_id      UUID REFERENCES tracks (id),
    track_number INT NOT NULL,
    PRIMARY KEY (album_id, track_number)
);
CREATE INDEX ON album_tracks (track_id);

---

CREATE TABLE artists
(
    id   UUID PRIMARY KEY DEFAULT uuidv7(), --TODO: check
    name TEXT NOT NULL
);
