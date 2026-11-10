"""
ECOTRACK V2 - Script de Mise à Jour Pédagogique Intégrale de Jira
Ce script met à jour les 33 tickets Jira (27 Tâches + 6 Epics) avec des descriptions
ultra-détaillées, pédagogiques, simples pour étudiants débutants (terminale),
et strictement attachées au Cahier des Charges Fonctionnel (CDCF V2).
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

# ==============================================================================
# DESCRIPTIONS PÉDAGOGIQUES COMPLÈTES (CDCF V2 & PAS-À-PAS DÉBUTANT)
# ==============================================================================

TICKETS = {}

# ------------------------------------------------------------------------------
# SPRINT 2 (SPRINT ACTIF - PRIORITÉ MAXIMALE)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-44"] = {
    "title": "ECO-13 | [UI-MOB] Inscription Mobile Citoyen & Formulaire React Native Expo",
    "desc": """# 🌿 SCRUM-44 : Formulaire Mobile d'Inscription Citoyenne (React Native / Expo)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Création de Compte & Authentification Citoyenne**
* **Rôle Métier :** **Citoyen** (télécharge l'application mobile EcoTrack sur son smartphone pour signaler des anomalies urbaines).
* **Objectif Fonctionnel :** Permettre à tout habitant de la ville de créer son compte citoyen en moins de 60 secondes en renseignant son nom, son email, son mot de passe et son téléphone. L'application valide immédiatement la saisie avant d'appeler l'API d'authentification.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Ahmed Salah** (Mobile / Expo)
* **Branche Git à créer :** `feature/ECO-13-ahmed-mobile-register`
* **Fichiers cibles à ouvrir / modifier :**
  1. `apps/mobile/src/screens/Auth/RegisterScreen.tsx` *(Créer l'écran et les champs de formulaire)*
  2. `apps/mobile/src/store/authStore.ts` *(Gérer l'état de session utilisateur avec Zustand)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Créer l'écran et les champs de formulaire
Dans `apps/mobile/src/screens/Auth/RegisterScreen.tsx` :
- Utilise des composants React Native classiques : `<View>`, `<TextInput>`, `<Text>`, `<TouchableOpacity>`.
- Prépare 4 champs de saisie :
  1. **Nom complet** (`fullName`)
  2. **Adresse email** (`email` avec `keyboardType="email-address"`)
  3. **Mot de passe** (`password` avec `secureTextEntry={true}`)
  4. **Téléphone** (`phoneNumber` avec `keyboardType="phone-pad"`)

#### 🔹 Étape 2 : Ajouter la validation simple
Avant d'envoyer les données au serveur :
- Vérifie que l'email contient bien un caractère `@` et un point `.`.
- Vérifie que le mot de passe fait au moins 8 caractères.
- Si un champ est vide, affiche un message d'erreur en rouge au-dessus du bouton.

#### 🔹 Étape 3 : Connecter l'appel API
- Sur le clic du bouton "Créer mon compte", envoie une requête HTTP POST :
  `POST http://localhost:3001/api/v1/auth/register` (ou IP de ta machine si tu testes sur téléphone physique).
- Headers : `{"Content-Type": "application/json"}`.

#### 🔹 Étape 4 : Gérer les réponses
- **Si HTTP 201 (Succès) :** Affiche une alerte verte "Compte créé !", enregistre l'utilisateur dans `authStore` et navigue automatiquement vers l'écran de connexion (`LoginScreen`).
- **Si HTTP 409 (Email déjà pris) :** Affiche "Cet email est déjà utilisé par un autre citoyen.".

---

### 📦 4. Exemple Concret (Ce que l'application envoie à l'API)
```json
{
  "fullName": "Karim Ben Salah",
  "email": "karim@example.com",
  "password": "Password123!",
  "phoneNumber": "+21620123456"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Assure-toi que le service d'identité tourne en local (`http://localhost:3001`).
2. Lance l'application Expo :
   ```powershell
   npx nx start mobile
   ```
3. Ouvre l'émulateur Android ou appuie sur `w` pour tester dans le navigateur web.
4. Remplis le formulaire et clique sur "Créer mon compte" : tu dois recevoir une confirmation immédiate.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Les 4 champs de saisie sont présents et utilisables sur smartphone.
- [ ] Le mot de passe est masqué par des puces lors de la frappe.
- [ ] Un message d'erreur clair s'affiche si l'email est invalide ou déjà existant.
- [ ] Le bouton respecte la taille tactile minimale recommandée (au moins 44x44 pixels).
- [ ] Mon commit Git est propre : `git commit -m "feat(mobile): ECO-13 register screen with validation"`.
"""
}

TICKETS["SCRUM-46"] = {
    "title": "ECO-20 | [DB] Schéma Mongoose Signalement & Index Géospatial 2dsphere",
    "desc": """# 🌿 SCRUM-46 : Modélisation du Signalement d'Anomalie & Index Géospatial 2dsphere

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-02 : Enregistrement Géolocalisé d'une Anomalie Urbaine**
* **Rôle Métier :** **Citoyen** (dans la rue avec son smartphone) & **Agent de Mairie** (qui consulte la carte).
* **Objectif Fonctionnel :** Quand un citoyen signale un dépôt sauvage ou un nid-de-poule, l'application doit enregistrer les coordonnées GPS précises (latitude/longitude), la photo, la description et le statut initial `NOUVEAU`. Grâce à l'index spatial `2dsphere`, la Mairie et les ouvriers pourront instantanément chercher les signalements les plus proches d'eux (`$near`).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Ahmed Salah** (Mobile / DB)
* **Branche Git :** `feature/ECO-20-ahmed-report-schema`
* **Fichiers cibles :**
  1. `packages/shared/src/types/report.ts` *(Définir les types TypeScript partagés)*
  2. `packages/db/src/schemas/report.schema.ts` *(Créer le schéma Mongoose et l'index 2dsphere)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Définir les types dans `@ecotrack/shared`
Ouvre `packages/shared/src/types/report.ts` et vérifie/ajoute :
- L'énumération des statuts : `NOUVEAU`, `EN_COURS_DE_VALIDATION`, `VALIDE`, `ASSIGNE`, `EN_TRAITEMENT`, `RESOLU`, `REJETE`.
- L'interface GeoJSON pour les coordonnées GPS : `{ type: 'Point', coordinates: [number, number] }` (attention : convention GeoJSON = `[longitude, latitude]`).

#### 🔹 Étape 2 : Créer le Schéma Mongoose dans `@ecotrack/db`
Ouvre `packages/db/src/schemas/report.schema.ts` :
1. Crée le schéma avec les champs : `reporterId`, `category`, `description`, `imageUrl`, `location`, `status`, `createdAt`, `updatedAt`.
2. Le champ `location` doit être un objet GeoJSON strict :
   ```typescript
   location: {
     type: { type: String, enum: ['Point'], default: 'Point', required: true },
     coordinates: { type: [Number], required: true } // [longitude, latitude]
   }
   ```

#### 🔹 Étape 3 : Ajouter l'Index Spatial `2dsphere`
À la fin de la définition du schéma, ajoute la ligne magique qui active la recherche géographique rapide :
```typescript
ReportSchema.index({ location: '2dsphere' });
```

#### 🔹 Étape 4 : Exporter le Modèle
```typescript
export const ReportModel = mongoose.model<IReportDocument>('Report', ReportSchema);
```

---

### 📦 4. Exemple Concret (Ce qui est stocké dans MongoDB)
```json
{
  "_id": "672f10a8b9e1a2001c45a789",
  "reporterId": "672f09a1b9e1a2001c45a123",
  "category": "DEPOT_SAUVAGE",
  "description": "Tas de gravats abandonné sur le trottoir",
  "imageUrl": "https://storage.ecotrack.local/reports/gravats-2026.webp",
  "location": {
    "type": "Point",
    "coordinates": [2.3522, 48.8566]
  },
  "status": "NOUVEAU",
  "createdAt": "2026-11-10T10:00:00.000Z"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance simplement la suite de tests automatisée du Sprint 2 depuis la racine du projet :
```powershell
python .agents/scripts/test_sprint2_tickets.py
```
**Ce que tu dois voir :**
```text
[PASS] SCRUM-46: ReportStatus & GeoLocation Types in @ecotrack/shared
[PASS] SCRUM-46: Report Mongoose Schema & 2dsphere Spatial Index in @ecotrack/db
```

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le type `ReportStatus` contient bien les 7 statuts du CDCF V2.
- [ ] Le schéma Mongoose contient l'index `ReportSchema.index({ location: '2dsphere' })`.
- [ ] Le test `python .agents/scripts/test_sprint2_tickets.py` passe à 100% au vert `[PASS]`.
- [ ] Mon commit Git est propre : `git commit -m "feat(db): ECO-20 report mongoose schema with 2dsphere index"`.
"""
}

TICKETS["SCRUM-47"] = {
    "title": "ECO-21 | [API] Service Média — Purge des Métadonnées EXIF/GPS & Stockage Sécurisé MinIO/S3",
    "desc": """# 🌿 SCRUM-47 : Service Média — Purge des Métadonnées EXIF/GPS & Stockage Sécurisé MinIO/S3

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-02 & US-11 : Protection de la Vie Privée & Conformité RGPD (Suppression EXIF)**
* **Rôle Métier :** **Citoyen** (prend une photo avec son téléphone) & **Délégué à la Protection des Données (DPO)**.
* **Objectif Fonctionnel :** Quand un citoyen prend une photo avec son smartphone, le fichier JPEG contient des données privées cachées (coordonnées GPS de son domicile, marque du téléphone, date et heure exacte). Le serveur **DOIT impérativement purger** toutes ces données EXIF pour respecter le RGPD, puis convertir l'image au format WebP léger avant de la stocker sur MinIO/S3.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (DevOps / Backend)
* **Branche Git :** `feature/ECO-21-adem-media-service`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/media-api/src/utils/sharp.util.ts` *(Traitement de l'image et suppression EXIF)*
  2. `services/media-api/src/controllers/upload.controller.ts` *(Réception du fichier multipart et contrôle de taille)*
  3. `services/media-api/src/services/s3.service.ts` *(Upload vers MinIO S3 avec AWS SDK v3)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Configurer Sharp pour effacer les métadonnées
Dans `services/media-api/src/utils/sharp.util.ts` :
- Utilise la bibliothèque `sharp` :
  ```typescript
  const cleanBuffer = await sharp(inputBuffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true }) // Redimensionnement max
    .withMetadata(false) // 🚨 INDISPENSABLE : supprime 100% des métadonnées EXIF privées !
    .webp({ quality: 80 }) // Conversion en WebP pour économiser 70% de bande passante
    .toBuffer();
  ```

#### 🔹 Étape 2 : Configurer Multer pour la réception de fichier
Dans `services/media-api/src/controllers/upload.controller.ts` :
- Utilise `multer.memoryStorage()` pour que l'image reste en mémoire vive (pas de fichier temporaire non sécurisé sur le disque).
- Fixe la limite maximale de taille à 10 Mo (`limits: { fileSize: 10 * 1024 * 1024 }`).

#### 🔹 Étape 3 : Sauvegarder sur MinIO S3
Dans `services/media-api/src/services/s3.service.ts` :
- Utilise `@aws-sdk/client-s3` avec `PutObjectCommand`.
- Paramètre le `forcePathStyle: true` pour assurer la compatibilité avec le conteneur MinIO local.

#### 🔹 Étape 4 : Renvoyer l'URL publique
- Retourne une réponse HTTP 201 avec l'URL finale de l'image prête à être enregistrée dans le signalement.

---

### 📦 4. Exemple Concret (Réponse JSON de l'API Media)
```json
{
  "success": true,
  "imageUrl": "https://storage.ecotrack.local/reports/clean-photo-a89b72.webp",
  "format": "webp",
  "originalSizeKb": 4200,
  "compressedSizeKb": 320,
  "exifPurged": true
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance simplement la commande de test du Sprint 2 :
```powershell
python .agents/scripts/test_sprint2_tickets.py
```
**Ce que tu dois voir :**
```text
[PASS] SCRUM-47: Sharp Utility (sharp.util.ts) - Max 1920px & withMetadata(false)
[PASS] SCRUM-47: Upload Controller & Multer 10MB Limit (upload.controller.ts)
[PASS] SCRUM-47: AWS SDK v3 PutObjectCommand S3/MinIO Integration (s3.service.ts)
[PASS] SCRUM-47: Media API Server & Routes Definition (index.ts)
```

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La méthode `.withMetadata(false)` est bien présente dans le pipeline Sharp.
- [ ] L'image ressort au format WebP avec redimensionnement maximal à 1920px.
- [ ] Multer bloque tout fichier dépassant la limite stricte de 10 Mo (HTTP 413).
- [ ] La suite de tests `test_sprint2_tickets.py` valide tous les tests avec succès `[PASS]`.
"""
}

TICKETS["SCRUM-48"] = {
    "title": "ECO-22 | [AI] Microservice IA FastAPI — Classification Automatique des Photos d'Incidents",
    "desc": """# 🌿 SCRUM-48 : Microservice IA FastAPI — Classification Automatique des Photos d'Incidents

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-03 : Préqualification IA des Anomalies Urbaines (Computer Vision)**
* **Rôle Métier :** **Agent de Mairie** (reçoit l'aide de l'IA pour qualifier instantanément les signalements) & **Citoyen**.
* **Objectif Fonctionnel :** Quand une photo d'incident est soumise, le microservice Python FastAPI l'analyse automatiquement avec un modèle de Vision (MobileNetV3 / PyTorch) pour deviner la catégorie de l'anomalie (`DEPOT_SAUVAGE`, `NID_DE_POULE`, `ECLAIRAGE_PUBLIC`, `ENCOMBRANT`) et calculer un indice de confiance (entre 0% et 100%).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Hiba Dhouib** (AI / FastAPI)
* **Branche Git :** `feature/ECO-22-hiba-ai-fastapi`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/ai-vision/routers/classify.py` *(Créer la route HTTP d'inférence)*
  2. `services/ai-vision/services/vision_model.py` *(Charger le modèle de vision et faire la prédiction)*
  3. `services/ai-vision/main.py` *(Point d'entrée de l'application FastAPI)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Créer la route FastAPI dans `classify.py`
- Déclare un routeur FastAPI : `router = APIRouter(prefix="/v1")`.
- Crée la route POST `/v1/classify` qui accepte une image en upload :
  ```python
  @router.post("/classify")
  async def classify_image(file: UploadFile = File(...)):
      image_bytes = await file.read()
      # Appel au modèle
  ```

#### 🔹 Étape 2 : Préparer et prétraiter l'image avec Pillow
Dans `services/ai-vision/services/vision_model.py` :
- Ouvre l'image avec Pillow : `img = Image.open(io.BytesIO(image_bytes)).convert("RGB")`.
- Redimensionne à 224x224 pixels (format standard des réseaux de neurones de vision).

#### 🔹 Étape 3 : Exécuter la prédiction du modèle
- Passe l'image prétraitée dans le modèle PyTorch : `outputs = model(tensor)`.
- Applique la fonction Softmax pour transformer les scores bruts en pourcentages :
  `probabilities = torch.nn.functional.softmax(outputs, dim=1)`.
- Récupère la classe ayant le pourcentage le plus élevé et sa valeur de confiance.

#### 🔹 Étape 4 : Renvoyer la réponse JSON
- Renvoyer un dictionnaire contenant :
  - `suggestedCategory` : le nom de la catégorie (ex: `DEPOT_SAUVAGE`).
  - `confidence` : le score entre 0.0 et 1.0 (ex: 0.94).
  - `inferenceMs` : le temps calculé en millisecondes.

---

### 📦 4. Exemple Concret (Ce que répond le microservice IA)
```json
{
  "suggestedCategory": "DEPOT_SAUVAGE",
  "confidence": 0.94,
  "inferenceMs": 142,
  "topPredictions": [
    { "label": "DEPOT_SAUVAGE", "score": 0.94 },
    { "label": "ENCOMBRANT", "score": 0.04 },
    { "label": "GRAFFITI", "score": 0.02 }
  ]
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance le serveur FastAPI en local :
   ```powershell
   cd services/ai-vision
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. Ouvre la documentation interactive Swagger dans ton navigateur :
   👉 `http://localhost:8000/docs`
3. Clique sur la route `/v1/classify`, clique sur "Try it out", sélectionne une photo d'essai et clique sur "Execute" : tu verras la catégorie suggérée et le score de confiance !

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La route `POST /v1/classify` répond avec succès (HTTP 200).
- [ ] Le score de confiance retourné est bien un nombre flottant entre 0.0 et 1.0.
- [ ] Le temps d'inférence en local est rapide (< 500 ms).
- [ ] Mon commit Git respecte la norme : `git commit -m "feat(ai): ECO-22 fastapi image classification endpoint"`.
"""
}

TICKETS["SCRUM-49"] = {
    "title": "ECO-23 | [API] Contrôleur API Signalement & Émission d'Événement RabbitMQ",
    "desc": """# 🌿 SCRUM-49 : Contrôleur API Signalement & Émission d'Événement RabbitMQ

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-02 : Soumission Officielle du Signalement Citoyen**
* **Rôle Métier :** **Citoyen** (finalise son envoi d'anomalie) & **Agent / Microservices** (consomment le nouveau signalement).
* **Objectif Fonctionnel :** Créer la route officielle `POST /api/v1/reports` qui valide les données saisies par le citoyen, sauvegarde le signalement dans MongoDB, et publie un événement asynchrone `report.created` sur le bus RabbitMQ pour alerter immédiatement les autres services (ETL, notifications) sans faire attendre le citoyen (< 300 ms).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih** (Backend API / Integration)
* **Branche Git :** `feature/ECO-23-sara-report-creation`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/report-api/src/services/report.service.ts` *(Logique métier et requêtes MongoDB $near)*
  2. `services/report-api/src/controllers/report.controller.ts` *(Contrôleur Express et validation des entrées)*
  3. `services/report-api/src/routes/report.routes.ts` *(Déclaration des routes HTTP)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Implémenter les méthodes du Service
Dans `services/report-api/src/services/report.service.ts` :
1. `createReport(data)` : instancie le modèle Mongoose `new ReportModel(data)` et appelle `.save()`. Le statut par défaut doit être `NOUVEAU`.
2. `findReports(filter)` : si le paramètre `near=lng,lat` est présent, utilise la requête spatiale MongoDB :
   ```typescript
   query.location = {
     $near: {
       $geometry: { type: 'Point', coordinates: [lng, lat] },
       $maxDistance: radiusInMeters || 5000
     }
   };
   ```

#### 🔹 Étape 2 : Coder le Contrôleur Express
Dans `services/report-api/src/controllers/report.controller.ts` :
1. Récupère le corps de la requête `req.body`.
2. Vérifie la présence des champs obligatoires : `description`, `location.coordinates`, `imageUrl`.
   - Si un champ obligatoire manque, renvoie immédiatement une erreur `HTTP 400 Bad Request`.
3. Appelle le service `createReport(...)`.
4. Émets l'événement `report.created` vers RabbitMQ.
5. Renvoie `HTTP 201 Created` avec l'objet du signalement sauvegardé.

#### 🔹 Étape 3 : Gérer la consultation d'un signalement
- Implémente `getReportById(req, res)` : si l'identifiant n'existe pas dans MongoDB, renvoie proprement `HTTP 404 Not Found`.

---

### 📦 4. Exemple Concret (Ce que l'application envoie à l'API)
```json
{
  "reporterId": "672f09a1b9e1a2001c45a123",
  "category": "DEPOT_SAUVAGE",
  "description": "Déchets verts et encombrants bloquant l'accès piéton",
  "imageUrl": "https://storage.ecotrack.local/reports/photo-102.webp",
  "location": {
    "type": "Point",
    "coordinates": [2.3522, 48.8566]
  }
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
Lance simplement la suite de tests automatisée du Sprint 2 :
```powershell
python .agents/scripts/test_sprint2_tickets.py
```
**Ce que tu dois voir :**
```text
[PASS] SCRUM-49: Report Service with 2dsphere $near Proximity Search
[PASS] SCRUM-49: Report Controller & HTTP Status Codes (201, 200, 400, 404)
[PASS] SCRUM-49: Report API Server & Gateway Routes Definition (:3002)
```

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La route `POST /api/v1/reports` crée un signalement avec statut initial `NOUVEAU` (HTTP 201).
- [ ] Les coordonnées géographiques sont sauvegardées au format GeoJSON valide.
- [ ] La recherche par proximité GPS `$near` fonctionne correctement.
- [ ] La suite de tests `test_sprint2_tickets.py` passe à 100% au vert `[PASS]`.
- [ ] Mon commit Git est propre : `git commit -m "feat(report-api): ECO-23 report creation controller and spatial queries"`.
"""
}

TICKETS["SCRUM-57"] = {
    "title": "ECO-24 | [ETL-Data] Worker Python bi-etl-worker : Extraction Incrémentale vers Fact_Reports",
    "desc": """# 🌿 SCRUM-57 : Worker Python ETL — Synchronisation Incrémentale vers PostgreSQL (Data Warehouse)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-12 : Entrepôt de Données & Alimentation des Rapports Décisionnels Power BI**
* **Rôle Métier :** **Équipe Data / Responsable Municipal** (analyse les indicateurs sur Power BI).
* **Objectif Fonctionnel :** Développer un script Python d'extraction incrémentale (ETL) qui lit les signalements modifiés dans MongoDB depuis la dernière exécution (`updatedAt > lastSync`), anonymise les identifiants citoyens (hachage SHA-256 avec sel pour respecter le RGPD), et les insère dans la table de faits `Fact_Reports` de PostgreSQL sans doublon (UPSERT).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Ahmed Salah** (Data / ETL)
* **Branche Git :** `feature/ECO-24-ahmed-etl-initial`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/bi-etl/extractors/reports_extractor.py` *(Extraction depuis MongoDB)*
  2. `services/bi-etl/loaders/postgres_loader.py` *(Chargement sécurisé dans PostgreSQL)*
  3. `services/bi-etl/main.py` *(Boucle d'orchestration de l'ETL)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Extraire uniquement les nouveaux enregistrements
Dans `services/bi-etl/extractors/reports_extractor.py` :
- Connecte-toi à MongoDB via `pymongo`.
- Récupère le dernier timestamp de synchronisation stocké (ex: `last_sync_timestamp`).
- Exécute la requête : `db.reports.find({"updatedAt": {"$gt": last_sync_timestamp}})`.

#### 🔹 Étape 2 : Anonymiser l'identifiant citoyen (RGPD)
- Pour respecter la vie privée, ne transfère jamais l'ID citoyen en clair dans la base décisionnelle.
- Utilise la bibliothèque Python standard `hashlib` :
  ```python
  salt = os.getenv("ETL_SALT", "ecotrack_secret_salt_2026")
  citizen_hash = hashlib.sha256((report["reporterId"] + salt).encode()).hexdigest()
  ```

#### 🔹 Étape 3 : Insérer dans PostgreSQL avec UPSERT
Dans `services/bi-etl/loaders/postgres_loader.py` :
- Utilise `psycopg2` ou `SQLAlchemy`.
- Rédige la requête SQL d'insertion qui met à jour l'enregistrement s'il existe déjà :
  ```sql
  INSERT INTO Fact_Reports (report_id, citizen_hash, category, status, longitude, latitude, created_at, updated_at)
  VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
  ON CONFLICT (report_id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;
  ```

#### 🔹 Étape 4 : Mettre à jour l'horodatage de référence
- Une fois le lot inséré avec succès, enregistre le timestamp actuel comme nouvelle valeur de `last_sync_timestamp`.

---

### 📦 4. Exemple Concret (Ce qui est écrit dans la table Fact_Reports)
| report_id | citizen_hash | category | status | longitude | latitude | created_at |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `672f10a8b9e1` | `e3b0c44298fc...` | `DEPOT_SAUVAGE` | `NOUVEAU` | `2.3522` | `48.8566` | `2026-11-10 10:00:00` |

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Assure-toi que MongoDB et PostgreSQL sont allumés dans Docker :
   ```powershell
   docker compose ps
   ```
2. Exécute le script ETL :
   ```powershell
   python services/bi-etl/main.py
   ```
3. Ouvre un terminal SQL et vérifie que les lignes sont apparues :
   ```sql
   SELECT COUNT(*) FROM Fact_Reports;
   ```

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le filtre temporel incrémental fonctionne (ne recharge pas toute la base à chaque fois).
- [ ] Le hachage SHA-256 avec sel est appliqué à tous les identifiants citoyens.
- [ ] La clause `ON CONFLICT DO UPDATE` évite les erreurs de doublons.
- [ ] Mon commit Git est propre : `git commit -m "feat(etl): ECO-24 python incremental reports extractor to postgres"`.
"""
}

# ------------------------------------------------------------------------------
# SPRINT 3 (QUALIFICATION IA, FSM, OUVIER MOBILE & CARTE SUPERVISION)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-50"] = {
    "title": "ECO-30 | [API] Machine à États FSM & Transitions de Statuts (T1 - T4)",
    "desc": """# 🌿 SCRUM-50 : Machine à États Finis (FSM) & Gardes de Transition (T1 à T5)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-04 : Cycle de Vie & Workflow d'Intervention Municipal**
* **Rôle Métier :** **Agent de Mairie** (valide et assigne) & **Ouvrier de Voirie** (intervient sur le terrain).
* **Objectif Fonctionnel :** Empêcher toute incohérence dans le traitement d'une anomalie. Un ouvrier ne doit pas pouvoir clôturer un signalement qui n'a pas encore été validé par la Mairie. La machine à états finis (FSM) applique 5 règles strictes et rejette toute transition interdite avec une erreur `HTTP 409 Conflict`.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih** (Workflow / State Machine)
* **Branche Git :** `feature/ECO-30-sara-state-machine`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/workflow-api/src/services/state-machine.service.ts` *(Moteur de transitions et gardes)*
  2. `services/workflow-api/src/controllers/workflow.controller.ts` *(Points d'entrée d'action T1, T2, T3, T4)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Modéliser la table des transitions légales
Dans `state-machine.service.ts`, définis la matrice exacte du CDCF V2 :
- **T1 (Valider) :** `NOUVEAU` ➔ `VALIDE` *(Action Agent)*
- **T2 (Assigner) :** `VALIDE` ➔ `ASSIGNE` *(Action Agent avec désignation de l'ouvrier/équipe)*
- **T3 (Démarrer) :** `ASSIGNE` ➔ `EN_TRAITEMENT` *(Action Ouvrier sur le terrain)*
- **T4 (Clôturer) :** `EN_TRAITEMENT` ➔ `RESOLU` *(Action Ouvrier avec photo justificative)*
- **T5 (Rejeter) :** `NOUVEAU` ➔ `REJETE` *(Action Agent avec motif obligatoire)*

#### 🔹 Étape 2 : Coder la fonction de garde `canTransition(currentStatus, targetStatus, role)`
- Vérifie que le statut actuel permet d'atteindre le statut cible.
- Vérifie que l'utilisateur a le bon rôle (ex: seul le rôle `OUVRIER` ou `ADMIN` peut exécuter T3).

#### 🔹 Étape 3 : Gérer les erreurs et l'historique
- Si la transition est interdite (ex: tenter de passer directement de `NOUVEAU` à `RESOLU`) :
  Lève une exception `InvalidTransitionError` qui renvoie `HTTP 409 Conflict` avec un message clair.
- Si la transition est valide : met à jour le statut, enregistre l'horodatage exact et crée une ligne d'audit.

---

### 📦 4. Exemple Concret (Erreur en cas de transition illégale)
```json
{
  "statusCode": 409,
  "error": "INVALID_STATE_TRANSITION",
  "message": "Impossible de passer du statut 'NOUVEAU' au statut 'RESOLU'. Le signalement doit d'abord être validé (T1) puis assigné (T2)."
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance les tests unitaires du module de workflow :
   ```powershell
   npx nx test workflow-api
   ```
2. Vérifie qu'un test tente de forcer une transition interdite et reçoit bien le code HTTP 409.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Les 5 transitions T1, T2, T3, T4, T5 sont strictement codées.
- [ ] Une transition interdite renvoie le statut HTTP 409 sans modifier la base de données.
- [ ] Le rôle de l'utilisateur est contrôlé avant d'autoriser la transition.
- [ ] Mon commit Git est propre : `git commit -m "feat(workflow): ECO-30 finite state machine with T1-T5 guards"`.
"""
}

TICKETS["SCRUM-51"] = {
    "title": "ECO-31 | [UI-WEB] Écran d'Arbitrage Agent & Split-Screen Qualification",
    "desc": """# 🌿 SCRUM-51 : Écran Web de Qualification en Split-Screen pour l'Agent de Mairie

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-05 : Arbitrage & Modération des Signalements par l'Agent**
* **Rôle Métier :** **Agent de Mairie** (travaille sur son ordinateur pour valider les signalements des citoyens).
* **Objectif Fonctionnel :** Fournir à l'agent une interface moderne à double panneau ("Split-Screen") : à gauche la photo haute résolution envoyée par le citoyen avec possibilité de zoomer, à droite la suggestion de l'IA (catégorie et badge de confiance coloré) et les boutons d'action rapide pour valider en un clic (T1) ou corriger la catégorie si l'IA s'est trompée.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Hiba Dhouib** (Web UI / Integration IA)
* **Branche Git :** `feature/ECO-31-hiba-web-qualification`
* **Fichiers cibles à ouvrir / modifier :**
  1. `apps/web-react/src/pages/agent/QualificationPage.tsx` *(Page principale split-screen)*
  2. `apps/web-react/src/components/moderation/AnomalyCard.tsx` *(Composant de visualisation de l'anomalie)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Créer la disposition en deux colonnes (Split-Screen)
Dans `apps/web-react/src/pages/agent/QualificationPage.tsx` :
- Utilise Tailwind CSS avec une grille : `grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-80px)]`.
- **Panneau gauche :** Contient l'image de l'anomalie avec `object-cover rounded-xl shadow-lg` et un bouton pour zoomer en plein écran.
- **Panneau droit :** Contient les informations textuelles (adresse, date, description du citoyen).

#### 🔹 Étape 2 : Afficher le badge de confiance de l'IA
- Si la confiance IA est >= 80% : affiche un badge **vert émeraude** `bg-emerald-500/20 text-emerald-400` ("Confiance Élevée : 94%").
- Si la confiance est entre 60% et 79% : affiche un badge **ambre/jaune** `bg-amber-500/20 text-amber-400` ("À vérifier").
- Si la confiance est < 60% : affiche un badge **rouge** `bg-rose-500/20 text-rose-400` ("Confiance Faible").

#### 🔹 Étape 3 : Ajouter les boutons d'action d'arbitrage
- **Bouton Vert "Valider la suggestion IA (T1)" :** Envoie la validation immédiate et passe au signalement suivant dans la file.
- **Bouton Bleu "Modifier la catégorie" :** Ouvre une liste déroulante pour que l'agent choisisse manuellement la bonne catégorie.
- **Bouton Rouge "Rejeter le signalement (T5)" :** Ouvre une boîte de dialogue demandant le motif de rejet (ex: "Photo floue / Hors commune").

---

### 📦 4. Exemple Concret (Ce que l'écran envoie lors d'une validation)
```json
{
  "reportId": "672f10a8b9e1a2001c45a789",
  "action": "VALIDATE",
  "confirmedCategory": "DEPOT_SAUVAGE",
  "aiOverridden": false,
  "agentId": "672f08a0b9e1a2001c45a001"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance l'application Web React :
   ```powershell
   npx nx serve web-react
   ```
2. Ouvre ton navigateur sur `http://localhost:5173/agent/qualification`.
3. Vérifie visuellement que les deux panneaux s'affichent proprement côte-à-côte et que cliquer sur "Valider" met à jour le compteur d'anomalies traitées.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La disposition split-screen est responsive (deux colonnes sur grand écran, empilé sur mobile).
- [ ] Le badge de confiance IA change de couleur selon le score.
- [ ] Les actions Valider, Corriger et Rejeter déclenchent les bonnes requêtes API.
- [ ] Mon commit Git est propre : `git commit -m "feat(web): ECO-31 agent qualification split screen view"`.
"""
}

TICKETS["SCRUM-58"] = {
    "title": "ECO-32 | [UI-MOB] Feuille de Route Mobile Ouvrier par Proximité ($near) & Démarrage Chantier (T3)",
    "desc": """# 🌿 SCRUM-58 : Feuille de Route Mobile Ouvrier par Proximité ($near) & Démarrage Chantier (T3)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-06 : Intervention Terrain de l'Ouvrier Municipal**
* **Rôle Métier :** **Ouvrier de Voirie** (en camionnette municipale sur le terrain).
* **Objectif Fonctionnel :** Fournir à l'ouvrier municipal une liste claire de ses missions du jour, triées automatiquement de la plus proche à la plus éloignée de sa position GPS actuelle (grâce à l'index `$near`). L'ouvrier peut cliquer sur un bouton pour ouvrir son application GPS (Google Maps / Waze) et sur "Démarrer le chantier" pour déclencher la transition d'état T3 (`EN_TRAITEMENT`).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih** (Mobile / Ouvrier)
* **Branche Git :** `feature/ECO-32-sara-mobile-worker`
* **Fichiers cibles à ouvrir / modifier :**
  1. `apps/mobile/src/screens/Worker/RoadmapScreen.tsx` *(Liste des interventions triées par distance)*
  2. `apps/mobile/src/screens/Worker/InterventionDetailScreen.tsx` *(Fiche d'intervention et bouton démarrer)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Récupérer la position GPS de l'ouvrier
Dans `RoadmapScreen.tsx` :
- Utilise `expo-location` pour demander la permission et obtenir les coordonnées actuelles de l'ouvrier :
  `const location = await Location.getCurrentPositionAsync({});`.

#### 🔹 Étape 2 : Appeler l'API avec la position géographique
- Envoie une requête : `GET /api/v1/reports?status=ASSIGNE&near=${longitude},${latitude}`.
- L'API utilise l'index `2dsphere` (ECO-20) pour renvoyer la liste ordonnée par distance croissante (ex: "à 250 mètres", "à 1,2 km").

#### 🔹 Étape 3 : Créer la carte d'intervention
Pour chaque tâche, affiche :
- La catégorie (ex: "Nid-de-poule dangereux").
- L'adresse approximative et la distance.
- Un bouton d'action bleu "Itinéraire GPS" qui ouvre `Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=lat,lng')`.

#### 🔹 Étape 4 : Déclencher le démarrage du chantier (T3)
Dans `InterventionDetailScreen.tsx` :
- Ajoute un gros bouton vert "Démarrer l'intervention".
- Sur le clic, envoie `POST /api/v1/workflow/transition` avec `{ "reportId": id, "action": "START_WORK" }`.
- Le statut passe à `EN_TRAITEMENT` et l'horodatage de début `startedAt` est enregistré.

---

### 📦 4. Exemple Concret (Ce que reçoit l'ouvrier sur son téléphone)
```json
[
  {
    "id": "672f10a8b9e1a2001c45a789",
    "category": "NID_DE_POULE",
    "priority": "URGENT",
    "distanceMeters": 350,
    "address": "14 Avenue de la République",
    "status": "ASSIGNE"
  }
]
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance l'application Expo en mode ouvrier :
   ```powershell
   npx nx start mobile
   ```
2. Sur le simulateur, définis une position GPS d'essai (ex: Paris ou Tunis).
3. Connecte-toi avec un compte au rôle `OUVRIER` : l'écran doit afficher la feuille de route triée avec la distance exacte calculée.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La feuille de route trie bien les chantiers du plus proche au plus lointain.
- [ ] Le bouton itinéraire ouvre l'application cartographique externe sans faire planter l'application.
- [ ] Le bouton "Démarrer l'intervention" déclenche avec succès la transition T3 (`EN_TRAITEMENT`).
- [ ] Mon commit Git est propre : `git commit -m "feat(mobile): ECO-32 worker roadmap with gps proximity sorting"`.
"""
}

TICKETS["SCRUM-59"] = {
    "title": "ECO-33 | [Web-Data] Carte de Supervision Multi-filtres & Calcul des Lead Times",
    "desc": """# 🌿 SCRUM-59 : Carte Interactive de Supervision Multi-Filtres & Calcul des Délais (Lead Times)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-07 : Cartographie de Supervision & Observabilité des Délais Municipaux**
* **Rôle Métier :** **Responsable Voirie / Élus Municipaux** (suivent la situation en direct sur grand écran).
* **Objectif Fonctionnel :** Intégrer une carte interactive (Leaflet / Mapbox) dans le tableau de bord web affichant l'ensemble des anomalies urbaines sous forme de marqueurs colorés selon leur criticité et leur statut. Calculer également les délais intermédiaires de traitement (Lead Times : délai de triage T2-T1 et délai de prise en charge T3-T2).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Ahmed Salah** (Web GIS / Data)
* **Branche Git :** `feature/ECO-33-ahmed-web-map-leadtimes`
* **Fichiers cibles à ouvrir / modifier :**
  1. `apps/web-react/src/components/map/SupervisionMap.tsx` *(Composant carte interactive React)*
  2. `services/bi-etl/transformers/lead_times.py` *(Calcul des métriques de temps de traitement)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Intégrer la carte React Leaflet
Dans `apps/web-react/src/components/map/SupervisionMap.tsx` :
- Utilise `react-leaflet` avec `<MapContainer>`, `<TileLayer>`, `<Marker>`, et `<Popup>`.
- Configure le centre initial sur les coordonnées de la ville et un niveau de zoom adapté (ex: zoom 13).

#### 🔹 Étape 2 : Colorer les marqueurs selon l'état du signalement
- Marqueur **Jaune / Ambre** : Statut `NOUVEAU` (en attente d'arbitrage).
- Marqueur **Bleu** : Statut `VALIDE` ou `ASSIGNE` (équipe désignée).
- Marqueur **Orange** : Statut `EN_TRAITEMENT` (chantier en cours).
- Marqueur **Vert** : Statut `RESOLU` (intervention terminée).

#### 🔹 Étape 3 : Ajouter les filtres de recherche
- Ajoute au-dessus de la carte une barre de filtres :
  - Par catégorie (Nid-de-poule, Déchets, etc.).
  - Par statut de traitement.
  - Par niveau d'urgence.

#### 🔹 Étape 4 : Coder le calcul des Lead Times dans l'ETL
Dans `services/bi-etl/transformers/lead_times.py` :
- Calcule la durée entre la création et la validation : `T_Triage = validatedAt - createdAt`.
- Calcule la durée entre l'assignation et le début des travaux : `T_Pickup = startedAt - assignedAt`.
- Stocke ces métriques en heures décimales pour les graphiques Power BI.

---

### 📦 4. Exemple Concret (Métriques de délais calculées)
```json
{
  "reportId": "672f10a8b9e1a2001c45a789",
  "leadTimes": {
    "triageHours": 2.4,
    "pickupHours": 5.1,
    "totalResolutionHours": 14.8,
    "slaBreached": false
  }
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance l'application web :
   ```powershell
   npx nx serve web-react
   ```
2. Ouvre la page de cartographie dans ton navigateur.
3. Clique sur un filtre (ex: afficher seulement les "Nids-de-poule") : les marqueurs doivent se filtrer instantanément sans recharger la page.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La carte charge les tuiles OpenStreetMap sans erreur de certificat.
- [ ] Les marqueurs affichent une popup avec la photo et les détails au clic.
- [ ] Les délais `T_Triage` et `T_Pickup` sont calculés sans division par zéro.
- [ ] Mon commit Git est propre : `git commit -m "feat(web-gis): ECO-33 interactive supervision map and lead times"`.
"""
}

# ------------------------------------------------------------------------------
# SPRINT 4 (CLÔTURE TERRAIN, POWER BI CDC & MLOPS)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-60"] = {
    "title": "ECO-40 | [Workflow] Clôture Chantier T4 avec Photo après travaux (EXIF Purgé) & Réouverture Admin",
    "desc": """# 🌿 SCRUM-60 : Clôture Chantier T4 avec Photo Après Travaux & Gestion des Réouvertures Admin

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-08 : Clôture Définitive d'une Intervention avec Preuve Visuelle**
* **Rôle Métier :** **Ouvrier de Voirie** (prend la photo de fin de chantier) & **Administrateur** (peut rouvrir un dossier).
* **Objectif Fonctionnel :** Pour qu'une intervention passe au statut final `RESOLU` (transition T4), l'ouvrier **doit obligatoirement fournir une photo prouvant que les travaux ont été réalisés**. Le système purge les données EXIF de cette photo, horodate la résolution (`resolvedAt`), calcule le temps moyen de résolution (MTTR), et envoie une notification push au citoyen qui avait initialement signalé l'incident. L'administrateur dispose aussi d'une route spéciale pour rouvrir un ticket si le travail a été mal fait.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih** (Workflow & API)
* **Branche Git :** `feature/ECO-40-sara-closure-reopen`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/workflow-api/src/controllers/resolution.controller.ts` *(Route de clôture T4)*
  2. `services/workflow-api/src/controllers/reopen.controller.ts` *(Route de réouverture administrative)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Créer la route de résolution `POST /interventions/:id/resolve`
Dans `resolution.controller.ts` :
1. Vérifie que le signalement est actuellement dans l'état `EN_TRAITEMENT`.
2. Vérifie qu'une photo de fin de travaux est fournie (`completionImageUrl`). Si absente : renvoie `HTTP 400 Bad Request` ("La photo après travaux est obligatoire pour clôturer le chantier").
3. Fais passer le statut à `RESOLU`.
4. Enregistre la date de résolution : `resolvedAt = new Date()`.
5. Calcule le temps total d'intervention en heures (MTTR).

#### 🔹 Étape 2 : Notifier le citoyen
- Émets un événement `report.resolved` pour envoyer un email ou une notification push au citoyen avec la photo du trottoir nettoyé ou réparé !

#### 🔹 Étape 3 : Créer la route d'exception `POST /reports/:id/reopen`
Dans `reopen.controller.ts` :
1. Sécurise la route pour qu'elle soit réservée exclusivement au rôle `ADMIN`.
2. Exige un champ `reopenReason` obligatoire (ex: "Travail incomplet constaté lors du contrôle").
3. Fais repasser le statut à `ASSIGNE` pour qu'une équipe y retourne, et journalise l'action dans `AuditLogs`.

---

### 📦 4. Exemple Concret (Requête de clôture envoyée par l'ouvrier)
```json
{
  "completionImageUrl": "https://storage.ecotrack.local/reports/resolution-photo-88.webp",
  "comment": "Nid-de-poule rebouché avec enrobé à froid. Circulation rétablie.",
  "materialsUsed": ["Enrobé 50kg", "Panneaux signalisation"]
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance les tests de clôture :
   ```powershell
   npx nx test workflow-api --testFile=resolution.spec.ts
   ```
2. Vérifie qu'une tentative de clôture sans photo renvoie bien une erreur HTTP 400.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] La photo après travaux est strictement obligatoire pour valider la transition T4.
- [ ] Le statut passe bien à `RESOLU` et `resolvedAt` est horodaté.
- [ ] La réouverture nécessite le rôle ADMIN et un motif textuel obligatoire.
- [ ] Mon commit Git est propre : `git commit -m "feat(workflow): ECO-40 T4 resolution with completion photo and admin reopen"`.
"""
}

TICKETS["SCRUM-52"] = {
    "title": "ECO-41 | [BI-Data] Pipeline CDC Anonymisé (SHA-256) & Modèle DAX Power BI",
    "desc": """# 🌿 SCRUM-52 : Pipeline CDC Anonymisé (SHA-256) & Modèle de Mesures DAX Power BI

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-09 : Modélisation Décisionnelle & Indicateurs de Performance (KPIs)**
* **Rôle Métier :** **Directeur Général des Services (DGS) & Élus Municipaux** (consultent les rapports exécutifs).
* **Objectif Fonctionnel :** Mettre en place la synchronisation en continu (Change Data Capture) depuis la base transactionnelle vers le schéma en étoile PostgreSQL, avec anonymisation stricte des citoyens (RGPD) et troncature géographique à 100m. Développer les formules statistiques DAX dans Power BI pour calculer le respect des délais légaux (SLA) et la vitesse moyenne de réparation (MTTR).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (Data / Power BI)
* **Branche Git :** `feature/ECO-41-adem-cdc-powerbi`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/bi-etl/main.py` *(Pipeline d'extraction continue)*
  2. `docs/powerbi_dax_measures.md` *(Définition des formules de calcul DAX)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Mettre en place le Change Data Capture (CDC)
Dans `services/bi-etl/main.py` :
- Utilise un curseur régulier ou les Change Streams de MongoDB pour écouter les modifications en temps réel.
- Chaque mise à jour de statut est propagée dans la table de faits `Fact_Reports`.

#### 🔹 Étape 2 : Anonymisation des coordonnées GPS (RGPD)
- Pour éviter qu'un rapport décisionnel municipal ne permette d'identifier l'adresse exacte d'un citoyen :
  - Arrondis les coordonnées GPS à 3 décimales (précision ~100 mètres) avant insertion dans `Dim_Geography`.
  - Exemple : `2.3522219 ➔ 2.352`.

#### 🔹 Étape 3 : Écrire les formules DAX pour Power BI
Dans `docs/powerbi_dax_measures.md`, documente et teste les formules :
1. **Taux de dépassement SLA (%) :**
   ```dax
   Taux_Depassement_SLA = 
   DIVIDE(
       CALCULATE(COUNT(Fact_Reports[report_id]), Fact_Reports[sla_breached] = TRUE()),
       COUNT(Fact_Reports[report_id]),
       0
   ) * 100
   ```
2. **Délai Moyen de Résolution (MTTR en Heures) :**
   ```dax
   MTTR_Moyen = AVERAGE(Fact_Reports[mttr_hours])
   ```

---

### 📦 4. Exemple Concret (Indicateurs affichés dans le rapport Power BI)
- **Signalements totaux ce mois-ci :** 1 240
- **Délai moyen de résolution (MTTR) :** 18,4 heures (Objectif CDCF < 24h ✅)
- **Taux de respect du SLA :** 94,2% ✅

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance le script CDC sur un jeu de données test :
   ```powershell
   python services/bi-etl/main.py --mode=cdc
   ```
2. Vérifie que les données dans PostgreSQL ont bien des coordonnées arrondies à 3 décimales.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le pipeline CDC répercute les changements de statut en moins de 10 secondes.
- [ ] Les coordonnées GPS sont bien floutées à ~100m dans le Data Warehouse.
- [ ] Les formules DAX sont validées et documentées dans `docs/powerbi_dax_measures.md`.
- [ ] Mon commit Git est propre : `git commit -m "feat(bi): ECO-41 CDC pipeline and DAX measures documentation"`.
"""
}

TICKETS["SCRUM-53"] = {
    "title": "ECO-42 | [BI-Web] API Power BI Embed Token & Intégration React du Rapport Décisionnel",
    "desc": """# 🌿 SCRUM-53 : API Power BI Embed Token & Intégration Sécurisée dans l'Application Web

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-10 : Tableaux de Bord Décisionnels Municipaux Intégrés**
* **Rôle Métier :** **Maire, Adjoints & Directeurs de Services** (consultent les rapports directement dans l'application web sans quitter leur session).
* **Objectif Fonctionnel :** Permettre l'affichage transparent et interactif des 4 rapports officiels Power BI (Opérationnel, MLOps, Performance Équipes, SLA) au sein du portail web React. L'API backend génère un jeton sécurisé temporaire Azure AD ("Embed Token") en appliquant la sécurité au niveau des lignes (Row-Level Security - RLS) pour que chaque responsable ne voie que les données de son secteur.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Ahmed Salah** (Web / Azure Integration)
* **Branche Git :** `feature/ECO-42-ahmed-powerbi-token`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/bi-etl/controllers/bi_embed.controller.ts` *(Génération du jeton Azure AD)*
  2. `apps/web-react/src/pages/admin/AnalyticsPage.tsx` *(Composant React affichant l'iframe sécurisée Power BI)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Obtenir le jeton Azure AD côté backend
Dans `services/bi-etl/controllers/bi_embed.controller.ts` :
- Utilise la bibliothèque `@azure/msal-node` avec les identifiants d'un compte de service (Service Principal).
- Appelle l'API REST officielle de Microsoft Power BI pour générer un jeton temporaire :
  `POST https://api.powerbi.com/v1.0/myorg/GenerateToken`.

#### 🔹 Étape 2 : Appliquer la sécurité Row-Level Security (RLS)
- Dans la demande de jeton, transmets le rôle et la zone de l'utilisateur connecté :
  ```json
  {
    "accessLevel": "View",
    "identities": [
      {
        "username": "agent-quartier-nord@ville.fr",
        "roles": ["QuartierNord"],
        "datasets": ["dataset-id-ecotrack"]
      }
    ]
  }
  ```

#### 🔹 Étape 3 : Intégrer le composant dans React
Dans `apps/web-react/src/pages/admin/AnalyticsPage.tsx` :
- Utilise le package officiel `powerbi-client-react`.
- Récupère le jeton via l'API, puis configure le composant :
  ```tsx
  <PowerBIEmbed
    embedConfig={{
      type: 'report',
      id: reportId,
      embedUrl: embedUrl,
      accessToken: token,
      tokenType: models.TokenType.Embed
    }}
  />
  ```

---

### 📦 4. Exemple Concret (Ce que renvoie l'API d'authentification Power BI)
```json
{
  "reportId": "d8b3c10a-45ef-4a11-b892-0123456789ab",
  "embedUrl": "https://app.powerbi.com/reportEmbed?reportId=d8b3c10a...",
  "accessToken": "H4sIAAAAAAAEAC2W... (jeton JWT chiffré)",
  "expiresAt": "2026-11-10T12:00:00.000Z"
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance l'application web :
   ```powershell
   npx nx serve web-react
   ```
2. Connecte-toi avec un compte Administrateur et va sur l'onglet "Analytique / Décisionnel".
3. Le tableau de bord interactif Power BI doit s'afficher sans demander de mot de passe supplémentaire !

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le backend génère un jeton Power BI Embed valide.
- [ ] La restriction par rôle (RLS) est prise en compte.
- [ ] Le rapport s'affiche de manière fluide dans l'application web sans scrollbar parasite.
- [ ] Mon commit Git est propre : `git commit -m "feat(bi-web): ECO-42 power bi embed token api and react container"`.
"""
}

TICKETS["SCRUM-61"] = {
    "title": "ECO-43 | [AI-MLOps] Suivi de la Concordance IA/Humain, Export Active Learning & Matrice de Confusion BI",
    "desc": """# 🌿 SCRUM-61 : Gouvernance MLOps — Concordance IA/Humain & Matrice de Confusion

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-11 : Observabilité de l'IA & Amélioration Continue (Active Learning)**
* **Rôle Métier :** **Ingénieur MLOps / Chef de Projet IA** & **Agent de Mairie**.
* **Objectif Fonctionnel :** Suivre en continu la qualité des suggestions faites par l'IA. Si l'agent municipal valide la suggestion sans la changer, l'accord est positif. S'il corrige la catégorie (ex: l'IA a cru voir un dépôt sauvage alors que c'était un encombrant), le système enregistre cette divergence. Toutes les divergences sont automatiquement exportées dans un jeu de données ("Active Learning") pour réentraîner le modèle et alimenter la matrice de confusion dans Power BI.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Hiba Dhouib** (AI / MLOps)
* **Branche Git :** `feature/ECO-43-hiba-mlops-bi`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/ai-vision/evaluation/agreement_tracker.py` *(Calcul du taux d'accord IA/Humain)*
  2. `apps/web-react/src/pages/admin/AiGovernancePage.tsx` *(Page web d'observabilité MLOps)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Calculer le taux d'accord IA / Humain
Dans `services/ai-vision/evaluation/agreement_tracker.py` :
- Définis la formule de calcul :
  $$\\text{aiAgreementRate} = \\frac{\\text{Nombre de signalements validés sans modification}}{\\text{Nombre total de signalements validés}} \\times 100$$
- Déclenche une alerte si ce taux passe en-dessous de 70% (seuil critique du CDCF V2).

#### 🔹 Étape 2 : Exporter les cas d'erreur pour l'Active Learning
- Crée une fonction `export_divergences_to_json()` :
  - Sélectionne tous les signalements où `aiOverridden === true`.
  - Sauvegarde l'image, la catégorie prédite par l'IA, et la vraie catégorie corrigée par l'humain.
  - Ce jeu servira à la prochaine session d'apprentissage du réseau de neurones.

#### 🔹 Étape 3 : Alimenter la dimension `Dim_AI_Model` dans PostgreSQL
- Remplis la table de dimension du Data Warehouse avec la matrice des prédictions vs réalité pour permettre à Power BI de tracer la matrice de confusion 6x6.

---

### 📦 4. Exemple Concret (Indicateurs MLOps retournés)
```json
{
  "totalEvaluated": 450,
  "agreedCount": 396,
  "overriddenCount": 54,
  "overallAgreementRate": "88.0%",
  "mostConfusedClasses": [
    { "predicted": "DEPOT_SAUVAGE", "actual": "ENCOMBRANT", "occurrences": 22 }
  ]
}
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance le script de suivi MLOps :
   ```powershell
   python services/ai-vision/evaluation/agreement_tracker.py
   ```
2. Vérifie qu'il affiche dans la console le taux d'accord global et génère le fichier `active_learning_dataset.json`.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le calcul du taux d'accord `aiAgreementRate` est exact.
- [ ] Les cas de divergence sont correctement exportés au format JSON.
- [ ] La page de gouvernance affiche la matrice de confusion dans l'interface web.
- [ ] Mon commit Git est propre : `git commit -m "feat(mlops): ECO-43 agreement tracker and active learning dataset export"`.
"""
}

# ------------------------------------------------------------------------------
# SPRINT 5 (QA, TESTS DE CHARGE K6, PLAYWRIGHT & DÉPLOIEMENT K8S)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-62"] = {
    "title": "ECO-50 | [QA-DevOps] Tests de Charge k6 validant la latence API P95 < 300 ms (NFR-01)",
    "desc": """# 🌿 SCRUM-62 : Campagne de Tests de Charge k6 (Validation P95 < 300 ms)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Exigence Non Fonctionnelle (NFR) :** **NFR-01 : Performance, Haute Disponibilité & Latence Maximale**
* **Rôle Métier :** **Tous les utilisateurs** (garantie que l'application reste ultra-rapide même si 1 000 citoyens l'utilisent en même temps).
* **Objectif Fonctionnel :** Simuler une charge réaliste de 100 requêtes par seconde avec l'outil de performance **k6**. Vérifier formellement que **95% des requêtes (P95) obtiennent une réponse en moins de 300 millisecondes**, et simuler un test de panne ("Chaos Test") pour s'assurer que l'application continue de fonctionner si le microservice IA est arrêté.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (QA / DevOps)
* **Branche Git :** `feature/ECO-50-adem-k6-loadtests`
* **Fichiers cibles à ouvrir / modifier :**
  1. `tests/k6/load_test_reports.js` *(Scénario de montée en charge k6)*
  2. `tests/k6/stress_test_gateway.js` *(Scénario de stress et test de panne)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Rédiger le scénario k6
Dans `tests/k6/load_test_reports.js` :
- Configure les paliers de montée en charge (`stages`) :
  - Montée progressive : 0 à 50 utilisateurs virtuels (VUs) en 30 secondes.
  - Charge stable : 100 VUs pendant 2 minutes.
  - Descente : retour à 0 en 30 secondes.

#### 🔹 Étape 2 : Définir les seuils stricts du CDCF (Thresholds)
- Ajoute la condition bloquante dans le script k6 :
  ```javascript
  export const options = {
    thresholds: {
      http_req_duration: ['p(95)<300'], // 🚨 95% des requêtes doivent répondre en moins de 300ms !
      http_req_failed: ['rate<0.01']     // Moins de 1% d'erreurs tolérées
    }
  };
  ```

#### 🔹 Étape 3 : Tester le repli en cas de panne (Chaos Test)
- Dans `stress_test_gateway.js`, simule l'arrêt du conteneur IA : la passerelle API doit renvoyer un mode dégradé gracieux sans crasher (HTTP 200 avec catégorie par défaut "NON_QUALIFIE").

---

### 📦 4. Exemple Concret (Rapport de sortie k6)
```text
✓ status is 200
✓ response time P95 < 300ms

checks...............: 100.00% ✓ 12500 ✗ 0
http_req_duration....: avg=112ms min=45ms med=98ms max=285ms p(95)=214ms ✅
http_req_failed......: 0.00%   ✓ 0     ✗ 12500
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance l'environnement local avec Docker (`docker compose up -d`).
2. Exécute le test de charge avec k6 :
   ```powershell
   k6 run tests/k6/load_test_reports.js
   ```
3. Si le seuil `p(95)<300` est vert avec un crochet `✓`, l'exigence NFR-01 est officiellement validée pour la soutenance !

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le scénario k6 s'exécute sans aucune erreur HTTP 500.
- [ ] La latence P95 mesurée est strictement inférieure à 300 millisecondes.
- [ ] Le test de chaos confirme la résilience de la passerelle en cas de coupure de l'IA.
- [ ] Mon commit Git est propre : `git commit -m "test(k6): ECO-50 performance test validating NFR-01 p95 under 300ms"`.
"""
}

TICKETS["SCRUM-63"] = {
    "title": "ECO-51 | [AI-MLOps] Évaluation Scientifique du Modèle IA sur Jeu Étiqueté (Précision, Rappel, F1-Score)",
    "desc": """# 🌿 SCRUM-63 : Évaluation Scientifique et Métrologique du Modèle IA de Vision

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Exigence Non Fonctionnelle (NFR) :** **NFR-02 : Précision Scientifique & Métrologie IA**
* **Rôle Métier :** **Ingénieur IA / Jury Académique** (exige des preuves scientifiques des performances de l'IA).
* **Objectif Fonctionnel :** Exécuter une campagne d'évaluation rigoureuse du modèle de classification sur un jeu de test de référence (200 photos annotées manuellement). Calculer les indicateurs standards de la recherche en intelligence artificielle : **Précision**, **Rappel (Recall)** et **F1-Score** pour chaque classe d'anomalie, et rédiger le rapport officiel pour la soutenance.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Hiba Dhouib** (AI / MLOps)
* **Branche Git :** `feature/ECO-51-hiba-ai-benchmark`
* **Fichiers cibles à ouvrir / modifier :**
  1. `services/ai-vision/evaluation/benchmark.py` *(Script de calcul mathématique des métriques)*
  2. `docs/rapport_evaluation_ia.md` *(Document markdown récapitulatif pour le jury)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Charger le jeu de test annoté
Dans `services/ai-vision/evaluation/benchmark.py` :
- Charge le dossier d'images de test contenant les 6 classes officielles (nids-de-poule, dépôts sauvages, éclairage, tags/graffitis, encombrants, signalisation endommagée).

#### 🔹 Étape 2 : Exécuter les prédictions et comparer à la vérité terrain
- Pour chaque photo, compare la classe prédite à la vraie classe (`ground truth`).
- Construis la matrice de confusion 6x6 avec `scikit-learn` :
  ```python
  from sklearn.metrics import classification_report, confusion_matrix
  report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
  ```

#### 🔹 Étape 3 : Valider le F1-Score minimal (> 80%)
- Vérifie que le F1-Score global pondéré dépasse les **80%** exigés par le cahier des charges.

#### 🔹 Étape 4 : Rédiger le rapport d'évaluation
- Sauvegarde les tableaux et graphiques dans `docs/rapport_evaluation_ia.md` avec l'analyse des points forts et des confusions résiduelles.

---

### 📦 4. Exemple Concret (Tableau de performance du modèle)
| Catégorie d'Anomalie | Précision | Rappel (Recall) | F1-Score | Nombre d'Images |
| :--- | :--- | :--- | :--- | :--- |
| **Dépôt Sauvage** | 91.2% | 88.5% | **89.8%** | 50 |
| **Nid-de-poule** | 87.5% | 85.0% | **86.2%** | 40 |
| **Éclairage Défaillant**| 94.0% | 92.0% | **93.0%** | 35 |
| **Moyenne Globale** | **90.4%** | **88.2%** | **89.3%** ✅ | **200** |

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance le benchmark en une seule commande :
   ```powershell
   python services/ai-vision/evaluation/benchmark.py
   ```
2. Le script génère la matrice de confusion et affiche le tableau des scores directement dans la console.

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le benchmark s'exécute sur l'intégralité des 200 images de test.
- [ ] Le F1-Score global est supérieur au seuil minimal de 80%.
- [ ] Le document `docs/rapport_evaluation_ia.md` est rédigé et prêt pour la soutenance.
- [ ] Mon commit Git est propre : `git commit -m "docs(ai): ECO-51 scientific evaluation report and confusion matrix"`.
"""
}

TICKETS["SCRUM-64"] = {
    "title": "ECO-52 | [QA-E2E] Recette Complète E2E Multi-Acteurs (Playwright) & Audit Accessibilité WCAG 2.1 AA",
    "desc": """# 🌿 SCRUM-64 : Recette Bout-en-Bout Multi-Acteurs (Playwright) & Audit Accessibilité (WCAG 2.1 AA)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Exigence Non Fonctionnelle (NFR) :** **NFR-03 : Qualité Logicielle & Accessibilité Numérique (RGAA / WCAG)**
* **Rôle Métier :** **Tous les utilisateurs (Citoyen, Agent, Ouvrier, Admin)**, y compris les personnes en situation de handicap visuel ou moteur.
* **Objectif Fonctionnel :** Valider par un test automatisé Playwright le parcours utilisateur complet d'EcoTrack : un citoyen signale une anomalie ➔ l'IA la préqualifie ➔ l'agent de mairie valide et assigne ➔ l'ouvrier intervient et clôture avec photo ➔ les données apparaissent dans Power BI. Réaliser également un audit automatisé Axe pour prouver la conformité **WCAG 2.1 niveau AA** (contrastes de couleurs suffisants, navigation au clavier).

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeuse assignée :** **Sara Sahih** (QA / Testing E2E)
* **Branche Git :** `feature/ECO-52-sara-e2e-a11y`
* **Fichiers cibles à ouvrir / modifier :**
  1. `tests/e2e/citizen_to_worker.spec.ts` *(Scénario Playwright bout-en-bout)*
  2. `tests/e2e/a11y_audit.spec.ts` *(Audit automatisé d'accessibilité avec @axe-core/playwright)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Écrire le scénario Playwright complet
Dans `tests/e2e/citizen_to_worker.spec.ts` :
1. Simule la connexion citoyenne et la soumission d'un formulaire avec photo.
2. Déconnecte et connecte l'agent de mairie : vérifie que le signalement apparaît dans la file et clique sur "Valider".
3. Connecte l'ouvrier : vérifie que la tâche apparaît dans sa feuille de route, clique sur "Démarrer" puis "Clôturer".
4. Vérifie que le statut final est `RESOLU`.

#### 🔹 Étape 2 : Coder le test d'accessibilité Axe
Dans `tests/e2e/a11y_audit.spec.ts` :
- Utilise `@axe-core/playwright` sur chaque page clé (Accueil, Formulaire, Modération, Statistiques) :
  ```typescript
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
  ```
- Vérifie que les contrastes de texte dépassent le ratio minimal de 4.5:1 (WCAG AA).

---

### 📦 4. Exemple Concret (Rapport de validation Playwright)
```text
Running 2 tests using 1 worker
  ✓  tests/e2e/citizen_to_worker.spec.ts:12:1 › Full Lifecycle: Citizen -> Agent -> Worker (8.4s)
  ✓  tests/e2e/a11y_audit.spec.ts:15:1 › WCAG 2.1 AA Compliance Audit (0 violations) (3.1s)

  2 passed (11.5s)
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance les services nécessaires en arrière-plan (`docker compose up -d`).
2. Exécute le test Playwright :
   ```powershell
   npx playwright test
   ```
3. Tu verras le navigateur s'ouvrir et exécuter toutes les étapes automatiquement sous tes yeux !

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le scénario multi-acteurs complet traverse les statuts du début à la fin sans blocage.
- [ ] L'audit d'accessibilité Axe remonte 0 violation bloquante (WCAG AA validé).
- [ ] Les tests s'exécutent avec succès dans le pipeline d'intégration continue GitHub Actions.
- [ ] Mon commit Git est propre : `git commit -m "test(e2e): ECO-52 full lifecycle playwright test and axe a11y audit"`.
"""
}

TICKETS["SCRUM-65"] = {
    "title": "ECO-53 | [DevOps] Déploiement K8s avec HPA, Scripts de Seed 500 Signalements & Répétition Soutenance",
    "desc": """# 🌿 SCRUM-65 : Déploiement Kubernetes avec HPA, Script de Données Réalistes (500 Seeds) & Soutenance

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Exigence Non Fonctionnelle (NFR) :** **NFR-04 : Déploiement Cloud, Scalabilité & Préparation de la Soutenance**
* **Rôle Métier :** **Équipe Complète (Adem, Ahmed, Hiba, Sara)** & **Jury d'Évaluation**.
* **Objectif Fonctionnel :** Déployer les microservices sur un cluster Kubernetes avec autoscaling horizontal automatique (HPA qui augmente le nombre de répliques si l'utilisation CPU dépasse 70%). Écrire un script de peuplement ("Seed") générant 500 signalements réalistes géolocalisés pour alimenter magnifiquement les cartes et les rapports Power BI lors de la démonstration orale devant le jury.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (Lead Dev / DevOps)
* **Branche Git :** `feature/ECO-53-adem-k8s-prod`
* **Fichiers cibles à ouvrir / modifier :**
  1. `deploy/k8s/hpa-report-service.yaml` *(Configuration de l'autoscaler Kubernetes)*
  2. `scripts/seed_demo_data.ts` *(Script de génération de 500 signalements réalistes)*
  3. `docs/deroule_soutenance.md` *(Fiche de passage chronométrée pour l'équipe)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant (Étape par Étape)

#### 🔹 Étape 1 : Configurer le Horizontal Pod Autoscaler (HPA)
Dans `deploy/k8s/hpa-report-service.yaml` :
- Spécifie les bornes : minimum 2 répliques, maximum 10 répliques.
- Règle de déclenchement : si la moyenne CPU des pods dépasse 70%, Kubernetes démarre automatiquement de nouveaux conteneurs.

#### 🔹 Étape 2 : Créer le script de peuplement (500 Seeds)
Dans `scripts/seed_demo_data.ts` :
- Génère 500 signalements répartis sur les 6 quartiers de la ville :
  - 60% Résolus, 20% En traitement, 15% Nouveaux, 5% Rejetés.
  - Coordonnées GPS réalistes réparties dans le périmètre urbain.
  - Dates échelonnées sur les 3 derniers mois pour donner de superbes courbes temporelles dans Power BI !

#### 🔹 Étape 3 : Préparer la répétition de la soutenance
Dans `docs/deroule_soutenance.md` :
- Répétition chronométrée de 20 minutes (5 minutes par membre) :
  1. **Adem :** Architecture globale, DevOps, Monorepo & Power BI DAX.
  2. **Ahmed :** Application Mobile Expo, géolocalisation `$near` & ETL.
  3. **Hiba :** Microservice IA Vision, FastAPI & Gouvernance MLOps.
  4. **Sara :** Portail Web, Machine à états FSM, Workflow & Tests E2E Playwright.

---

### 📦 4. Exemple Concret (Extrait de la commande de seed)
```powershell
npx ts-node scripts/seed_demo_data.ts --count=500
# Sortie :
# [SEED] Insertion de 500 signalements historiques terminée avec succès.
# [SEED] Cartographie et rapports Power BI prêts pour la démonstration !
```

---

### 🧪 5. Comment tester sur ma machine ? (Pas de panique !)
1. Lance le script de seed :
   ```powershell
   npx ts-node scripts/seed_demo_data.ts
   ```
2. Ouvre le portail web ou le tableau de bord : les graphiques et la carte se remplissent immédiatement de données professionnelles !

---

### ✅ 6. Checklist de Validation (Definition of Done)
- [ ] Le manifeste Kubernetes HPA est syntaxiquement valide (`kubectl apply --dry-run=client`).
- [ ] Les 500 données d'essai sont insérées sans erreur d'intégrité référentielle.
- [ ] Le plan de présentation de la soutenance est validé par les 4 étudiants.
- [ ] Mon commit Git est propre : `git commit -m "chore(prod): ECO-53 k8s hpa configuration and 500 demo seed dataset"`.
"""
}

# ------------------------------------------------------------------------------
# SPRINT 0 (SOCLE & DEVOPS - CAPITAL POUR LA COMPRÉHENSION FONDATRICE)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-38"] = {
    "title": "ECO-01 | [DevOps] Initialize Nx Monorepo & CI/CD",
    "desc": """# 🌿 SCRUM-38 : Initialisation du Monorepo Nx, Docker Compose & Pipeline CI/CD

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Architecture Monorepo & Infrastructure d'Intégration Continue**
* **Rôle Métier :** **Toute l'équipe de développement** (Adem, Ahmed, Hiba, Sara).
* **Objectif Fonctionnel :** Poser les fondations techniques du projet EcoTrack V2 dans un unique dépôt de code structuré (Nx Monorepo). Configurer `docker-compose.yml` pour démarrer d'une seule commande toutes les bases de données (MongoDB 7, PostgreSQL 16, Redis 7, RabbitMQ, MinIO) et automatiser les tests avec GitHub Actions.

---

### 📂 2. Où travailler ? (Fichiers & Git)
* **Développeur assigné :** **Adem Ouerhani** (Lead Dev / DevOps)
* **Branche Git :** `feature/ECO-01-adem-nx-init`
* **Fichiers cibles :**
  1. `nx.json` & `package.json` *(Configuration des packages et commandes partagées)*
  2. `docker-compose.yml` *(Déclaration des conteneurs de développement)*
  3. `.github/workflows/ci.yml` *(Pipeline d'intégration continue automatisé)*

---

### 🪜 3. Guide Pas-à-Pas pour Débutant
1. Configurer les conteneurs dans `docker-compose.yml` avec ports d'écoute standards (Mongo: 27017, Postgres: 5432, Redis: 6379, MinIO: 9000).
2. Définir les scripts partagés dans `package.json` : `npm run build`, `npm run lint`, `npm run test`.
3. Écrire le workflow GitHub Actions pour exécuter le linting et les tests à chaque Pull Request.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
docker compose up -d
docker compose ps # Tous les conteneurs doivent être "Up (healthy)"
```
"""
}

TICKETS["SCRUM-39"] = {
    "title": "ECO-02 | [UI-MOB] Initialize Expo App & Design Tokens",
    "desc": """# 🌿 SCRUM-39 : Scaffolding de l'Application Mobile Expo & Charte Graphique CDCF

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Application Mobile Citoyen & Ouvrier (React Native / Expo)**
* **Rôle Métier :** **Citoyen** & **Ouvrier**.
* **Objectif Fonctionnel :** Initialiser le projet mobile avec Expo SDK, configurer la navigation par onglets, et implémenter la charte graphique officielle du CDCF V2 (Vert émeraude `#059669` pour l'écologie et Bleu saphir `#1E3A8A` pour l'institution municipale).

---

### 📂 2. Où travailler ?
* **Développeur assigné :** **Ahmed Salah** (Mobile Lead)
* **Fichiers cibles :** `apps/mobile/app.json`, `apps/mobile/src/theme/colors.ts`, `apps/mobile/src/theme/typography.ts`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
npx nx start mobile
```
"""
}

TICKETS["SCRUM-40"] = {
    "title": "ECO-03 | [AI] Initialize FastAPI & PyTorch Environment",
    "desc": """# 🌿 SCRUM-40 : Initialisation du Microservice IA (Python FastAPI & PyTorch)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Microservice d'Intelligence Artificielle de Vision**
* **Rôle Métier :** **Système IA**.
* **Objectif Fonctionnel :** Configurer l'environnement Python 3.11 avec FastAPI, PyTorch et Torchvision, créer le conteneur Dockerfile optimisé et exposer la route de santé `GET /health`.

---

### 📂 2. Où travailler ?
* **Développeuse assignée :** **Hiba Dhouib** (AI Lead)
* **Fichiers cibles :** `services/ai-vision/requirements.txt`, `services/ai-vision/main.py`, `services/ai-vision/Dockerfile`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
curl http://localhost:8000/health
# Doit renvoyer : {"status": "healthy", "service": "ai-vision"}
```
"""
}

TICKETS["SCRUM-41"] = {
    "title": "ECO-04 | [UI-WEB] Initialize React Vite & Tailwind CSS",
    "desc": """# 🌿 SCRUM-41 : Initialisation de l'Application Web de Supervision (React / Vite / Tailwind)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Portail Web d'Administration & Modération Municipale**
* **Rôle Métier :** **Agent de Mairie** & **Administrateur**.
* **Objectif Fonctionnel :** Scaffolder l'application React avec Vite, Tailwind CSS, la bibliothèque d'icônes Lucide et le système de composants atomiques (Boutons, Cartes, Badges) respectant la charte CDCF V2.

---

### 📂 2. Où travailler ?
* **Développeuse assignée :** **Sara Sahih** (Frontend Lead)
* **Fichiers cibles :** `apps/web-react/tailwind.config.js`, `apps/web-react/src/App.tsx`, `apps/web-react/src/components/ui/Button.tsx`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
npx nx serve web-react
```
"""
}

TICKETS["SCRUM-55"] = {
    "title": "ECO-05 | [BI-Data] DDL PostgreSQL Schéma en Étoile (2 Faits, 5 Dimensions) & Mocks Contrats",
    "desc": """# 🌿 SCRUM-55 : DDL PostgreSQL du Schéma en Étoile (2 Tables de Faits, 5 Dimensions)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **Socle Fondateur :** **Modélisation Décisionnelle Relationnelle (Data Warehouse)**
* **Rôle Métier :** **Équipe Data / Analyste Décisionnel**.
* **Objectif Fonctionnel :** Écrire et exécuter le script SQL de création du schéma en étoile pur dans PostgreSQL 16 : 2 tables de faits (`Fact_Reports`, `Fact_Interventions`) et 5 tables de dimensions (`Dim_Date`, `Dim_Geography`, `Dim_Category`, `Dim_Team`, `Dim_AI_Model`).

---

### 📂 2. Où travailler ?
* **Développeur assigné :** **Adem Ouerhani** (Data Architect)
* **Fichiers cibles :** `services/bi-etl/sql/01_create_star_schema.sql`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
psql -U postgres -d ecotrack_dw -f services/bi-etl/sql/01_create_star_schema.sql
# Doit exécuter CREATE TABLE sans erreur de clé étrangère.
```
"""
}

# ------------------------------------------------------------------------------
# SPRINT 1 (IDENTITÉ, SÉCURITÉ, RBAC & AUDIT RGPD)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-42"] = {
    "title": "ECO-11 | [DB] Create User Mongoose Schema & Hashing Logic",
    "desc": """# 🌿 SCRUM-42 : Schéma Mongoose Utilisateur & Hachage Sécurisé Argon2id

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Modélisation des Comptes Utilisateurs & Sécurité RBAC**
* **Rôle Métier :** **Tous les rôles (Citoyen, Agent, Ouvrier, Admin)**.
* **Objectif Fonctionnel :** Modéliser la collection MongoDB `users` avec contrôle d'unicité sur l'email, gestion des rôles stricts (CITOYEN, AGENT, OUVRIER, ADMIN) et sécuriser le mot de passe avec le meilleur algorithme cryptographique actuel (**Argon2id** : 64MB mémoire, 3 itérations).

---

### 📂 2. Où travailler ?
* **Développeur assigné :** **Adem Ouerhani**
* **Fichiers cibles :** `packages/shared/src/types/user.ts`, `packages/db/src/schemas/user.schema.ts`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
python .agents/scripts/test_sprint1_tickets.py
# [PASS] SCRUM-42: UserRole enum definition in @ecotrack/shared
# [PASS] SCRUM-42: User Mongoose Schema structure in @ecotrack/db
# [PASS] SCRUM-42: Argon2id Hashing parameters & Pre-save hook
```
"""
}

TICKETS["SCRUM-43"] = {
    "title": "ECO-12 | [API] Build POST /auth/register Route",
    "desc": """# 🌿 SCRUM-43 : Route API d'Inscription Citoyenne (POST /auth/register)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Service d'Inscription et Validation des Entrées**
* **Rôle Métier :** **Citoyen**.
* **Objectif Fonctionnel :** Développer le contrôleur d'inscription dans `identity-api`, valider les champs avec Zod, vérifier l'unicité de l'email (renvoyer HTTP 409 si déjà pris), forcer le rôle à `CITOYEN` pour éviter toute élévation de privilèges non autorisée, et renvoyer HTTP 201 Created.

---

### 📂 2. Où travailler ?
* **Développeuse assignée :** **Sara Sahih**
* **Fichiers cibles :** `services/identity-api/src/routes/auth.routes.ts`, `services/identity-api/src/controllers/register.controller.ts`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
python .agents/scripts/test_sprint1_tickets.py
```
"""
}

TICKETS["SCRUM-45"] = {
    "title": "ECO-14 | [API] Build POST /auth/login with RS256 & Redis Rate Limit",
    "desc": """# 🌿 SCRUM-45 : Connexion Sécurisée (POST /auth/login), Tokens JWT RS256 & Rate Limiting Redis

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-01 : Authentification Forte & Protection Anti-Bruteforce**
* **Rôle Métier :** **Tous les utilisateurs**.
* **Objectif Fonctionnel :** Développer l'endpoint de connexion sécurisé qui limite les tentatives de frappe (5 tentatives max par IP via Redis pour bloquer les attaques par force brute), vérifie le hash Argon2id, et délivre un Access Token signé avec clé asymétrique **RS256** (durée 15 min) et un Refresh Token révocable.

---

### 📂 2. Où travailler ?
* **Développeuse assignée :** **Hiba Dhouib**
* **Fichiers cibles :** `services/identity-api/src/controllers/login.controller.ts`, `services/identity-api/src/services/jwt.service.ts`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
python .agents/scripts/test_sprint1_tickets.py
```
"""
}

TICKETS["SCRUM-56"] = {
    "title": "ECO-15 | [Audit & RGPD] Microservice AuditLogs Append-Only & Traces Immuables",
    "desc": """# 🌿 SCRUM-56 : Microservice d'Audit & Conformité RGPD (Collection Append-Only Immuable)

---

### 🎯 1. Rattachement au Cahier des Charges (CDCF V2)
* **User Story (US) :** **US-11 : Journalisation d'Audit Immuable & Respect du RGPD**
* **Rôle Métier :** **Administrateur & Délégué à la Protection des Données (DPO)**.
* **Objectif Fonctionnel :** Créer la collection `AuditLogs` en mode écriture seule stricte (Append-Only : toute tentative d'UPDATE ou DELETE est formellement bloquée au niveau de la base). Chaque action sensible (création de compte, changement de statut, réassignation) génère une trace horodatée avec anonymisation de l'adresse IP (troncature du dernier octet RGPD).

---

### 📂 2. Où travailler ?
* **Développeur assigné :** **Adem Ouerhani**
* **Fichiers cibles :** `packages/shared/src/types/audit.ts`, `services/audit-api/src/schemas/audit.schema.ts`, `services/audit-api/src/controllers/audit.controller.ts`.

---

### 🧪 5. Comment tester sur ma machine ?
```powershell
python .agents/scripts/test_sprint1_tickets.py
# [PASS] SCRUM-56: AuditAction enum & AuditLog Types in @ecotrack/shared
# [PASS] SCRUM-56: AuditLog Mongoose Schema in @ecotrack/db
# [PASS] SCRUM-56: Append-Only Guards
```
"""
}

# ------------------------------------------------------------------------------
# LES 6 EPICS DU PROJET (DESCRIPTIONS MACRO INSPIRANTES ET STRUCTURÉES)
# ------------------------------------------------------------------------------

TICKETS["SCRUM-33"] = {
    "title": "EPIC 0: Infrastructure, DevOps & Repo Setup (Sprint 0)",
    "desc": """# 🏛️ EPIC 0 : Infrastructure, DevOps & Socles Applicatifs (Sprint 0)

### 🎯 Vision Globale
Mettre en place l'environnement technique complet partagé par les 4 développeurs de l'équipe EcoTrack V2 :
- **Monorepo Nx** hébergeant toutes les applications et microservices.
- **Docker Compose** pour orchestrer localement MongoDB 7, PostgreSQL 16, Redis 7, MinIO et RabbitMQ.
- **Pipeline CI/CD GitHub Actions** pour valider automatiquement la compilation et les tests.
- **Modèle décisionnel en étoile PostgreSQL** prêt à recevoir les données analytiques.
"""
}

TICKETS["SCRUM-34"] = {
    "title": "EPIC 1: Identity, JWT & RBAC (Sprint 1)",
    "desc": """# 🛡️ EPIC 1 : Identité, Authentification Forte & Sécurité RBAC (Sprint 1)

### 🎯 Vision Globale
Garantir la sécurité d'accès à la plateforme municipale pour les 4 profils utilisateurs (Citoyen, Agent, Ouvrier, Admin) :
- **Hachage Argon2id** ultra-résistant contre les attaques par dictionnaire.
- **Tokens JWT asymétriques RS256** avec rotation des Refresh Tokens sous Redis.
- **Rate-limiting Redis** limitant les attaques par force brute sur les mots de passe.
- **Microservice AuditLogs Append-Only** garantissant la traçabilité immuable et la conformité RGPD.
"""
}

TICKETS["SCRUM-35"] = {
    "title": "EPIC 2: Core Report & Media Service (Sprint 2)",
    "desc": """# 📸 EPIC 2 : Signalement Citoyen, Géolocalisation 2dsphere & IA Vision (Sprint 2)

### 🎯 Vision Globale
Permettre au citoyen de photographier et géolocaliser une anomalie urbaine en moins de 60 secondes :
- **Schéma Mongoose et index spatial 2dsphere** pour le requêtage de proximité `$near`.
- **Service Média Sharp** supprimant automatiquement les métadonnées privées EXIF/GPS avant stockage S3.
- **Microservice FastAPI & PyTorch** pour préqualifier automatiquement l'incident en moins de 500 ms.
- **Bus d'événements RabbitMQ** et premier flux d'extraction ETL vers le Data Warehouse.
"""
}

TICKETS["SCRUM-36"] = {
    "title": "EPIC 3: Workflow State Machine & Dispatch (Sprint 3)",
    "desc": """# ⚙️ EPIC 3 : Machine à États Finis (FSM) & Cartographie de Supervision (Sprint 3)

### 🎯 Vision Globale
Structurer le traitement municipal des signalements sans aucune incohérence d'état :
- **Machine à états finis formelle (FSM)** régissant les transitions T1 à T5 avec gardes strictes.
- **Console Web Split-Screen** permettant à l'agent de mairie d'arbitrer avec l'aide de l'IA.
- **Feuille de route mobile ouvrier** triée par proximité GPS de la camionnette municipale.
- **Carte décisionnelle Leaflet multi-filtres** et calcul des Lead Times intermédiaires.
"""
}

TICKETS["SCRUM-37"] = {
    "title": "EPIC 4: Clôture Terrain & Tableaux de Bord Power BI (Sprint 4)",
    "desc": """# 📊 EPIC 4 : Clôture avec Preuve Visuelle & Tableaux de Bord Power BI (Sprint 4)

### 🎯 Vision Globale
Assurer la transparence de la résolution d'incident et offrir une observabilité décisionnelle de premier plan :
- **Clôture obligatoire avec photo après travaux (T4)** et calcul automatique du MTTR.
- **Pipeline CDC continu** alimentant le schéma en étoile PostgreSQL avec coordonnées floutées à 100m.
- **Intégration Power BI Embedded** avec sécurité par rôle (RLS) dans le portail web.
- **Gouvernance MLOps** avec calcul de l'accord IA/Humain et export Active Learning.
"""
}

TICKETS["SCRUM-54"] = {
    "title": "EPIC 5: Tests E2E, Charge k6, MLOps & Déploiement K8s (Sprint 5)",
    "desc": """# 🚀 EPIC 5 : Tests E2E, Charge k6, Évaluation IA & Déploiement Cloud (Sprint 5)

### 🎯 Vision Globale
Préparer la plateforme EcoTrack V2 pour la soutenance finale et la mise en production :
- **Tests de performance k6** certifiant une latence API P95 < 300 ms sous 100 req/s.
- **Évaluation scientifique du modèle IA** sur 200 images avec calcul de la matrice de confusion.
- **Recette E2E Playwright multi-acteurs** et audit d'accessibilité WCAG 2.1 niveau AA.
- **Déploiement Kubernetes avec HPA** et jeu de démonstration réaliste de 500 signalements.
"""
}

def main():
    print("=" * 70)
    print("DÉMARRAGE DE LA MISE À JOUR PÉDAGOGIQUE JIRA (CDCF V2)")
    print(f"Nombre total de tickets à mettre à jour : {len(TICKETS)}")
    print("=" * 70)
    
    success_count = 0
    fail_count = 0
    
    # Order: Sprint 2 first (Active), then Sprint 3, 4, 5, 0, 1, then Epics
    order = [
        # Sprint 2 (Active)
        "SCRUM-44", "SCRUM-46", "SCRUM-47", "SCRUM-48", "SCRUM-49", "SCRUM-57",
        # Sprint 3
        "SCRUM-50", "SCRUM-51", "SCRUM-58", "SCRUM-59",
        # Sprint 4
        "SCRUM-60", "SCRUM-52", "SCRUM-53", "SCRUM-61",
        # Sprint 5
        "SCRUM-62", "SCRUM-63", "SCRUM-64", "SCRUM-65",
        # Sprint 0 & 1
        "SCRUM-38", "SCRUM-39", "SCRUM-40", "SCRUM-41", "SCRUM-55",
        "SCRUM-42", "SCRUM-43", "SCRUM-45", "SCRUM-56",
        # Epics
        "SCRUM-33", "SCRUM-34", "SCRUM-35", "SCRUM-36", "SCRUM-37", "SCRUM-54"
    ]
    
    for key in order:
        item = TICKETS.get(key)
        if not item:
            continue
        print(f"--> Traitement de {key} ({item['title']})...")
        ok = update_jira_description(key, item["title"], item["desc"])
        if ok:
            success_count += 1
        else:
            fail_count += 1
        time.sleep(0.5)
        
    print("=" * 70)
    print(f"RÉSUMÉ : {success_count}/{len(order)} TICKETS MIS À JOUR AVEC SUCCÈS !")
    if fail_count > 0:
        print(f"ATTENTION : {fail_count} tickets ont échoué.")
    print("=" * 70)

if __name__ == "__main__":
    main()
