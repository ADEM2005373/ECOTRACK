"""
Script pour envoyer l'alerte qualité Git à Hiba Dhouib (hibadhouib6@gmail.com).
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

RECIPIENT_NAME = "Hiba Dhouib"
RECIPIENT_EMAIL = "hibadhouib6@gmail.com"
SUBJECT = "[ECOTRACK - ALERTE GIT] Push direct sur la branche main et encodage du README"

BODY = """Bonjour Hiba,

J'espère que tu vas bien.

En examinant le dépôt GitHub du projet ECOTRACK, nous avons constaté deux anomalies suite à tes récents commits sur le projet :

1. Push direct sur la branche 'main' (commits 7796ed2 et 76022b5) :
   - Ton code pour le microservice IA FastAPI (ticket SCRUM-40 / ECO-03) est bien implémenté dans services/ai-vision/.
   - Cependant, il a été poussé directement sur la branche principale 'main'.
   - Rappel de la règle Git : la branche 'main' doit rester stable et protégée. Aucun push direct n'est autorisé. Tout travail doit impérativement se faire sur ta branche dédiée : feature/ECO-03-hiba-fastapi-init.

2. Encodage du fichier README.md corrompu (commit 76022b5 'first commit') :
   - Ce commit a ajouté la ligne '# tasks_app_reactNative' avec un encodage Windows UTF-16 (octets nuls).
   - Conséquence : Git et GitHub considèrent désormais le README.md comme un fichier binaire corrompu au lieu d'un fichier texte Markdown lisible.

---
COMMENT CORRIGER EXACTEMENT CELA SUR TON POSTE :

Étape 1 : Récupérer et se positionner sur ta branche dédiée :
   git checkout feature/ECO-03-hiba-fastapi-init
   git pull origin main

Étape 2 : Pour tout développement futur, pousser UNIQUEMENT sur ta branche :
   git push origin feature/ECO-03-hiba-fastapi-init
   (Ne jamais exécuter 'git push origin main').

Étape 3 : Créer une Pull Request (PR) sur GitHub :
   Rends-toi sur https://github.com/ADEM2005373/ECOTRACK et ouvre une PR de 'feature/ECO-03-hiba-fastapi-init' vers 'main' pour que l'équipe puisse relire et valider.

Étape 4 : Configuration de ton éditeur (VS Code) :
   Assure-toi d'enregistrer tous tes fichiers au format 'UTF-8' standard (sans BOM) pour éviter de corrompre les fichiers Markdown.

Étape 5 : Mise à jour Jira :
   Merci de passer le ticket SCRUM-40 (ECO-03) au statut 'En cours' ou 'Terminé' sur notre tableau Jira :
   https://ouerhaniadem0805.atlassian.net/browse/SCRUM-40

Merci pour ta réactivité et ton travail sur le microservice IA !

Cordialement,
Adem Ouerhani - Lead Project ECOTRACK
"""

def open_in_browser():
    # Gmail web compose URL
    params = {
        "view": "cm",
        "fs": "1",
        "to": RECIPIENT_EMAIL,
        "su": SUBJECT,
        "body": BODY
    }
    gmail_url = "https://mail.google.com/mail/?" + urllib.parse.urlencode(params)
    print(f"[INFO] Ouverture du composeur Gmail dans le navigateur...")
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
