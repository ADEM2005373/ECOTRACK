"""
ECOTRACK Email Alert Dispatcher
Sends urgent deadline alert emails to team members:
- Hiba Dhouib (hibadhouib6@gmail.com)
- Ahmed Salah (hmidsalah2005@gmail.com)
- Sara Shih (sarah.sou2016@gmail.com)
"""

import sys
import os
import urllib.parse
import webbrowser
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

TEAM_ALERTS = [
    {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "subject": "[ECOTRACK - ALERTE RETARD SPRINT 1] Ticket critique SCRUM-45 (ECO-14)",
        "body": """Bonjour Hiba,

En tant que Scrum Master & PM sur le projet ECOTRACK V2, je te contacte en urgence concernant l'avancement du Sprint 1.

La date limite du Sprint 1 était fixée au 25 octobre 2026. Nous sommes le 3 novembre 2026 et le sprint est en retard de 9 jours.

Ton ticket du Sprint 1 est toujours au statut 'A faire' :
- SCRUM-45 : ECO-14 | [API] Build POST /auth/login with RS256 & Redis Rate Limit
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-45

Ce module d'authentification conditionne la sécurité et le verrouillage des routes inter-services.
De plus, le Sprint 2 arrive a echeance demain (4 nov.) avec ton ticket IA Vision :
- SCRUM-48 : ECO-22 | [AI] Build FastAPI Image Classification Route
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-48

Merci de prioriser SCRUM-45 des aujourd'hui et de mettre a jour ton statut sur Jira.

Cordialement,
Adem Ouerhani - Lead Project ECOTRACK"""
    },
    {
        "name": "Ahmed Salah",
        "email": "hmidsalah2005@gmail.com",
        "subject": "[ECOTRACK - ALERTE RETARD SPRINT 1] Ticket critique SCRUM-44 (ECO-13)",
        "body": """Bonjour Ahmed,

En tant que Scrum Master & PM sur le projet ECOTRACK V2, je te contacte en urgence concernant l'avancement du Sprint 1.

La date limite du Sprint 1 était fixée au 25 octobre 2026. Nous sommes le 3 novembre 2026 et le sprint est en retard de 9 jours.

Ton ticket du Sprint 1 est toujours au statut 'A faire' :
- SCRUM-44 : ECO-13 | [UI-MOB] Build Mobile Registration Screen
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-44

Ce composant mobile bloque la validation citoyenne de bout en bout.
De plus, le Sprint 2 arrive a echeance demain (4 nov.) avec tes deux tickets cles :
- SCRUM-46 : ECO-20 | [DB] Create Report Schema & 2dsphere Index
- SCRUM-57 : ECO-24 | [ETL-Data] Worker Python bi-etl-worker
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-46

Merci de prioriser SCRUM-44 des aujourd'hui et de mettre a jour ton statut sur Jira.

Cordialement,
Adem Ouerhani - Lead Project ECOTRACK"""
    },
    {
        "name": "Sara Shih",
        "email": "sarah.sou2016@gmail.com",
        "subject": "[ECOTRACK - ALERTE RETARD SPRINT 1] Ticket critique SCRUM-43 (ECO-12)",
        "body": """Bonjour Sara,

En tant que Scrum Master & PM sur le projet ECOTRACK V2, je te contacte en urgence concernant l'avancement du Sprint 1.

La date limite du Sprint 1 était fixée au 25 octobre 2026. Nous sommes le 3 novembre 2026 et le sprint est en retard de 9 jours.

Ton ticket du Sprint 1 est toujours au statut 'A faire' :
- SCRUM-43 : ECO-12 | [API] Build POST /auth/register Route
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43

Cette route d'inscription est indispensable pour alimenter la base de donnees et finaliser la mire mobile.
De plus, le Sprint 2 arrive a echeance demain (4 nov.) avec ton ticket :
- SCRUM-49 : ECO-23 | [API] Combine Creation & Emit 'report.created' Event
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-49

Merci de prioriser SCRUM-43 des aujourd'hui et de mettre a jour ton statut sur Jira.

Cordialement,
Adem Ouerhani - Lead Project ECOTRACK"""
    }
]

def open_webmail():
    print("[INFO] Launching Gmail Web Compose windows for team members...")
    for alert in TEAM_ALERTS:
        params = {
            "view": "cm",
            "fs": "1",
            "to": alert["email"],
            "su": alert["subject"],
            "body": alert["body"]
        }
        url = "https://mail.google.com/mail/?" + urllib.parse.urlencode(params)
        print(f"Opening compose window for {alert['name']} ({alert['email']})...")
        webbrowser.open(url)
    print("[SUCCESS] All 3 Gmail compose tabs opened in your browser.")

def send_smtp(app_password):
    sender = "ouerhaniadem0805@gmail.com"
    print(f"[INFO] Connecting to Gmail SMTP server as {sender}...")
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender, app_password)
        for alert in TEAM_ALERTS:
            msg = MIMEMultipart()
            msg["From"] = f"Adem Ouerhani <{sender}>"
            msg["To"] = alert["email"]
            msg["Subject"] = alert["subject"]
            msg.attach(MIMEText(alert["body"], "plain", "utf-8"))
            server.send_message(msg)
            print(f"[SENT] Email sent successfully to {alert['name']} ({alert['email']})")
        server.quit()
        print("[SUCCESS] All emails sent via SMTP.")
    except Exception as e:
        print(f"[ERROR] SMTP sending failed: {e}", file=sys.stderr)
        print("[FALLBACK] Opening browser Gmail compose windows instead...")
        open_webmail()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--smtp":
        if len(sys.argv) > 2:
            send_smtp(sys.argv[2])
        else:
            print("Usage: python send_alert_emails.py --smtp <GMAIL_APP_PASSWORD>")
    else:
        open_webmail()
