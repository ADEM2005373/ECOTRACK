# 🌿 EcoTrack V2

**Plateforme Smart City de signalement et de résolution des anomalies urbaines** (dépôts sauvages, objets encombrants, voirie, éclairage…), conçue pour les municipalités tunisiennes.

Les citoyens signalent une anomalie depuis leur téléphone (photo + position GPS). Une IA de vision propose une catégorie, un agent de la mairie la qualifie puis l'affecte à une brigade, et le chef ouvrier clôture l'intervention avec une photo « après travaux ». Chaque étape est tracée dans un journal d'audit immuable.

---

## Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Rôles](#-rôles)
- [Architecture](#-architecture)
- [Structure du dépôt](#-structure-du-dépôt)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Lancer le projet en local](#-lancer-le-projet-en-local)
- [Déploiement hybride (Vercel + APK + tunnel)](#-déploiement-hybride-vercel--apk--tunnel)
  - [Démarrer le serveur de déploiement](#2-démarrer-le-serveur-de-déploiement-à-chaque-session-de-test) (`npm run deploy:start`)
- [Arrêter le projet](#-arrêter-le-projet)
- [Dépannage](#-dépannage)
- [Tests](#-tests)
- [Documentation](#-documentation)

---

## ✨ Fonctionnalités

- **Signalement citoyen mobile** : photo, géolocalisation, description ; la réclamation est routée automatiquement vers la mairie couvrant la position GPS.
- **IA de vision** (FastAPI + MobileNetV3) : classification de la photo et score de confiance.
- **Qualification par la mairie** : validation, correction ou rejet de la proposition IA.
- **Circuit de traitement contrôlé** (machine à états) :

  | Transition | Action | De → Vers | Qui |
  |---|---|---|---|
  | T1 | Qualifier | `NOUVEAU` → `EN_COURS_DE_VALIDATION` | Agent / Admin mairie |
  | T2 | Affecter à une brigade | `NOUVEAU` / `EN_COURS_DE_VALIDATION` / `VALIDE` → `ASSIGNE` | Agent / Admin mairie |
  | T3 | Démarrer l'intervention | `ASSIGNE` → `EN_TRAITEMENT` | Chef ouvrier / Ouvrier |
  | T4 | Clôturer (photo obligatoire) | `EN_TRAITEMENT` → `RESOLU` | Chef ouvrier / Ouvrier |
  | T5 | Rejeter (motif obligatoire) | `NOUVEAU` / `EN_COURS_DE_VALIDATION` / `VALIDE` → `REJETE` | Agent / Admin mairie |

- **Carte métropolitaine** des réclamations par territoire.
- **Journal d'audit immuable** (append-only, chaîné SHA-256, IP tronquée, conforme RGPD).
- **Tableaux de bord** par rôle et **entrepôt décisionnel** PostgreSQL (schéma en étoile) pour Power BI.

## 👥 Rôles

| Rôle | Application | Responsabilités |
|---|---|---|
| `CITOYEN` | Mobile | Crée des réclamations et suit leur avancement |
| `AGENT_MAIRIE` | Web | Qualifie les réclamations et les affecte aux brigades |
| `CHEF_OUVRIER` | Mobile | Démarre et clôture les interventions avec photo |
| `ADMIN_MUNICIPALITE` | Web | Supervise sa mairie (journal d'audit limité à son territoire) |
| `ADMIN_SAAS` | Web | Supervision globale multi-collectivités, gouvernance IA, audit global |

## 🏗 Architecture

```text
   Application web (React/Vite)          Application mobile (Expo)
                 │                                 │
                 └───────────────┬─────────────────┘
                                 ▼
                 Passerelle API Nginx (Docker, :8090)
                   CORS + routage /api/v1/* + /storage/
                                 │
   ┌──────────────┬──────────────┼──────────────┬──────────────┐
   ▼              ▼              ▼              ▼              ▼
identity-api   report-api   workflow-api    audit-api      ai-vision
   :3001         :3002          :3003          :3004          :8000
   │              │              │              │
   └──────────────┴──── MongoDB · Redis · RabbitMQ · MinIO · PostgreSQL (DW)
```

| Composant | Rôle | Port | Route passerelle |
|---|---|---|---|
| `services/identity-api` | Authentification JWT, comptes, rôles | 3001 | `/api/v1/auth` |
| `services/report-api` | Réclamations, GeoJSON, photos | 3002 | `/api/v1/reports` |
| `services/workflow-api` | Machine à états T1–T5, interventions | 3003 | `/api/v1/workflow`, `/api/v1/interventions` |
| `services/audit-api` | Journal d'audit immuable | 3004 | `/api/v1/audit` |
| `services/ai-vision` | Classification d'images (Python/FastAPI) | 8000 | `/api/v1/vision` |
| `services/bi-etl` | ETL vers l'entrepôt PostgreSQL (Python) | — | — |
| Passerelle Nginx | Point d'entrée unique | 8090 | — |
| MongoDB | Base opérationnelle (index géospatial 2dsphere) | 27017 | — |
| PostgreSQL | Entrepôt décisionnel (star schema) | 5432 | — |
| Redis / RabbitMQ / MinIO | Cache, file de messages, stockage des photos | 6379 / 5672 / 9000 | — |

## 📁 Structure du dépôt

```text
apps/
  web-react/       Console web (React 18, Vite, Tailwind, Leaflet)
  mobile/          Application Expo SDK 58 (citoyen & chef ouvrier)
services/          Microservices Node/TypeScript + IA et ETL Python
packages/
  shared/          Types et énumérations communs (statuts, rôles)
  db/              Connexion MongoDB et modèles Mongoose
  contracts/       Contrats d'API
deploy/
  docker/          Configuration Nginx de la passerelle
  k8s/             Manifestes Kubernetes
docs/              Cahier des charges, décisions, rapports
deploiment.md      Guide détaillé du déploiement hybride
```

## 🧰 Prérequis

- **Node.js 20+** et **npm 10+**
- **Python 3.11+** (pour `ai-vision`)
- **Docker Desktop**
- Pour le mobile : **Expo Go** sur le téléphone, ou un compte [expo.dev](https://expo.dev) pour construire l'APK

## 📦 Installation

```powershell
git clone https://github.com/ADEM2005373/ECOTRACK.git
cd ECOTRACK

# Dépendances de tout le monorepo (web, mobile, services, packages)
npm install

# Variables d'environnement
Copy-Item .env.example .env
Copy-Item apps/mobile/.env.example apps/mobile/.env

# Dépendances du service IA
pip install -r services/ai-vision/requirements.txt
```

Le service IA a besoin du fichier de poids du modèle indiqué par `AI_VISION_WEIGHTS` dans `.env` (voir `services/ai-vision/README.md`).

## ▶️ Lancer le projet en local

Les services lisent le fichier `.env` du dossier courant : lance-les **depuis la racine du dépôt**, chacun dans **son propre terminal**, et laisse les terminaux ouverts.

**1. Infrastructure Docker** (bases de données, passerelle, tunnel). Démarre d'abord Docker Desktop.

```powershell
docker compose up -d
```

> Si `NGROK_AUTHTOKEN` n'est pas défini dans `.env`, le conteneur `ecotrack-tunnel` ne pourra pas démarrer correctement : ce n'est pas gênant pour un usage purement local.

**2. Les 4 microservices**

```powershell
npx ts-node --project services/identity-api/tsconfig.json services/identity-api/src/index.ts
```
```powershell
npx ts-node services/report-api/src/index.ts
```
```powershell
npx ts-node services/workflow-api/src/index.ts
```
```powershell
npx ts-node services/audit-api/src/index.ts
```

**3. Le service IA**

```powershell
cd services/ai-vision
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**4. L'application web** → http://localhost:3000

```powershell
cd apps/web-react
npm run dev
```

**5. L'application mobile** (scanner le QR code avec Expo Go)

```powershell
cd apps/mobile
npx expo start
```

Sur un téléphone physique, `EXPO_PUBLIC_API_URL` dans `apps/mobile/.env` doit pointer vers l'IP de ton PC sur le réseau local (ex. `http://192.168.1.20:8090`), ou vers l'adresse du tunnel.

**Vérifier que tout répond**

```powershell
foreach ($p in 3001,3002,3003,3004,8000,8090) { "$p : " + (Invoke-WebRequest "http://localhost:$p/health" -UseBasicParsing).StatusCode }
```

Chaque ligne doit afficher `200`.

## 🌍 Déploiement hybride (Vercel + APK + tunnel)

Pour faire tester l'application à distance, le backend reste sur ton PC et il est exposé en HTTPS par un tunnel ngrok à domaine fixe. Le guide complet est dans [`deploiment.md`](deploiment.md).

```text
Site web (Vercel) ─┐
                   ├──► Tunnel HTTPS (ngrok) ──► Passerelle :8090 ──► services sur ton PC
APK Android ───────┘
```

Les testeurs n'ont **pas besoin d'être sur le même réseau** que ton PC : ils passent par l'adresse publique du tunnel. En revanche, **le site et l'application ne fonctionnent que lorsque le serveur de déploiement (ton PC) est lancé**.

### 1. Mise en place (une seule fois)

1. **Tunnel ngrok** : crée un compte gratuit sur [ngrok.com](https://ngrok.com), récupère ton *authtoken* et réserve ton domaine statique gratuit (*Domains*). Ajoute-les dans `.env` à la racine :

   ```dotenv
   NGROK_AUTHTOKEN=<ton-authtoken>
   NGROK_STATIC_DOMAIN=<ton-domaine>.ngrok-free.dev
   ```
2. **Site web sur Vercel** (dossier `apps/web-react`) : dans Vercel → *Settings* → *Environment Variables*, définis `VITE_API_URL=https://<ton-domaine-ngrok>`, puis déploie :

   ```powershell
   cd apps/web-react
   npx vercel login
   npx vercel --prod
   ```
3. **APK Android** : mets l'adresse du tunnel dans `EXPO_PUBLIC_API_URL` du profil `preview` de `apps/mobile/eas.json`, puis :

   ```powershell
   cd apps/mobile
   npx eas-cli login
   npx eas-cli build -p android --profile preview
   ```

   Le build tourne sur les serveurs d'Expo (tu peux éteindre ton PC pendant ce temps). Télécharge l'`.apk` depuis le lien du build et partage-le (lien, QR code ou fichier) avec les testeurs. Sur leur téléphone, ils doivent autoriser l'installation d'applications provenant de cette source.

### 2. Démarrer le serveur de déploiement (à chaque session de test)

**Méthode rapide : une seule commande** depuis la racine du dépôt.

```powershell
npm run deploy:start
```

Le script [`scripts/start-deployment.ps1`](scripts/start-deployment.ps1) :

1. démarre Docker Desktop si besoin, puis `docker compose up -d` (bases, passerelle et tunnel) ;
2. ouvre chaque service (4 microservices + IA) dans **sa propre fenêtre**, à laisser ouverte ; un service déjà lancé n'est pas relancé ;
3. vérifie que chaque service répond, puis que le **tunnel public** répond ;
4. affiche `Serveur de déploiement prêt` quand tout est OK, sinon les lignes `[KO]` à corriger.

Pour seulement vérifier l'état du serveur, sans rien démarrer :

```powershell
npm run deploy:check
```

Pense ensuite à **empêcher la mise en veille** du PC pendant la session (voir l'étape 5 ci-dessous).

**Méthode manuelle** : depuis la racine du dépôt, **chaque commande dans son propre terminal**, à laisser ouvert pendant toute la session :

1. Démarre **Docker Desktop** et attends qu'il soit prêt.
2. Infrastructure + passerelle + **tunnel** :

   ```powershell
   docker compose up -d
   docker ps
   ```

   Les 7 conteneurs doivent apparaître, dont `ecotrack-api-gateway` et `ecotrack-tunnel`.
3. Les 4 microservices :

   ```powershell
   npx ts-node --project services/identity-api/tsconfig.json services/identity-api/src/index.ts
   ```
   ```powershell
   npx ts-node services/report-api/src/index.ts
   ```
   ```powershell
   npx ts-node services/workflow-api/src/index.ts
   ```
   ```powershell
   npx ts-node services/audit-api/src/index.ts
   ```
4. Le service IA :

   ```powershell
   cd services/ai-vision
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
5. **Empêche la mise en veille** du PC pendant la session : *Paramètres Windows* → *Système* → *Alimentation* → mise en veille sur *Jamais* (sur secteur).

Le site Vercel et l'APK n'ont rien à relancer : ils se reconnectent tout seuls dès que le serveur répond.

### 3. Vérifier que le serveur est joignable depuis Internet

`npm run deploy:check` fait toutes ces vérifications d'un coup. À la main :

```powershell
# Services locaux : chaque ligne doit afficher 200
foreach ($p in 3001,3002,3003,3004,8000,8090) { "$p : " + (Invoke-WebRequest "http://localhost:$p/health" -UseBasicParsing).StatusCode }

# Passage par le tunnel public : doit renvoyer {"status":"healthy",...}
curl.exe -H "ngrok-skip-browser-warning: true" https://<ton-domaine-ngrok>/health
```

Si le test local passe mais pas le tunnel, consulte les journaux du tunnel :

```powershell
docker logs --tail 30 ecotrack-tunnel
```

Pour finir, connecte-toi sur le site Vercel et vérifie qu'une page avec des données (liste des réclamations, carte) se charge.

### 4. Mettre à jour après une modification du code

| Ce qui a changé | Quoi faire |
|---|---|
| Un microservice (`services/*`) | `Ctrl+C` dans son terminal, puis relancer la même commande |
| La passerelle (`deploy/docker/nginx.conf`) | `docker exec ecotrack-api-gateway nginx -s reload` |
| Le site web (`apps/web-react`) | `cd apps/web-react` puis `npx vercel --prod` |
| L'application mobile (`apps/mobile`) | Refaire un build APK et le redistribuer aux testeurs |
| L'adresse du tunnel | Mettre à jour `VITE_API_URL` sur Vercel (puis redéployer) **et** `eas.json` (puis rebuild APK) |

### 5. Arrêter le serveur de déploiement

1. `Ctrl+C` dans le terminal (ou la fenêtre ouverte par le script) de chaque service (4 microservices + IA).
2. Arrêter les conteneurs (les données sont conservées) :

   ```powershell
   docker compose down
   ```

Préviens tes testeurs : tant que le serveur est arrêté, le site et l'application affichent des erreurs de connexion. Pensez à vous mettre d'accord sur des créneaux de test.

## ⏹ Arrêter le projet

- Services, IA, web, mobile : `Ctrl+C` dans chaque terminal.
- Conteneurs Docker (les données sont conservées) :

  ```powershell
  docker compose down
  ```

## 🛠 Dépannage

| Problème | Cause probable / solution |
|---|---|
| `EADDRINUSE` au démarrage d'un service | Une ancienne instance tourne encore sur ce port : l'arrêter (Gestionnaire des tâches → `node.exe`) puis relancer. |
| « Failed to fetch » sur le site Vercel | PC éteint ou en veille, service arrêté, ou tunnel coupé : vérifier les ports avec la commande de vérification ci-dessus et `docker ps`. |
| Erreur CORS sur un en-tête | Ajouter l'en-tête à `Access-Control-Allow-Headers` dans `deploy/docker/nginx.conf`, puis `docker exec ecotrack-api-gateway nginx -s reload`. |
| Build Vercel en échec | Vercel n'envoie que `apps/web-react` : la configuration de ce dossier ne doit rien référencer en dehors de lui. |
| Build APK en échec (Gradle) | Lancer `npx expo-doctor` dans `apps/mobile` et corriger les dépendances signalées avant de relancer le build. |
| Port 5432 ou 27017 déjà occupé | Un PostgreSQL ou MongoDB installé sous Windows utilise ce port : arrêter ce service Windows ou changer le port mappé. |

## 🧪 Tests

```powershell
# Tests unitaires de tout le monorepo
npm test

# Tests de l'application web uniquement
cd apps/web-react
npx vitest run
```

Les scénarios E2E Playwright (parcours citoyen → agent → ouvrier et audit WCAG 2.1 AA) sont dans `tests/e2e`. Ils ciblent des services déjà démarrés et sont désactivés par défaut :

```powershell
$env:E2E_RUN = "true"
$env:E2E_API_URL = "http://127.0.0.1:8090/api/v1"
$env:E2E_REPORTER_ID = "<citizen-id>"
$env:E2E_AGENT_ID = "<agent-id>"
$env:E2E_WORKER_ID = "<worker-id>"
$env:E2E_WEB_URL = "http://127.0.0.1:3000"
npm run test:e2e
```

`E2E_A11Y_PATHS` accepte une liste de routes séparées par des virgules pour étendre l'audit d'accessibilité.

## 📱 Application Mobile (APK) & Livrables

- **Télécharger l'APK Android (Build EAS Preview)** :  
  https://expo.dev/artifacts/eas/vbhVFWECLzqKnyACagN6L_cM8H91sTb0tynBf81pWzk.apk
- **Dossier `livrable/`** :
  - [`livrable/project_report_ECOTRACK.pdf`](livrable/project_report_ECOTRACK.pdf) : Rapport final du projet
  - [`livrable/cahier_de_charge_ecotrack.pdf`](livrable/cahier_de_charge_ecotrack.pdf) : Cahier des charges
  - [`livrable/README.md`](livrable/README.md) : Guide rapide d'installation et de lancement pour l'évaluateur
  - `livrable/demos/` : Emplacement des vidéos de démonstration mobile

## 📚 Documentation

- [`docs/Cahier_Des_Charges_Fonctionnel_ECOTRACK.pdf`](docs/Cahier_Des_Charges_Fonctionnel_ECOTRACK.pdf) : cahier des charges fonctionnel
- [`docs/decisions.md`](docs/decisions.md) : décisions d'architecture
- [`docs/powerbi_dax_measures.md`](docs/powerbi_dax_measures.md) : mesures DAX du tableau de bord Power BI
- [`docs/rapport_evaluation_ia.md`](docs/rapport_evaluation_ia.md) : évaluation du modèle IA
- [`deploiment.md`](deploiment.md) : déploiement hybride détaillé

### Suivi de projet (Jira)

Le script `.agents/scripts/sync_jira.py` synchronise les tickets Jira (`SCRUM`) dans un tableau de bord local (`dashboard/data.json` et `dashboard/index.html`), lancé automatiquement dans Antigravity par le hook `.agents/hooks.json`. Le dossier `dashboard/` n'est pas versionné dans ce dépôt : il doit exister localement pour que la synchronisation fonctionne.

```powershell
python .agents/scripts/sync_jira.py
Start-Process dashboard/index.html
```

## 👨‍💻 Équipe

Adem Ouerhani · Ahmed Salah · sarahsou2016 · Hiba Dhouib
