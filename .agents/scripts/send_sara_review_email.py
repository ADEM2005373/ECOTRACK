"""
Script pour envoyer l'email de revue Lead Dev & cadrage Sprint 1 à Sara Shih (sarah.sou2016@gmail.com).
Ouvre directement le composeur d'email Gmail / client par défaut et permet l'envoi SMTP.
"""

import sys
import os
import urllib.parse
import webbrowser
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

RECIPIENT_NAME = "Sara Shih"
RECIPIENT_EMAIL = "sarah.sou2016@gmail.com"
SUBJECT = "[ECOTRACK V2] Revue Lead Dev SCRUM-41 (Validé) & Priorité Sprint 1 (SCRUM-43)"

BODY = """Bonjour Sara,

J'espère que tu vas bien.

En tant que Lead Developer & Scrum Master sur ECOTRACK V2, je viens de finaliser la revue de code de ton ticket du Sprint 0 ainsi que le point de cadrage pour la suite :

============================================================
1. RETOUR DE REVUE DE CODE : SCRUM-41 (ECO-04) - VALIDÉ ✅
============================================================
Félicitations pour le socle Web React 18 + Vite + Tailwind CSS (apps/web-react) :
- Respect rigoureux des Design Tokens CDCF V2 : vert émeraude (#059669) et bleu saphir (#1E3A8A).
- Typographie soignée (Inter + Plus Jakarta Sans).
- Le composant atomique <Button /> est complet (variants, tailles, micro-interactions, spinner SVG).
- Banc de tests d'intégration validé avec succès (20/20 PASS).

Pistes d'amélioration technique mineures pour la suite :
- Penser à relier l'utilitaire cn() (clsx + tailwind-merge déjà installés) dans Button.tsx pour sécuriser les surcharges de classes CSS.
- Ajouter les attributs d'accessibilité (aria-busy={isLoading} et aria-hidden sur le spinner SVG).

============================================================
2. PRÉCISION IMPORTANTE SUR LE PUSH GITHUB DE SCRUM-41 ℹ️
============================================================
La fiche Jira mentionnait initialement la branche 'feature/ECO-04-sara-react-init' :
- Sur GitHub, cette branche n'avait pas été poussée.
- RASSURE-TOI : TU N'AS PLUS BESOIN DE LA POUSSER MAINTENANT.
Tout ton code a été récupéré, consolidé et officiellement fusionné dans la branche 'develop' via la Pull Request #1. Le ticket SCRUM-41 est d'ailleurs passé au statut 'Terminé(e)'.

============================================================
3. PRIORITÉ ABSOLUE AUJOURD'HUI : SPRINT 1 (SCRUM-43) 🚀
============================================================
Le Sprint 1 est actuellement en cours et accuse du retard. Nous devons impérativement livrer ton ticket bloquant :
👉 Ticket : SCRUM-43 (ECO-12) | [API] Build POST /auth/register Route
👉 Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43

Bonne nouvelle : toute la fondation backend a été livrée et fusionnée sur 'develop' :
- Le schéma Mongoose User (avec rôles et contraintes RGPD) est disponible dans @ecotrack/db.
- Le service métier complet 'userService.createUser()' avec hachage durci Argon2id est prêt dans services/identity-api/src/services/user.service.ts.

Voici la démarche exacte à suivre sur ton poste :
1. Récupérer la branche develop à jour :
   git checkout develop
   git pull origin develop

2. Créer ta branche de travail pour le Sprint 1 :
   git checkout -b feature/ECO-12-sara-auth-register

3. Implémenter le contrôleur Express de la route POST /auth/register en appelant directement userService.createUser(dto).

4. Pousser ta branche sur GitHub et ouvrir une Pull Request vers 'develop' :
   git push -u origin feature/ECO-12-sara-auth-register

5. Passer le ticket SCRUM-43 au statut 'En cours' sur Jira.

Je reste à ta disposition sur Discord / Slack pour toute question ou pair-programming si nécessaire.

Bonne journée et bon dev !

Cordialement,
Adem Ouerhani
Lead Developer, Scrum Master & DevOps — ECOTRACK V2
"""

def open_in_browser():
    params = {
        "view": "cm",
        "fs": "1",
        "to": RECIPIENT_EMAIL,
        "su": SUBJECT,
        "body": BODY
    }
    gmail_url = "https://mail.google.com/mail/?" + urllib.parse.urlencode(params)
    print(f"[INFO] Ouverture du composeur Gmail dans le navigateur pour {RECIPIENT_EMAIL}...")
    webbrowser.open(gmail_url)

def open_mailto():
    mailto_url = f"mailto:{RECIPIENT_EMAIL}?subject={urllib.parse.quote(SUBJECT)}&body={urllib.parse.quote(BODY)}"
    print(f"[INFO] Ouverture du client mail local...")
    webbrowser.open(mailto_url)

def send_smtp(app_password):
    sender = "ouerhaniadem0805@gmail.com"
    app_pwd = app_password.replace(" ", "").strip()
    print(f"[INFO] Connexion au serveur SMTP Gmail pour {sender}...")
    server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
    server.ehlo()
    server.starttls()
    server.ehlo()
    server.login(sender, app_pwd)
    
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Adem Ouerhani <{sender}>"
    msg["To"] = f"{RECIPIENT_NAME} <{RECIPIENT_EMAIL}>"
    msg["Subject"] = SUBJECT
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")
    msg.attach(MIMEText(BODY, "plain", "utf-8"))
    
    server.send_message(msg)
    server.quit()
    print(f"[SUCCESS] Email envoyé avec succès à {RECIPIENT_EMAIL} !")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--smtp":
        if len(sys.argv) > 2:
            send_smtp(sys.argv[2])
        else:
            print("Erreur: Mot de passe d'application manquant.")
    else:
        open_in_browser()
