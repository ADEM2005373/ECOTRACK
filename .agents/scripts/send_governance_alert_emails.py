#!/usr/bin/env python3
"""
ECOTRACK V2 - Script d'Alerte de Gouvernance Dev Lead & Scrum Master
Envoi d'e-mails d'avertissement officiels aux membres de l'équipe :
1. Ahmed Salah (hmidsalah2005@gmail.com) : Alerte critique livraison fictive SCRUM-39 & retard SCRUM-44.
2. Sara Shih (sarah.sou2016@gmail.com) : Félicitations PR #2 & rappel strict règle "No Push = No Done".
3. Hiba Dhouib (hibadhouib6@gmail.com) : Point de livraison Sprint 1 (SCRUM-45) & lancement Sprint 2 (SCRUM-48).

Règle d'or de l'équipe : "Un ticket marqué Terminé sur Jira sans commit/PR sur GitHub est une livraison fictive interdite."
"""

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

# Assurer l'encodage UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Charger les identifiants SMTP centraux
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani (Lead Developer & Scrum Master)"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

GOVERNANCE_EMAILS = [
    {
        "name": "Ahmed Salah",
        "email": "hmidsalah2005@gmail.com",
        "subject": "[ECOTRACK V2] ⚠️ Alerte Critique Dev Lead : Interdiction de marquer des tickets 'Terminé' sans Push Git (SCRUM-39 / SCRUM-44)",
        "body": """Bonjour Ahmed,

J'espère que tu vas bien.

En tant que Lead Developer et Scrum Master sur ECOTRACK V2, je réalise un audit de traçabilité croisé entre notre tableau Jira Cloud et notre dépôt GitHub officiel (https://github.com/ADEM2005373/ECOTRACK).

L'audit de gouvernance révèle une anomalie majeure concernant tes livrables :

============================================================
1. CONSTAT D'AUDIT SUR TES TICKETS JIRA vs GITHUB 🔍
============================================================
- SCRUM-39 (ECO-02 - Initialisation Expo & Design Tokens) :
  👉 Ce ticket est marqué "Terminé" sur Jira depuis plusieurs jours.
  ❌ Cependant, sur GitHub, tu n'as poussé AUCUN commit et AUCUNE branche.
  ⚠️ RAPPEL DE GOUVERNANCE STRICT : Marquer un ticket comme "Terminé" sur Jira sans avoir commité et poussé le code sur GitHub est qualifié de LIVRAISON FICTIVE (Fraude de burndown).

- SCRUM-44 (ECO-13 - Écran Mobile Inscription / Connexion) :
  👉 Ce ticket est marqué "En cours" sur Jira.
  ❌ Aucune branche 'feature/ECO-13-ahmed-mobile-auth' n'existe sur le dépôt distant.

============================================================
2. RÈGLE D'OR DE L'ÉQUIPE : "NO PUSH = NO DONE" ⚖️
============================================================
La Definition of Done (DoD) de notre projet stipule expressément :
"Un ticket ne peut JAMAIS être passé à l'état Terminé s'il n'y a pas une branche de feature, des commits signés par l'assignee et une Pull Request validée sur GitHub."

============================================================
3. ACTIONS CORRECTIVES EXIGÉES SOUS 24 HEURES ⚡
============================================================
1. Si tu as du code en local sur ta machine :
   - Crée ta branche : git checkout -b feature/ECO-13-ahmed-mobile-auth
   - Configure ton identité Git : 
     git config user.name "Ahmed Salah"
     git config user.email "hmidsalah2005@gmail.com"
   - Commite ton travail et pousse-le : git push origin feature/ECO-13-ahmed-mobile-auth
2. Ouvre immédiatement la Pull Request vers 'develop'.
3. Ne passe plus AUCUN ticket à "Terminé" sur Jira sans validation préalable du push sur GitHub.

Le service 'report-api' (port 3002) avec l'index spatial 2dsphere et les requêtes $near a déjà été développé pour te débloquer. Tu as toutes les briques pour livrer l'écran mobile.

Je compte sur ta réactivité immédiate pour rétablir la conformité de tes livrables.

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps Architect — ECOTRACK V2
"""
    },
    {
        "name": "Sara Shih",
        "email": "sarah.sou2016@gmail.com",
        "subject": "[ECOTRACK V2] ✅ Félicitations PR #2 & ⚠️ Rappel de Gouvernance : Règle 'No Push = No Done' (SCRUM-41 / SCRUM-43)",
        "body": """Bonjour Sara,

J'espère que tu vas bien.

Je tiens d'abord à te remercier d'avoir accepté l'invitation sur notre dépôt GitHub officiel (https://github.com/ADEM2005373/ECOTRACK).

============================================================
1. FÉLICITATIONS : PULL REQUEST #2 OFFICIELLEMENT FUSIONNÉE 🎉
============================================================
La Pull Request #2 concernant ton ticket SCRUM-43 (ECO-12 - Route POST /auth/register avec Argon2id et composants UI React) a été validée, testée à 100% et fusionnée avec succès dans la branche 'develop' et 'main'.
Le commit 7f2afdc est officiellement enregistré et crédité sous ton profil GitHub (@sarah-sahih). Ton avatar apparaît désormais fièrement sur la branche !

============================================================
2. RAPPEL DE GOUVERNANCE STRICT : "NO PUSH = NO DONE" ⚖️
============================================================
Lors de l'audit de gouvernance Jira vs Git, nous avons constaté que le ticket SCRUM-41 (ECO-04 - Initialisation React Vite) était marqué "Terminé" sur Jira avant que des commits ne soient poussés depuis ton terminal.

Rappel du protocole pour tous les prochains tickets :
- Il est strictement interdit de marquer un ticket comme "Terminé" sur Jira sans avoir au préalable poussé son code et ouvert une Pull Request sur GitHub.
- Chaque ticket doit impérativement porter ta signature Git sur ta machine :
  git config user.name "Sara Shih"
  git config user.email "sarah.sou2016@gmail.com"

============================================================
3. OBJECTIFS PRIORITAIRES SPRINT 2 (CORE REPORT & WORKFLOW) 🚀
============================================================
Le Sprint 2 est actif. Tes tickets clés sont :
👉 SCRUM-49 : ECO-23 | [API] Combine Creation & Emit 'report.created' (RabbitMQ)
👉 SCRUM-50 : ECO-30 | [API] Build Workflow Guard Service (FSM T1 - T4)

Tout le code de base est synchronisé sur 'develop'. Fais un 'git pull origin develop' pour récupérer la dernière version stable.

Excellente continuation et bravo pour la régularisation de ta PR !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps Architect — ECOTRACK V2
"""
    },
    {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "subject": "[ECOTRACK V2] ⚠️ Point de Synchronisation Sprint 1/2 & Règle de Livraison Git (SCRUM-40 / SCRUM-45 / SCRUM-48)",
        "body": """Bonjour Hiba,

J'espère que tu vas bien.

Un point rapide de suivi en tant que Lead Developer & Scrum Master suite à notre audit croisé Jira vs GitHub.

============================================================
1. FÉLICITATIONS POUR SPRINT 0 (SCRUM-40) ✅
============================================================
Ton commit 7796ed2 sur la branche 'feature/ECO-03-hiba-fastapi-init' a été validé et intégré. L'environnement FastAPI et PyTorch est opérationnel.

============================================================
2. RAPPEL SUR SPRINT 1 : TICKET SCRUM-45 EN SOUFFRANCE ⚠️
============================================================
Le ticket SCRUM-45 (ECO-14 - POST /auth/login avec RS256 & Rate Limiter Redis) est marqué "En cours" sur Jira depuis plusieurs jours, mais aucun commit n'a été poussé sur GitHub.
Pour débloquer la livraison globale et les tests du Sprint 1, j'ai dû implémenter le TokenService (signature asymétrique RS256) et le RateLimiterService directement dans 'services/identity-api/'.

👉 RAPPEL DE GOUVERNANCE :
Tout travail entamé sur Jira doit faire l'objet de pushs Git réguliers (au minimum un push par jour de travail). Ne pas laisser un ticket "En cours" ou le marquer "Terminé" sans que le code correspondant ne soit visible sur GitHub.

============================================================
3. OBJECTIF MAJEUR SPRINT 2 : IA VISION CLASSIFICATION (SCRUM-48) 🎯
============================================================
Ton ticket phare pour le Sprint 2 est ouvert :
👉 SCRUM-48 : ECO-22 | [AI] Build FastAPI Image Classification Route
👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-48

Attendu :
- Implémenter la route POST /api/v1/vision/classify dans 'services/ai-vision/main.py'.
- Inférence MobileNetV3 / YOLO avec score de confiance >= 0.65.
- Pousser ton travail sur une branche dédiée : 'feature/ECO-22-hiba-ai-classification'.

Je reste à ta disposition pour tout échange technique.

Bon dev et bon sprint !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps Architect — ECOTRACK V2
"""
    }
]

def send_alerts():
    print("=" * 80)
    print("  ECOTRACK V2 - ENVOI DES EMAILS D'ALERTE DE GOUVERNANCE DEV LEAD (SMTP)")
    print(f"  Expéditeur : {SENDER_NAME} <{SENDER_EMAIL}>")
    print("=" * 80)
    
    app_pwd = STORED_APP_PWD.replace(" ", "").strip()
    
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, app_pwd)
        print("[AUTH OK] Connexion et authentification SMTP réussies sur smtp.gmail.com:587 !\n")
    except Exception as e:
        print(f"[ERREUR SMTP] Échec de connexion : {e}", file=sys.stderr)
        return False
        
    success_count = 0
    for m in GOVERNANCE_EMAILS:
        print(f"[*] Envoi de l'alerte à {m['name']} <{m['email']}>...")
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg["To"] = m["email"]
            msg["Subject"] = m["subject"]
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="ecotrack.local")
            
            msg.attach(MIMEText(m["body"], "plain", "utf-8"))
            
            server.sendmail(SENDER_EMAIL, [m["email"]], msg.as_string())
            print(f"    --> ✅ EMAIL ENVOYÉ AVEC SUCCÈS À {m['email']} !")
            success_count += 1
        except Exception as err:
            print(f"    --> ❌ Erreur lors de l'envoi à {m['email']} : {err}", file=sys.stderr)
            
    server.quit()
    print("\n" + "=" * 80)
    print(f"  BILAN : {success_count} / {len(GOVERNANCE_EMAILS)} emails d'alerte envoyés avec succès !")
    print("=" * 80)
    return success_count == len(GOVERNANCE_EMAILS)

if __name__ == '__main__':
    send_alerts()
