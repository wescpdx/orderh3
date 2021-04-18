
DROP TABLE IF EXISTS public.kennel CASCADE;
DROP TABLE IF EXISTS public.hasher CASCADE;
DROP TABLE IF EXISTS public.event CASCADE;
DROP TABLE IF EXISTS public.event_hashers;
DROP TABLE IF EXISTS public.event_hares;
DROP TABLE IF EXISTS public.event_jedi;
DROP TYPE IF EXISTS honor_type CASCADE;
DROP TABLE IF EXISTS public.honor_def CASCADE;
DROP TABLE IF EXISTS public.honor_delivery;
DROP TYPE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS public.auth_user;

CREATE TABLE public.kennel
(
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)
);

CREATE TABLE public.hasher
(
  id          SERIAL PRIMARY KEY,
  real_name   VARCHAR(100),
  hash_name   VARCHAR(100),
  fb_name     VARCHAR(100),
  fb_url      VARCHAR(100),
  kennel      INTEGER,
  notes       VARCHAR(1000),
  created     TIMESTAMPTZ,
  updated     TIMESTAMPTZ,

  CONSTRAINT fk_kennel FOREIGN KEY (kennel) REFERENCES kennel (id)
);

CREATE TABLE public.event
(
  id          SERIAL PRIMARY KEY,
  kennel      INTEGER,
  title       VARCHAR(100),
  number      SMALLINT,
  ev_date     DATE,
  location    VARCHAR(200),
  notes       VARCHAR(1000),
  created     TIMESTAMPTZ,
  updated     TIMESTAMPTZ,

  CONSTRAINT fk_kennel FOREIGN KEY (kennel) REFERENCES kennel (id)
);

CREATE TABLE public.event_hashers
(
  event       INTEGER,
  hasher      INTEGER,

  CONSTRAINT fk_hasher FOREIGN KEY (hasher) REFERENCES hasher (id),
  CONSTRAINT fk_event FOREIGN KEY (event) REFERENCES event (id)
);

CREATE TABLE public.event_hares
(
  event       INTEGER,
  hasher      INTEGER,

  CONSTRAINT fk_hasher FOREIGN KEY (hasher) REFERENCES hasher (id),
  CONSTRAINT fk_event FOREIGN KEY (event) REFERENCES event (id)
);

CREATE TABLE public.event_jedi
(
  event       INTEGER,
  hasher      INTEGER,

  CONSTRAINT fk_hasher FOREIGN KEY (hasher) REFERENCES hasher (id),
  CONSTRAINT fk_event FOREIGN KEY (event) REFERENCES event (id)
);

CREATE TYPE honor_type AS ENUM
(
  'hash',
  'hare',
  'jedi'
);

CREATE TABLE public.honor_def
(
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(100),
  kennel      INTEGER,
  type        honor_type,
  created     TIMESTAMPTZ,
  updated     TIMESTAMPTZ,

  CONSTRAINT fk_kennel FOREIGN KEY (kennel) REFERENCES kennel (id)
);

CREATE TABLE public.honor_delivery
(
  id          SERIAL PRIMARY KEY,
  honor       INTEGER,
  hasher      INTEGER,
  event       INTEGER,
  created     TIMESTAMPTZ,
  updated     TIMESTAMPTZ,

  CONSTRAINT fk_honor FOREIGN KEY (honor) REFERENCES honor_def (id),
  CONSTRAINT fk_hasher FOREIGN KEY (hasher) REFERENCES hasher (id),
  CONSTRAINT fk_event FOREIGN KEY (event) REFERENCES event (id)
);

CREATE TYPE permissions AS ENUM
(
  'data_entry',
  'admin'
);

CREATE TABLE public.auth_user
(
  id          SERIAL PRIMARY KEY,
  google_key  VARCHAR(200),
  name        VARCHAR(100),
  email       VARCHAR(100),
  permissions permissions,
  last_login  TIMESTAMPTZ,
  created     TIMESTAMPTZ,
  updated     TIMESTAMPTZ
);
