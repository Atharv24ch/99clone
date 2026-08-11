-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for ILIKE index support
CREATE EXTENSION IF NOT EXISTS unaccent; -- for accent-insensitive search

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
