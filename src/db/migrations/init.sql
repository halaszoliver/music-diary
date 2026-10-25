CREATE TYPE movement AS ENUM ('new', 're-entry', 'up', 'down', 'same');

CREATE TABLE chart_entry
(
    id               UUID PRIMARY KEY     DEFAULT uuidv7(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    chart_id         UUID        NOT NULL REFERENCES chart (id) ON DELETE CASCADE,
    track_id          UUID REFERENCES track (id),
    album_id         UUID REFERENCES album (id),
    position         INT         NOT NULL CHECK (position > 0),
    points           NUMERIC     NOT NULL,

    -- comparison stats: NULL where they don't apply
    previous_pos     INT, -- last week / last year; NULL = new or re-entry
    peak_pos         INT, -- weekly chart only
    periods_on_chart INT, -- weekly chart only
    movement         movement,

    CHECK ((track_id IS NULL) <> (album_id IS NULL)),
    UNIQUE (chart_id, position)
);

CREATE UNIQUE INDEX ON chart_entry (chart_id, track_id) WHERE track_id IS NOT NULL;
CREATE UNIQUE INDEX ON chart_entry (chart_id, album_id) WHERE album_id IS NOT NULL;
CREATE INDEX ON chart_entry (track_id) WHERE track_id IS NOT NULL;
CREATE INDEX ON chart_entry (album_id) WHERE album_id IS NOT NULL;

---

CREATE TYPE period_type AS ENUM ('week', 'year');
CREATE TYPE chart_kind AS ENUM ('track', 'album');
CREATE TYPE chart_status AS ENUM ('draft', 'published');

CREATE TABLE chart
(
    id           UUID PRIMARY KEY     DEFAULT uuidv7(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id      TEXT        NOT NULL REFERENCES "user" (id) ON DELETE CASCADE, -- better-auth table
    kind         chart_kind  NOT NULL,
    period_type  period_type NOT NULL,
    period_start DATE        NOT NULL,
    published_at TIMESTAMPTZ, -- NULL = not yet published
    UNIQUE (user_id, kind, period_type, period_start),
    CHECK (period_type <> 'year' OR EXTRACT(DOY FROM period_start) = 1)
);

---

CREATE TABLE track
(
    id           UUID PRIMARY KEY DEFAULT uuidv7(), --TODO: check
    title        TEXT NOT NULL,
    release_date DATE                               -- ?
);

-- Many-to-many so features/collabs work ("A feat. B")
CREATE TABLE track_artist
(
    track_id    INT REFERENCES track (id),
    artist_id  INT REFERENCES artist (id),
    role       TEXT DEFAULT 'primary', -- 'primary', 'featured'
    sort_order INT  DEFAULT 0,
    PRIMARY KEY (track_id, artist_id)
);

CREATE INDEX ON track_artist (artist_id);

---

CREATE TABLE album
(
    id              UUID PRIMARY KEY DEFAULT uuidv7(), --TODO: check
    title           TEXT NOT NULL,
    parent_album_id UUID REFERENCES album (id)        -- deluxe/remaster points to the original
);

CREATE TABLE album_artist
(
    album_id   UUID REFERENCES album (id),
    artist_id  UUID REFERENCES artist (id),
    sort_order INT DEFAULT 0,
    PRIMARY KEY (album_id, artist_id)
);

CREATE INDEX ON album_artist (artist_id);

CREATE TABLE album_track
(
    album_id     UUID REFERENCES album (id),
    track_id      UUID REFERENCES track (id),
    track_number INT NOT NULL,
    PRIMARY KEY (album_id, track_number)
);
CREATE INDEX ON album_track (track_id);

---

CREATE TABLE artist
(
    id   UUID PRIMARY KEY DEFAULT uuidv7(), --TODO: check
    name TEXT NOT NULL
);
