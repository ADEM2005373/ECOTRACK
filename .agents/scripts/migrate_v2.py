"""
ECOTRACK V2 Migration Script:
1. Backs up current Jira V1 items to dashboard/backup_jira_v1.json.
2. Deletes all old 29 Jira items.
3. Creates the clean, hyper-granular V2 Epics and Tasks in project SCRUM.
4. Triggers dashboard resynchronization.
"""

import os
import sys
import json
import re
import time
import subprocess

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DASHBOARD_DIR = os.path.join(WORKSPACE_DIR, "dashboard")
BACKUP_FILE = os.path.join(DASHBOARD_DIR, "backup_jira_v1.json")

# Team Account IDs on ouerhaniadem0805.atlassian.net
ACCOUNTS = {
    "Adem": "712020:63bd0ac7-17c2-4b0a-849d-67d08d240ec6",
    "Ahmed": "712020:b33b67c3-4eb2-4b0a-97e9-d4f327a3a578",
    "Hiba": "712020:a46cf953-3fbb-417c-b408-549124322ead",
    "Sara": "712020:4d6a91b9-fc55-4efc-9bb7-b57c98cc5be3"
}

def run_twg(args):
    cmd = ["twg"] + args
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        print(f"[ERROR] twg {' '.join(args)} failed: {res.stderr.strip()}", file=sys.stderr)
        return None
    return res.stdout.strip()

def backup_current_issues():
    print("--> 1. Sauvegarde des 29 tickets Jira actuels...")
    raw = run_twg(["jira", "workitem", "query", "--jql", "project = SCRUM", "-o", "json"])
    if not raw:
        print("[ERROR] Impossible de récupérer les tickets pour sauvegarde.")
        sys.exit(1)
        
    m = re.search(r'stdout:\s*"([^"]+)"', raw)
    if m:
        tmp_path = m.group(1).replace("\\\\", "\\")
        if os.path.exists(tmp_path):
            with open(tmp_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = json.loads(raw)
    else:
        data = json.loads(raw)
        
    os.makedirs(DASHBOARD_DIR, exist_ok=True)
    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    issues = data.get("data", {}).get("issues", [])
    print(f"    [OK] Sauvegarde effectuée dans {BACKUP_FILE} ({len(issues)} tickets).")
    return [i["key"] for i in issues]

def delete_old_issues(keys):
    print(f"--> 2. Suppression définitive des {len(keys)} anciens tickets...")
    # Delete subtasks first, then tasks, then epics
    # Numerical sort reverse helps (e.g. higher keys created later often childs)
    for key in keys:
        print(f"    Suppression de {key}...")
        res = run_twg(["jira", "workitem", "delete", key, "--delete-subtasks", "true"])
        time.sleep(0.5)
    print("    [OK] Nettoyage terminé.")

def create_workitem(space, itype, summary, desc, assignee=None, parent=None, priority="Medium"):
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
        
    # Extract created key
    m = re.search(r'SCRUM-\d+', out)
    if m:
        key = m.group(0)
        print(f"    [+ {itype}] {key}: {summary}")
        return key
    else:
        print(f"    [+ {itype}] (created) {summary}")
        return None

def main():
    old_keys = backup_current_issues()
    delete_old_issues(old_keys)
    
    print("\n--> 3. Création des 5 Epics V2 dans Jira...")
    epics_def = [
        ("EPIC 0: Infrastructure, DevOps & Repo Setup (Sprint 0)", "Mise en place de l'architecture Nx Monorepo, Docker Compose et socles applicatifs.", ACCOUNTS["Adem"]),
        ("EPIC 1: Identity, JWT & RBAC (Sprint 1)", "Gestion des utilisateurs, authentification JWT RS256, Refresh Tokens et rôles RBAC.", ACCOUNTS["Adem"]),
        ("EPIC 2: Core Report & Media Service (Sprint 2)", "Collecte des signalements, géolocalisation 2dsphere, purge EXIF et classification IA.", ACCOUNTS["Ahmed"]),
        ("EPIC 3: Workflow State Machine & Dispatch (Sprint 3)", "Moteur d'états d'intervention, validation citoyenne et écran d'arbitrage Mairie.", ACCOUNTS["Sara"]),
        ("EPIC 4: Power BI ETL & Analytics (Sprint 5)", "Pipeline ETL Python, anonymisation RGPD et intégration Power BI RLS.", ACCOUNTS["Adem"]),
    ]
    
    created_epics = {}
    for idx, (title, desc, owner) in enumerate(epics_def):
        key = create_workitem("SCRUM", "Epic", title, desc, assignee=owner, priority="High")
        created_epics[idx] = key
        time.sleep(1)

    print("\n--> 4. Création des 16 Tâches Techniques Hyper-Granulaires V2...")
    
    tasks_def = [
        # EPIC 0 (Sprint 0)
        (0, "ECO-01 | [DevOps] Initialize Nx Monorepo & CI/CD", 
         """### Objectif
Initialiser l'architecture Nx Monorepo et les pipelines CI/CD.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-01-adem-nx-init`
* **Fichiers Cibles:** `nx.json`, `.github/workflows/ci.yml`, `docker-compose.yml`
### Tâches Atomiques:
1. `npx create-nx-workspace@latest ecotrack --preset=apps`
2. Configurer `.github/workflows/ci.yml` (lint, test, build-docker)
3. Configurer `docker-compose.yml` (MongoDB 7, Postgres 16, Redis 7, RabbitMQ, MinIO)
### DoD:
`docker compose up -d` démarre tous les conteneurs sans crash.""", ACCOUNTS["Adem"]),

        (0, "ECO-02 | [UI-MOB] Initialize Expo App & Design Tokens",
         """### Objectif
Scaffolding du projet mobile Expo et implémentation de la charte graphique CDCF.
* **Assigné:** Ahmed Salah
* **Branche:** `feature/ECO-02-ahmed-expo-init`
* **Fichiers Cibles:** `/apps/mobile/app.json`, `/apps/mobile/src/theme/colors.ts`, `/apps/mobile/src/theme/typography.ts`
### Tâches Atomiques:
1. Init Expo SDK router. Installer `react-native-reanimated`, `zustand`, `@tanstack/react-query`.
2. Définir `colors.ts` (Primary: `#059669`, Secondary: `#1E3A8A`).
3. Setup polices `PlusJakartaSans-Bold` et `Inter-Regular`.
### DoD:
L'écran d'accueil Expo démarre sur simulateur iOS et émulateur Android.""", ACCOUNTS["Ahmed"]),

        (0, "ECO-03 | [AI] Initialize FastAPI & PyTorch Environment",
         """### Objectif
Initialiser le microservice IA pour la classification de photos d'incidents.
* **Assigné:** Hiba Dhouib
* **Branche:** `feature/ECO-03-hiba-fastapi-init`
* **Fichiers Cibles:** `/services/ai-vision/requirements.txt`, `/services/ai-vision/main.py`, `/services/ai-vision/Dockerfile`
### Tâches Atomiques:
1. `requirements.txt`: fastapi, uvicorn, torch, torchvision, pillow, pydantic.
2. Endpoint `GET /health` renvoyant le statut GPU/CPU.
3. Multi-stage Dockerfile basé sur `python:3.11-slim`.
### DoD:
`curl http://localhost:8000/health` renvoie HTTP 200 `{"status": "ok"}`.""", ACCOUNTS["Hiba"]),

        (0, "ECO-04 | [UI-WEB] Initialize React Vite & Tailwind CSS",
         """### Objectif
Initialiser l'application Web de supervision React avec Vite et TailwindCSS.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-04-sara-react-init`
* **Fichiers Cibles:** `/apps/web/tailwind.config.js`, `/apps/web/src/App.tsx`, `/apps/web/src/components/ui/Button.tsx`
### Tâches Atomiques:
1. React Vite + SWC avec TailwindCSS, `lucide-react`, `react-router-dom`.
2. Configuration palette HEX CDCF V2 (`#059669`, `#1E3A8A`).
3. Composant atomique `<Button />` (variants primary, secondary, destructive).
### DoD:
`npm run dev` compile et affiche le Storybook/Page de test.""", ACCOUNTS["Sara"]),

        # EPIC 1 (Sprint 1)
        (1, "ECO-11 | [DB] Create User Mongoose Schema & Hashing Logic",
         """### Objectif
Modéliser le schéma User et sécuriser le hachage des mots de passe.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-11-adem-user-schema`
* **Fichiers Cibles:** `/packages/db/src/models/User.ts`, `/packages/db/src/utils/hash.ts`
### Tâches Atomiques:
1. Schéma User: email unique, passwordHash (select: false), rôle ('citizen', 'agent', 'worker', 'admin').
2. Hachage sécurisé avec `argon2.hash` (`type: argon2.argon2id`).
3. Fonction `verifyPassword(hash, plain)`.
### DoD:
Tests unitaires `test:db` validés sans mot de passe en clair dans les logs.""", ACCOUNTS["Adem"]),

        (1, "ECO-12 | [API] Build POST /auth/register Route",
         """### Objectif
Développer l'API d'inscription citoyenne avec validation Zod.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-12-sara-register-api`
* **Fichiers Cibles:** `/services/identity-api/src/routes/auth.routes.ts`, `/services/identity-api/src/controllers/register.controller.ts`
### Tâches Atomiques:
1. Schema Zod `RegisterDto` (email valide, mot de passe complexe >= 10 chars).
2. Contrôle d'unicité email (HTTP 409 Conflict si existant).
3. Enregistrement sécurisé avec rôle forcé à 'citizen'.
### DoD:
Tests d'intégration Supertest (201 Created, 400 Bad Request, 409 Conflict).""", ACCOUNTS["Sara"]),

        (1, "ECO-13 | [UI-MOB] Build Mobile Registration Screen",
         """### Objectif
Développer l'écran mobile React Native d'inscription citoyenne.
* **Assigné:** Ahmed Salah
* **Branche:** `feature/ECO-13-ahmed-mobile-register`
* **Fichiers Cibles:** `/apps/mobile-expo/src/screens/Auth/RegisterScreen.tsx`, `/apps/mobile-expo/src/store/authStore.ts`
### Tâches Atomiques:
1. Formulaire `react-hook-form` avec validation Zod.
2. Champs avec bordures adaptatives et bouton de validation.
3. Intégration appel API `/api/v1/auth/register` avec toast de confirmation.
### DoD:
Testé sur simulateur iOS et émulateur Android (cibles tactiles 44x44px).""", ACCOUNTS["Ahmed"]),

        (1, "ECO-14 | [API] Build POST /auth/login with RS256 & Redis Rate Limit",
         """### Objectif
Endpoint de connexion haute sécurité avec signatures asymétriques RS256 et rate-limiting Redis.
* **Assigné:** Hiba Dhouib
* **Branche:** `feature/ECO-14-hiba-login-api`
* **Fichiers Cibles:** `/services/identity-api/src/controllers/login.controller.ts`, `/services/identity-api/src/services/jwt.service.ts`
### Tâches Atomiques:
1. Rate limit Redis: 5 tentatives max par IP -> HTTP 429.
2. Vérification Argon2.
3. Génération Access Token JWT (RS256, durée 15m) et Refresh Token révocable en base.
### DoD:
Vérification de signature JWT avec clé publique.""", ACCOUNTS["Hiba"]),

        # EPIC 2 (Sprint 2)
        (2, "ECO-20 | [DB] Create Report Schema & 2dsphere Index",
         """### Objectif
Modéliser les signalements géoréférencés et créer l'index spatial MongoDB.
* **Assigné:** Ahmed Salah
* **Branche:** `feature/ECO-20-ahmed-report-schema`
* **Fichiers Cibles:** `/packages/db/src/models/Report.ts`
### Tâches Atomiques:
1. Champs: reporter (ref User), description, photos, statut.
2. Coordonnées GeoJSON: `{ type: 'Point', coordinates: [lng, lat] }`.
3. Index spatial `ReportSchema.index({ location: '2dsphere' })`.
### DoD:
Requête `$near` testée et validée sur un jeu d'essai.""", ACCOUNTS["Ahmed"]),

        (2, "ECO-21 | [API] Build Media Service (Sharp EXIF Purge & S3)",
         """### Objectif
Service de traitement et stockage d'images avec purge RGPD des métadonnées EXIF GPS.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-21-adem-media-api`
* **Fichiers Cibles:** `/services/media-api/src/controllers/upload.controller.ts`, `/services/media-api/src/utils/sharp.util.ts`
### Tâches Atomiques:
1. Multer memory storage (limite 10MB).
2. Sharp: Redimensionnement max 1920px et `.withMetadata(false)` pour supprimer les tags EXIF.
3. Upload S3/MinIO via AWS SDK v3 `PutObjectCommand`.
### DoD:
Image de test vérifiée avec `exiftool` (0 métadonnée résiduelle).""", ACCOUNTS["Adem"]),

        (2, "ECO-22 | [AI] Build FastAPI Image Classification Route",
         """### Objectif
API d'inférence FastAPI pour la qualification automatique des anomalies de voirie.
* **Assigné:** Hiba Dhouib
* **Branche:** `feature/ECO-22-hiba-ai-fastapi`
* **Fichiers Cibles:** `/services/ai-vision/routers/classify.py`, `/services/ai-vision/services/vision_model.py`
### Tâches Atomiques:
1. Endpoint `POST /v1/classify` recevant l'image.
2. Inférence MobileNetV3 avec normalisation Torchvision.
3. Calcul des scores Softmax de confiance (0.0 à 1.0).
### DoD:
Latence d'inférence < 500ms sur CPU de développement.""", ACCOUNTS["Hiba"]),

        (2, "ECO-23 | [API] Combine Creation & Emit 'report.created'",
         """### Objectif
Endpoint de signalement citoyen asynchrone avec bus d'événements RabbitMQ.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-23-sara-report-creation`
* **Fichiers Cibles:** `/services/report-api/src/controllers/report.controller.ts`, `/packages/events/src/publishers/ReportCreatedPublisher.ts`
### Tâches Atomiques:
1. `POST /reports` multipart: transmission média à ECO-21.
2. Enregistrement du rapport dans MongoDB.
3. Publication de l'événement `report.created` sur l'échange RabbitMQ `ecotrack.events`.
### DoD:
Réponse HTTP 201 instantanée à l'application mobile.""", ACCOUNTS["Sara"]),

        # EPIC 3 (Sprint 3)
        (3, "ECO-30 | [API] Build Workflow Guard Service (T1 - T4)",
         """### Objectif
Moteur d'état d'intervention et gardes de transition T1 à T4.
* **Assigné:** Sara Shih
* **Branche:** `feature/ECO-30-sara-state-machine`
* **Fichiers Cibles:** `/services/workflow-api/src/services/state-machine.service.ts`
### Tâches Atomiques:
1. Implémenter la machine à états finis des interventions.
2. Garde T2: Validation requise par l'agent de mairie avant assignation ouvrier.
3. Garde T3: Seul l'ouvrier assigné peut démarrer l'intervention.
4. Historisation des changements d'états avec horodatage et auteur.
### DoD:
Transition illégale renvoie HTTP 409 INVALID_TRANSITION.""", ACCOUNTS["Sara"]),

        (3, "ECO-31 | [UI-WEB] Build Agent Qualification Split-Screen",
         """### Objectif
Interface Web de qualification d'incidents pour les agents de mairie.
* **Assigné:** Hiba Dhouib
* **Branche:** `feature/ECO-31-hiba-web-qualification`
* **Fichiers Cibles:** `/apps/web-react/src/pages/agent/QualificationPage.tsx`
### Tâches Atomiques:
1. Vue split-screen (Photo HD zoomable à gauche, formulaire d'arbitrage à droite).
2. Badge de confiance IA (Vert >= 85%, Rouge < 60%).
3. Boutons d'action: 'Confirmer la suggestion IA' ou 'Surcharger manuellement'.
### DoD:
Action agent déclenche l'appel API de qualification et actualise la file d'attente.""", ACCOUNTS["Hiba"]),

        # EPIC 4 (Sprint 5)
        (4, "ECO-50 | [ETL] Build Python CDC & Anonymization Script",
         """### Objectif
Pipeline ETL de synchronisation des données MongoDB vers le Data Warehouse PostgreSQL pour Power BI.
* **Assigné:** Adem Ouerhani
* **Branche:** `feature/ECO-50-adem-bi-etl`
* **Fichiers Cibles:** `/services/bi-etl/main.py`, `/services/bi-etl/transformers.py`
### Tâches Atomiques:
1. Extraction incrémentale CDC depuis MongoDB (`updatedAt > last_sync`).
2. Anonymisation SHA-256 salée des identifiants citoyens.
3. Arrondi des coordonnées GPS à 3 décimales (précision ~100m) pour la table Dim_Geography.
4. Chargement par UPSERT dans la table `Fact_Reports` de PostgreSQL.
### DoD:
Exécution sans erreur et intégrité référentielle vérifiée dans Postgres.""", ACCOUNTS["Adem"]),

        (4, "ECO-51 | [BI] Generate Power BI Embed Token API",
         """### Objectif
Génération de jetons sécurisés Power BI Embedded avec Row-Level Security (RLS).
* **Assigné:** Ahmed Salah
* **Branche:** `feature/ECO-51-ahmed-powerbi-token`
* **Fichiers Cibles:** `/services/analytics-api/src/controllers/bi.controller.ts`
### Tâches Atomiques:
1. Authentification Service Principal Azure AD via `@azure/msal-node`.
2. Appel REST API Power BI `GenerateToken`.
3. Application du filtre RLS dynamique par rôle utilisateur et zone géographique.
### DoD:
Jeton retourné permet d'afficher le rapport Power BI dans le conteneur iframe web.""", ACCOUNTS["Ahmed"]),
    ]

    for epic_idx, title, desc, assignee in tasks_def:
        parent_epic = created_epics.get(epic_idx)
        create_workitem("SCRUM", "Tâche", title, desc, assignee=assignee, parent=parent_epic, priority="Medium")
        time.sleep(1)

    print("\n--> 5. Resynchronisation du Dashboard Power BI...")
    sync_script = os.path.join(WORKSPACE_DIR, ".agents", "scripts", "sync_jira.py")
    subprocess.run(["python", sync_script], capture_output=False)
    print("\n[SUCCESS] Migration V2 terminée avec succès !")

if __name__ == "__main__":
    main()
