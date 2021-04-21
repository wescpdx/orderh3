
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
  created     TIMESTAMPTZ DEFAULT NOW(),
  updated     TIMESTAMPTZ DEFAULT NOW(),

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
  created     TIMESTAMPTZ DEFAULT NOW(),
  updated     TIMESTAMPTZ DEFAULT NOW(),

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
  num         INTEGER,
  created     TIMESTAMPTZ DEFAULT NOW(),
  updated     TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_kennel FOREIGN KEY (kennel) REFERENCES kennel (id)
);

CREATE TABLE public.honor_delivery
(
  id          SERIAL PRIMARY KEY,
  honor       INTEGER,
  hasher      INTEGER,
  event       INTEGER,
  created     TIMESTAMPTZ DEFAULT NOW(),
  updated     TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_honor FOREIGN KEY (honor) REFERENCES honor_def (id),
  CONSTRAINT fk_hasher FOREIGN KEY (hasher) REFERENCES hasher (id),
  CONSTRAINT fk_event FOREIGN KEY (event) REFERENCES event (id)
);

CREATE TYPE permissions AS ENUM
(
  'data_entry',
  'admin',
  'pending'
);

CREATE TABLE public.auth_user
(
  id          SERIAL PRIMARY KEY,
  google_key  VARCHAR(200),
  name        VARCHAR(100),
  email       VARCHAR(100),
  permissions permissions,
  last_login  TIMESTAMPTZ,
  created     TIMESTAMPTZ DEFAULT NOW(),
  updated     TIMESTAMPTZ DEFAULT NOW()
);

CREATE VIEW hasher_attendance
AS
SELECT k.id AS kennel_id, k.name AS kennel_name, h.id AS hasher_id, h.hash_name,
 h.real_name, h.fb_name, COUNT(eh.event) AS hashes
FROM hasher h
JOIN event_hashers eh
 ON eh.hasher = h.id
JOIN event e
 ON eh.event = e.id
JOIN kennel k
 ON e.kennel = k.id
WHERE k.id = 3
GROUP BY 1, 2, 3, 4, 5, 6;

CREATE VIEW hasher_hares
AS
SELECT k.id AS kennel_id, k.name AS kennel_name, h.id AS hasher_id, h.hash_name,
 h.real_name, h.fb_name, COUNT(eh.event) AS hashes
FROM hasher h
JOIN event_hares eh
 ON eh.hasher = h.id
JOIN event e
 ON eh.event = e.id
JOIN kennel k
 ON e.kennel = k.id
WHERE k.id = 3
GROUP BY 1, 2, 3, 4, 5, 6;

CREATE VIEW hasher_jedi
AS
SELECT k.id AS kennel_id, k.name AS kennel_name, h.id AS hasher_id, h.hash_name,
 h.real_name, h.fb_name, COUNT(eh.event) AS hashes
FROM hasher h
JOIN event_jedi eh
 ON eh.hasher = h.id
JOIN event e
 ON eh.event = e.id
JOIN kennel k
 ON e.kennel = k.id
WHERE k.id = 3
GROUP BY 1, 2, 3, 4, 5, 6;

-- ==============================================================================
-- RESET AND INSERT SAMPLE DATA
-- ==============================================================================

DELETE FROM honor_delivery;
DELETE FROM honor_def;
DELETE FROM event_hashers;
DELETE FROM event_hares;
DELETE FROM event_jedi;
DELETE FROM hasher;
DELETE FROM event;
DELETE FROM kennel;

INSERT INTO kennel
(id, name) VALUES
(1, 'Stumptown H3'),
(2, 'Oregon H3'),
(3, 'Test Kennel');

INSERT INTO event
(id, kennel, title, number, ev_date, location) VALUES
(1, 3, 'Test first', 1, '2021-02-04', 'Gabriel Park'),
(2, 3, 'Test second', 2, '2021-02-11', 'Albina Park'),
(3, 3, 'Test third', 3, '2021-02-18', 'Downtown Portland'),
(4, 3, 'Test fourth', 4, '2021-02-25', 'NE Portland'),
(5, 3, 'Big number 5', 5, '2021-03-02', 'Someplace cool'),
(6, 3, 'Magic six', 6, '2021-03-11', 'A bar or something'),
(7, 3, '777', 7, '2021-03-18', 'Downtown Portland');

INSERT INTO hasher
(id, kennel, real_name, hash_name) VALUES
(1, 3, 'Bob Smith', 'The Bobster'),
(2, 3, 'Jane Doe', 'Nobody'),
(3, 3, 'Jim Jones', 'Jimmy'),
(4, 3, 'Sally Fields', 'Cookie Monsta'),
(5, 3, 'Henry Cook', 'The HARE'),
(6, 3, 'Frankie Prather', 'Chiller');

INSERT INTO event_hashers
(event, hasher) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(2, 1),
(2, 3),
(2, 4),
(2, 6),
(3, 1),
(3, 2),
(3, 5),
(3, 6),
(4, 1),
(4, 4),
(4, 5),
(4, 6),
(5, 1),
(5, 2),
(5, 3),
(5, 5),
(5, 6),
(6, 1),
(6, 2),
(6, 5),
(6, 6),
(7, 1),
(7, 2),
(7, 3),
(7, 5),
(7, 6);

INSERT INTO event_hares
(event, hasher) VALUES
(1, 1),
(2, 1),
(3, 1),
(3, 6),
(4, 6),
(5, 1),
(5, 5),
(6, 1),
(7, 6);

INSERT INTO event_jedi
(event, hasher) VALUES
(1, 3),
(2, 3),
(3, 5),
(4, 5),
(4, 6),
(5, 3),
(6, 5),
(7, 3);

INSERT INTO honor_def
(id, kennel, title, type, num) VALUES
(1, 3, 'Repeat badge', 'hash', 2),
(2, 3, 'Five timer', 'hash', 5);

INSERT INTO honor_delivery
(honor, hasher, event) VALUES
(1, 1, 2),
(1, 2, 2),
(1, 5, 4),
(1, 6, 5),
(2, 1, 6);
