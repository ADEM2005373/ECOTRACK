"""
ECOTRACK V2 - Envoi des emails d'onboarding Git & Structure de Projet
Envoie les instructions complètes pour cloner le repo, obtenir le squelette identique,
travailler proprement avec des branches isolées et ouvrir des Pull Requests.
Destinataires :
- Hiba Dhouib (hibadhouib6@gmail.com)
- Ahmed Salah (hmidsalah2005@gmail.com)
- Sara Sahih (sarah.sou2016@gmail.com)
Expéditeur : Adem Ouerhani (ouerhaniadem0805@gmail.com)
"""

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

EMAILS = [
    {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Guide d'installation du projet sur ton PC & Workflow Git / PR (IA Vision & Auth)",
        "body": """Bonjour Hiba,

J'espère que tu vas très bien !

Je t'envoie cet email pour t'expliquer exactement comment installer le projet ECOTRACK V2 sur ton propre ordinateur afin que nous ayons tous les quatre EXACTEMENT la même arborescence de fichiers, de dossiers et de composants (le même squelette monorepo), et comment travailler proprement avec Git sans jamais écraser le code des autres.

================================================================================
1. INSTALLATION INITIALE DU PROJET SUR TON PC (À FAIRE UNE SEULE FOIS)
================================================================================

1. Ouvre ton terminal (PowerShell ou Bash) et place-toi dans le dossier où tu ranges tes projets (ex: C:\\Users\\...\\Documents).
2. Clone le dépôt officiel de notre projet :
   git clone https://github.com/ADEM2005373/ECOTRACK.git

3. Entre dans le dossier :
   cd ECOTRACK

4. Place-toi sur la branche principale de travail de l'équipe ('develop') :
   git checkout develop
   git pull origin develop

5. Installe toutes les dépendances Node.js / TypeScript du Monorepo :
   npm install

6. Configure ton environnement Python pour le microservice IA (FastAPI / PyTorch) :
   cd services/ai-vision
   python -m venv venv
   # Sous Windows PowerShell :
   .\\venv\\Scripts\\Activate.ps1
   # (ou si tu as un message de sécurité : .\\venv\\Scripts\\activate.bat)
   pip install -r requirements.txt
   cd ../..

7. Démarre toutes les bases de données et services en arrière-plan avec Docker :
   docker compose up -d

Félicitations ! À partir de là, ton PC possède exactement les mêmes dossiers ('apps/', 'services/', 'packages/'), les mêmes configurations et les mêmes bases de données que toute l'équipe.

================================================================================
2. COMMENT TRAVAILLER PROPREMENT AU QUOTIDIEN (WORKFLOW GIT & PR)
================================================================================

Voici les 5 règles d'or à suivre pour chaque tâche que tu développes :

🔹 RÈGLE 1 : Ne JAMAIS coder directement sur la branche 'main' ou 'develop' !
Chaque fonctionnalité doit être développée sur sa propre branche isolée.

🔹 RÈGLE 2 : Toujours te synchroniser avant de commencer :
   git checkout develop
   git pull origin develop

🔹 RÈGLE 3 : Créer ta branche de travail pour ta tâche Jira :
Pour ta tâche actuelle du Sprint 2 (SCRUM-48 - Inférence IA FastAPI) :
   git checkout -b feature/ECO-22-hiba-ai-fastapi

🔹 RÈGLE 4 : Garder ton espace de travail propre (Clean Working Tree) :
Tape régulièrement :
   git status
Grâce à notre fichier '.gitignore', les dossiers lourds ou temporaires ('node_modules/', 'venv/', '__pycache__/') sont automatiquement ignorés par Git. Tu ne risques pas de polluer le projet !

🔹 RÈGLE 5 : Enregistrer ton code (Commit) & Pousser sur GitHub (Push) :
Une fois ton code écrit et testé :
   git add services/ai-vision/
   git commit -m "feat(ai): [ECO-22] endpoint classify fastapi avec score de confiance"
   git push -u origin feature/ECO-22-hiba-ai-fastapi

================================================================================
3. COMMENT OUVRIR TA PULL REQUEST (PR) SUR GITHUB
================================================================================

1. Rends-toi sur la page GitHub du projet :
   👉 https://github.com/ADEM2005373/ECOTRACK
2. Tu verras une bannière jaune en haut avec le bouton vert : "Compare & pull request". Clique dessus !
3. Vérifie bien que :
   - 'base repository: ADEM2005373/ECOTRACK' | 'base: develop'
   - 'compare: feature/ECO-22-hiba-ai-fastapi'
4. Écris un petit titre explicatif (ex: "Intégration route IA classify ECO-22") et mets le lien de ton ticket Jira.
5. Dans la colonne de droite, assigne-moi comme Reviewer (Adem Ouerhani).
6. Clique sur "Create pull request". Je relirai ton code, je validerai et nous fusionnerons proprement dans 'develop' !

================================================================================
4. TES TICKETS SONT DISPONIBLES ET DÉTAILLÉS PAS-À-PAS SUR JIRA
================================================================================

J'ai entièrement réécrit les descriptions de tous les tickets sur Jira Cloud : chaque ticket contient désormais un guide pas-à-pas pour débutant, les fichiers exacts à toucher, des exemples JSON et la commande de test.
👉 Accède à ton ticket SCRUM-48 : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-48

Si tu as la moindre question ou le moindre doute en tapant une commande Git, envoie-moi un message ou appelle-moi, nous ferons la manipulation ensemble !

Bon dev et bon Sprint 2 !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""
    },
    {
        "name": "Ahmed Salah",
        "email": "hmidsalah2005@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Guide d'installation du projet sur ton PC & Workflow Git / PR (Mobile Expo, 2dsphere & ETL)",
        "body": """Bonjour Ahmed,

J'espère que tu vas très bien !

Je t'envoie cet email pour t'expliquer exactement comment installer le projet ECOTRACK V2 sur ton propre ordinateur afin que nous ayons tous les quatre EXACTEMENT la même arborescence de fichiers, de dossiers et de composants (le même squelette monorepo), et comment travailler proprement avec Git sans jamais écraser le code des autres.

================================================================================
1. INSTALLATION INITIALE DU PROJET SUR TON PC (À FAIRE UNE SEULE FOIS)
================================================================================

1. Ouvre ton terminal (PowerShell ou Bash) et place-toi dans le dossier de tes projets.
2. Clone le dépôt officiel de notre projet :
   git clone https://github.com/ADEM2005373/ECOTRACK.git

3. Entre dans le dossier :
   cd ECOTRACK

4. Place-toi sur la branche principale de travail de l'équipe ('develop') :
   git checkout develop
   git pull origin develop

5. Installe toutes les dépendances Node.js / TypeScript du Monorepo :
   npm install

6. Configure l'environnement Python pour le worker ETL PostgreSQL :
   cd services/bi-etl
   python -m venv venv
   # Sous Windows :
   .\\venv\\Scripts\\Activate.ps1
   pip install -r requirements.txt
   cd ../..

7. Démarre toutes les bases de données (MongoDB 7, PostgreSQL 16, Redis, MinIO) avec Docker :
   docker compose up -d

8. Pour tester que l'application mobile démarre correctement :
   npx nx start mobile

Félicitations ! À partir de là, ton PC possède exactement les mêmes dossiers ('apps/', 'services/', 'packages/'), les mêmes composants et les mêmes bases de données que toute l'équipe.

================================================================================
2. COMMENT TRAVAILLER PROPREMENT AU QUOTIDIEN (WORKFLOW GIT & PR)
================================================================================

Voici les 5 règles d'or à suivre pour chaque tâche que tu développes :

🔹 RÈGLE 1 : Ne JAMAIS coder directement sur la branche 'main' ou 'develop' !
Chaque fonctionnalité doit être développée sur sa propre branche isolée.

🔹 RÈGLE 2 : Toujours te synchroniser avant de commencer :
   git checkout develop
   git pull origin develop

🔹 RÈGLE 3 : Créer ta branche de travail pour ta tâche Jira :
- Pour l'écran mobile d'inscription (SCRUM-44) :
   git checkout -b feature/ECO-13-ahmed-mobile-register
- Pour le schéma Report et l'index 2dsphere (SCRUM-46) :
   git checkout -b feature/ECO-20-ahmed-report-schema
- Pour le worker Python ETL (SCRUM-57) :
   git checkout -b feature/ECO-24-ahmed-etl-initial

🔹 RÈGLE 4 : Garder ton espace de travail propre (Clean Working Tree) :
Tape régulièrement :
   git status
Grâce à notre fichier '.gitignore', les dossiers lourds ou temporaires ('node_modules/', '.expo/', 'venv/', '__pycache__/') sont automatiquement ignorés par Git. Ton arbre de travail reste 100% propre !

🔹 RÈGLE 5 : Enregistrer ton code (Commit) & Pousser sur GitHub (Push) :
Une fois ton code écrit et testé :
   git add <fichiers_modifiés>
   git commit -m "feat(mobile): [ECO-13] ecran inscription citoyenne avec validation"
   git push -u origin feature/ECO-13-ahmed-mobile-register

================================================================================
3. COMMENT OUVRIR TA PULL REQUEST (PR) SUR GITHUB
================================================================================

1. Rends-toi sur la page GitHub du projet :
   👉 https://github.com/ADEM2005373/ECOTRACK
2. Tu verras une bannière jaune en haut avec le bouton vert : "Compare & pull request". Clique dessus !
3. Vérifie bien que :
   - 'base repository: ADEM2005373/ECOTRACK' | 'base: develop'
   - 'compare: feature/ECO-XX-ahmed-...'
4. Écris un petit titre explicatif et mets le lien de ton ticket Jira.
5. Dans la colonne de droite, assigne-moi comme Reviewer (Adem Ouerhani).
6. Clique sur "Create pull request". Je relirai ton code, je validerai et nous fusionnerons proprement dans 'develop' !

================================================================================
4. TES TICKETS SONT DISPONIBLES ET DÉTAILLÉS PAS-À-PAS SUR JIRA
================================================================================

J'ai entièrement réécrit les descriptions de tous tes tickets sur Jira Cloud avec un guide pas-à-pas pour débutant, les fichiers exacts à toucher, des exemples JSON et la commande de test automatique :
👉 SCRUM-44 (Mobile Register) : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-44
👉 SCRUM-46 (Schéma Report & 2dsphere) : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-46
👉 SCRUM-57 (Worker ETL Fact_Reports) : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-57

Si tu as la moindre question ou un blocage en tapant une commande Git, dis-le moi tout de suite, nous le ferons ensemble pas à pas !

Bon dev et bon Sprint 2 !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""
    },
    {
        "name": "Sara Sahih",
        "email": "sarah.sou2016@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Guide d'installation du projet sur ton PC & Workflow Git / PR (Web React, API & Workflow FSM)",
        "body": """Bonjour Sara,

J'espère que tu vas très bien !

Je t'envoie cet email pour t'expliquer exactement comment installer le projet ECOTRACK V2 sur ton propre ordinateur afin que nous ayons tous les quatre EXACTEMENT la même arborescence de fichiers, de dossiers et de composants (le même squelette monorepo), et comment travailler proprement avec Git sans jamais écraser le code des autres.

================================================================================
1. INSTALLATION INITIALE DU PROJET SUR TON PC (À FAIRE UNE SEULE FOIS)
================================================================================

1. Ouvre ton terminal (PowerShell ou Bash) et place-toi dans le dossier où tu ranges tes projets.
2. Clone le dépôt officiel de notre projet :
   git clone https://github.com/ADEM2005373/ECOTRACK.git

3. Entre dans le dossier :
   cd ECOTRACK

4. Place-toi sur la branche principale de travail de l'équipe ('develop') :
   git checkout develop
   git pull origin develop

5. Installe toutes les dépendances Node.js / TypeScript du Monorepo :
   npm install

6. Démarre toutes les bases de données (MongoDB 7, PostgreSQL 16, Redis, MinIO, RabbitMQ) avec Docker :
   docker compose up -d

7. Pour tester que le portail web React démarre correctement :
   npx nx serve web-react
   (Ouvre ensuite http://localhost:5173 dans ton navigateur !)

Félicitations ! À partir de là, ton PC possède exactement les mêmes dossiers ('apps/web-react', 'services/report-api', 'services/workflow-api', 'packages/'), les mêmes composants et les mêmes bases de données que toute l'équipe.

================================================================================
2. COMMENT TRAVAILLER PROPREMENT AU QUOTIDIEN (WORKFLOW GIT & PR)
================================================================================

Voici les 5 règles d'or à suivre pour chaque tâche que tu développes :

🔹 RÈGLE 1 : Ne JAMAIS coder directement sur la branche 'main' ou 'develop' !
Chaque fonctionnalité doit être développée sur sa propre branche isolée.

🔹 RÈGLE 2 : Toujours te synchroniser avant de commencer :
   git checkout develop
   git pull origin develop

🔹 RÈGLE 3 : Créer ta branche de travail pour ta tâche Jira :
- Pour l'API de création de signalement (SCRUM-49) :
   git checkout -b feature/ECO-23-sara-report-creation
- Pour la Machine à états finis FSM T1-T5 (SCRUM-50) :
   git checkout -b feature/ECO-30-sara-state-machine

🔹 RÈGLE 4 : Garder ton espace de travail propre (Clean Working Tree) :
Tape régulièrement :
   git status
Grâce à notre fichier '.gitignore', les dossiers lourds ou temporaires ('node_modules/', 'dist/', '.vite/') sont automatiquement ignorés par Git. Ton arbre de travail reste 100% propre !

🔹 RÈGLE 5 : Enregistrer ton code (Commit) & Pousser sur GitHub (Push) :
Une fois ton code écrit et testé :
   git add <fichiers_modifiés>
   git commit -m "feat(report-api): [ECO-23] controleur creation signalement et requete near"
   git push -u origin feature/ECO-23-sara-report-creation

================================================================================
3. COMMENT OUVRIR TA PULL REQUEST (PR) SUR GITHUB
================================================================================

1. Rends-toi sur la page GitHub du projet :
   👉 https://github.com/ADEM2005373/ECOTRACK
2. Tu verras une bannière jaune en haut avec le bouton vert : "Compare & pull request". Clique dessus !
3. Vérifie bien que :
   - 'base repository: ADEM2005373/ECOTRACK' | 'base: develop'
   - 'compare: feature/ECO-23-sara-report-creation'
4. Écris un petit titre explicatif et colle le lien de ton ticket Jira.
5. Dans la colonne de droite, assigne-moi comme Reviewer (Adem Ouerhani).
6. Clique sur "Create pull request". Je relirai ton code, je validerai et nous fusionnerons proprement dans 'develop' !

================================================================================
4. TES TICKETS SONT DISPONIBLES ET DÉTAILLÉS PAS-À-PAS SUR JIRA
================================================================================

J'ai entièrement réécrit les descriptions de tous tes tickets sur Jira Cloud avec un guide pas-à-pas pour débutant, les fichiers exacts à toucher, des exemples JSON et la commande de test automatique :
👉 SCRUM-49 (Report API Core Controller) : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-49
👉 SCRUM-50 (Machine à états FSM T1-T5) : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-50

Si tu as la moindre question ou le moindre doute sur une commande Git, envoie-moi un message immédiatement, nous regarderons ensemble !

Bon dev et bon Sprint 2 !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""
    }
]

def send_all_emails():
    print("=" * 70)
    print("ENVOI DES EMAILS D'ONBOARDING GIT & STRUCTURE DE PROJET")
    print(f"Expéditeur : {SENDER_NAME} <{SENDER_EMAIL}>")
    print(f"Destinataires : {len(EMAILS)} membres")
    print("=" * 70)
    
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, STORED_APP_PWD)
        print("[AUTH OK] Connexion SMTP Gmail réussie !")
        
        for item in EMAILS:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg["To"] = f"{item['name']} <{item['email']}>"
            msg["Subject"] = item["subject"]
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="gmail.com")
            msg.attach(MIMEText(item["body"], "plain", "utf-8"))
            
            server.send_message(msg)
            print(f"  [ENVOYÉ] -> {item['name']} ({item['email']}) : {item['subject'][:45]}...")
            
        server.quit()
        print("=" * 70)
        print("[SUCCÈS TOTAL] Tous les emails ont été expédiés avec succès !")
        print("=" * 70)
    except Exception as e:
        print(f"[ERREUR] Échec de l'envoi SMTP : {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    send_all_emails()
