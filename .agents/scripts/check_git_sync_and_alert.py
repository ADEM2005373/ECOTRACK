#!/usr/bin/env python3
"""
ECOTRACK V2 - Automated Git Synchronization & Governance Alert Dispatcher
Lead Developer & Scrum Master: Adem Ouerhani (@ADEM2005373)

Ce script audite en temps réel l'ensemble des branches distantes :
1. Vérifie si chaque branche de feature a une Pull Request ouverte vers develop.
2. Calcule le retard de synchronisation (nombre de commits de retard par rapport à develop).
3. Détecte les branches inactives ou les pushs orphelins.
4. Envoie automatiquement des emails d'alerte SMTP pédagogiques avec commandes Git prêtes à l'emploi.

Usage :
  python check_git_sync_and_alert.py --audit   # Afficher l'audit dans la console
  python check_git_sync_and_alert.py --alert   # Envoyer les alertes par email
"""

import sys
import os
import subprocess
import json
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

# Assurer l'encodage UTF-8 sous Windows PowerShell
sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(ROOT_DIR, ".agents", "scripts"))
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani (Lead Developer & Scrum Master)"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

DEVELOPERS = {
    "ahmed": {
        "name": "Ahmed Salah",
        "email": "hmidsalah2005@gmail.com",
        "github": "ah-med-sal-ah",
        "patterns": ["ahmed", "salah", "eco-13", "eco-20", "eco-24"]
    },
    "hiba": {
        "name": "Hiba Dhouib",
        "email": "hibadhouib6@gmail.com",
        "github": "hibadh",
        "patterns": ["hiba", "dhouib", "eco-03", "eco-14", "eco-22"]
    },
    "sara": {
        "name": "Sara Shih",
        "email": "sarah.sou2016@gmail.com",
        "github": "sarah-sahih",
        "patterns": ["sara", "sarah", "eco-12", "eco-23"]
    }
}

def run_git(args):
    cmd = ["git"] + args
    res = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, encoding="utf-8")
    return res.returncode, res.stdout.strip(), res.stderr.strip()

def get_remote_branches():
    run_git(["fetch", "origin"])
    code, out, _ = run_git(["branch", "-r"])
    if code != 0 or not out:
        return []
    branches = []
    for line in out.splitlines():
        b = line.strip()
        if "->" in b or not b.startswith("origin/"):
            continue
        branch_name = b.replace("origin/", "")
        if branch_name in ["main", "develop"]:
            continue
        branches.append(branch_name)
    return branches

def get_pr_for_branch(branch_name):
    cmd = ["gh", "pr", "list", "--head", branch_name, "--json", "number,title,state,isDraft,url"]
    res = subprocess.run(cmd, cwd=ROOT_DIR, capture_output=True, text=True, encoding="utf-8")
    if res.returncode == 0 and res.stdout.strip():
        try:
            prs = json.loads(res.stdout)
            return prs[0] if prs else None
        except Exception:
            return None
    return None

def identify_developer(branch_name, last_author_email=""):
    target_str = (branch_name + " " + last_author_email).lower()
    for dev_key, dev_info in DEVELOPERS.items():
        if any(p in target_str for p in dev_info["patterns"]):
            return dev_key, dev_info
    return None, None

def audit_synchronization():
    branches = get_remote_branches()
    print("================================================================================")
    print("  ECOTRACK V2 — AUDIT DE SYNCHRONISATION GIT ET DES BRANCHES DE TRAVAIL")
    print(f"  Date : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Réf : origin/develop")
    print("================================================================================\n")
    
    reports = []
    
    for b in branches:
        # Commits ahead / behind develop
        _, ahead, _ = run_git(["rev-list", "--count", f"origin/develop..origin/{b}"])
        _, behind, _ = run_git(["rev-list", "--count", f"origin/{b}..origin/develop"])
        ahead_cnt = int(ahead) if ahead.isdigit() else 0
        behind_cnt = int(behind) if behind.isdigit() else 0
        
        # Last commit info
        _, last_log, _ = run_git(["log", "-1", f"origin/{b}", "--format=%h|%an|%ae|%cd|%s"])
        parts = last_log.split("|") if last_log else ["-", "-", "-", "-", "-"]
        commit_hash, author_name, author_email, commit_date, commit_msg = parts[0], parts[1], parts[2], parts[3], parts[4]
        
        # PR check
        pr_info = get_pr_for_branch(b)
        
        dev_key, dev_info = identify_developer(b, author_email)
        
        issues = []
        if not pr_info:
            issues.append("❌ AUCUNE PULL REQUEST OUVERTE (Le travail n'est pas synchronisé avec l'équipe)")
        if behind_cnt >= 3:
            issues.append(f"⚠️ EN RETARD DE {behind_cnt} COMMITS SUR develop (Risque élevé de conflits)")
        if not b.startswith("feature/ECO-") and not b.startswith("fix/ECO-"):
            issues.append("⚠️ NON-RESPECT DE LA CONVENTION DE NOMMAGE (Attendu: feature/ECO-XX-...)")
            
        reports.append({
            "branch": b,
            "ahead": ahead_cnt,
            "behind": behind_cnt,
            "last_commit": commit_hash,
            "author": author_name,
            "email": author_email,
            "date": commit_date,
            "msg": commit_msg,
            "pr": pr_info,
            "dev_key": dev_key,
            "dev_info": dev_info,
            "issues": issues
        })
        
        print(f"🌿 Branche : {b}")
        print(f"   Assigné / Auteur : {author_name} <{author_email}>")
        print(f"   Statut vs develop : +{ahead_cnt} commits en avance | -{behind_cnt} commits en retard")
        if pr_info:
            print(f"   Pull Request : #{pr_info['number']} ({'Draft' if pr_info.get('isDraft') else 'Ouverte'}) - {pr_info['url']}")
        else:
            print("   Pull Request : ❌ Aucune PR trouvée sur GitHub !")
        
        if issues:
            print("   Anomalies détectées :")
            for isue in issues:
                print(f"     {isue}")
        else:
            print("   ✅ Branche 100% conforme et synchronisée.")
        print("-" * 80)
        
    return reports

def generate_alert_emails(reports):
    alerts = {}
    
    for r in reports:
        if not r["issues"] or not r["dev_info"]:
            continue
        dev_email = r["dev_info"]["email"]
        if dev_email not in alerts:
            alerts[dev_email] = {
                "name": r["dev_info"]["name"],
                "email": dev_email,
                "branches": []
            }
        alerts[dev_email]["branches"].append(r)
        
    email_payloads = []
    for email, data in alerts.items():
        name = data["name"]
        subject = f"[ECOTRACK V2] ⚠️ Alerte Synchronisation Git : Régularisation requise sur vos branches"
        
        body_lines = [
            f"Bonjour {name},",
            "",
            "En tant que Lead Developer et Scrum Master sur le projet ECOTRACK V2, je réalise un audit de traçabilité et de synchronisation des branches de notre dépôt officiel.",
            "",
            "L'audit automatisé a détecté des anomalies de gouvernance sur vos branches de travail :",
            ""
        ]
        
        for b in data["branches"]:
            body_lines.append(f"============================================================")
            body_lines.append(f"📌 BRANCHE : {b['branch']}")
            body_lines.append(f"============================================================")
            body_lines.append(f"- Dernier commit : {b['last_commit']} ({b['msg']})")
            body_lines.append(f"- Situation vs develop : +{b['ahead']} commits | -{b['behind']} commits de retard")
            body_lines.append(f"- Problèmes identifiés :")
            for iss in b["issues"]:
                body_lines.append(f"    * {iss}")
            body_lines.append("")
            body_lines.append("🛠️ ACTIONS OBLIGATOIRES À EXÉCUTER SUR VOTRE MACHINE :")
            
            # Generating specific git commands
            body_lines.append(f"1. Mettre à jour votre branche avec le code de l'équipe (develop) :")
            body_lines.append(f"   git checkout {b['branch']}")
            body_lines.append(f"   git fetch origin")
            body_lines.append(f"   git merge origin/develop")
            body_lines.append(f"   # Résoudre les éventuels conflits et tester")
            body_lines.append(f"   git push origin {b['branch']}")
            body_lines.append("")
            if not b["pr"]:
                body_lines.append(f"2. Ouvrir immédiatement une Draft Pull Request vers develop :")
                body_lines.append(f"   👉 Rendez-vous sur https://github.com/ADEM2005373/ECOTRACK/pull/new/{b['branch']}")
                body_lines.append(f"   👉 Base: develop  <--  Compare: {b['branch']}")
                body_lines.append(f"   👉 Cliquer sur la flèche verte et choisir 'Create Draft Pull Request'.")
                body_lines.append("")
                
        body_lines.extend([
            "RAPPEL DE GOUVERNANCE STRICT :",
            "1. La Pull Request est indispensable pour que toute l'équipe et le Lead Dev voient l'avancement en temps réel.",
            "2. Un ticket ne peut JAMAIS être marqué comme 'Terminé' sur Jira sans une PR validée par le Lead Dev.",
            "",
            "Merci de procéder à ces ajustements dès aujourd'hui.",
            "",
            "Cordialement,",
            "Adem Ouerhani",
            "Lead Developer & Scrum Master — ECOTRACK V2"
        ])
        
        email_payloads.append({
            "name": name,
            "email": email,
            "subject": subject,
            "body": "\n".join(body_lines)
        })
        
    return email_payloads

def send_emails(payloads):
    if not payloads:
        print("[INFO] Aucune alerte requise. Toutes les branches sont conformes.")
        return
        
    print(f"\n[*] Préparation de l'envoi de {len(payloads)} alertes SMTP...")
    app_pwd = STORED_APP_PWD.replace(" ", "").strip()
    
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, app_pwd)
        print(f"[AUTH OK] Authentification SMTP réussie pour {SENDER_EMAIL}")
    except Exception as e:
        print(f"[ERREUR SMTP] Impossible de se connecter au serveur Gmail : {e}", file=sys.stderr)
        return
        
    for p in payloads:
        print(f"[*] Envoi de l'alerte à {p['name']} <{p['email']}>...")
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg["To"] = p["email"]
            msg["Cc"] = SENDER_EMAIL
            msg["Subject"] = p["subject"]
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="ecotrack.local")
            
            msg.attach(MIMEText(p["body"], "plain", "utf-8"))
            
            recipients = [p["email"], SENDER_EMAIL]
            server.sendmail(SENDER_EMAIL, recipients, msg.as_string())
            print(f"    --> ✅ EMAIL ENVOYÉ À {p['email']} (avec copie Lead Dev) !")
        except Exception as err:
            print(f"    --> ❌ Erreur lors de l'envoi à {p['email']} : {err}", file=sys.stderr)
            
    server.quit()
    print("[TERMINE] Cycle d'alertes terminé avec succès.")

def main():
    reports = audit_synchronization()
    email_payloads = generate_alert_emails(reports)
    
    if "--alert" in sys.argv:
        send_emails(email_payloads)
    else:
        print("\n💡 MODE AUDIT UNIQUEMENT.")
        print(f"   {len(email_payloads)} développeur(s) ciblés par des alertes potentielles.")
        print("   Pour envoyer réellement les emails d'alerte, exécutez :")
        print("   python .agents/scripts/check_git_sync_and_alert.py --alert\n")

if __name__ == '__main__':
    main()
