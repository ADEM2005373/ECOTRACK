# 🌿 ECOTRACK - Déroulé Chronométré de Soutenance de Projet (SCRUM-65 / ECO-53)

> **Projet :** ECOTRACK — Plateforme Intelligente de Signalement & Gestion des Déchets Municipaux  
> **Durée Totale :** 20 minutes d'exposé oral + 10 minutes de questions-réponses avec le jury  
> **Équipe :** Adem Ouerhani, Ahmed Salah, Hiba Dhouib, Sara Sahih  
> **Cadre :** Validation Finale PFE / Soutenance de Fin d'Études

---

## ⏱️ 1. Matrice Chronométrée de Répartition du Temps (20 min)

```mermaid
gantt
    title Déroulé Soutenance ECOTRACK (20 Minutes Chronométrées)
    dateFormat  m:s
    axisFormat %M:%S
    section Adem (Lead Dev & DevOps)
    Intro, Architecture, DevOps K8s & Star Schema : 00:00, 05:00
    section Ahmed (Fullstack Mobile)
    Mobile Expo, Geospatial $near & Worker ETL   : 05:00, 10:00
    section Hiba (AI & MLOps)
    IA Vision PyTorch, Benchmarks & MLOps       : 10:00, 15:00
    section Sara (Fullstack Web & QA)
    Portail Web, FSM Guards T1-T5 & E2E/WCAG    : 15:00, 20:00
```

---

## 🎤 2. Détail par Orateur & Fiche de Passage

### 👤 1. Adem Ouerhani (00:00 - 05:00) — *Lead Developer, DevOps & Architecte BI*

* **00:00 - 01:15 | Contexte & Vision Métier :**
  * Problématique de salubrité publique dans les métropoles (dépôts sauvages, encombrants, temps de réaction administratif).
  * Promesse ECOTRACK : boucle fermée de traçabilité en moins de 48h entre citoyen, agent communal et équipe terrain.
* **01:15 - 03:00 | Architecture Technique Globale & DevOps :**
  * Monorepo Nx modulaire : séparation claire `@ecotrack/shared`, services backend Node/TypeScript, FastAPI IA et frontends.
  * CI/CD GitHub Actions multi-étapes (Lint, Typecheck, Tests unitaires, Build images Docker).
  * Orchestration Kubernetes avec **Horizontal Pod Autoscaler (HPA)** (`deploy/k8s/hpa-report-service.yaml`) : autoscaling dynamique de 2 à 10 répliques dès 70% d'utilisation CPU.
  * Campagne de tests de charge **k6** (`tests/k6/load_test_reports.js`) validant l'exigence **NFR-01 (P95 < 300 ms à 100 req/s)** et résilience en cas de panne IA.
* **03:00 - 05:00 | Décisionnel & Modélisation Power BI :**
  * Schéma en étoile PostgreSQL (`Fact_Reports`, `Fact_Interventions`, 5 Dimensions `Dim_Temps`, `Dim_Quartier`, etc.).
  * Pipeline CDC incrémental anonymisé (SHA-256) et mesures DAX officielles (MTTR, SLA Breach Rate).

---

### 👤 2. Ahmed Salah (05:00 - 10:00) — *Développeur Mobile & Data Engineer*

* **05:00 - 07:00 | Application Mobile Citoyen (Expo / React Native) :**
  * Design tokens et charte graphique éco-responsable (`#059669`, `#1E3A8A`).
  * Expérience citoyenne fluide : capture photo, géolocalisation GPS native, suivi en temps réel de l'avancement.
  * Gestion du mode hors-ligne et cache local.
* **07:00 - 08:30 | Moteur Géospatial & Proximité :**
  * Index spatial MongoDB 2dsphere (`location: { type: 'Point', coordinates: [lng, lat] }`).
  * Requêtes `$near` optimisées pour alimenter la feuille de route mobile de l'ouvrier par rayon kilométrique.
* **08:30 - 10:00 | Ingestion & Worker ETL Incrémental :**
  * Service `bi-etl-worker` en Python avec mécanisme de Watermark immuable.
  * Transformation des données brutes opérationnelles en faits décisionnels sans blocage de base transactionnelle.

---

### 👤 3. Hiba Dhouib (10:00 - 15:00) — *Ingénieure IA & MLOps*

* **10:00 - 11:30 | Modèle de Vision par Ordinateur :**
  * Architecture MobileNetV3 fine-tunée sur les catégories de déchets urbains (Décharges sauvages, Encombrants, Gravats, etc.).
  * Microservice FastAPI haute performance, conteneurisé et exposé via `/predict`.
  * Temps d'inférence moyen mesuré à **38.04 ms** sur CPU (< 100 ms exigé par le CDCF).
* **11:30 - 13:00 | Évaluation Scientifique & Benchmark :**
  * Jeu de données étiqueté de référence (200 images réelles).
  * Métriques de performance validées : **Précision 91.5%**, **Rappel 89.2%**, **F1-Score 90.2%** (dépassant le seuil contractuel de 80%).
* **13:00 - 15:00 | Gouvernance MLOps & Apprentissage Actif :**
  * Suivi automatique de la concordance IA / Humain lors de la qualification agent.
  * Matrice de confusion 6x6 en temps réel dans le portail d'administration.
  * Export périodique des cas de discordance pour le pipeline d'Active Learning et réentraînement continu.

---

### 👤 4. Sara Sahih (15:00 - 20:00) — *Développeuse Frontend Web & Assurance Qualité*

* **15:00 - 16:30 | Portail Web de Supervision & Dispatching (React 18 / Tailwind) :**
  * Interface Split-Screen pour l'agent communal : comparaison visuelle de l'anomalie, zoom haute résolution, prédiction IA et boutons d'action rapide.
  * Carte interactive multi-filtres des anomalies par quartier et statut.
* **16:30 - 18:00 | Machine à États Finis (FSM) & Règle Anti-Fraude T4 :**
  * Moteur de transition formel `state-machine.service.ts` : T1 (Valider), T2 (Assigner), T3 (Démarrer), T4 (Résoudre), T5 (Rejeter).
  * **Règle stricte T4 (Clôture Chantier) :** Impossible de marquer un signalement comme résolu sans uploader la photo après travaux (purgée d'EXIF via Sharp pour conformité RGPD).
  * Garde RBAC de réouverture administrative motivée.
* **18:00 - 20:00 | Recette E2E Multi-Acteurs & Accessibilité WCAG 2.1 AA :**
  * Suite Playwright complète simulant le cycle de vie citoyen -> agent -> ouvrier -> superviseur.
  * Audit automatisé Axe Core certifiant la conformité accessibilité WCAG 2.1 AA (contraste, navigation clavier, attributs ARIA).
  * Conclusion générale et passage au jury.

---

## 🎬 3. Chorégraphie de la Démonstration Live (5 minutes intégrées)

1. **Étape 1 (Citoyen) :** Ahmed prend une photo sur l'application mobile et signale un déchet au Centre-Ville.
2. **Étape 2 (IA & API) :** Hiba montre la détection instantanée de catégorie "DECHARGE_SAUVAGE" et la latence < 50ms.
3. **Étape 3 (Agent Web) :** Sara ouvre le Split-Screen sur le portail Web, valide la transition T1 et assigne l'ouvrier.
4. **Étape 4 (Ouvrier Terrain) :** Ahmed affiche la feuille de route `$near` sur mobile, démarre l'intervention (T3), puis téléverse la photo de preuve après nettoyage (T4).
5. **Étape 5 (Supervision BI) :** Adem montre la mise à jour immédiate du tableau de bord Power BI (500 signalements de seed, calcul du MTTR et carte de chaleur).

---

## 💡 4. Matrice d'Anticipation des Questions du Jury

| Thématique | Question Probable du Jury | Réponse Clé Préparée |
| :--- | :--- | :--- |
| **Sécurité & RGPD** | *Comment garantissez-vous qu'aucune donnée privée n'est divulguée via les photos citoyennes ?* | Les métadonnées EXIF (coordonnées GPS du domicile, modèle appareil, heure exacte) sont purgées par Sharp avant tout stockage S3. De plus, les adresses IP dans les AuditLogs sont tronquées à 24 bits (`/24`). |
| **Scalabilité** | *Que se passe-t-il lors d'un pic soudain de signalements (ex: intempéries) ?* | Le Horizontal Pod Autoscaler Kubernetes (HPA) scale automatiquement nos pods de 2 à 10 répliques dès 70% CPU. Les tests k6 confirment que P95 reste sous 300ms jusqu'à 100 requêtes/s. |
| **Résilience IA** | *Si le microservice IA plante ou rame, toute la plateforme est-elle bloquée ?* | Non. Le test de chaos k6 prouve le repli gracieux (Graceful Fallback) : la passerelle retourne un HTTP 200 avec la catégorie par défaut `NON_QUALIFIE`, permettant à l'agent humain de qualifier manuellement. |
| **Intégrité Métier** | *Un ouvrier peut-il frauder et marquer un chantier terminé sans y aller ?* | Impossible grâce à la garde formelle T4 de la FSM : la transition vers `RESOLU` requiert obligatoirement une photo post-nettoyage horodatée et géolocalisée, vérifiée par l'agent superviseur. |
