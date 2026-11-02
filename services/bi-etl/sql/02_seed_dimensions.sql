-- ==============================================================================
-- ECOTRACK DATA WAREHOUSE - SEEDING INITIAL DES DIMENSIONS
-- Sprint 0: ECO-05 / SCRUM-55
-- ==============================================================================

SET search_path TO ecotrack_dw, public;

-- ==============================================================================
-- 1. SEED DIM_DATE (Génération de 2025 à 2030)
-- ==============================================================================
INSERT INTO Dim_Date (
    date_key,
    full_date,
    day_of_month,
    day_name,
    day_of_week,
    is_weekend,
    week_of_year,
    month_number,
    month_name,
    quarter,
    year_number,
    is_holiday
)
SELECT 
    TO_CHAR(datum, 'YYYYMMDD')::INT AS date_key,
    datum AS full_date,
    EXTRACT(DAY FROM datum)::INT AS day_of_month,
    TO_CHAR(datum, 'TMDay') AS day_name,
    EXTRACT(ISODOW FROM datum)::INT AS day_of_week,
    CASE WHEN EXTRACT(ISODOW FROM datum) IN (6, 7) THEN TRUE ELSE FALSE END AS is_weekend,
    EXTRACT(WEEK FROM datum)::INT AS week_of_year,
    EXTRACT(MONTH FROM datum)::INT AS month_number,
    TO_CHAR(datum, 'TMMonth') AS month_name,
    EXTRACT(QUARTER FROM datum)::INT AS quarter,
    EXTRACT(YEAR FROM datum)::INT AS year_number,
    FALSE AS is_holiday
FROM GENERATE_SERIES(
    '2025-01-01'::DATE,
    '2030-12-31'::DATE,
    '1 day'::INTERVAL
) AS datum
ON CONFLICT (date_key) DO NOTHING;

-- ==============================================================================
-- 2. SEED DIM_CATEGORY (Référentiel officiel CDCF V2)
-- ==============================================================================
INSERT INTO Dim_Category (category_code, category_label, description, default_priority, target_sla_hours, is_recyclable)
VALUES 
    ('DEPOT_SAUVAGE', 'Dépôt sauvage ordonnancé', 'Accumulation d ordures ménagères ou gravats en zone publique non autorisée', 'HAUTE', 24, FALSE),
    ('ENCOMBRANTS', 'Objets encombrants / Mobiliers', 'Matelas, électroménagers usagés, meubles jetés sur trottoir', 'MOYENNE', 48, TRUE),
    ('DECHETS_VERTS', 'Déchets végétaux et tailles d arbres', 'Branchages, feuilles, tontes d espaces verts municipaux ou privés', 'BASSE', 72, TRUE),
    ('GRAVATS_CHANTIER', 'Gravats et déblais de construction', 'Ciment, briques, carrelages issus de chantiers de rénovation', 'HAUTE', 36, FALSE),
    ('DECHETS_TOXIQUES', 'Déchets dangereux ou toxiques', 'Batteries usagées, peintures, solvants, produits chimiques ou amiante', 'CRITIQUE', 12, FALSE),
    ('DEBORDEMENT_BAC', 'Débordement de bacs / Conteneurs pleins', 'Conteneurs municipaux saturés nécessitant rotation immédiate', 'HAUTE', 18, TRUE)
ON CONFLICT (category_code) DO NOTHING;

-- ==============================================================================
-- 3. SEED DIM_GEOGRAPHY (Districts & Quartiers Pilotes)
-- ==============================================================================
INSERT INTO Dim_Geography (district_code, district_name, neighborhood, zone_type, postal_code, latitude_centroid, longitude_centroid)
VALUES 
    ('DIST_TUN_CTR', 'Tunis Centre', 'Bab Bhar / Lafayette', 'Centre Urbain Dense', '1000', 36.800200, 10.180000),
    ('DIST_TUN_CTR', 'Tunis Centre', 'Belvédère', 'Parc & Résidentiel', '1002', 36.818500, 10.175000),
    ('DIST_MARSA', 'La Marsa', 'Marsa Plage', 'Zone Côtière Touristique', '2070', 36.882000, 10.328000),
    ('DIST_MARSA', 'La Marsa', 'Gammarth Supérieur', 'Résidentiel & Hôtelier', '2078', 36.908000, 10.298000),
    ('DIST_ARIANA', 'Ariana Ville', 'Ariana Supérieur / Ennasr', 'Résidentiel Dense', '2037', 36.862000, 10.160000),
    ('DIST_CHARGUIA', 'Zone Industrielle', 'La Charguia 1 & 2', 'Industriel & Logistique', '2035', 36.845000, 10.210000)
ON CONFLICT (district_name, neighborhood) DO NOTHING;

-- ==============================================================================
-- 4. SEED DIM_TEAM (Équipes Municipales d Intervention)
-- ==============================================================================
INSERT INTO Dim_Team (team_code, team_name, specialty, supervisor_name, worker_count, vehicle_type)
VALUES 
    ('EQP_VOIRIE_01', 'Brigade Voirie & Salubrité Centre', 'Nettoyage & Collecte', 'M. Karim Ben Salah', 4, 'Camion Benne 12T'),
    ('EQP_LOURD_02', 'Section Évacuation Gravats & Encombrants', 'Évacuation Lourde', 'M. Nizar Mansour', 3, 'Tractopelle & Benne Basculante'),
    ('EQP_VERTS_03', 'Cellule Espaces Verts & Élagage', 'Compostage & Végétaux', 'Mme Amel Triki', 4, 'Camion Plateau avec Broyeur'),
    ('EQP_URG_04', 'Brigade Rapide d Intervention Salubrité', 'Urgences & Risques Sanitaires', 'M. Tarak Zidi', 2, 'Fourgonnette Équipée EPI'),
    ('EQP_COTE_05', 'Brigade Littoral & Plages', 'Nettoyage Côtiers', 'Mme Sonia Chaabane', 5, 'Tracteur Cribleuse de Plage')
ON CONFLICT (team_code) DO NOTHING;

-- ==============================================================================
-- 5. SEED DIM_AI_MODEL (Modèles IA Déployés en Production)
-- ==============================================================================
INSERT INTO Dim_AI_Model (model_name, model_version, model_architecture, deployed_at, confidence_threshold)
VALUES 
    ('YOLOv8x-EcoTrack', 'v1.0.0-baseline', 'Ultralytics YOLOv8x PyTorch', '2026-09-15', 0.50),
    ('YOLOv8x-EcoTrack', 'v2.1.0', 'ONNX Runtime Optimized ViT/YOLO', '2026-10-20', 0.65),
    ('EfficientNetV2-EcoWaste', 'v2.0.0', 'CNN Transfer Learning Keras', '2026-10-10', 0.60)
ON CONFLICT (model_name, model_version) DO NOTHING;
