"""
ECOTRACK V2 - Injection du Guide Git Débutant dans les descriptions Jira
Ce script enrichit toutes les tâches Jira avec le Kit Débutant Git :
- Récupération du squelette identique du projet
- Création de branche dédiée
- Maintien du Clean Working Tree
- Commit propre
- Push et ouverture de Pull Request (PR) vers develop
"""

import subprocess
import json
import time
import re
import sys
import os

from update_pedagogical_descriptions import TICKETS, update_jira_description

def inject_git_workflow():
    print("=" * 70)
    print("ENRICHISSEMENT DES DESCRIPTIONS JIRA AVEC LE WORKFLOW GIT & PR")
    print("=" * 70)
    
    updated_count = 0
    
    for key, data in TICKETS.items():
        if key in ["SCRUM-33", "SCRUM-34", "SCRUM-35", "SCRUM-36", "SCRUM-37", "SCRUM-54"]:
            # Epics don't have atomic feature branches
            continue
            
        desc = data["desc"]
        title = data["title"]
        
        m = re.search(r'Branche Git[^`\n]*`([^`]+)`', desc)
        branch = m.group(1) if m else f"feature/{key.lower()}"
        
        git_block = f"""
---

### 🛠️ 2.1 Kit Débutant Git : Obtenir le même squelette & Travailler Proprement
Pour que toute l'équipe ait **exactement la même arborescence de fichiers et composants** sur son PC et travaille sans écraser le code des autres :

1. **Se synchroniser avec la branche commune :**
   ```powershell
   git checkout develop
   git pull origin develop
   ```
2. **Créer ta propre branche isolée pour ce ticket :**
   ```powershell
   git checkout -b {branch}
   ```
3. **Vérifier la propreté de ton espace de travail (Clean Working Tree) :**
   ```powershell
   git status
   ```
   *(Grâce au fichier `.gitignore`, les dossiers `node_modules/`, `venv/`, `.expo/` sont automatiquement masqués. Seuls tes vrais fichiers modifiés apparaissent !)*
4. **Enregistrer ton travail (Commit propre) :**
   ```powershell
   git add <fichiers_modifiés>
   git commit -m "feat(module): [{key}] description courte de ce que tu as fait"
   ```
5. **Envoyer sur GitHub et ouvrir ta Pull Request (PR) :**
   ```powershell
   git push -u origin {branch}
   ```
   👉 Ouvre ensuite **https://github.com/ADEM2005373/ECOTRACK** : clique sur le bouton jaune **"Compare & pull request"** vers la branche cible **`develop`**, et assigne **Adem Ouerhani** pour la relecture !
"""
        
        if "### 🪜 3. Guide" in desc and "### 🛠️ 2.1 Kit Débutant Git" not in desc:
            new_desc = desc.replace("### 🪜 3. Guide", git_block.strip() + "\n\n---\n\n### 🪜 3. Guide")
            print(f"--> Mise à jour Git Workflow pour {key} ({branch})...")
            ok = update_jira_description(key, title, new_desc)
            if ok:
                updated_count += 1
            time.sleep(0.5)
            
    print("=" * 70)
    print(f"[SUCCÈS] {updated_count} tâches ont été enrichies avec le workflow Git dans Jira !")
    print("=" * 70)

if __name__ == "__main__":
    inject_git_workflow()
