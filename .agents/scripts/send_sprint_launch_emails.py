"""
ECOTRACK Sprint 2 Launch & Option A Team Email Dispatcher
Sends personalized kickoff and coordination emails from Adem Ouerhani (ouerhaniadem0805@gmail.com)
to all core team members:
- Hiba Dhouib (hibadhouib6@gmail.com)
- Ahmed Salah (hmidsalah2005@gmail.com)
- Sara Shih (sarah.sou2016@gmail.com)

Features:
1. Opens prefilled Gmail Web compose windows in default browser for 1-click review & sending.
2. Supports direct SMTP delivery via '--smtp <app_password>'.
3. Generates clickable mailto / web links.
"""

import sys
import os
import urllib.parse
import webbrowser
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

TEAM_EMAILS = [
    {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Lancement Sprint 2 & Cadrage IA / Auth (SCRUM-45 & SCRUM-48)",
        "body": """Bonjour Hiba,

J'espère que tu vas bien.

En tant que Lead Developer & Scrum Master sur ECOTRACK V2, je t'informe que nous venons officiellement d'activer le Sprint 2 sur notre tableau Jira Cloud, en parallèle de la clôture des derniers livrables du Sprint 1.

============================================================
1. POINT SUR SPRINT 1 : AUTH & LOGIN RS256 (SCRUM-45) ✅
============================================================
Pour débloquer l'équipe (Option A validée), le socle de connexion sécurisée a été intégré dans 'services/identity-api/' :
- Signature asymétrique JWT RS256 avec paire de clés RSA 2048 bits (ADR-02).
- Limiteur de débit contre les attaques par force brute (5 tentatives / min max).
- Endpoints POST /auth/login, POST /auth/refresh et GET /auth/public-key fonctionnels.
- Banc de tests validé (15/15 tests PASS).

👉 Ticket Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-45
Tu peux relire le code dans 'services/identity-api/src/routes/auth.routes.ts' et mettre à jour le statut du ticket sur Jira.

============================================================
2. OBJECTIF PRIORITAIRE SPRINT 2 : IA VISION (SCRUM-48) 🎯
============================================================
Le Sprint 2 est désormais OUVERT et ACTIF sur Jira.
Ton ticket clé pour ce sprint est :
👉 SCRUM-48 : ECO-22 | [AI] Build FastAPI Image Classification Route
👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-48

Objectif attendu :
- Implémenter la route POST /api/v1/vision/classify dans 'services/ai-vision/main.py'.
- Prendre en entrée une image (multipart/form-data) et exécuter l'inférence (MobileNetV3 / YOLO).
- Retourner la catégorie prédite (DEPOT_SAUVAGE, ENCOMBRANT, DECHETS_VERTS) avec l'indice de confiance (confidenceScore >= 0.65).
- Prévoir un fallback rapide (< 1.5s) pour ne jamais bloquer l'expérience utilisateur mobile.

Je reste disponible sur Discord / Slack pour tout échange ou besoin d'assistance.

Bon dev et bon lancement de Sprint 2 !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""
    },
    {
        "name": "Ahmed Salah",
        "email": "hmidsalah2005@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Lancement Sprint 2 & Activation Report-API Spatial 2dsphere (SCRUM-46 / SCRUM-44)",
        "body": """Bonjour Ahmed,

J'espère que tu vas bien.

En tant que Lead Developer & Scrum Master sur ECOTRACK V2, je t'annonce le lancement officiel du Sprint 2 ("Carte Citoyenne 2dsphere & Core Report") sur notre tableau Jira Cloud !

============================================================
1. LIVRABLES EFFECTUÉS SUR LE CORE REPORT & SPATIAL (SCRUM-46) ✅
============================================================
Dans le cadre de l'Option A (déblocage du backend transactionnel) :
- Le schéma Mongoose 'Report' avec son index spatial '2dsphere' est finalisé dans '@ecotrack/db'.
- Le microservice 'services/report-api' (port 3002) est créé avec les routes POST /reports et GET /reports?lat=&lng=&radiusMeters=.
- Les requêtes de proximité spatiale $near sont prêtes et testées avec succès (9/9 tests PASS).

👉 Ticket Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-46

============================================================
2. TES PRIORITÉS IMMÉDIATES (SPRINT 1 & SPRINT 2) 🎯
============================================================
1. Finaliser l'écran mobile citoyen (Sprint 1) :
   👉 SCRUM-44 : ECO-13 | [UI-MOB] Build Mobile Registration Screen
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-44
   (Note : le doublon workspace 'apps/mobile-expo' a été nettoyé ; tout le code Expo propre est dans 'apps/mobile/').

2. Préparer le pipeline ETL décisionnel (Sprint 2) :
   👉 SCRUM-57 : ECO-24 | [ETL-Data] Worker Python bi-etl-worker : Extraction Incrémentale vers Fact_Reports
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-57
   Ce worker synchronisera les signalements MongoDB vers notre Data Warehouse PostgreSQL 16 (Star Schema).

Merci de mettre à jour tes statuts sur Jira dès que possible.

Bon dev et bon démarrage de sprint !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""
    },
    {
        "name": "Sara Shih",
        "email": "sarah.sou2016@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Lancement Sprint 2 & Disponibilité de Report-API (SCRUM-49 / SCRUM-43)",
        "body": """Bonjour Sara,

J'espère que tu vas bien.

Je t'informe que nous venons officiellement d'activer le Sprint 2 sur notre tableau Jira Cloud, et que les fondations du backend transactionnel ont été déployées !

============================================================
1. POINT D'AVANCEMENT BACKEND & AUTH (SCRUM-43) ✅
============================================================
- La route POST /auth/register est opérationnelle avec les contrôles de validation et de sécurité.
- Le login RS256 (SCRUM-45) est également prêt, permettant d'obtenir les tokens JWT Bearer nécessaires pour sécuriser les routes signalements.
- Le microservice 'services/report-api' (port 3002) est scaffoldé et prêt à accueillir la soumission des signalements.

👉 Ticket Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43

============================================================
2. TES MISSIONS POUR LE SPRINT 2 (SCRUM-49 & WORKFLOWS) 🎯
============================================================
1. Finaliser le flux de création de signalement :
   👉 SCRUM-49 : ECO-23 | [API] Combine Creation & Emit 'report.created'
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-49
   Objectif : Valider la chaîne complète (Upload photo sans EXIF -> Enregistrement en base GeoJSON -> Émission de l'événement RabbitMQ).

2. Anticiper le moteur de workflow (Sprint 3) :
   👉 SCRUM-50 : ECO-30 | [API] Build Workflow Guard Service (T1 - T4)
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-50

N'hésite pas si tu souhaites faire un point technique rapide sur l'intégration RabbitMQ ou les tests.

Excellente journée et bon sprint !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""
    }
]

def open_compose_tabs():
    """Ouvre les onglets Gmail de composition pré-remplis dans le navigateur par défaut."""
    print("=" * 70)
    print("OUVERTURE DU COMPOSITEUR GMAIL POUR LES 3 MEMBRES DE L'EQUIPE")
    print(f"Expéditeur configuré : {SENDER_NAME} <{SENDER_EMAIL}>")
    print("=" * 70)
    for member in TEAM_EMAILS:
        params = {
            "view": "cm",
            "fs": "1",
            "to": member["email"],
            "su": member["subject"],
            "body": member["body"]
        }
        gmail_url = "https://mail.google.com/mail/?" + urllib.parse.urlencode(params)
        print(f"[ACTION] Ouverture du composeur Gmail pour {member['name']} <{member['email']}>...")
        try:
            webbrowser.open(gmail_url)
        except Exception as e:
            print(f"[WARN] Impossible d'ouvrir le navigateur : {e}")

def send_smtp(raw_password):
    """Envoi direct via le serveur SMTP Gmail."""
    app_pwd = raw_password.replace(" ", "").strip()
    print(f"[INFO] Connexion au serveur SMTP Gmail (smtp.gmail.com:587) avec {SENDER_EMAIL}...")
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, app_pwd)
        print("[AUTH OK] Authentification SMTP réussie !")
        
        for member in TEAM_EMAILS:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg["To"] = f"{member['name']} <{member['email']}>"
            msg["Subject"] = member["subject"]
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="gmail.com")
            msg.attach(MIMEText(member["body"], "plain", "utf-8"))
            
            server.send_message(msg)
            print(f"[ENVOYE] Email envoyé à {member['name']} <{member['email']}> !")
            
        server.quit()
        print("[SUCCES] Les 3 emails ont été expédiés avec succès via SMTP !")
    except Exception as e:
        print(f"[ERREUR] Échec de l'envoi SMTP : {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--browser":
        open_compose_tabs()
    elif len(sys.argv) > 2 and sys.argv[1] == "--smtp":
        send_smtp(sys.argv[2])
    else:
        # Envoi automatique par défaut via SMTP avec le mot de passe mémorisé
        send_smtp(STORED_APP_PWD)
