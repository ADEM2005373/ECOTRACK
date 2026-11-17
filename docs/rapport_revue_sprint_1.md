# 🔍 Rapport Officiel de Revue de Code & Audit Gouvernance — Sprint 1

**Projet :** ECOTRACK V2 (`SCRUM`)  
**Date d'audit :** 10 Novembre 2026  
**Auditeur :** Adem Ouerhani (Lead Developer & Scrum Master)  
**Protocole appliqué :** [docs/sprint_code_review_protocol.md](sprint_code_review_protocol.md)  
**Règle appliquée :** « No Push / No Review = No Done » & « Zéro modification directe par le Lead Dev / Alertes explicatives uniquement ».

---

## 📊 1. État des Lieux des Tickets du Sprint 1 (Jira Cloud)

Tous les tickets du Sprint 1 ont été basculés dans l'état **`Revue en cours`** pour inspection ligne par ligne :

| Ticket | Assigné | Titre du Ticket | Statut Audit | Anomalie Détectée | Décision Code Review |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **`SCRUM-42`** | Adem Ouerhani | User Mongoose Schema & Argon2id | 🟢 **CONFORME** | Aucune. 100% conforme OWASP/ADR-02. | ✅ **Validé pour Terminé** |
| **`SCRUM-56`** | Adem Ouerhani | AuditLogs Append-Only & RGPD | 🟢 **CONFORME** | Aucune. Immutabilité stricte & IP `/24`. | ✅ **Validé pour Terminé** |
| **`SCRUM-43`** | Sara Sahih | API POST /auth/register Route | 🟡 **PARTIEL** | Backend API 100% conforme, mais **formulaire React UI manquant** dans `apps/web-react`. | ⚠️ **En revue (Alerte émise)** |
| **`SCRUM-45`** | Hiba Dhouib | POST /auth/login RS256 & Redis | 🔴 **SUBSTITUTION** | Code complet sur `develop`, mais **écrit par Adem** (0 commit de Hiba). | ⚠️ **En revue (Alerte émise)** |
| **`SCRUM-44`** | Ahmed Salah | Écran Mobile Inscription | 🚨 **FICTIF / RETARD** | **0% de code livré**, 0 commit sur Git. Déplacé au Sprint 2. | ❌ **Rejeté (Alerte émise)** |

---

## 🔬 2. Revue Ligne par Ligne du Code Source

### A. `SCRUM-42` (Adem Ouerhani) — `packages/db/src/schemas/user.schema.ts`
* **Lignes 6-11 :** `ARGON2_CONFIG` avec 64 Mo de mémoire (`memoryCost: 65536`), 3 passes et 4 threads. Conforme ADR-02.
* **Lignes 15-28 :** Masquage natif du mot de passe (`select: false`) et validation d'email par expression régulière.
* **Lignes 76-88 :** Hook Mongoose `pre('save')` qui ne recalcule le hash que si le mot de passe est modifié (`isModified('password')`).
* **Verdict :** **100% PASS** sur tous les tests unitaires.

### B. `SCRUM-56` (Adem Ouerhani) — `packages/db/src/schemas/audit-log.schema.ts`
* **Lignes 45-49 :** Champ `ipTruncated` obligatoire alimenté par `truncateIp()` (`/24` en IPv4).
* **Lignes 85-119 :** Verrouillage strict en écriture seule : 8 hooks Mongoose pré-mise à jour/suppression (`updateOne`, `deleteOne`, etc.) déclenchent une exception `IMMUTABILITY_ERROR`.
* **Verdict :** **100% PASS** sur tous les tests d'immutabilité et RGPD.

### C. `SCRUM-43` (Sara Sahih) — `services/identity-api/src/routes/auth.routes.ts`
* **Lignes 15-77 :** Contrôleur `POST /register` sécurisé.
  * Validation email regex (`EMAIL_REGEX`), longueur de mot de passe $\ge 8$, nom complet non vide.
  * Rôle par défaut `UserRole.CITOYEN` si non renseigné.
  * Hachage automatique via `userService.createUser()`.
  * Codes de retour conformes : `201 Created`, `400 Bad Request`, `409 Conflict`.
* **Anomalie :** Le commit `7f2afdc` mentionnait des composants d'interface, mais aucun formulaire React n'existe dans `apps/web-react`.

### D. `SCRUM-45` (Hiba Dhouib) — `services/identity-api/src/services/`
* `token.service.ts` : Signature asymétrique JWT RS256 (Access Token 15 min, Refresh Token 7 jours).
* `rate-limiter.service.ts` : Compteur glissant (5 tentatives / 15 minutes), retour `429 Too Many Requests`.
* **Anomalie :** Code commité par le Lead Dev Adem (`commit d0895d7`), 0 commit par Hiba.

### E. `SCRUM-44` (Ahmed Salah) — `apps/mobile/app/`
* Aucun fichier d'inscription ou d'authentification (`register.tsx`, `auth.tsx`).
* Retard critique de plus de 15 jours sur l'échéance initiale.

---

## 📧 3. Alertes Pédagogiques Transmises par Email (SMTP 587)

Les e-mails d'avertissement et de cadrage ont été expédiés avec succès le 10/11/2026 à 14:54 :

1. **À Ahmed Salah (`hmidsalah2005@gmail.com`) :**
   * *Objet :* Alerte Critique Dev Lead : Interdiction de marquer des tickets 'Terminé' sans Push Git.
   * *Contenu :* Constat d'absence de code sur `SCRUM-44`, rappel de la règle « No Push = No Done », guide pas-à-pas pour initialiser la branche `feature/ECO-13-ahmed-mobile-auth` et implémenter l'écran d'inscription mobile sous 24h.
2. **À Hiba Dhouib (`hibadhouib6@gmail.com`) :**
   * *Objet :* Point de Synchronisation Sprint 1/2 & Règle de Livraison Git.
   * *Contenu :* Notification sur `SCRUM-45` commité par le Lead Dev par substitution, exigence de commits personnels quotidiens, et assignation prioritaire sur `SCRUM-48` (FastAPI IA Vision).
3. **À Sara Sahih (`sarah.sou2016@gmail.com`) :**
   * *Objet :* Félicitations PR #2 & Rappel de Gouvernance.
   * *Contenu :* Validation du backend `POST /auth/register`, demande d'ajout du formulaire React manquant sur `apps/web-react`, et cadrage sur le Sprint 2 (`SCRUM-49`).

---

## 🔒 4. Recommandation Scrum Master sur les Statuts

* `SCRUM-42` et `SCRUM-56` (Adem) : **Prêts pour la transition immédiate vers `Terminé(e)`**.
* `SCRUM-43` (Sara) : Maintenu en **`Revue en cours`** en attendant le composant UI React.
* `SCRUM-45` (Hiba) : Maintenu en **`Revue en cours`** jusqu'à régularisation de ses pushs sur le Sprint 2.
* `SCRUM-44` (Ahmed) : Maintenu en **`En cours`** sous surveillance active.
