#!/usr/bin/env python3
"""
ECOTRACK V2 - Envoi d'un e-mail formel d'alerte des dépendances à Sara Sahih
Envoyé par Adem Ouerhani (Lead Dev & Scrum Master)
Explique en détail les dépendances architecturales et les blocages de l'équipe causés par l'absence de livrables.
"""

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

# Assurer l'encodage UTF-8
sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani (Lead Developer & Scrum Master)"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()
RECIPIENT_EMAIL = "sarah.sou2016@gmail.com"
RECIPIENT_NAME = "Sara Sahih"

SUBJECT = "[ECOTRACK V2] 🚨 ALERTE CRITIQUE SCRUM MASTER : Blocage de l'Équipe & Matrice des Dépendances sur tes Livrables"

BODY_TEXT = """Bonjour Sara,

En tant que Lead Developer et Scrum Master du projet ECOTRACK V2, je t'adresse cet e-mail officiel et urgent concernant l'avancement global de notre projet.

Actuellement, l'équipe a validé et fusionné sur 'develop' 12 tickets sur 27 (44,4% d'avancement global) :
- Sprint 0 : 100% Terminé
- Sprint 1 : 75% Terminé (SCRUM-42, SCRUM-45, SCRUM-56 validés)
- Sprint 2 : 66,7% Terminé (SCRUM-44, SCRUM-46, SCRUM-47, SCRUM-48 validés)

Cependant, ton compte affiche un avancement de 0,0% avec 6 tickets en attente ("À faire") et aucun commit ni branche distante poussée à ce jour sur le dépôt GitHub.

Tes livrables constituent LE CHEMIN CRITIQUE ET LE CŒUR NÉVRALGIQUE de toute l'architecture d'EcoTrack V2. Ton retard bloque directement ou contraint à travailler sur des bouchons l'ensemble des autres développeurs (Ahmed, Hiba et moi-même).

================================================================================
1. CARTOGRAPHIE DÉTAILLÉE DES BLOCAGES PAR TICKET
================================================================================

📌 A. TICKET SCRUM-49 : ECO-23 | POST /reports & Émission RabbitMQ 'report.created' (Sprint 2) — 🚨 POINT DE BLOCAGE NUMÉRO 1
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-49
Ce ticket est le pivot central de la plateforme. Son absence bloque :
1. Ahmed Salah sur SCRUM-57 (Worker Python bi-etl-worker - en cours) :
   Ahmed développe l'ETL incrémental qui écoute les événements ou extrait de MongoDB vers PostgreSQL (Fact_Reports). Sans la création de signalements et l'émission de l'événement RabbitMQ 'report.created', son worker ne peut pas ingérer de données réelles et ne peut être testé qu'avec des mocks.
2. Hiba Dhouib sur SCRUM-51 (Console Web de Qualification Mairie) :
   L'agent de mairie doit charger les signalements via GET /api/v1/reports pour arbitrer la préqualification de l'IA. Sans ton API, aucun signalement n'existe.
3. Ahmed Salah sur SCRUM-59 (Carte Leaflet Multi-filtres) :
   La carte interactive municipale doit requêter GET /api/v1/reports pour afficher les punaises géographiques.
4. Adem Ouerhani sur SCRUM-62 (Tests de Charge k6 NFR-01) :
   L'exigence non-fonctionnelle NFR-01 impose une latence P95 < 300 ms sous 50 req/s précisément sur POST /api/v1/reports. Impossible d'exécuter la campagne de tir k6 sans ce endpoint.
5. Le pipeline Décisionnel Power BI (SCRUM-52) :
   Le Change Data Capture vers le Data Warehouse reste stérile sans signalements.

📌 B. TICKET SCRUM-50 : ECO-30 | Machine à États Finis (FSM) & Gardes T1 à T5 (Sprint 3) — 🚨 MOTEUR DU WORKFLOW
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-50
Ce microservice régit les transitions de statut (T1 Valider, T2 Assigner, T3 Démarrer, T4 Clôturer, T5 Rejeter). Son absence bloque :
1. Hiba Dhouib sur SCRUM-51 : Les boutons "Valider" (T1) et "Rejeter" (T5) de la console web doivent appeler le service de workflow.
2. Ahmed Salah sur SCRUM-59 : Le calcul des Lead Times municipaux (T1-T0 temps de validation, T2-T1 temps d'assignation, etc.) dépend directement des timestamps de transition de ta FSM.
3. Les tickets terrain ouvrier (SCRUM-58 & SCRUM-60) : Le passage en statut 'EN_TRAITEMENT' (T3) et 'RESOLU' (T4) ne peut pas fonctionner.
4. La table Fact_Interventions sous PostgreSQL/Power BI : Elle reste à 0 ligne sans transitions FSM.

📌 C. TICKET SCRUM-43 : ECO-12 | POST /auth/register Route (Sprint 1)
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43
Son absence bloque :
1. Ahmed Salah sur SCRUM-44 : L'écran mobile Expo est prêt, mais l'inscription citoyenne réelle de bout en bout ne peut pas être testée sans ce backend.
2. La recette globale E2E Playwright (SCRUM-64) : L'étape 1 ("Le citoyen s'inscrit") échoue.

================================================================================
2. RAPPEL STRICT DE GOUVERNANCE GIT & SOUTENANCE
================================================================================
Conformément aux directives de notre soutenance et aux règles d'audit :
- "No Push by Assignee = No Done".
- Chaque membre de l'équipe DOIT écrire, signer et pousser ses propres commits depuis sa propre machine.
- Aucune substitution par un autre membre de l'équipe (Lead Dev ou pair) n'est autorisée. Tout code de substitution a été purgé de develop.
- C'est ton nom et ton adresse GitHub (sarah.sou2016@gmail.com) qui doivent figurer sur la traçabilité des livrables.

================================================================================
3. PLAN D'ACTION IMMÉDIAT (PRIORITÉS P0)
================================================================================
Pour débloquer immédiatement Ahmed, Hiba et moi-même, voici ce que tu dois faire dès aujourd'hui :

👉 ÉTAPE 1 (PRIORITÉ ABSOLUE P0) : Livrer SCRUM-49 (Report API)
1. git checkout develop && git pull origin develop
2. git checkout -b feature/ECO-23-sara-report-creation
3. Implémenter dans services/report-api :
   - POST /api/v1/reports : insertion avec ReportModel (créé par Ahmed dans @ecotrack/db / SCRUM-46).
   - Émission de l'événement 'report.created' sur l'échange RabbitMQ 'ecotrack.events'.
   - GET /api/v1/reports/nearby : recherche spatiale $near via l'index 2dsphere.
4. Valider en local : python .agents/scripts/test_sprint2_tickets.py
5. git commit -m "feat(report): [ECO-23] create report endpoint with rabbitmq event"
6. git push -u origin feature/ECO-23-sara-report-creation
7. Passer le ticket en "Revue en cours" sur Jira.

👉 ÉTAPE 2 (PRIORITÉ P0) : Livrer SCRUM-50 (Machine à états FSM)
1. git checkout -b feature/ECO-30-sara-state-machine
2. Implémenter dans services/workflow-api le moteur de transition T1 à T5 avec les gardes de rôles (Agent, Ouvrier, Admin).
3. Pousser la branche et soumettre pour revue.

Toute l'équipe compte sur toi pour débloquer ces flux vitaux. Si tu rencontres un obstacle technique (connexion RabbitMQ, typage GeoJSON Mongoose ou Docker), contacte-moi immédiatement pour que je t'oriente.

Bon courage, nous attendons tes pushs pour enchaîner les revues de code et finaliser l'intégration !

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
ouerhaniadem0805@gmail.com
"""

BODY_HTML = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; line-height: 1.6; background-color: #f7fafc; padding: 20px; }
  .container { max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background: linear-gradient(135deg, #c53030 0%, #9b2c2c 100%); color: #ffffff; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
  .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
  .content { padding: 24px; }
  .alert-box { background: #fff5f5; border-left: 4px solid #e53e3e; padding: 14px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; color: #9b2c2c; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
  .stat-card { background: #edf2f7; padding: 12px; border-radius: 6px; text-align: center; }
  .stat-value { font-size: 18px; font-weight: bold; color: #2b6cb0; }
  .stat-label { font-size: 11px; text-transform: uppercase; color: #718096; margin-top: 4px; }
  .section-title { font-size: 16px; font-weight: 700; color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; margin-bottom: 14px; }
  .ticket-card { background: #f8fafc; border: 1px solid #cbd5e0; border-radius: 8px; padding: 14px; margin-bottom: 14px; }
  .ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .ticket-badge { background: #e53e3e; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
  .ticket-title { font-size: 14px; font-weight: 700; color: #2d3748; }
  .impact-list { margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #4a5568; }
  .impact-list li { margin-bottom: 6px; }
  .impact-list strong { color: #2d3748; }
  .action-box { background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 16px; margin-top: 20px; }
  .action-title { font-weight: 700; color: #22543d; font-size: 15px; margin-bottom: 8px; }
  .code-block { background: #1a202c; color: #68d391; padding: 10px 14px; border-radius: 6px; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; overflow-x: auto; margin: 8px 0; }
  .footer { background: #edf2f7; padding: 16px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🚨 ALERTE CRITIQUE SCRUM MASTER — ECOTRACK V2</h1>
    <p>Matrice des Dépendances & Déblocage Urgent de l'Équipe</p>
  </div>
  
  <div class="content">
    <p>Bonjour <strong>Sara</strong>,</p>
    
    <div class="alert-box">
      <strong>Constat de Blocage Global :</strong> Le projet ECOTRACK V2 a atteint <strong>44,4% d'avancement</strong> (12/27 tâches validées sur <code>develop</code>). Cependant, ton avancement est à <strong>0,0% (6 tickets en "À faire", 0 commit poussé)</strong>. Tes modules constituent le cœur névralgique du système et leur absence paralyse les développements et tests de toute l'équipe.
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">12 / 27</div>
        <div class="stat-label">Tâches Réalisées Équipe</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #e53e3e;">0 / 6</div>
        <div class="stat-label">Tâches Livrées Sara</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">66,7%</div>
        <div class="stat-label">Sprint 2 Validé</div>
      </div>
    </div>

    <div class="section-title">🔍 Qui est bloqué et pourquoi ? (Matrice des Dépendances)</div>

    <!-- TICKET 49 -->
    <div class="ticket-card" style="border-left: 4px solid #e53e3e;">
      <div class="ticket-header">
        <span class="ticket-title"><a href="https://ouerhaniadem0805.atlassian.net/browse/SCRUM-49" style="color: #2b6cb0; text-decoration: none;">SCRUM-49</a> : POST /reports & Événement RabbitMQ 'report.created'</span>
        <span class="ticket-badge">BLOCAGE P0 MAJEUR</span>
      </div>
      <ul class="impact-list">
        <li><strong>Ahmed Salah (SCRUM-57 - Worker Python ETL) :</strong> Ahmed code actuellement le worker ETL incrémental qui écoute RabbitMQ pour peupler <code>Fact_Reports</code>. Sans ton API et sans ton événement <code>report.created</code>, son worker n'a aucune donnée réelle à ingérer.</li>
        <li><strong>Hiba Dhouib (SCRUM-51 - Écran Web Qualification Mairie) :</strong> L'agent de mairie doit charger les signalements via <code>GET /api/v1/reports</code> pour confirmer l'IA. Sans ton endpoint, l'écran reste vide.</li>
        <li><strong>Ahmed Salah (SCRUM-59 - Carte de Supervision Leaflet) :</strong> La carte municipale doit interroger <code>GET /api/v1/reports</code> pour placer les punaises GPS.</li>
        <li><strong>Adem Ouerhani (SCRUM-62 - Tests k6 NFR-01) :</strong> L'exigence contractuelle CDCF V2 impose <code>P95 &lt; 300 ms</code> sous 50 req/s sur <code>POST /reports</code>. Impossible de lancer la campagne sans ton code.</li>
      </ul>
    </div>

    <!-- TICKET 50 -->
    <div class="ticket-card" style="border-left: 4px solid #dd6b20;">
      <div class="ticket-header">
        <span class="ticket-title"><a href="https://ouerhaniadem0805.atlassian.net/browse/SCRUM-50" style="color: #2b6cb0; text-decoration: none;">SCRUM-50</a> : Machine à États FSM & Gardes T1 à T5</span>
        <span class="ticket-badge" style="background: #dd6b20;">MOTEUR WORKFLOW P0</span>
      </div>
      <ul class="impact-list">
        <li><strong>Hiba Dhouib (SCRUM-51) :</strong> Les boutons d'action "Valider" (T1) et "Rejeter" (T5) de la console web doivent appeler le service de workflow.</li>
        <li><strong>Ahmed Salah (SCRUM-59) :</strong> Le calcul des Lead Times (T1-T0, T2-T1, T4-T3) dépend directement des transitions horodatées de ta FSM.</li>
        <li><strong>Adem Ouerhani (SCRUM-52 / Power BI) :</strong> La table <code>Fact_Interventions</code> reste à 0 ligne si aucun incident ne change de statut.</li>
      </ul>
    </div>

    <!-- TICKET 43 -->
    <div class="ticket-card" style="border-left: 4px solid #3182ce;">
      <div class="ticket-header">
        <span class="ticket-title"><a href="https://ouerhaniadem0805.atlassian.net/browse/SCRUM-43" style="color: #2b6cb0; text-decoration: none;">SCRUM-43</a> : POST /auth/register Route (Sprint 1)</span>
        <span class="ticket-badge" style="background: #3182ce;">AUTHENTIFICATION</span>
      </div>
      <ul class="impact-list">
        <li><strong>Ahmed Salah (SCRUM-44) :</strong> L'écran mobile Expo est terminé et validé, mais l'inscription réelle d'un citoyen depuis l'application nécessite ton API pour fonctionner de bout en bout.</li>
        <li><strong>Recette Playwright E2E (SCRUM-64) :</strong> Le test du parcours utilisateur échoue dès l'étape initiale de création de compte.</li>
      </ul>
    </div>

    <div class="action-box">
      <div class="action-title">🛠️ Plan d'Action Immédiat pour Débloquer l'Équipe :</div>
      <p style="margin: 0 0 8px 0; font-size: 13px;">Tu dois impérativement livrer <strong>SCRUM-49</strong> en priorité absolue sous ta propre identité Git :</p>
      <div class="code-block">
git checkout develop<br>
git pull origin develop<br>
git checkout -b feature/ECO-23-sara-report-creation<br>
# Développe POST /api/v1/reports et émission RabbitMQ dans services/report-api<br>
python .agents/scripts/test_sprint2_tickets.py<br>
git commit -m "feat(report): [ECO-23] create report endpoint with rabbitmq event"<br>
git push -u origin feature/ECO-23-sara-report-creation
      </div>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #22543d;">
        Rappel de Gouvernance : <strong>"No Push by Assignee = No Done"</strong>. Seuls tes propres commits signés avec <code>sarah.sou2016@gmail.com</code> seront validés lors de la revue Lead Dev.
      </p>
    </div>

    <p style="margin-top: 20px; font-size: 13px;">Toute l'équipe compte sur ta réactivité pour que nous puissions réaliser une soutenance parfaite. Si tu as besoin d'aide sur RabbitMQ ou Express, je suis disponible pour t'accompagner.</p>

  </div>
  
  <div class="footer">
    <strong>Adem Ouerhani</strong> — Lead Developer & Scrum Master ECOTRACK V2<br>
    📧 ouerhaniadem0805@gmail.com | 🌐 <a href="https://ouerhaniadem0805.atlassian.net" style="color: #4a5568;">Jira Cloud Workspace</a>
  </div>
</div>
</body>
</html>
"""

def send_email():
    print(f"[INFO] Initialisation de l'envoi vers {RECIPIENT_NAME} <{RECIPIENT_EMAIL}>...")
    print(f"[INFO] Expéditeur : {SENDER_NAME} <{SENDER_EMAIL}>")
    
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"] = f"{RECIPIENT_NAME} <{RECIPIENT_EMAIL}>"
    msg["Subject"] = SUBJECT
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")
    
    # Attacher les deux versions (Plain text et HTML)
    msg.attach(MIMEText(BODY_TEXT, "plain", "utf-8"))
    msg.attach(MIMEText(BODY_HTML, "html", "utf-8"))
    
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, STORED_APP_PWD)
        server.send_message(msg)
        server.quit()
        print(f"[SUCCESS] E-mail de cadrage et dépendances envoyé avec succès à {RECIPIENT_EMAIL} !")
        return True
    except Exception as e:
        print(f"[ERROR] Échec de l'envoi SMTP : {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = send_email()
    sys.exit(0 if success else 1)
