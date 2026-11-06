-- ==============================================================================
-- ECOTRACK DATA WAREHOUSE - STAR SCHEMA DDL (POSTGRESQL 16)
-- Sprint 0: ECO-05 / SCRUM-55
-- Architecture Décisionnelle Power BI: 2 Tables de Faits & 5 Dimensions
-- ==============================================================================

-- Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Création du schéma décisionnel dédié
CREATE SCHEMA IF NOT EXISTS ecotrack_dw;
SET search_path TO ecotrack_dw, public;

-- ==============================================================================
-- 1. DIMENSIONS
-- ==============================================================================

-- Dimension 1: Date & Temps
CREATE TABLE IF NOT EXISTS Dim_Date (
    date_key INT PRIMARY KEY,                  -- Format YYYYMMDD (ex: 20261102)
    full_date DATE NOT NULL UNIQUE,
    day_of_month INT NOT NULL,
    day_name VARCHAR(15) NOT NULL,
    day_of_week INT NOT NULL,                 -- 1 (Lundi) à 7 (Dimanche)
    is_weekend BOOLEAN NOT NULL,
    week_of_year INT NOT NULL,
    month_number INT NOT NULL,
    month_name VARCHAR(15) NOT NULL,
    quarter INT NOT NULL,
    year_number INT NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE
);

-- Dimension 2: Géographie & Territoires
CREATE TABLE IF NOT EXISTS Dim_Geography (
    geo_key SERIAL PRIMARY KEY,
    district_code VARCHAR(20) NOT NULL,        -- Ex: TUNIS_CENTRE, LA_MARSA
    district_name VARCHAR(100) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,            -- Résidentiel, Industriel, Parc, Côtier
    postal_code VARCHAR(10),
    latitude_centroid DECIMAL(9, 6) NOT NULL,
    longitude_centroid DECIMAL(9, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_geo_district_neighborhood UNIQUE (district_name, neighborhood)
);

-- Dimension 3: Catégories d'Incidents
CREATE TABLE IF NOT EXISTS Dim_Category (
    category_key SERIAL PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL UNIQUE, -- DEPOT_SAUVAGE, ENCOMBRANT, DECHETS_VERTS
    category_label VARCHAR(100) NOT NULL,
    description TEXT,
    default_priority VARCHAR(20) NOT NULL,     -- BASSE, MOYENNE, HAUTE, CRITIQUE
    target_sla_hours INT NOT NULL,             -- SLA cible de résolution en heures
    is_recyclable BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
);

-- Dimension 4: Équipes d'Intervention
CREATE TABLE IF NOT EXISTS Dim_Team (
    team_key SERIAL PRIMARY KEY,
    team_code VARCHAR(50) NOT NULL UNIQUE,     -- TEAM_VOIRIE_01, TEAM_HYGIENE_NORD
    team_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,           -- Nettoyage, Évacuation Lourde, Espaces Verts
    supervisor_name VARCHAR(100) NOT NULL,
    worker_count INT NOT NULL DEFAULT 4,
    vehicle_type VARCHAR(50),                  -- Camion Benne, Véhicule Léger
    active BOOLEAN DEFAULT TRUE
);

-- Dimension 5: Modèles IA de Vision
CREATE TABLE IF NOT EXISTS Dim_AI_Model (
    model_key SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,          -- YOLOv8x-EcoTrack, ViT-WasteClassifier
    model_version VARCHAR(30) NOT NULL,        -- v2.1.0, v2.2.0
    model_architecture VARCHAR(50) NOT NULL,   -- CNN / Transformer / Hybrid
    deployed_at DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    confidence_threshold DECIMAL(3, 2) NOT NULL DEFAULT 0.65,
    CONSTRAINT uk_model_version UNIQUE (model_name, model_version)
);

-- ==============================================================================
-- 2. TABLES DE FAITS (FACT TABLES)
-- ==============================================================================

-- Fait 1: Signalements & Qualification Citoyenne
CREATE TABLE IF NOT EXISTS Fact_Reports (
    report_key BIGSERIAL PRIMARY KEY,
    report_uuid UUID NOT NULL,                 -- Référence MongoDB _id
    
    -- Clés Étrangères Dimensions
    date_created_key INT NOT NULL REFERENCES Dim_Date(date_key),
    date_qualified_key INT REFERENCES Dim_Date(date_key),
    geo_key INT NOT NULL REFERENCES Dim_Geography(geo_key),
    category_suggested_ai_key INT REFERENCES Dim_Category(category_key),
    category_validated_human_key INT REFERENCES Dim_Category(category_key),
    ai_model_key INT REFERENCES Dim_AI_Model(model_key),
    
    -- Mesures & Métriques Numériques
    ai_confidence_score DECIMAL(5, 4),         -- 0.0000 à 1.0000
    is_ai_concordant BOOLEAN NOT NULL,         -- Accord IA vs Humain (US-10)
    time_to_qualify_seconds INT,               -- Délai réception -> validation
    exif_purged_flag BOOLEAN DEFAULT TRUE,     -- Conformité RGPD / NFR
    severity_level VARCHAR(20) NOT NULL,       -- FAIBLE, MOYEN, ELEVE, URGENT
    report_status VARCHAR(30) NOT NULL,        -- CREATED, VALIDATED, REJECTED, CLOSED
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fait 2: Interventions & Résolutions Terrain
CREATE TABLE IF NOT EXISTS Fact_Interventions (
    intervention_key BIGSERIAL PRIMARY KEY,
    intervention_uuid UUID NOT NULL,           -- Référence MongoDB / Workflow
    report_key BIGINT NOT NULL REFERENCES Fact_Reports(report_key),
    
    -- Clés Étrangères Dimensions
    date_dispatched_key INT NOT NULL REFERENCES Dim_Date(date_key),
    date_closed_key INT REFERENCES Dim_Date(date_key),
    team_key INT NOT NULL REFERENCES Dim_Team(team_key),
    geo_key INT NOT NULL REFERENCES Dim_Geography(geo_key),
    category_key INT NOT NULL REFERENCES Dim_Category(category_key),
    
    -- Mesures & Performance Opérationnelle
    dispatch_delay_hours DECIMAL(6, 2),        -- Temps qualification -> assignation
    resolution_duration_hours DECIMAL(6, 2),    -- Temps assignation -> clôture (MTTR)
    travel_time_minutes INT,                   -- Durée déplacement estimée
    sla_hours_target INT NOT NULL,
    is_sla_breached BOOLEAN NOT NULL,          -- Dépassement SLA contractuel
    after_photo_verified BOOLEAN DEFAULT FALSE,-- Photo après travaux validée (US-06)
    estimated_waste_weight_kg INT,             -- Poids estimé des déchets ramassés
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. INDEX DE PERFORMANCE ANALYTIQUE (OLAP / POWER BI)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_fact_reports_date ON Fact_Reports(date_created_key);
CREATE INDEX IF NOT EXISTS idx_fact_reports_geo ON Fact_Reports(geo_key);
CREATE INDEX IF NOT EXISTS idx_fact_reports_cat_ai ON Fact_Reports(category_suggested_ai_key);
CREATE INDEX IF NOT EXISTS idx_fact_reports_cat_val ON Fact_Reports(category_validated_human_key);
CREATE INDEX IF NOT EXISTS idx_fact_reports_concordance ON Fact_Reports(is_ai_concordant);

CREATE INDEX IF NOT EXISTS idx_fact_interventions_team ON Fact_Interventions(team_key);
CREATE INDEX IF NOT EXISTS idx_fact_interventions_date_closed ON Fact_Interventions(date_closed_key);
CREATE INDEX IF NOT EXISTS idx_fact_interventions_sla ON Fact_Interventions(is_sla_breached);
CREATE INDEX IF NOT EXISTS idx_fact_interventions_report ON Fact_Interventions(report_key);

-- ==============================================================================
-- 4. VUES ANALYTIQUES POUR POWER BI (KPIs MAJEURS)
-- ==============================================================================

-- Vue 1: KPI MTTR & Taux de Respect SLA par Territoire
CREATE OR REPLACE VIEW View_KPI_Territory_Performance AS
SELECT 
    g.district_name,
    g.zone_type,
    c.category_label,
    COUNT(i.intervention_key) AS total_interventions,
    ROUND(AVG(i.resolution_duration_hours)::numeric, 2) AS avg_mttr_hours,
    ROUND(AVG(CASE WHEN i.is_sla_breached THEN 1.0 ELSE 0.0 END)::numeric * 100, 2) AS sla_breach_rate_percent,
    ROUND(AVG(CASE WHEN i.after_photo_verified THEN 1.0 ELSE 0.0 END)::numeric * 100, 2) AS compliance_after_photo_percent
FROM Fact_Interventions i
JOIN Dim_Geography g ON i.geo_key = g.geo_key
JOIN Dim_Category c ON i.category_key = c.category_key
GROUP BY g.district_name, g.zone_type, c.category_label;

-- Vue 2: Taux de Concordance IA vs Décision Humaine (US-10)
CREATE OR REPLACE VIEW View_KPI_AI_Accuracy AS
SELECT 
    m.model_name,
    m.model_version,
    cat_ai.category_label AS ai_predicted_category,
    cat_val.category_label AS human_validated_category,
    COUNT(r.report_key) AS occurrences,
    ROUND(AVG(CASE WHEN r.is_ai_concordant THEN 1.0 ELSE 0.0 END)::numeric * 100, 2) AS concordance_accuracy_percent,
    ROUND(AVG(r.ai_confidence_score)::numeric, 4) AS avg_confidence
FROM Fact_Reports r
JOIN Dim_AI_Model m ON r.ai_model_key = m.model_key
JOIN Dim_Category cat_ai ON r.category_suggested_ai_key = cat_ai.category_key
JOIN Dim_Category cat_val ON r.category_validated_human_key = cat_val.category_key
GROUP BY m.model_name, m.model_version, cat_ai.category_label, cat_val.category_label;
