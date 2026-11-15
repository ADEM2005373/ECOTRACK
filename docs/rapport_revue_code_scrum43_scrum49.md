# 🔍 Rapport Officiel de Revue de Code & Validation — SCRUM-43 & SCRUM-49

**Projet :** ECOTRACK V2 (`SCRUM`)  
**Date d'audit :** 15 Novembre 2026  
**Auditeur :** Adem Ouerhani (Lead Developer & Scrum Master)  
**Protocole appliqué :** [docs/sprint_code_review_protocol.md](sprint_code_review_protocol.md)  
**Règle appliquée :** « No Push / No Review = No Done » & Definition of Done (DoD Gate).

---

## 📊 1. Synthèse des Décisions de Revue

| Ticket | Assigné | Titre du Ticket | Branche Git & PR | Verdict Banc de Tests | Décision Lead Dev | Statut Jira Final |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **`SCRUM-43`** | Sara Sahih | ECO-12 \| [API] Build `POST /auth/register` Route & UI | `feature/ECO-12-sara-register-api` ([PR #9](https://github.com/ADEM2005373/ECOTRACK/pull/9)) | 🟢 **15/15 PASS** (Sprint 1) | ✅ **Validé & Fusionné** | **`Terminé(e)`** |
| **`SCRUM-49`** | Sara Sahih | ECO-23 \| Combine Creation & Emit `report.created` | `feature/ECO-23-sara-report-creation` ([PR #10](https://github.com/ADEM2005373/ECOTRACK/pull/10)) | 🟢 **9/9 PASS** (Sprint 2) | ✅ **Validé & Fusionné** | **`Terminé(e)`** |

---

## 🔬 2. Revue Ligne par Ligne du Code Source

### A. `SCRUM-43` (ECO-12) — Inscription Citoyenne & UI

#### 1. Backend Controller (`services/identity-api/src/controllers/register.controller.ts`)
* **Lignes 6-7 :** Validation regex de format e-mail (`EMAIL_REGEX`).
* **Lignes 20-39 :** Contrôle strict des paramètres d'entrée avec renvoi d'erreurs `400 Bad Request` :
  * E-mail valide et non vide.
  * Longueur minimale de mot de passe $\ge 8$ caractères.
  * Présence obligatoire du champ `fullName`.
* **Lignes 41-48 :** Forçage du rôle `UserRole.CITOYEN` (prévention des attaques par escalade de privilèges).
* **Lignes 50-53 :** Codes HTTP conformes : `201 Created` avec objet utilisateur anonymisé sans mot de passe.
* **Lignes 55-66 :** Gestion d'erreur `409 Conflict` (`EMAIL_ALREADY_EXISTS`) si doublon sur l'index unique MongoDB.

#### 2. Frontend React UI (`apps/web-react/src/components/RegisterModal.tsx` & `App.tsx`)
* **Composant `RegisterModal.tsx` :** Formulaire contrôlé avec état local, validation des entrées en amont, masquage sécurisé du mot de passe avec confirmation, feedback d'erreur interactif et carte de succès détaillée.
* **Intégration `App.tsx` :** Déclencheur « S'inscrire (ECO-12) » dans la barre de navigation supérieure avec injection du modal dans le DOM.
* **Verdict Anti-Mockup :** **100% PASS** — Aucun bouton sans handler, formulaire entièrement fonctionnel connecté aux contrats OpenAPI.

---

### B. `SCRUM-49` (ECO-23) — Signalement, Recherche Spatiale & Bus RabbitMQ

#### 1. Service Métier (`services/report-api/src/services/report.service.ts`)
* **Lignes 40-75 (`createReport`) :**
  * Résolution des coordonnées GeoJSON RFC 7946 `[longitude, latitude]`.
  * Instanciation du modèle Mongoose officiel `ReportModel` d'`@ecotrack/db`.
  * Statut initial forcé à `ReportStatus.NOUVEAU`.
  * Déclenchement de l'événement asynchrone `report.created`.
* **Lignes 77-128 (`findReports`) :**
  * Requête spatiale 2dsphere exploitant l'opérateur `$near` et la contrainte de rayon `$maxDistance`.
  * Support du format de requête `lng,lat` ou `lat/lng` et du paramètre de rayon en mètres.
  * Filtres combinés par statut, `reporterId`, catégorie et pagination (`limit`).
* **Lignes 130-137 (`getReportById`) :**
  * Validation d'ObjectId MongoDB et renvoi du document ou `null`.

#### 2. Service d'Événements (`services/report-api/src/services/event.service.ts`)
* **Lignes 10-33 :** Publication de l'événement `report.created` sur l'échange RabbitMQ `ecotrack.events`. Payload conforme aux besoins de l'ETL (`SCRUM-57`) et du moteur de règles.

#### 3. Contrôleur HTTP (`services/report-api/src/controllers/report.controller.ts`)
* **Lignes 20-56 (`createReport`) :**
  * Validation des champs obligatoires : `description`, `location`, `imageUrl`.
  * Renvoi immédiat de `400 Bad Request` en cas d'omission.
  * Renvoi de `201 Created` avec la confirmation de l'événement émis `report.created`.
* **Lignes 105-125 (`getReportById`) :**
  * Renvoi propre de `404 Not Found` si l'identifiant n'existe pas.

---

## 🧪 3. Exécution des Bancs de Tests Officiels

```text
=================================================================
RUNNING ECOTRACK SPRINT 1 TEST SUITE (SCRUM-42, SCRUM-56 & SCRUM-43)
=================================================================
[PASS] SCRUM-42: UserRole enum definition in @ecotrack/shared
[PASS] SCRUM-42: User Mongoose Schema structure in @ecotrack/db
[PASS] SCRUM-42: Argon2id Hashing parameters & Pre-save hook
[PASS] SCRUM-42: Identity Service utility and user service
[PASS] SCRUM-56: AuditAction enum & AuditLog Types in @ecotrack/shared
[PASS] SCRUM-56: AuditLog Mongoose Schema structure
[PASS] SCRUM-56: Strict Immutability (Append-Only) enforcement
[PASS] SCRUM-56: RGPD IP Truncation Utility
[PASS] SCRUM-56: Audit Service & Controller with ADMIN RBAC Guard
[PASS] SCRUM-56: Audit API Routes & Server definition
[PASS] SCRUM-43: Auth Register Route & Controller (Identity API)
[PASS] SCRUM-45: Token Service with RS256 Asymmetric Signing & Key Export
[PASS] SCRUM-45: Rate Limiter Service for Brute-Force Protection
[PASS] SCRUM-45: POST /auth/login with RS256, 401 & 429 Status Codes
[PASS] TECH-DEBT: Duplicate apps/mobile-expo removed, local tsconfig & cn() plugged
=================================================================
SUMMARY: 15/15 TESTS PASSED
=================================================================

=================================================================
RUNNING ECOTRACK SPRINT 2 TEST SUITE (SCRUM-46, SCRUM-47 & SCRUM-49)
=================================================================
[PASS] SCRUM-46: ReportStatus & GeoLocation Types in @ecotrack/shared
[PASS] SCRUM-46: Report Mongoose Schema & 2dsphere Spatial Index in @ecotrack/db
[PASS] SCRUM-47: Sharp Utility (sharp.util.ts) - Max 1920px & withMetadata(false)
[PASS] SCRUM-47: Upload Controller & Multer 10MB Limit (upload.controller.ts)
[PASS] SCRUM-47: AWS SDK v3 PutObjectCommand S3/MinIO Integration (s3.service.ts)
[PASS] SCRUM-47: Media API Server & Routes Definition (index.ts)
[PASS] SCRUM-49: Report Service with 2dsphere $near Proximity Search
[PASS] SCRUM-49: Report Controller & HTTP Status Codes (201, 200, 400, 404)
[PASS] SCRUM-49: Report API Server & Gateway Routes Definition (:3002)
=================================================================
SUMMARY: 9/9 TESTS PASSED
=================================================================
```

---

## 🎯 4. Déblocage Architectural du Projet

La validation et la fusion de ces deux tickets débloquent l'ensemble des dépendances critiques de l'équipe :
1. **Déblocage d'Ahmed Salah (`SCRUM-57`) :** Le worker Python `bi-etl-worker` peut désormais ingérer les événements réels `report.created` émis par l'API sans recourir à des bouchons.
2. **Déblocage d'Hiba Dhouib (`SCRUM-51`) :** La console de qualification Agent Web peut interroger les signalements existants via `GET /api/v1/reports`.
3. **Déblocage d'Ahmed Salah (`SCRUM-59`) :** La carte Leaflet multi-filtres peut charger les points géographiques via la recherche spatiale `2dsphere` (`$near`).
4. **Déblocage des Tests de Charge k6 (`SCRUM-62`) :** La campagne de tir validant l'exigence `NFR-01` (P95 < 300 ms sous 50 req/s) sur `POST /api/v1/reports` est prête à être exécutée.
