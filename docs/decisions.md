# Architecture Decision Records (ADR) - ECOTRACK

Document de référence consignant les décisions d'architecture structurantes prises pour le projet ECOTRACK V2.

---

## ADR-01 : Modèle Hybride de Données (MongoDB Polyglot + PostgreSQL Data Warehouse)
* **Date :** 2026-10-15
* **Statut :** Accepté
* **Contexte :** 
  L'application nécessite à la fois un stockage transactionnel hautement flexible et géospatial pour les signalements mobiles (photos, coordonnées GPS mouvantes, métadonnées dynamiques), et un moteur analytique relationnel performant pour les agrégations BI, les rapports municipaux et les tableaux de bord Power BI.
* **Décision :** 
  - **MongoDB 7.0 (Opérationnel) :** Base NoSQL principale gérant les signalements, les métadonnées de workflow et les index `2dsphere` pour les requêtes de proximité spatiale `$near` et `$geoWithin`.
  - **PostgreSQL 16 (Analytique) :** Entrepôt de données (DW) modélisé en schéma en étoile pur (2 faits, 5 dimensions) alimenté par un pipeline ETL périodique pour la BI et Power BI.
* **Conséquences :** 
  Excellente séparation des préoccupations OLTP/OLAP. Nécessite la mise en place d'un ETL asynchrone (microservice `bi-etl`) garantissant la cohérence éventuelle.

---

## ADR-02 : Sécurité et Authentification Décentralisée (JWT RS256 / Ed25519 & Argon2id)
* **Date :** 2026-10-16
* **Statut :** Accepté
* **Contexte :** 
  Plusieurs microservices indépendants doivent valider les identités et permissions sans solliciter de manière synchrone le service d'identité à chaque requête HTTP.
* **Décision :** 
  - Utilisation de clés asymétriques pour les tokens JWT : l'Identity Service signe avec une clé privée, tous les services satellites valident avec la clé publique.
  - Hachage de mot de passe obligatoire avec **Argon2id** (paramètres durcis : 64MB mémoire, 3 itérations).
  - Durée de vie courte des Access Tokens (15 min) avec rotation des Refresh Tokens (7 jours) stockés sous Redis pour révocation immédiate si compromission.
* **Conséquences :** 
  Latence nulle pour la validation des requêtes inter-services, sécurité renforcée contre les attaques par force brute ou vol de token.

---

## ADR-03 : Machine à États Finis (FSM) pour le Cycle de Vie des Signalements
* **Date :** 2026-10-18
* **Statut :** Accepté
* **Contexte :** 
  Le processus de signalement ne doit pas permettre de transitions incohérentes (ex: un ouvrier clôturant un ticket non encore assigné ou rejeté).
* **Décision :** 
  Implémentation d'une machine à états finis formelle régie par 5 transitions atomiques strictes :
  - **T1 (Valider) :** `NOUVEAU` -> `VALIDE` (Agent)
  - **T2 (Assigner) :** `VALIDE` -> `ASSIGNE` (Agent / Dispatcher)
  - **T3 (Démarrer) :** `ASSIGNE` -> `EN_TRAITEMENT` (Ouvrier sur le terrain)
  - **T4 (Clôturer) :** `EN_TRAITEMENT` -> `RESOLU` (Ouvrier + photo obligatoire après travaux)
  - **T5 (Rejeter) :** `NOUVEAU` -> `REJETE` (Agent avec motif explicite)
* **Conséquences :** 
  Impossibilité d'états zombies ou de contournement des contrôles municipaux. Chaque transition est journalisée dans `AuditLogs`.

---

## ADR-04 : Découplage de l'Inférence IA Vision via FastAPI et File Asynchrone
* **Date :** 2026-10-19
* **Statut :** Accepté
* **Contexte :** 
  L'inférence de vision par ordinateur (YOLOv8 / ViT) consomme des ressources CPU/GPU significatives et ne doit pas bloquer la boucle d'événements Node.js ni pénaliser le temps de réponse de soumission citoyenne (< 300 ms).
* **Décision :** 
  - Microservice dédié en Python avec **FastAPI** et runtime optimisé ONNX / PyTorch.
  - Deux modes d'interaction :
    1. Synchrone : Endpoint direct `/api/v1/vision/classify` pour l'assistance temps réel lors de la prise de vue citoyenne sur mobile.
    2. Asynchrone : Traitement en arrière-plan via RabbitMQ pour le ré-entraînement, les benchmarks de modèles et le calcul de concordance globale (US-10).
* **Conséquences :** 
  Haute scalabilité horizontale du service IA indépendamment du backend transactionnel.

---

## ADR-05 : Conformité RGPD et Anonymisation Immédiate (Purge EXIF & Hash Citoyen)
* **Date :** 2026-10-20
* **Statut :** Accepté
* **Contexte :** 
  Les photos prises par les citoyens contiennent souvent des métadonnées privées (balises EXIF, modèles d'appareils, date/heure précise, coordonnées privées à domicile).
* **Décision :** 
  - Purge automatique et systématique des métadonnées EXIF lors de l'upload avant stockage sur MinIO S3.
  - Anonymisation ou pseudonymisation des identifiants citoyens dans les vues décisionnelles Power BI.
  - Conservation des logs d'audit dans une collection immuable (Append-Only) `AuditLogs` avec troncature des adresses IP.
* **Conséquences :** 
  Conformité stricte avec les réglementations RGPD et la protection des données personnelles.
