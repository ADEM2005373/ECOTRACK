# 🌿 ECOTRACK - Jira Supervision & Power BI Dashboard

Ce dossier contient le tableau de bord exécutif inspiré de Power BI pour la supervision et le suivi en temps réel du projet **ECOTRACK** (`SCRUM`), directement connecté à Atlassian Jira via **TWG (Teamwork Graph)**.

---

## 🚀 Fonctionnalités Clés

1. **📊 Vue Générale & KPIs Exécutifs**
   - Taux d'avancement global (41.4% - 12 / 29 tâches terminées).
   - Donut Chart SVG & ventilation par type (Epics, Tâches, Sous-tâches).
   - Progression en direct des 5 Macro-Sprints.

2. **⚠️ Alertes & Gestion des Délais (Risk Center)**
   - Détection des points de blocage critiques (ex: `SCRUM-25` US-01 Auth & RBAC).
   - Alertes sur les dépendances de dépôts GitHub (`SCRUM-16` à `19`).
   - Signalement des tâches orphelines ou inactives depuis plus de 14 jours.
   - Recommandations d'action immédiates pour le Scrum Master / Lead Dev.

3. **👥 Charge de Travail & Avancement par Membre**
   - **Adem Ouerhani** : 62.5% d'avancement (5 terminées / 3 en attente).
   - **Ahmed Salah** : 42.8% d'avancement (3 terminées / 4 en attente).
   - **sarahsou2016** : 50.0% d'avancement (3 terminées / 3 en attente).
   - **Hiba Dhouib** : 33.3% d'avancement (2 terminées / 4 en attente).
   - Filtre interactif par membre en un clic pour inspecter son backlog.

4. **🎯 Roadmap des Macro-Sprints**
   - Macro-Sprint 1 : Fondations, Architecture, Sécurité & Auth (RBAC).
   - Macro-Sprint 2 : Core Backend, Signalement & Géolocalisation (Geo-Map).
   - Macro-Sprint 3 : Microservice IA, Qualification & Dashboard Admin/Analytics.
   - Macro-Sprint 4 : Applications Mobiles Citoyen & Ouvrier Terrain (Expo).
   - Macro-Sprint 5 : Intégration Bout-en-Bout, QA, Performance & Déploiement.

5. **📋 Supervision Intégrale Jira**
   - Table dynamique avec barre de recherche instantanée.
   - Filtres croisés par statut, type, assigné, et sprint.
   - Liens directs vers Jira Cloud (`https://ouerhaniadem0805.atlassian.net/browse/SCRUM-xx`).

---

## ⚡ Démarrage Automatique dans Antigravity

Le tableau de bord est configuré pour se lancer automatiquement dès que vous ouvrez le projet dans Antigravity via le hook `.agents/hooks.json` (`SessionStart`) :

- Il synchronise automatiquement les derniers tickets Jira via TWG.
- Il met à jour `dashboard/data.json` et `dashboard/index.html`.
- Il ouvre le tableau de bord dans votre navigateur par défaut.

### Lancement Manuel

Vous pouvez également synchroniser ou ouvrir le dashboard manuellement :

```powershell
# Synchroniser les données depuis Jira
python .agents/scripts/sync_jira.py

# Ouvrir le dashboard
Start-Process dashboard/index.html
```

## Tests E2E Playwright

Les scénarios de validation du parcours citoyen-agent-ouvrier et l'audit WCAG 2.1 AA
sont dans `tests/e2e`. Ils ciblent les services déjà démarrés et sont désactivés par
défaut pour ne pas rendre la CI dépendante d'un environnement local.

```powershell
$env:E2E_RUN = "true"
$env:E2E_API_URL = "http://127.0.0.1:8080/api/v1"
$env:E2E_REPORTER_ID = "<citizen-id>"
$env:E2E_AGENT_ID = "<agent-id>"
$env:E2E_WORKER_ID = "<worker-id>"
$env:E2E_WEB_URL = "http://127.0.0.1:5173"
npm run test:e2e
```

`E2E_A11Y_PATHS` accepte une liste de routes séparées par des virgules pour étendre
l'audit d'accessibilité.
