import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
import sys
import os

def send_alert_sara(app_password):
    sender = "ouerhaniadem0805@gmail.com"
    recipient = "sarah.sou2016@gmail.com"
    subject = "[ECOTRACK - RELANCE URGENTE SPRINT 1] Ticket Bloquant SCRUM-43 (POST /auth/register)"
    
    body = """Bonjour Sara,

Je te relance en tant que Scrum Master & Lead Developer sur le projet ECOTRACK V2.

Le Sprint 1 est officiellement échu (deadline initiale fixée au 25 octobre 2026), et nous accusons désormais un retard critique de plus de 12 jours sur la livraison des fondations d'authentification.

Ton ticket du Sprint 1 est toujours au statut "À faire" :
- SCRUM-43 : ECO-12 | [API] Build POST /auth/register Route
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43

Cette route d'inscription est l'élément central qui bloque :
1. L'enrôlement et l'inscription des citoyens de bout en bout.
2. La finalisation des tests d'intégration du Sprint 1.
3. Le démarrage effectif des parcours de signalement du Sprint 2.

Pour rappel, toute la couche de données et de logique métier est DÉJÀ PRÊTE et testée à 100% dans la branche 'feature/ECO-11-adem-user-schema' :
- Le schéma Mongoose User (avec rôles et contraintes).
- Le service d'inscription 'userService.createUser()' avec hachage sécurisé Argon2id.
Il te suffit donc de créer le contrôleur Express qui reçoit le DTO et appelle cette méthode existante.

Action impérative attendue aujourd'hui :
- Passer le ticket SCRUM-43 au statut 'En cours' sur Jira.
- Créer ta branche de travail 'feature/ECO-12-sara-register-api'.
- Brancher le contrôleur Express et ouvrir la Pull Request vers develop.

Si tu as la moindre question technique ou besoin d'assistance sur l'intégration, contacte-moi directement.

Cordialement,
Adem Ouerhani — Lead Developer & Scrum Master ECOTRACK V2"""

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender, app_password.replace(" ", "").strip())
        
        msg = MIMEMultipart("alternative")
        msg["From"] = f"Adem Ouerhani <{sender}>"
        msg["To"] = recipient
        msg["Subject"] = subject
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="gmail.com")
        
        part = MIMEText(body, "plain", "utf-8")
        msg.attach(part)
        
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"[ERROR] Échec de l'envoi SMTP : {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    pwd = os.environ.get("GMAIL_APP_PASSWORD") or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not pwd:
        print("Usage: python send_sara_alert.py <GMAIL_APP_PASSWORD>")
        sys.exit(1)
    success = send_alert_sara(pwd)
    sys.exit(0 if success else 1)
