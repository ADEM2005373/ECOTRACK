#!/usr/bin/env python3
"""
ECOTRACK V2 - Envoi d'alertes de rejet de revue Sprint 1
Envoyé par Adem Ouerhani (Lead Dev & Scrum Master)
"""

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani (Lead Developer & Scrum Master)"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

REJECTION_EMAILS = [
    {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "subject": "[ECOTRACK V2] 🚨 Rejet Code Review SCRUM-45 : Rétrogradation à 'À faire' & Obligation de Push Personnel",
        "body": """Bonjour Hiba,

En tant que Lead Developer et Scrum Master, j'ai procédé à la re-revue formelle de l'ensemble des tickets du Sprint 1.

============================================================
1. DÉCISION OFFICIELLE DU SCRUM MASTER : TICKET REJETÉ ❌
============================================================
Ticket : SCRUM-45 (ECO-14 | [API] Build POST /auth/login with RS256 & Redis Rate Limit)
Nouveau Statut Jira : RÉTROGRADÉ À "À FAIRE" (To Do)
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-45

============================================================
2. MOTIF DU REJET (AUDIT DE GOUVERNANCE GIT) 🔍
============================================================
Lors de l'audit de traçabilité Git, il a été constaté que le code de connexion présent sur 'develop' n'a pas été commité par toi, mais par le Lead Dev (Adem) pour pallier un blocage.
Or, la règle d'or de notre équipe est absolue : "No Push by Assignee = No Done".
Chaque développeur doit coder, signer et pousser ses propres livrables. Aucune substitution ne sera acceptée pour la soutenance.

============================================================
3. GUIDE DE CORRECTION PAS-À-PAS (HOW TO FIX) 🛠️
============================================================
Tu dois réaliser et livrer ce ticket toi-même sous 24 heures :

1. Positionne-toi sur 'develop' et tire la dernière version :
   git checkout develop
   git pull origin develop

2. Crée ta branche de travail dédiée :
   git checkout -b feature/ECO-14-hiba-auth-login

3. Configure ton identité Git sur ta machine :
   git config user.name "Hiba Dhouib"
   git config user.email "hibadhouib6@gmail.com"

4. Implémente la route POST /api/v1/auth/login :
   - Fichier cible : services/identity-api/src/routes/auth.routes.ts
   - Vérification du mot de passe avec Argon2id.
   - Génération du token JWT signé en RS256 (asymétrique).
   - Protection brute-force avec le RateLimiter (max 5 tentatives / 15 min).

5. Valide que les tests automatisés passent :
   python .agents/scripts/test_sprint1_tickets.py

6. Commite et pousse ton travail :
   git add .
   git commit -m "feat(identity-api): ECO-14 implement POST /auth/login with RS256 and rate limiting"
   git push -u origin feature/ECO-14-hiba-auth-login

7. Sur Jira : Passe ton ticket de "À faire" -> "En cours", puis "Revue en cours" dès que ta PR est ouverte.

Je reste disponible pour toute question d'architecture.

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
"""
    },
    {
        "name": "Sara Sahih",
        "email": "sarah.sou2016@gmail.com",
        "subject": "[ECOTRACK V2] ⚠️ Rejet Code Review SCRUM-43 : Rétrogradation à 'À faire' (Composant UI React Manquant)",
        "body": """Bonjour Sara,

En tant que Lead Developer et Scrum Master, j'ai procédé à la re-revue formelle de l'ensemble des tickets du Sprint 1.

============================================================
1. DÉCISION DU SCRUM MASTER : TICKET RÉTROGRADÉ ⚠️
============================================================
Ticket : SCRUM-43 (ECO-12 | [API] Build POST /auth/register Route)
Nouveau Statut Jira : RÉTROGRADÉ À "À FAIRE" (To Do)
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43

============================================================
2. MOTIF DU REJET (REVUE LIGNE PAR LIGNE) 🔍
============================================================
- Backend API (Node.js/Express) : ✅ Le contrôleur POST /register est propre et fonctionnel.
- Frontend React (apps/web-react) : ❌ TON LIVRABLE EST INCOMPLET.
  Ton message de commit annonçait : "implement POST /auth/register route & UI components".
  Or, dans 'apps/web-react', aucun formulaire d'inscription n'a été créé ni poussé. Seuls Button.tsx et cn.ts sont présents.
  Un ticket ne peut pas être validé à "Terminé" si la partie interface utilisateur promise n'est pas livrée.

============================================================
3. GUIDE DE CORRECTION PAS-À-PAS (HOW TO FIX) 🛠️
============================================================
1. Crée ta branche dédiée :
   git checkout -b feature/ECO-12-sara-auth-register

2. Développe le formulaire d'inscription dans 'apps/web-react' :
   - Fichier à créer ou enrichir : apps/web-react/src/components/auth/RegisterForm.tsx (ou dans App.tsx).
   - Champs requis : Nom complet, Email, Mot de passe (≥ 8 car.), Numéro de téléphone.
   - Branchement : Appel fetch() vers l'API 'POST /api/v1/auth/register'.
   - Gestion des retours : Affichage des messages de succès (201) et d'erreur (400, 409).

3. Commite avec ta signature :
   git config user.name "Sara Shih"
   git config user.email "sarah.sou2016@gmail.com"
   git commit -m "feat(web-react): implement register form UI and API integration"
   git push -u origin feature/ECO-12-sara-auth-register

4. Sur Jira : Déplace ton ticket de "À faire" -> "En cours" -> "Revue en cours" une fois le code poussé.

Merci pour ta réactivité.

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
"""
    }
]

def send():
    app_pwd = STORED_APP_PWD.replace(" ", "").strip()
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, app_pwd)
        print("[AUTH OK] Connexion SMTP réussie.")
    except Exception as e:
        print(f"[ERREUR SMTP] : {e}")
        return

    for item in REJECTION_EMAILS:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg["To"] = item["email"]
            msg["Subject"] = item["subject"]
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="ecotrack.local")
            msg.attach(MIMEText(item["body"], "plain", "utf-8"))
            server.sendmail(SENDER_EMAIL, [item["email"]], msg.as_string())
            print(f"--> [ENVOYÉ] Alerte transmise à {item['name']} ({item['email']})")
        except Exception as err:
            print(f"--> [ÉCHEC] Erreur pour {item['email']}: {err}")
    server.quit()
    print("[TERMINÉ] Toutes les notifications ont été traitées.")

if __name__ == '__main__':
    send()
