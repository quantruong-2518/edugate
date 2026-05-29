-- 0001 — extensions, gen_uuid_v7(), Postgres roles.
-- Runs as a superuser (maintenance pool). Subsequent migrations rely on
-- the extensions and roles created here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- gen_random_bytes
CREATE EXTENSION IF NOT EXISTS citext;          -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS unaccent;        -- accent-insensitive search
CREATE EXTENSION IF NOT EXISTS btree_gist;      -- EXCLUDE USING gist on campaigns

-- Wrap unaccent() in an IMMUTABLE shim so it can appear in index expressions.
-- The vanilla unaccent() is STABLE because the dictionary could theoretically
-- change between calls; we pin the dictionary explicitly here and assert
-- IMMUTABLE so Postgres lets us index on its output.
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- UUID v7 — time-ordered for index locality, opaque externally.
-- Pure PL/pgSQL implementation so we don't depend on the pg_uuidv7 extension
-- which isn't bundled with vanilla postgres images.
-- Spec: https://www.rfc-editor.org/rfc/rfc9562#name-uuid-version-7
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gen_uuid_v7() RETURNS uuid AS $$
DECLARE
  uuid_bytes bytea := gen_random_bytes(16);
  unix_ts_ms bigint := (extract(epoch FROM clock_timestamp()) * 1000)::bigint;
BEGIN
  -- 48-bit big-endian millisecond timestamp into bytes 0..5
  uuid_bytes := set_byte(uuid_bytes, 0, ((unix_ts_ms >> 40) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 1, ((unix_ts_ms >> 32) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 2, ((unix_ts_ms >> 24) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 3, ((unix_ts_ms >> 16) & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 4, ((unix_ts_ms >> 8)  & 255)::int);
  uuid_bytes := set_byte(uuid_bytes, 5, (unix_ts_ms         & 255)::int);
  -- Version 7 in the high nibble of byte 6
  uuid_bytes := set_byte(uuid_bytes, 6,
    ((get_byte(uuid_bytes, 6) & 15) | 112)::int);
  -- Variant 10xx in the high two bits of byte 8
  uuid_bytes := set_byte(uuid_bytes, 8,
    ((get_byte(uuid_bytes, 8) & 63) | 128)::int);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ----------------------------------------------------------------------------
-- Three Postgres roles per specs/DATA_MODEL.md §4.1. Created NOLOGIN with no
-- password — production ops sets passwords + ALTER ROLE LOGIN per environment.
-- The dev smoke test reaches them via `SET ROLE` from the superuser session.
--
--   app_role          — subject to RLS; request handling
--   platform_role     — tenant lookup; bypasses RLS on a few tables via grants
--   maintenance_role  — migrations + retention; BYPASSRLS
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'platform_role') THEN
    CREATE ROLE platform_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'maintenance_role') THEN
    CREATE ROLE maintenance_role NOLOGIN BYPASSRLS;
  END IF;
END
$$;

-- Default privileges so future tables grant correctly when created by the
-- maintenance role. Each migration also explicitly grants on its own tables.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO app_role;
