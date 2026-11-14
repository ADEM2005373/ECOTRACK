-- ==============================================================================
-- ECOTRACK DATA WAREHOUSE - INCREMENTAL ETL SUPPORT (POSTGRESQL 16)
-- Sprint 2: ECO-24 / SCRUM-57 (bi-etl worker: MongoDB reports -> Fact_Reports)
-- ==============================================================================
--
-- Strictly ADDITIVE and IDEMPOTENT migration on top of 01_create_star_schema.sql
-- (ECO-05 / SCRUM-55). 01 and 02 are left untouched. Safe to run several times:
-- every statement uses IF NOT EXISTS, and DROP NOT NULL is a no-op on a column
-- that is already nullable. It intentionally fails if 01 was not applied first
-- (no IF EXISTS on ALTER TABLE): loading facts without the star schema is a bug.
--
-- WHY EACH CHANGE IS NEEDED
--   1. report_id VARCHAR(24) + UNIQUE INDEX uk_fact_reports_report_id
--      The MongoDB _id is an ObjectId (24 hex chars), not a UUID, so it cannot be
--      stored in report_uuid. The unique index is the arbiter required by the
--      UPSERT "ON CONFLICT (report_id) DO UPDATE" (no duplicates on re-runs).
--   2. citizen_hash CHAR(64)
--      Salted SHA-256 of the MongoDB reporterId (GDPR pseudonymisation, ADR-05).
--      The raw citizen id never reaches the warehouse.
--   3. category_code VARCHAR(50)
--      The citizen-declared MongoDB "category" is a free string (max 50) that may
--      not exist in Dim_Category yet; keeping the code avoids losing it.
--   4. longitude / latitude DECIMAL(9, 6)
--      Report position, ROUNDED BY THE ETL TO 3 DECIMALS (~100 m, data
--      minimisation, aligned with the rounding planned in ECO-41 / SCRUM-52).
--      MongoDB keeps the exact coordinates.
--   5. updated_at TIMESTAMPTZ
--      MongoDB updatedAt, used to keep the latest version on UPSERT.
--      The existing created_at column receives the MongoDB createdAt.
--   6. etl_sync_state table
--      Watermark of the incremental extraction (compound cursor updatedAt, _id),
--      written in the SAME transaction as each loaded batch.
--
-- NOT NULL CONSTRAINTS RELAXED (to be approved by the Data Architect)
--   - report_uuid       : replaced by report_id (ObjectId is not a UUID).
--   - geo_key           : NULL until ECO-41 maps positions to Dim_Geography.
--   - is_ai_concordant  : NULL when the AI or the human category is not known yet.
--   - severity_level    : no source field in MongoDB yet.
--
-- COLUMNS LEFT NULL BY ECO-24 (filled later by ECO-41 or other tickets)
--   report_uuid, geo_key, date_qualified_key, ai_model_key,
--   time_to_qualify_seconds, severity_level.
--   exif_purged_flag keeps its DEFAULT TRUE.
-- ==============================================================================

SET search_path TO ecotrack_dw, public;

-- 1-5. New columns on Fact_Reports
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS report_id VARCHAR(24);
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS citizen_hash CHAR(64);
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS category_code VARCHAR(50);
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS longitude DECIMAL(9, 6);
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS latitude DECIMAL(9, 6);
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- UPSERT arbiter (ON CONFLICT (report_id))
CREATE UNIQUE INDEX IF NOT EXISTS uk_fact_reports_report_id ON Fact_Reports (report_id);

-- Relaxed NOT NULL constraints (see header)
ALTER TABLE Fact_Reports ALTER COLUMN report_uuid DROP NOT NULL;
ALTER TABLE Fact_Reports ALTER COLUMN geo_key DROP NOT NULL;
ALTER TABLE Fact_Reports ALTER COLUMN is_ai_concordant DROP NOT NULL;
ALTER TABLE Fact_Reports ALTER COLUMN severity_level DROP NOT NULL;

-- 6. Incremental extraction watermark
CREATE TABLE IF NOT EXISTS etl_sync_state (
    pipeline_name VARCHAR(64) PRIMARY KEY,          -- e.g. reports_to_fact_reports
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL, -- max MongoDB updatedAt loaded
    last_report_id VARCHAR(24) NOT NULL,            -- tie-breaker: max _id at that updatedAt
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documentation for Power BI / analysts
COMMENT ON COLUMN Fact_Reports.report_id IS 'MongoDB reports._id (ObjectId hex, 24 chars). UPSERT key.';
COMMENT ON COLUMN Fact_Reports.citizen_hash IS 'SHA-256(reporterId + secret salt). Pseudonymised citizen id (GDPR, ADR-05).';
COMMENT ON COLUMN Fact_Reports.category_code IS 'Citizen-declared MongoDB category code (free string).';
COMMENT ON COLUMN Fact_Reports.longitude IS 'Longitude rounded to 3 decimals (~100 m) by the ETL.';
COMMENT ON COLUMN Fact_Reports.latitude IS 'Latitude rounded to 3 decimals (~100 m) by the ETL.';
COMMENT ON COLUMN Fact_Reports.created_at IS 'MongoDB createdAt (UTC) when loaded by the bi-etl worker.';
COMMENT ON COLUMN Fact_Reports.updated_at IS 'MongoDB updatedAt (UTC) of the loaded version.';
COMMENT ON TABLE etl_sync_state IS 'bi-etl incremental watermarks, one row per pipeline (ECO-24).';
