"""
ECOTRACK V2 - Mise à jour Pédagogique Intégrale des tickets TERMINE / SPRINTS 0 & 1
Ce script applique le template hyper-détaillé (6 sections + Kit Git + Pas-à-pas débutant)
sur les tickets réalisés (Done) pour que les étudiants puissent les comprendre,
les modifier ou les refaire (re-do) en toute autonomie.
"""

import subprocess
import json
import time
import os
import sys

def update_jira_description(key, title, markdown_desc):
    cmd = [
        "twg", "jira", "workitem", "update",
        "--id", key,
        "--description", markdown_desc,
        "--description-format", "markdown",
        "-o", "json"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if res.returncode == 0:
        print(f"  [OK] {key} mis à jour avec succès : {title}")
        return True
    else:
        print(f"  [ERREUR] {key} : {res.stderr.strip()}", file=sys.stderr)
        return False

DONE_TICKETS = {}

# ------------------------------------------------------------------------------
# SPRINT 0 (SOCLE TECHNIQUE & DEVOPS - 5 TICKETS)
# ------------------------------------------------------------------------------

DONE_TICKETS["SCRUM-38"] = {
    "title": "ECO-01 | [DevOps] Initialize Nx Monorepo & CI/CD",
    "desc": """# 🌿 SCRUM-38 : Initialisation du Monorepo Nx, Docker Compose & Pipeline CI/CD

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **NFR-04 : Architecture Monorepo & Infrastructure DevOps d'Équipe**
* **Rôle Métier :** **Lead Developer / DevOps (Adem Ouerhani)** & toute l'équipe (Ahmed, Hiba, Sara).
* **Objectif Fonctionnel :** Créer la racine du projet partagé où chaque membre retrouve tous les sous-projets au même endroit. Mettre en place `docker-compose.yml` pour que n'importe quel développeur puisse allumer en une seconde toutes les bases de données (MongoDB, PostgreSQL, Redis, MinIO, RabbitMQ) sans devoir les installer manuellement sur sa machine.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (Lead Dev / DevOps)
* **Branche Git :** `feature/ECO-01-adem-nx-init`
* **Fichiers cibles à ouvrir / modifier :**
  1. `nx.json` & `package.json` *(Configuration du Monorepo et des commandes globales)*
  2. `docker-compose.yml` *(Orchestration des conteneurs locaux)*
  3. `.github/workflows/ci.yml` *(Automatisation des tests sur GitHub)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
Pour travailler sur cette tâche ou la refaire :
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-01-adem-nx-init
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Commiter proprement :**
   ```powershell
   git add nx.json package.json docker-compose.yml
   git commit -m "feat(devops): [ECO-01] nx monorepo scaffolding and docker-compose setup"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-01-adem-nx-init
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Initialiser la structure Nx Monorepo
À la racine du projet :
- Exécute `npx create-nx-workspace@latest ecotrack --preset=apps`.
- Cela crée les dossiers clés :
  - `apps/` pour les applications utilisateur (mobile Expo, web-react).
  - `services/` pour les microservices backend (identity, report, ai-vision, bi-etl).
  - `packages/` pour le code partagé (db, shared, contracts).

#### 🔹 Étape 2 : Configurer les conteneurs dans `docker-compose.yml`
Déclare les 5 services indispensables avec leurs ports standards :
- **mongodb** : image `mongo:7.0`, port `27017:27017` (base des signalements).
- **postgres** : image `postgres:16`, port `5432:5432` (Data Warehouse pour Power BI).
- **redis** : image `redis:7-alpine`, port `6379:6379` (rate limiting & refresh tokens).
- **rabbitmq** : image `rabbitmq:3-management`, ports `5672:5672` et `15672:15672` (bus d'événements).
- **minio** : image `minio/minio`, ports `9000:9000` et `9001:9001` (stockage photos S3).

#### 🔹 Étape 3 : Créer le pipeline GitHub Actions
Dans `.github/workflows/ci.yml` :
- Déclenche le job à chaque `push` ou `pull_request` sur la branche `develop`.
- Étapes : checkout du code, setup Node.js 20, `npm ci`, vérification TypeScript (`npm run lint`), et exécution des tests unitaires.

---

### 📦 4. Exemple Concret (Extrait de docker-compose.yml)
```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: ecotrack-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
  postgres:
    image: postgres:16
    container_name: ecotrack-postgres
    environment:
      POSTGRES_DB: ecotrack_dw
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance les conteneurs et vérifie leur statut :
```powershell
docker compose up -d
docker compose ps
```
**Ce que tu dois voir :**
Tous les conteneurs affichent le statut `Up (healthy)` ou `running`.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le fichier `docker-compose.yml` démarre les 5 conteneurs sans conflit de ports.
- [ ] Le fichier `package.json` contient les scripts globaux `build`, `lint` et `test`.
- [ ] Le workflow GitHub Actions s'exécute au vert sur la branche `develop`.
"""
}

DONE_TICKETS["SCRUM-39"] = {
    "title": "ECO-02 | [UI-MOB] Initialize Expo App & Design Tokens",
    "desc": """# 🌿 SCRUM-39 : Scaffolding de l'Application Mobile Expo & Tokens de Design CDCF V2

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Application Mobile Cross-Platform (Citoyen & Ouvrier)**
* **Rôle Métier :** **Ahmed Salah** (Mobile Lead) & Utilisateurs smartphone (Citoyen dans la rue, Ouvrier terrain).
* **Objectif Fonctionnel :** Initialiser le projet mobile avec React Native et Expo SDK 51+, configurer TypeScript, et implémenter la charte graphique officielle du CDCF V2 (Vert émeraude `#059669` et Bleu saphir `#1E3A8A`) pour que tous les futurs écrans aient un design harmonieux.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Ahmed Salah** (Mobile Lead)
* **Branche Git :** `feature/ECO-02-ahmed-expo-init`
* **Fichiers cibles à ouvrir / modifier :**
  1. `apps/mobile/app.json` *(Configuration Expo, nom de l'app, permissions caméra et GPS)*
  2. `apps/mobile/src/theme/colors.ts` *(Palette HEX officielle CDCF V2)*
  3. `apps/mobile/src/theme/typography.ts` *(Polices et tailles de texte standardisées)*
  4. `apps/mobile/App.tsx` *(Point d'entrée de l'application mobile)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-02-ahmed-expo-init
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add apps/mobile/
   git commit -m "feat(mobile): [ECO-02] initialize expo app with cdcf v2 design tokens"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-02-ahmed-expo-init
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Créer l'application Expo dans `apps/mobile`
- Utilise la commande Expo TypeScript :
  `npx create-expo-app apps/mobile --template blank-typescript`.
- Installe les bibliothèques indispensables :
  `npm install @react-navigation/native @react-navigation/bottom-tabs react-native-safe-area-context lucide-react-native zustand`.

#### 🔹 Étape 2 : Définir la charte de couleurs dans `colors.ts`
Dans `apps/mobile/src/theme/colors.ts` :
```typescript
export const Colors = {
  primary: '#059669',       // Vert Émeraude EcoTrack (Actions positives, boutons clés)
  primaryDark: '#047857',   // Survol / Press
  secondary: '#1E3A8A',     // Bleu Saphir Municipal (Institutionnel, en-têtes)
  accentYellow: '#F59E0B',  // Ambre (Signalements nouveaux en attente)
  accentRed: '#DC2626',     // Rouge (SLA dépassé, urgences)
  background: '#F8FAFC',    // Fond gris clair épuré
  surface: '#FFFFFF',       // Cartes blanches
  textMain: '#0F172A',      // Texte sombre très contrasté (WCAG AAA)
  textMuted: '#64748B',     // Texte secondaire
};
```

#### 🔹 Étape 3 : Définir la typographie dans `typography.ts`
- Tailles de police : `heading: 24px`, `subheading: 18px`, `body: 14px`, `caption: 12px`.
- Règle tactile mobile : tous les boutons doivent avoir une hauteur minimale de 44px (`minHeight: 44`).

#### 🔹 Étape 4 : Tester le rendu initial
Dans `App.tsx`, affiche un conteneur simple avec le logo EcoTrack, un titre vert émeraude et un bouton bleu saphir.

---

### 📦 4. Exemple Concret (Tokens exportés)
```typescript
import { Colors } from './src/theme/colors';
// Utilisation dans un composant :
<View style={{ backgroundColor: Colors.primary, padding: 16, borderRadius: 8 }}>
  <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>🌿 EcoTrack Mobile</Text>
</View>
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Démarre le serveur Expo :
```powershell
npx nx start mobile
```
- Appuie sur la touche `w` dans le terminal pour ouvrir l'application directement dans Google Chrome !
- Tu dois voir l'écran de bienvenue avec la palette aux couleurs EcoTrack.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] L'application Expo démarre sans erreur de bundling.
- [ ] La palette de couleurs contient exactement `#059669` et `#1E3A8A`.
- [ ] Les composants respectent la hauteur tactile minimale de 44px pour l'ergonomie mobile.
"""
}

DONE_TICKETS["SCRUM-40"] = {
    "title": "ECO-03 | [AI] Initialize FastAPI & PyTorch Environment",
    "desc": """# 🌿 SCRUM-40 : Initialisation du Microservice IA (Python FastAPI & PyTorch)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Microservice Découplé d'Intelligence Artificielle (ADR-04)**
* **Rôle Métier :** **Hiba Dhouib** (AI Lead) & Système de Vision par Ordinateur.
* **Objectif Fonctionnel :** Isoler le moteur d'intelligence artificielle dans un microservice Python indépendant utilisant FastAPI et PyTorch. Ce découplage empêche les calculs lourds d'inférence de bloquer le serveur Node.js et permet de faire monter en charge l'IA séparément.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Hiba Dhouib** (AI Lead)
* **Branche Git :** `feature/ECO-03-hiba-fastapi-init`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/ai-vision/requirements.txt` *(Dépendances Python IA et API)*
  2. `services/ai-vision/main.py` *(Point d'entrée FastAPI avec route /health)*
  3. `services/ai-vision/Dockerfile` *(Conteneur Dockerfile optimisé)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-03-hiba-fastapi-init
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add services/ai-vision/
   git commit -m "feat(ai): [ECO-03] fastapi pytorch environment with health endpoint"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-03-hiba-fastapi-init
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Créer le fichier `requirements.txt`
Dans `services/ai-vision/requirements.txt` :
```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
python-multipart>=0.0.9
pillow>=10.2.0
torch>=2.2.0 --index-url https://download.pytorch.org/whl/cpu
torchvision>=0.17.0 --index-url https://download.pytorch.org/whl/cpu
```

#### 🔹 Étape 2 : Coder le serveur FastAPI dans `main.py`
```python
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EcoTrack AI Vision API",
    description="Microservice de classification automatique d'incidents urbains",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-vision",
        "pytorchVersion": torch.__version__,
        "cudaAvailable": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }
```

#### 🔹 Étape 3 : Créer le Dockerfile
Basé sur `python:3.11-slim` :
- `WORKDIR /app`
- Copier `requirements.txt` et exécuter `pip install --no-cache-dir -r requirements.txt`.
- Copier le code et exposer le port 8000 : `CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`.

---

### 📦 4. Exemple Concret (Ce que renvoie la route de santé)
```json
{
  "status": "healthy",
  "service": "ai-vision",
  "pytorchVersion": "2.2.0+cpu",
  "cudaAvailable": false,
  "device": "cpu"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Active ton environnement virtuel et lance le serveur :
   ```powershell
   cd services/ai-vision
   uvicorn main:app --port 8000 --reload
   ```
2. Teste l'endpoint de santé :
   ```powershell
   curl http://localhost:8000/health
   ```
3. Ouvre Swagger dans ton navigateur : `http://localhost:8000/docs`.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La route `GET /health` répond HTTP 200 en moins de 50 ms.
- [ ] PyTorch et Pillow s'importent sans erreur de compilation C++.
- [ ] La documentation interactive Swagger est accessible sur `/docs`.
"""
}

DONE_TICKETS["SCRUM-41"] = {
    "title": "ECO-04 | [UI-WEB] Initialize React Vite & Tailwind CSS",
    "desc": """# 🌿 SCRUM-41 : Initialisation du Portail Web de Supervision (React / Vite / Tailwind)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Portail Web d'Administration & Modération Municipale**
* **Rôle Métier :** **Sara Sahih** (Frontend Lead) & Agents de Mairie / Directeurs de Services.
* **Objectif Fonctionnel :** Initialiser une Single Page Application (SPA) moderne et ultra-rapide avec React 18, Vite, Tailwind CSS et Lucide-React. Fournir la bibliothèque de composants atomiques de base (Boutons, En-têtes, Cartes) respectant les contrastes d'accessibilité WCAG AA.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih** (Frontend Lead)
* **Branche Git :** `feature/ECO-04-sara-react-init`
* **Fichiers cibles à ouvrir / modifier :**
  1. `apps/web-react/tailwind.config.js` *(Configuration de la palette et des bordures)*
  2. `apps/web-react/src/components/ui/Button.tsx` *(Composant atomique réutilisable)*
  3. `apps/web-react/src/App.tsx` *(Structure de navigation principale)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-04-sara-react-init
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add apps/web-react/
   git commit -m "feat(web): [ECO-04] react vite setup with tailwind and atomic button"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-04-sara-react-init
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Configurer Tailwind CSS
Dans `apps/web-react/tailwind.config.js`, étends le thème :
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#059669',
          sapphire: '#1E3A8A',
          amber: '#F59E0B',
          rose: '#DC2626',
        }
      }
    }
  }
}
```

#### 🔹 Étape 2 : Créer le composant `<Button />` réutilisable
Dans `apps/web-react/src/components/ui/Button.tsx` :
- Gère les 3 variantes du CDCF :
  - `primary` : fond `#059669`, texte blanc, hover plus foncé.
  - `secondary` : fond bleu `#1E3A8A`, texte blanc.
  - `destructive` : fond rouge `#DC2626` (pour les rejets T5).
- Ajoute la gestion de l'état de chargement (`isLoading={true}`) avec un spinner SVG fluide.

#### 🔹 Étape 3 : Structurer la barre de navigation
Dans `App.tsx`, intègre une barre de navigation latérale (Sidebar) avec les liens :
- 🏠 Tableau de bord (`/`)
- 🔍 File de modération Agent (`/moderation`)
- 🗺️ Carte de supervision (`/map`)
- 📊 Rapports analytiques Power BI (`/analytics`)

---

### 📦 4. Exemple Concret (Utilisation du composant Button)
```tsx
import { Button } from './components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

<Button variant="primary" onClick={handleValidate}>
  <CheckCircle2 size={16} /> Valider l'anomalie
</Button>
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance le serveur de développement :
```powershell
npx nx serve web-react
```
Ouvre `http://localhost:5173` dans ton navigateur : l'application doit se charger instantanément (< 200 ms grâce à Vite).

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] L'application compile sans aucun avertissement TypeScript.
- [ ] Le composant Button propose les variantes primary, secondary et destructive.
- [ ] Le ratio de contraste du texte sur fond dépasse 4.5:1 (Conforme WCAG AA).
"""
}

DONE_TICKETS["SCRUM-55"] = {
    "title": "ECO-05 | [BI-Data] DDL PostgreSQL Schéma en Étoile (2 Faits, 5 Dimensions) & Mocks Contrats",
    "desc": """# 🌿 SCRUM-55 : DDL PostgreSQL du Schéma en Étoile (2 Tables de Faits, 5 Dimensions)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **ADR-01 : Modélisation Relationnelle Décisionnelle Pure (Data Warehouse)**
* **Rôle Métier :** **Adem Ouerhani** (Data Architect) & Analystes Décisionnels / Élus.
* **Objectif Fonctionnel :** Créer la structure de l'entrepôt de données (DW) dans PostgreSQL 16 selon un schéma en étoile pur. Cette base est découplée de MongoDB pour garantir que les calculs statistiques lourds et les tableaux de bord Power BI ne ralentissent jamais l'application mobile des citoyens.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (Data Architect)
* **Branche Git :** `feature/ECO-05-adem-dw-schema`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/bi-etl/sql/01_create_star_schema.sql` *(Script SQL complet DDL)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-05-adem-dw-schema
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add services/bi-etl/sql/
   git commit -m "feat(dw): [ECO-05] postgresql star schema with 2 facts and 5 dimensions"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-05-adem-dw-schema
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Créer les 5 Tables de Dimensions
Dans `01_create_star_schema.sql` :
1. `Dim_Date` : `date_key INT PRIMARY KEY`, `full_date DATE`, `day_name`, `month_name`, `quarter`, `year`.
2. `Dim_Geography` : `geo_key SERIAL PRIMARY KEY`, `district_name` (Quartier), `rounded_longitude`, `rounded_latitude`.
3. `Dim_Category` : `category_key SERIAL PRIMARY KEY`, `category_code` (ex: `DEPOT_SAUVAGE`), `category_label`, `department`.
4. `Dim_Team` : `team_key SERIAL PRIMARY KEY`, `team_name`, `service_pole`.
5. `Dim_AI_Model` : `model_key SERIAL PRIMARY KEY`, `model_version`, `architecture` (MobileNetV3).

#### 🔹 Étape 2 : Créer la Table de Faits Principale `Fact_Reports`
```sql
CREATE TABLE Fact_Reports (
    fact_id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(64) UNIQUE NOT NULL,
    date_key INT REFERENCES Dim_Date(date_key),
    geo_key INT REFERENCES Dim_Geography(geo_key),
    category_key INT REFERENCES Dim_Category(category_key),
    team_key INT REFERENCES Dim_Team(team_key),
    model_key INT REFERENCES Dim_AI_Model(model_key),
    status VARCHAR(32) NOT NULL,
    mttr_hours NUMERIC(6,2),          -- Délai de résolution total en heures
    triage_hours NUMERIC(6,2),        -- Délai de validation par l'agent
    sla_breached BOOLEAN DEFAULT FALSE,
    is_ai_overridden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

#### 🔹 Étape 3 : Créer la Table de Faits `Fact_Interventions`
Gère les métriques des ouvriers : durée sur site, matériel utilisé, distance parcourue.

---

### 📦 4. Exemple Concret (Schéma décisionnel prêt pour Power BI)
Grâce aux clés primaires et étrangères, Power BI reconnaît automatiquement les relations 1-à-plusieurs (`1 -> *`) entre les dimensions et la table de faits pour créer les rapports instantanément !

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Exécute le script SQL dans PostgreSQL :
```powershell
docker compose exec -T postgres psql -U postgres -d ecotrack_dw < services/bi-etl/sql/01_create_star_schema.sql
```
Vérifie que les tables existent :
```powershell
docker compose exec postgres psql -U postgres -d ecotrack_dw -c "\dt"
```
**Ce que tu dois voir :**
7 tables listées (`Dim_AI_Model`, `Dim_Category`, `Dim_Date`, `Dim_Geography`, `Dim_Team`, `Fact_Interventions`, `Fact_Reports`).

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Les 2 tables de faits et 5 tables de dimensions sont créées sans erreur de syntaxe.
- [ ] La contrainte d'unicité `UNIQUE(report_id)` est présente pour permettre les UPSERTs.
- [ ] L'intégrité référentielle par clés étrangères est respectée.
"""
}

# ------------------------------------------------------------------------------
# SPRINT 1 (AUTHENTIFICATION, SÉCURITÉ, RBAC & AUDIT RGPD)
# ------------------------------------------------------------------------------

DONE_TICKETS["SCRUM-42"] = {
    "title": "ECO-11 | [DB] Create User Mongoose Schema & Hashing Logic",
    "desc": """# 🌿 SCRUM-42 : Schéma Mongoose Utilisateur, Hachage Sécurisé Argon2id & Rôles RBAC

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Modélisation des Comptes Utilisateurs & Sécurité RBAC**
* **Rôle Métier :** **Adem Ouerhani** (Backend Security) & Tous les profils (Citoyen, Agent, Ouvrier, Admin).
* **Objectif Fonctionnel :** Créer le schéma de données des utilisateurs dans MongoDB avec contrôle d'unicité sur l'adresse email. Sécuriser les mots de passe avec l'algorithme cryptographique **Argon2id** (paramétré pour résister aux attaques matérielles GPU) et masquer systématiquement le hash lors des requêtes normales (`select: false`).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani**
* **Branche Git :** `feature/ECO-11-adem-user-schema`
* **Fichiers cibles à ouvrir / modifier :**
  1. `packages/shared/src/types/user.ts` *(Énumération TypeScript des rôles)*
  2. `packages/db/src/schemas/user.schema.ts` *(Schéma Mongoose et hooks de hachage)*
  3. `services/identity-api/src/utils/hashing.ts` *(Fonctions utilitaires Argon2id)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-11-adem-user-schema
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add packages/shared/ packages/db/
   git commit -m "feat(db): [ECO-11] user mongoose schema with argon2id hashing pre-save hook"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-11-adem-user-schema
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Définir les types dans `@ecotrack/shared`
Dans `packages/shared/src/types/user.ts` :
```typescript
export enum UserRole {
  CITOYEN = 'CITOYEN',
  AGENT = 'AGENT',
  OUVRIER = 'OUVRIER',
  ADMIN = 'ADMIN'
}
```

#### 🔹 Étape 2 : Configurer le Schéma Mongoose dans `@ecotrack/db`
Dans `packages/db/src/schemas/user.schema.ts` :
- Champs : `email` (string, unique, lowercase, trim), `password` (string, `select: false`), `fullName`, `phoneNumber`, `role` (enum UserRole, default CITOYEN), `isActive` (boolean, default true).
- Ajoute l'index d'unicité : `UserSchema.index({ email: 1 }, { unique: true })`.

#### 🔹 Étape 3 : Ajouter le hook pré-sauvegarde Argon2id
Avant chaque sauvegarde de mot de passe neuf ou modifié :
```typescript
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await argon2.hash(this.password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 Mo de mémoire
    timeCost: 3,       // 3 itérations
    parallelism: 4     // 4 threads
  });
  next();
});
```

#### 🔹 Étape 4 : Ajouter la méthode de comparaison
```typescript
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return argon2.verify(this.password, candidatePassword);
};
```

---

### 📦 4. Exemple Concret (Ce qui est stocké dans MongoDB)
```json
{
  "_id": "672f09a1b9e1a2001c45a123",
  "email": "citoyen@ecotrack.local",
  "password": "$argon2id$v=19$m=65536,t=3,p=4$qW... (hash chiffré indéchiffrable)",
  "fullName": "Karim Ben Salah",
  "role": "CITOYEN",
  "isActive": true
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance simplement la suite de tests automatisée du Sprint 1 :
```powershell
python .agents/scripts/test_sprint1_tickets.py
```
**Ce que tu dois voir :**
```text
[PASS] SCRUM-42: UserRole enum definition in @ecotrack/shared
[PASS] SCRUM-42: User Mongoose Schema structure in @ecotrack/db
[PASS] SCRUM-42: Argon2id Hashing parameters & Pre-save hook
```

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le rôle est strictement typé avec l'enum `UserRole`.
- [ ] L'email est unique et insensible à la casse.
- [ ] Le mot de passe n'apparaît JAMAIS en clair dans les logs ou les requêtes (`select: false`).
- [ ] Tous les tests `test_sprint1_tickets.py` passent au vert.
"""
}

DONE_TICKETS["SCRUM-43"] = {
    "title": "ECO-12 | [API] Build POST /auth/register Route",
    "desc": """# 🌿 SCRUM-43 : Route API d'Inscription Citoyenne (POST /api/v1/auth/register)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Création de Compte Citoyen & Validation d'Entrée**
* **Rôle Métier :** **Sara Sahih** (Backend API) & Citoyen.
* **Objectif Fonctionnel :** Développer l'API REST permettant à un nouvel utilisateur de s'inscrire. Valider rigoureusement le format des données avec Zod, vérifier que l'email n'est pas déjà pris (renvoyer HTTP 409 Conflict si doublon), forcer le rôle à `CITOYEN` pour éviter qu'un pirate ne s'inscrive comme `ADMIN`, et renvoyer le code HTTP 201 Created.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih**
* **Branche Git :** `feature/ECO-12-sara-register-api`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/identity-api/src/routes/auth.routes.ts` *(Routeur Express)*
  2. `services/identity-api/src/controllers/register.controller.ts` *(Contrôleur et logique métier)*
  3. `services/identity-api/src/services/user.service.ts` *(Interaction avec la base)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-12-sara-register-api
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add services/identity-api/
   git commit -m "feat(auth): [ECO-12] post auth register controller with zod validation"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-12-sara-register-api
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Valider les données reçues avec Zod
Dans `register.controller.ts` :
- Vérifie que l'email est valide : `z.string().email()`.
- Vérifie que le mot de passe fait au moins 8 caractères : `z.string().min(8)`.
- Si Zod détecte une erreur : renvoie immédiatement `HTTP 400 Bad Request` avec les messages explicatifs.

#### 🔹 Étape 2 : Vérifier les doublons
- Cherche si l'utilisateur existe déjà :
  `const existing = await UserModel.findOne({ email });`
- Si trouvé : renvoie `res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS', message: 'Cet email est déjà utilisé.' });`.

#### 🔹 Étape 3 : Créer l'utilisateur en forçant le rôle Citoyen
- Appelle `UserModel.create({ email, password, fullName, phoneNumber, role: UserRole.CITOYEN })`.
- Le hook pré-sauvegarde Argon2id (ECO-11) s'occupe de hacher le mot de passe automatiquement !

#### 🔹 Étape 4 : Renvoyer la réponse
- Renvoyer `HTTP 201 Created` avec l'objet utilisateur SANS le champ mot de passe.

---

### 📦 4. Exemple Concret (Ce qui entre et ce qui sort)
**Entrée (POST /api/v1/auth/register) :**
```json
{
  "email": "karim.citoyen@ville.tn",
  "password": "Password123!",
  "fullName": "Karim Ben Salah",
  "phoneNumber": "+21620123456"
}
```
**Sortie (HTTP 201 Created) :**
```json
{
  "id": "672f09a1b9e1a2001c45a123",
  "email": "karim.citoyen@ville.tn",
  "fullName": "Karim Ben Salah",
  "role": "CITOYEN",
  "createdAt": "2026-11-10T10:00:00.000Z"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance les tests unitaires du Sprint 1 :
```powershell
python .agents/scripts/test_sprint1_tickets.py
```
**Ce que tu dois voir :**
`[PASS] SCRUM-43: Auth Register Route & Controller Security`

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Une requête valide crée l'utilisateur et renvoie HTTP 201.
- [ ] Un email déjà existant renvoie proprement HTTP 409 Conflict.
- [ ] Le rôle est systématiquement forcé à CITOYEN.
"""
}

DONE_TICKETS["SCRUM-45"] = {
    "title": "ECO-14 | [API] Build POST /auth/login with RS256 & Redis Rate Limit",
    "desc": """# 🌿 SCRUM-45 : Connexion Sécurisée (POST /auth/login), Tokens JWT RS256 & Rate Limiting Redis

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Authentification Forte, Tokens Asymétriques & Protection Anti-Bruteforce**
* **Rôle Métier :** **Hiba Dhouib** (Security / Backend) & Tous les utilisateurs.
* **Objectif Fonctionnel :** Développer l'endpoint de connexion sécurisé. Protéger l'API contre les attaques automatisées par force brute (5 tentatives max par minute par IP avec Redis). Vérifier le mot de passe avec Argon2id et délivrer un Access Token signé avec clé asymétrique **RS256** (durée 15 min) et un Refresh Token révocable sous Redis (7 jours).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Hiba Dhouib**
* **Branche Git :** `feature/ECO-14-hiba-login-api`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/identity-api/src/controllers/login.controller.ts` *(Logique de connexion)*
  2. `services/identity-api/src/services/jwt.service.ts` *(Signature asymétrique RS256)*
  3. `services/identity-api/src/middlewares/rate-limit.middleware.ts` *(Limiteur de débit Redis)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-14-hiba-login-api
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add services/identity-api/
   git commit -m "feat(auth): [ECO-14] login endpoint with rs256 jwt and redis rate limit"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-14-hiba-login-api
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Mettre en place le Rate Limiting Redis
Dans `rate-limit.middleware.ts` :
- Utilise l'adresse IP du client comme clé Redis : `rate_limit:login:${clientIp}`.
- Incrémente la clé : si elle dépasse 5 tentatives en moins de 60 secondes, bloque la requête avec `HTTP 429 Too Many Requests`.

#### 🔹 Étape 2 : Vérifier le mot de passe avec Argon2id
Dans `login.controller.ts` :
- Récupère l'utilisateur en incluant son mot de passe : `UserModel.findOne({ email }).select('+password')`.
- Si utilisateur introuvable ou `await user.comparePassword(password)` renvoie false :
  renvoie `HTTP 401 Unauthorized` ("Identifiants incorrects").

#### 🔹 Étape 3 : Signer l'Access Token avec la clé privée RS256
Dans `jwt.service.ts` :
- Charge la clé privée RSA 2048 bits.
- Signe le token contenant : `{ sub: user._id, email: user.email, role: user.role }`.
- Durée de validité : `expiresIn: '15m'`.

#### 🔹 Étape 4 : Exposer la clé publique
Crée la route `GET /api/v1/auth/public-key` : elle permet à tous les autres microservices de valider l'authenticité des tokens instantanément et sans requêter la base de données !

---

### 📦 4. Exemple Concret (Ce que renvoie la route POST /auth/login)
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9... (Access Token 15 min)",
  "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "expiresIn": 900,
  "user": {
    "id": "672f09a1b9e1a2001c45a123",
    "email": "karim.citoyen@ville.tn",
    "role": "CITOYEN"
  }
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance les tests automatisés du Sprint 1 :
```powershell
python .agents/scripts/test_sprint1_tickets.py
```
**Ce que tu dois voir :**
`[PASS] SCRUM-45: Login RS256 & Redis Rate Limit`

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Les tokens sont signés avec l'algorithme asymétrique RS256.
- [ ] Le rate limiter bloque après 5 tentatives échouées avec le code HTTP 429.
- [ ] La clé publique est accessible sur `GET /api/v1/auth/public-key`.
"""
}

DONE_TICKETS["SCRUM-56"] = {
    "title": "ECO-15 | [Audit & RGPD] Microservice AuditLogs Append-Only & Traces Immuables",
    "desc": """# 🌿 SCRUM-56 : Microservice d'Audit & Conformité RGPD (Collection Append-Only Immuable)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-11 : Journalisation d'Audit Immuable & Respect du RGPD**
* **Rôle Métier :** **Adem Ouerhani** (DevOps & Sécurité) & Délégué à la Protection des Données (DPO).
* **Objectif Fonctionnel :** Créer le microservice d'audit chargé d'enregistrer de manière infalsifiable chaque événement sensible survenant sur la plateforme (connexions, modifications de statut, réassignations). La collection MongoDB `AuditLogs` est **strictement Append-Only** (toute modification ou suppression est formellement bloquée) et applique la troncature d'adresse IP pour respecter le RGPD.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani**
* **Branche Git :** `feature/ECO-15-adem-audit-service`
* **Fichiers cibles à ouvrir / modifier :**
  1. `packages/shared/src/types/audit.ts` *(Types et énumérations d'actions d'audit)*
  2. `services/audit-api/src/schemas/audit.schema.ts` *(Schéma Mongoose et verrouillage Append-Only)*
  3. `services/audit-api/src/controllers/audit.controller.ts` *(Endpoints d'audit)*

---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée :**
   ```powershell
   git checkout -b feature/ECO-15-adem-audit-service
   ```
3. **Vérifier la propreté de ton espace (Clean Working Tree) :**
   ```powershell
   git status
   ```
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add packages/shared/ services/audit-api/
   git commit -m "feat(audit): [ECO-15] append-only auditlogs collection with gdpr ip truncation"
   ```
5. **Pousser et ouvrir sa PR sur GitHub :**
   ```powershell
   git push -u origin feature/ECO-15-adem-audit-service
   ```

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Comment le faire ou le refaire)

#### 🔹 Étape 1 : Définir les types d'audit
Dans `packages/shared/src/types/audit.ts` :
```typescript
export enum AuditAction {
  USER_REGISTERED = 'USER_REGISTERED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REPORT_CREATED = 'REPORT_CREATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  REPORT_REOPENED = 'REPORT_REOPENED'
}
```

#### 🔹 Étape 2 : Verrouiller Mongoose en Append-Only
Dans `services/audit-api/src/schemas/audit.schema.ts` :
- Empêche toute tentative d'écriture après création :
```typescript
AuditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function() {
  throw new Error("VIOLATION_AUDIT_IMMUTABILITE : Les logs d'audit sont immuables. UPDATE interdit.");
});

AuditLogSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function() {
  throw new Error("VIOLATION_AUDIT_IMMUTABILITE : Les logs d'audit sont immuables. DELETE interdit.");
});
```

#### 🔹 Étape 3 : Anonymiser l'adresse IP (RGPD)
- Crée la fonction de troncature :
  `function truncateIp(ip: string): string { return ip.replace(/\\.\\d+$/, '.0'); }`
  Exemple : `197.14.52.88` devient `197.14.52.0`.

#### 🔹 Étape 4 : Exposer la route d'audit sécurisée
- Route `GET /api/v1/audit-logs` réservée au rôle `ADMIN` avec pagination.

---

### 📦 4. Exemple Concret (Trace d'audit enregistrée)
```json
{
  "_id": "672f10b0b9e1a2001c45a999",
  "actorId": "672f08a0b9e1a2001c45a001",
  "actorRole": "AGENT",
  "action": "STATUS_CHANGED",
  "entityType": "REPORT",
  "entityId": "672f10a8b9e1a2001c45a789",
  "before": { "status": "NOUVEAU" },
  "after": { "status": "VALIDE" },
  "ipTruncated": "192.168.1.0",
  "timestamp": "2026-11-10T10:05:00.000Z"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance les tests du Sprint 1 :
```powershell
python .agents/scripts/test_sprint1_tickets.py
```
**Ce que tu dois voir :**
`[PASS] SCRUM-56: AuditAction enum & AuditLog Types in @ecotrack/shared`
`[PASS] SCRUM-56: AuditLog Mongoose Schema in @ecotrack/db`
`[PASS] SCRUM-56: Append-Only Guards`

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La collection refuse les opérations UPDATE et DELETE avec une exception claire.
- [ ] L'adresse IP est systématiquement tronquée au dernier octet.
- [ ] La route de consultation est inaccessible aux rôles non-administrateurs (HTTP 403).
"""
}

def main():
    print("=" * 70)
    print("ENRICHISSEMENT PÉDAGOGIQUE COMPLET DES TICKETS TERMINÉS / SPRINTS 0 & 1")
    print(f"Nombre de tickets à traiter : {len(DONE_TICKETS)}")
    print("=" * 70)
    
    count = 0
    for key, item in DONE_TICKETS.items():
        print(f"--> Traitement de {key} ({item['title']})...")
        ok = update_jira_description(key, item["title"], item["desc"])
        if ok:
            count += 1
        time.sleep(0.5)
        
    print("=" * 70)
    print(f"[SUCCÈS TOTAL] {count}/{len(DONE_TICKETS)} tickets terminés enrichis avec le tutoriel complet !")
    print("=" * 70)

if __name__ == "__main__":
    main()
