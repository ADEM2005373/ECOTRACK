## 📌 Référence du Ticket Jira
* **Identifiant du Ticket :** ECO-____ (SCRUM-____)
* **Lien Jira :** https://ouerhaniadem0805.atlassian.net/browse/SCRUM-____
* **Branche cible :** `develop` (Standard de Sprint) <!-- Seules les releases de prod ciblent main -->

---

## 📝 Résumé des Modifications
<!-- Décrivez de façon synthétique ce qui a été développé et testé -->
- 

---

## 🛡️ Checklist de Gouvernance & Synchronisation (Obligatoire)
Avant de soumettre cette Pull Request à la revue du Lead Dev, cochez obligatoirement chaque case :

- [ ] **Synchronisation avec `develop` :** J'ai exécuté `git fetch origin && git merge origin/develop` et résolu tous les conflits.
- [ ] **Traçabilité des Commits :** Tous les commits de cette branche contiennent le préfixe du ticket Jira (ex: `feat(ECO-XX): ...`) et sont signés par mon nom.
- [ ] **Zéro Mockup / Code Réel :** Aucun bouton sans `onPress`/`onClick`, aucun formulaire factice, aucune valeur codée en dur sans API.
- [ ] **Conformité ADR :** Le code respecte les décisions d'architecture (RS256, Argon2id, 2dsphere MongoDB, DDL PostgreSQL, etc.).
- [ ] **Tests & Linter :** Les tests unitaires et le typechecking TypeScript passent sans erreur en local.
- [ ] **Attribution de Revue :** J'ai assigné le Lead Developer (`@ADEM2005373`) en tant que Reviewer obligatoire (Code Owner).

---

> ⚠️ **RAPPEL GOUVERNANCE DEV LEAD :**
> Conformément au protocole officiel ECOTRACK V2, **seul le Lead Developer (`@ADEM2005373`) est habilité à approuver et fusionner cette Pull Request**. Aucune fusion autonome par un collaborateur n'est permise.
