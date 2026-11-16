-- ==============================================================================
-- ECOTRACK DATA WAREHOUSE - CHANGE DATA CAPTURE & POWER BI DAX SUPPORT (POSTGRESQL 16)
-- Sprint 4: ECO-41 / SCRUM-52 (Adem Ouerhani: CDC Pipeline & Power BI DAX Model)
-- ==============================================================================
--
-- Strictly ADDITIVE and IDEMPOTENT migration on top of 01_create_star_schema.sql
-- and 03_eco24_incremental_etl.sql.
-- Enriches Fact_Reports with MTTR (Mean Time to Resolution in decimal hours),
-- SLA Breach flag, and qualification lead-time seconds for Power BI DAX measures.
-- ==============================================================================

SET search_path TO ecotrack_dw, public;

-- 1. Additive columns for MTTR, SLA Breach, and Triage Lead Time
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS mttr_hours DECIMAL(7, 2);
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE;
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS time_to_qualify_seconds INT;
ALTER TABLE Fact_Reports ADD COLUMN IF NOT EXISTS time_to_pickup_hours DECIMAL(7, 2);

-- 2. Indexes for Power BI performance & DAX filtering
CREATE INDEX IF NOT EXISTS idx_fact_reports_sla_breached ON Fact_Reports (sla_breached);
CREATE INDEX IF NOT EXISTS idx_fact_reports_mttr_hours ON Fact_Reports (mttr_hours);
CREATE INDEX IF NOT EXISTS idx_fact_reports_status ON Fact_Reports (report_status);

-- 3. Comments for documentation and business glossary
COMMENT ON COLUMN Fact_Reports.mttr_hours IS 'Mean Time to Resolution (heures décimales: resolvedAt - createdAt). Mesure clé DAX.';
COMMENT ON COLUMN Fact_Reports.sla_breached IS 'Indicateur booléen de dépassement du SLA (SLA cible dépassé). Mesure clé DAX.';
COMMENT ON COLUMN Fact_Reports.time_to_qualify_seconds IS 'Délai de qualification citoyenne (secondes: validatedAt - createdAt).';
COMMENT ON COLUMN Fact_Reports.time_to_pickup_hours IS 'Délai de prise en charge ouvrier (heures: startedAt - assignedAt).';
