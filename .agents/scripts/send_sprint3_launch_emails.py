"""
ECOTRACK Sprint 3 Official Launch & Coordination Email Dispatcher
Sends personalized kickoff and technical guideline emails from Adem Ouerhani (Lead Developer & Scrum Master)
to all core team members:
- Sara Sahih (sarah.sou2016@gmail.com) -> SCRUM-50 & SCRUM-58 (FSM Workflow & Mobile Ouvrier)
- Hiba Dhouib (hibadhouib6@gmail.com) -> SCRUM-51 (Agent Web Qualification Split-Screen)
- Ahmed Salah (hmidsalah2005@gmail.com) -> SCRUM-59 (Carte de Supervision & Lead Times)
"""

import sys
import os
import urllib.parse
import webbrowser
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani (Lead Developer & Scrum Master)"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

TEAM_EMAILS = [
    {
        "name": "Sara Sahih",
        "email": "sarah.sou2016@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Lancement Officiel du Sprint 3 : FSM Workflow (SCRUM-50) & Feuille de Route Ouvrier (SCRUM-58)",
        "body": """Bonjour Sara,

J'espère que tu vas bien.

En tant que Lead Developer et Scrum Master sur ECOTRACK V2, je t'annonce le lancement officiel du SPRINT 3 sur notre tableau Jira Cloud :
👉 Sprint 3 : Workflow FSM, Dispatch & Qualification IA (ID Sprint Jira : 70 - ACTIF)

============================================================
1. TES DEUX MISSIONS MAJEURES POUR CE SPRINT 3 🎯
============================================================

1. Machine à États Finis (FSM) & Gardes de Transition :
   👉 SCRUM-50 : ECO-30 | [API] Build Workflow Guard Service (T1 - T4)
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-50
   - Définir le cycle de vie strict des signalements :
     * T1 : NOUVEAU ➔ EN_COURS_DE_VALIDATION (prise en charge Agent)
     * T2 : EN_COURS_DE_VALIDATION ➔ VALIDE ou REJETE (arbitrage Agent avec motif obligatoire si rejet)
     * T3 : VALIDE ➔ EN_TRAITEMENT (démarrage intervention Ouvrier sur site)
     * T4 : EN_TRAITEMENT ➔ RESOLU (clôture travaux)
   - Vérifier les permissions RBAC pour chaque transition (seul un Agent peut faire T2, seul un Ouvrier assigné peut faire T3, etc.).
   - Branche Git recommandée : feature/ECO-30-sara-fsm-workflow

2. Application Mobile Ouvrier Terrain ($near) :
   👉 SCRUM-58 : ECO-32 | [UI-MOB] Feuille de Route Mobile Ouvrier par Proximité ($near) & Démarrage Chantier (T3)
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-58
   - Développer l'écran mobile pour les équipes d'intervention municipales.
   - Récupérer les signalements assignés triés par proximité GPS grâce à l'index 2dsphere ($near).
   - Intégrer le bouton d'action "Démarrer intervention" déclenchant la transition T3.
   - Branche Git recommandée : feature/ECO-32-sara-mobile-worker

============================================================
2. GOUVERNANCE & QUALITÉ 📋
============================================================
- Les descriptions détaillées pas-à-pas sont disponibles directement dans tes tickets Jira.
- N'oublie pas de basculer tes tickets vers "En cours" dès le début du développement et de commiter régulièrement avec ton adresse email enregistrée.

Je reste à ta totale disposition pour toute question technique ou revue d'architecture.

Bon début de Sprint 3 !

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
"""
    },
    {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Lancement Officiel du Sprint 3 : Écran Web de Qualification Agent IA (SCRUM-51)",
        "body": """Bonjour Hiba,

Félicitations pour la validation de ton ticket IA du Sprint 2 (SCRUM-48 / ECO-22) ! La route de classification MobileNetV3 et ses tests unitaires ont été validés avec succès et le ticket est passé à l'état Terminé.

Le SPRINT 3 est officiellement ACTIF sur notre tableau Jira Cloud :
👉 Sprint 3 : Workflow FSM, Dispatch & Qualification IA (ID Sprint Jira : 70 - ACTIF)

============================================================
1. TA MISSION PRIORITAIRE SPRINT 3 : QUALIFICATION AGENT 🎯
============================================================
👉 SCRUM-51 : ECO-31 | [UI-WEB] Build Agent Qualification Split-Screen
👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-51

Objectif Métier (US-03) :
Créer l'interface web (React Vite + Tailwind CSS) dédiée aux agents municipaux pour examiner et préqualifier les signalements citoyens en tirant parti du microservice IA que tu viens de développer.

Composants attendus dans l'écran scindé (Split-Screen) :
- Volet Gauche (Inspection) :
  * Affichage de la photo de l'incident (sans métadonnées EXIF).
  * Affichage des coordonnées GPS et de l'adresse du signalement.
  * Suggestion de l'IA (Catégorie suggérée, indice de confiance %, badge vert si >= 65%, alerte si < 65%).
- Volet Droit (Arbitrage Agent) :
  * Sélecteur de catégorie (permettant à l'agent de confirmer ou de corriger le choix IA).
  * Sélecteur de priorité (BASSE, MOYENNE, HAUTE, URGENTE).
  * Boutons d'action rapides : [Valider le signalement (T2)] ou [Rejeter le signalement] avec saisie du motif de rejet.

============================================================
2. DÉMARRAGE TECHNIQUE 🛠️
============================================================
- Branche Git : feature/ECO-31-hiba-agent-qualification
- Fichier cible principal : apps/web/src/pages/AgentQualification.tsx (ou sous-composants dans apps/web/src/components/qualification/)
- Le guide pas-à-pas est consultable directement sur Jira (SCRUM-51).

N'hésite pas si tu as besoin d'aide pour connecter les composants avec l'API ou réutiliser notre charte graphique Tailwind !

Bon sprint à toi !

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
"""
    },
    {
        "name": "Ahmed Salah",
        "email": "hmidsalah2005@gmail.com",
        "subject": "[ECOTRACK V2] 🚀 Lancement Officiel du Sprint 3 : Carte de Supervision & Lead Times (SCRUM-59)",
        "body": """Bonjour Ahmed,

Bravo pour la livraison de l'écran d'enregistrement mobile (SCRUM-44 / ECO-13) !

Nous venons officiellement d'activer le SPRINT 3 sur notre tableau Jira Cloud :
👉 Sprint 3 : Workflow FSM, Dispatch & Qualification IA (ID Sprint Jira : 70 - ACTIF)

============================================================
1. TES OBJECTIFS PRIORITAIRES 🎯
============================================================

1. Finalisation Sprint 2 (ETL) :
   👉 SCRUM-57 : ECO-24 | [ETL-Data] Worker Python bi-etl-worker
   - Assure la fin de la synchronisation incrémentale de MongoDB vers PostgreSQL Fact_Reports pour clôturer sereinement les flux de données.

2. Nouvelle Mission Sprint 3 : Carte de Supervision Web Multi-Filtres :
   👉 SCRUM-59 : ECO-33 | [Web-Data] Composant Carte de Supervision Multi-filtres & Calcul des Lead Times
   👉 Lien : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-59
   - Développer le composant de cartographie décisionnelle dans l'application Web React.
   - Fonctionnalités requises :
     * Affichage dynamique des signalements sous forme de marqueurs / clusters géolocalisés.
     * Filtres croisés : Statut FSM (Nouveau, Validé, En traitement, Résolu), Catégorie, Priorité, Intervalle de dates.
     * KPI en temps réel : Calcul des Lead Times moyens (délai moyen entre la création du signalement T0 et chaque étape de résolution T1-T4).
   - Branche Git recommandée : feature/ECO-33-ahmed-supervision-map

Consulte la description pédagogique sur SCRUM-59 pour tous les détails d'implémentation.

Excellente continuation et bon Sprint 3 !

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
"""
    }
]

def send_smtp():
    app_pwd = STORED_APP_PWD.replace(" ", "").strip()
    print(f"[INFO] Connexion au serveur SMTP Gmail (smtp.gmail.com:587) avec {SENDER_EMAIL}...")
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
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
            msg["Message-ID"] = make_msgid(domain="ecotrack.local")
            msg.attach(MIMEText(member["body"], "plain", "utf-8"))

            server.send_message(msg)
            print(f"[ENVOYE] Email de lancement Sprint 3 envoyé avec succès à {member['name']} <{member['email']}> !")

        server.quit()
        print("[SUCCES] Tous les emails de cadrage du Sprint 3 ont été expédiés avec succès !")
    except Exception as e:
        print(f"[ERREUR] Échec de l'envoi SMTP : {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    send_smtp()
