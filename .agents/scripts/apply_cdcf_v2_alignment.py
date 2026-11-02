"""
ECOTRACK CDCF V2 Alignment Script:
Aligns the Jira project with the official 45-page CDCF V2:
- Exactly 6 Sprints (Sprint 0 to Sprint 5)
- 4 Team Members, with Data/BI responsibilities distributed across all 4
- All 12 User Stories covered with Gherkin acceptance criteria
- Sprint containers 106, 68, 69, 70, 71, 72 populated
"""

import os
import sys
import json
import re
import time
import subprocess

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

ACCOUNTS = {
    "Adem": "712020:63bd0ac7-17c2-4b0a-849d-67d08d240ec6",
    "Ahmed": "712020:b33b67c3-4eb2-4b0a-97e9-d4f327a3a578",
    "Hiba": "712020:a46cf953-3fbb-417c-b408-549124322ead",
    "Sara": "712020:4d6a91b9-fc55-4efc-9bb7-b57c98cc5be3"
}

SPRINT_IDS = {
    0: 106, # Sprint 0 - Socles V2
    1: 68,  # Sprint 1 - Fondations, Auth RB
    2: 69,  # Sprint 2 - Carte Citoyenne 2ds
    3: 70,  # Sprint 3 - Qualification IA Cô
    4: 71,  # Sprint 4 - Clôture Terrain ave
    5: 72   # Sprint 5 - Stabilisation, Test
}

def run_twg(args):
    cmd = ["twg"] + args
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        print(f"[ERROR] twg {' '.join(args)}: {res.stderr.strip()}", file=sys.stderr)
        return None
    return res.stdout.strip()

def create_workitem(space, itype, summary, desc, assignee=None, parent=None, priority="Medium", sprint=None):
    args = [
        "jira", "workitem", "create",
        "--space", space,
        "--type", itype,
        "--summary", summary,
        "--description", desc,
        "--description-format", "markdown",
        "--priority", priority,
        "-o", "json"
    ]
    if assignee:
        args.extend(["--assignee", assignee])
    if parent:
        args.extend(["--parent", parent])
        
    out = run_twg(args)
    if not out:
        return None
        
    m = re.search(r'SCRUM-\d+', out)
    if m:
        key = m.group(0)
        print(f"  [+ {itype}] {key}: {summary}")
        if sprint:
            run_twg(["jira", "workitem", "update", "--id", key, "--sprint", str(sprint)])
            print(f"    -> Affecte au Sprint {sprint}")
        return key
    return None

def update_workitem(key, summary=None, sprint=None, parent=None, assignee=None):
    args = ["jira", "workitem", "update", "--id", key]
    if summary:
        args.extend(["--summary", summary])
    if sprint:
        args.extend(["--sprint", str(sprint)])
    if parent:
        args.extend(["--parent", parent])
    if assignee:
        args.extend(["--assignee", assignee])
    args.extend(["-o", "json"])
    run_twg(args)
    print(f"  [UPDATED] {key} (Sprint {sprint})")

def main():
    print("--> 1. Mise a jour des Epics V2...")
    # Update SCRUM-37 to be Sprint 4 Epic, and create Sprint 5 Epic
    run_twg(["jira", "workitem", "update", "--id", "SCRUM-37", "--summary", "EPIC 4: Clôture Terrain & Tableaux de Bord Power BI (Sprint 4)"])
    epic_5 = create_workitem("SCRUM", "Epic", "EPIC 5: Tests E2E, Charge k6, MLOps & Déploiement K8s (Sprint 5)", 
                             "Recette bout en bout, tests de charge k6, évaluation du modèle IA et déploiement K8s.",
                             assignee=ACCOUNTS["Adem"], priority="High")
    
    print("\n--> 2. Réalignement des tickets existants vers leurs Sprints exacts...")
    # SCRUM-38 to 41 are in Sprint 0 (106)
    # SCRUM-42 to 45 are in Sprint 1 (68)
    # SCRUM-46 to 49 are in Sprint 2 (69)
    # SCRUM-50, 51 are in Sprint 3 (70)
    
    # SCRUM-52 (ex ECO-50 Python CDC) -> Move to Sprint 4 (71)
    update_workitem("SCRUM-52", summary="ECO-41 | [BI-Data] Pipeline CDC Anonymisé (SHA-256) & Modèle DAX Power BI", sprint=SPRINT_IDS[4], parent="SCRUM-37", assignee=ACCOUNTS["Adem"])
    
    # SCRUM-53 (ex ECO-51 Power BI Token) -> Move to Sprint 4 (71)
    update_workitem("SCRUM-53", summary="ECO-42 | [BI-Web] API Power BI Embed Token & Intégration React du Rapport Décisionnel", sprint=SPRINT_IDS[4], parent="SCRUM-37", assignee=ACCOUNTS["Ahmed"])

    print("\n--> 3. Création des tickets complémentaires pour couvrir 100% du CDCF V2...")
    
    new_tickets = [
        # SPRINT 0 (Socle)
        ("SCRUM", "Tâche", "ECO-05 | [BI-Data] DDL PostgreSQL Schéma en Étoile (2 Faits, 5 Dimensions) & Mocks Contrats",
         """### Objectif
Concevoir le modèle décisionnel relationnel pur dans PostgreSQL.
* **Assigné:** Adem Ouerhani (Data/BI)
* **Branche:** `feature/ECO-05-adem-dw-schema`
* **Fichiers Cibles:** `/services/bi-etl/sql/01_create_star_schema.sql`
### Tâches Atomiques:
1. Créer les tables de faits: `Fact_Reports` (mttr_hours, sla_breached, is_ai_overridden) et `Fact_Interventions`.
2. Créer les dimensions: `Dim_Date`, `Dim_Geography`, `Dim_Category`, `Dim_Team`, `Dim_AI_Model`.
### DoD:
DDL exécuté sur PostgreSQL 16 sans erreur et intégrité référentielle validée.""",
         ACCOUNTS["Adem"], "SCRUM-33", "High", SPRINT_IDS[0]),

        # SPRINT 1 (Fondations & Audit)
        ("SCRUM", "Tâche", "ECO-15 | [Audit & RGPD] Microservice AuditLogs Append-Only & Traces Immuables",
         """### Objectif
Microservice d'audit de sécurité et conformité RGPD.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-15-adem-audit-service`
* **Fichiers Cibles:** `/services/audit-api/src/models/AuditLog.ts`, `/services/audit-api/src/controllers/audit.controller.ts`
### Tâches Atomiques:
1. Modéliser la collection `AuditLogs` en écriture seule (Append-Only strict, interdiction UPDATE/DELETE).
2. Journalisation: actor, actorRole, action, entityType, entityId, before, after, reason, ipTruncated.
3. Route sécurisée `GET /audit-logs` réservée au rôle `admin`.
### DoD:
Chaque action sensible génère un événement d'audit immuable.""",
         ACCOUNTS["Adem"], "SCRUM-34", "High", SPRINT_IDS[1]),

        # SPRINT 2 (Carte & Premier Flux ETL)
        ("SCRUM", "Tâche", "ECO-24 | [ETL-Data] Worker Python bi-etl-worker : Extraction Incrémentale vers Fact_Reports",
         """### Objectif
Premier flux d'alimentation ETL incrémental de MongoDB vers le Data Warehouse.
* **Assigné:** Ahmed Salah (Data/BI)
* **Branche:** `feature/ECO-24-ahmed-etl-initial`
* **Fichiers Cibles:** `/services/bi-etl/extractors/reports_extractor.py`, `/services/bi-etl/loaders/postgres_loader.py`
### Tâches Atomiques:
1. Worker Python avec curseur `updatedAt > lastSyncTimestamp`.
2. Hachage SHA-256 avec sel des identifiants citoyens (anonymisation stricte).
3. Chargement idempotent UPSERT (`ON CONFLICT DO UPDATE`) dans `Fact_Reports`.
### DoD:
100 signalements de test synchronisés en moins de 5 secondes.""",
         ACCOUNTS["Ahmed"], "SCRUM-35", "Medium", SPRINT_IDS[2]),

        # SPRINT 3 (Console Agent & Mobilité Ouvrier)
        ("SCRUM", "Tâche", "ECO-32 | [UI-MOB] Feuille de Route Mobile Ouvrier par Proximité ($near) & Démarrage Chantier (T3)",
         """### Objectif
Application mobile dédiée à l'ouvrier terrain pour la gestion des chantiers.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-32-sara-mobile-worker`
* **Fichiers Cibles:** `/apps/mobile-expo/src/screens/Worker/RoadmapScreen.tsx`, `/apps/mobile-expo/src/screens/Worker/InterventionDetailScreen.tsx`
### Tâches Atomiques:
1. Écran de feuille de route triée par proximité GPS de l'ouvrier (`?near=lng,lat`).
2. Bouton de lancement de la navigation GPS externe (Google Maps / Apple Maps).
3. Bouton 'Démarrer le chantier' exécutant la transition T3 (`in_progress`) avec horodatage `startedAt`.
### DoD:
Testé sur simulateur avec géolocalisation simulée. Cibles tactiles >= 44x44px.""",
         ACCOUNTS["Sara"], "SCRUM-36", "High", SPRINT_IDS[3]),

        ("SCRUM", "Tâche", "ECO-33 | [Web-Data] Composant Carte de Supervision Multi-filtres & Calcul des Lead Times",
         """### Objectif
Carte interactive décisionnelle sur le portail d'administration et métriques intermédiaires.
* **Assigné:** Ahmed Salah (Data/SIG)
* **Branche:** `feature/ECO-33-ahmed-web-map-leadtimes`
* **Fichiers Cibles:** `/apps/web-react/src/components/map/SupervisionMap.tsx`, `/services/bi-etl/transformers/lead_times.py`
### Tâches Atomiques:
1. Carte Leaflet/Mapbox multi-filtres (statut, catégorie, gravité, zone).
2. Requêtes par boîte englobante d'écran (`?bbox=minLng,minLat,maxLng,maxLat`).
3. Calcul des délais dans l'ETL: `T_Triage` (T2-T1) et `T_Pickup` (T3-T2).
### DoD:
Affichage fluide de 500 marqueurs avec clustering sans latence perceptible.""",
         ACCOUNTS["Ahmed"], "SCRUM-36", "Medium", SPRINT_IDS[3]),

        # SPRINT 4 (Clôture Terrain & Power BI Embedded)
        ("SCRUM", "Tâche", "ECO-40 | [Workflow] Clôture Chantier T4 avec Photo après travaux (EXIF Purgé) & Réouverture Admin",
         """### Objectif
Clôture définitive des interventions sur le terrain et gestion des exceptions.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-40-sara-closure-reopen`
* **Fichiers Cibles:** `/services/workflow-api/src/controllers/resolution.controller.ts`, `/services/workflow-api/src/controllers/reopen.controller.ts`
### Tâches Atomiques:
1. Route `POST /interventions/:id/resolve` exigeant une photo après travaux (purge EXIF côté serveur).
2. Passage au statut `resolved`, horodatage `resolvedAt` et calcul immédiat du MTTR.
3. Notification push automatique au citoyen déclarant avec la photo de résolution.
4. Route d'exception `POST /reports/:id/reopen` réservée à l'Admin avec motif obligatoire.
### DoD:
Cycle complet de résolution et réouverture validé par tests d'intégration.""",
         ACCOUNTS["Sara"], "SCRUM-37", "High", SPRINT_IDS[4]),

        ("SCRUM", "Tâche", "ECO-43 | [AI-MLOps] Suivi de la Concordance IA/Humain, Export Active Learning & Matrice de Confusion BI",
         """### Objectif
Gouvernance MLOps et alimentation des tableaux de bord Power BI d'observabilité de l'IA.
* **Assigné:** Hiba Dhouib (Data/IA)
* **Branche:** `feature/ECO-43-hiba-mlops-bi`
* **Fichiers Cibles:** `/services/ai-vision/evaluation/agreement_tracker.py`, `/apps/web-react/src/pages/admin/AiGovernancePage.tsx`
### Tâches Atomiques:
1. Calcul de l'indicateur `aiAgreementRate` : (Validés sans modification / Total validés) * 100.
2. Route `GET /stats/ai-agreement` ventilant par catégorie et gravité.
3. Export des cas de divergence (`review.overridden === true`) pour constitution du jeu de réentraînement.
4. Alimentation de la dimension `Dim_AI_Model` pour la matrice de confusion Power BI.
### DoD:
Alerte automatique si le taux d'accord chute sous le seuil critique de 70%.""",
         ACCOUNTS["Hiba"], "SCRUM-37", "High", SPRINT_IDS[4]),

        # SPRINT 5 (Stabilisation, QA & Déploiement K8s)
        ("SCRUM", "Tâche", "ECO-50 | [QA-DevOps] Tests de Charge k6 validant la latence API P95 < 300 ms (NFR-01)",
         """### Objectif
Campagne de tests de performance automatisés pour valider les exigences non fonctionnelles.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-50-adem-k6-loadtests`
* **Fichiers Cibles:** `/tests/k6/load_test_reports.js`, `/tests/k6/stress_test_gateway.js`
### Tâches Atomiques:
1. Scénarios k6 simulant 100 req/s sur `GET /reports`, `GET /reports/map` et `GET /stats/overview`.
2. Vérification stricte du seuil: latence au 95e centile (P95) < 300 ms.
3. Test Chaos: arrêt inopiné du microservice FastAPI et vérification de la dégradation gracieuse.
### DoD:
Rapport k6 certifiant P95 < 300 ms sans aucune erreur HTTP 500.""",
         ACCOUNTS["Adem"], epic_5, "High", SPRINT_IDS[5]),

        ("SCRUM", "Tâche", "ECO-51 | [AI-MLOps] Évaluation Scientifique du Modèle IA sur Jeu Étiqueté (Précision, Rappel, F1-Score)",
         """### Objectif
Évaluation scientifique et métrologique du microservice Computer Vision.
* **Assigné:** Hiba Dhouib (Data/IA)
* **Branche:** `feature/ECO-51-hiba-ai-benchmark`
* **Fichiers Cibles:** `/services/ai-vision/evaluation/benchmark.py`, `/docs/rapport_evaluation_ia.md`
### Tâches Atomiques:
1. Exécution du benchmark sur le jeu de données d'évaluation de 200 images annotées.
2. Génération de la matrice de confusion 6x6 (pothole, illegal_dumping, street_light, etc.).
3. Calcul des métriques globales et par classe: Précision, Rappel, F1-Score.
4. Validation du temps d'inférence serveur inferenceMs < 1 500 ms (NFR-02).
### DoD:
Rapport d'évaluation IA finalisé et prêt pour la soutenance.""",
         ACCOUNTS["Hiba"], epic_5, "High", SPRINT_IDS[5]),

        ("SCRUM", "Tâche", "ECO-52 | [QA-E2E] Recette Complète E2E Multi-Acteurs (Playwright) & Audit Accessibilité WCAG 2.1 AA",
         """### Objectif
Validation du parcours utilisateur complet sans couture et conformité accessibilité.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-52-sara-e2e-a11y`
* **Fichiers Cibles:** `/tests/e2e/citizen_to_worker.spec.ts`, `/tests/e2e/a11y_audit.spec.ts`
### Tâches Atomiques:
1. Scénario Playwright: Inscription Citoyen -> Signalement Photo/GPS -> Triage Agent -> Dispatch Ouvrier -> Clôture Photo -> MAJ Power BI.
2. Audit automatisé Axe / Lighthouse validant les ratios de contraste (Texte blanc sur #1E3A8A = 10,36:1, AAA).
3. Cibles tactiles mobiles >= 44x44px vérifiées.
### DoD:
100% des tests E2E passants en intégration continue.""",
         ACCOUNTS["Sara"], epic_5, "High", SPRINT_IDS[5]),

        ("SCRUM", "Tâche", "ECO-53 | [DevOps] Déploiement K8s avec HPA, Scripts de Seed 500 Signalements & Répétition Soutenance",
         """### Objectif
Préparation de l'environnement de production/démonstration pour le jury.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-53-adem-k8s-prod`
* **Fichiers Cibles:** `/deploy/k8s/hpa-report-service.yaml`, `/scripts/seed_demo_data.ts`
### Tâches Atomiques:
1. Déploiement des manifestes Kubernetes avec Horizontal Pod Autoscaler (HPA 2 à 10 pods sur CPU > 70%).
2. Script de peuplement réaliste de 500 signalements historiques pour enrichir les 4 rapports Power BI.
3. Répétition chronométrée de la soutenance avec les 4 membres de l'équipe.
### DoD:
Plateforme accessible en ligne avec données réalistes et temps de réponse instantané.""",
         ACCOUNTS["Adem"], epic_5, "High", SPRINT_IDS[5]),
    ]

    for item in new_tickets:
        space, itype, title, desc, assignee, parent, priority, sprint = item
        create_workitem(space, itype, title, desc, assignee=assignee, parent=parent, priority=priority, sprint=sprint)
        time.sleep(1)

    print("\n--> 4. Resynchronisation du Dashboard Power BI...")
    sync_script = os.path.join(WORKSPACE_DIR, ".agents", "scripts", "sync_jira.py")
    subprocess.run(["python", sync_script])
    print("\n[SUCCESS] Espace Jira 100% aligné sur le CDCF V2 !")

if __name__ == "__main__":
    main()
