#!/usr/bin/env python3
"""
ECOTRACK DevLead & Scrum Master Governance Tool
Strict Cross-Audit: Jira Workitems vs GitHub Commits & Branches
Identifies Phantom Deliveries (Fraud), Lead Substitutions, and Blockers.
"""

import sys
import os
import subprocess
import json
import re
from datetime import datetime

# Enforce UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

ASSIGNEE_MAP = {
    'Adem Ouerhani': ['ouerhaniadem7@gmail.com', 'ouerhaniadem@djerba.r-iset.tn', 'ouerha'],
    'Hiba Dhouib': ['hibadhouib6@gmail.com', 'hibadh'],
    'sarahsou2016': ['sarah.sou2016@gmail.com', 'sarah-sahih', 'sara shih'],
    'sara sahih': ['sarah.sou2016@gmail.com', 'sarah-sahih', 'sara shih'],
    'Ahmed Salah': ['ahmed.salah', 'ah-med-sal-ah']
}

TICKET_COMMIT_ALIASES = {
    'SCRUM-38': ['ECO-01', 'SCRUM-38', 'monorepo', 'docker-compose'],
    'SCRUM-39': ['ECO-02', 'SCRUM-39', 'mobile', 'expo', 'design tokens', 'interactive prototype'],
    'SCRUM-40': ['ECO-03', 'SCRUM-40', 'fastapi', 'ai-vision'],
    'SCRUM-41': ['ECO-04', 'SCRUM-41', 'react vite', 'web-react', 'tailwind'],
    'SCRUM-42': ['ECO-11', 'SCRUM-42', 'mongoose', 'argon2id', 'user schema'],
    'SCRUM-43': ['ECO-12', 'SCRUM-43', 'auth/register', 'register route'],
    'SCRUM-44': ['ECO-13', 'SCRUM-44', 'mobile registration'],
    'SCRUM-45': ['ECO-14', 'SCRUM-45', 'rs256', 'login route', 'token service', 'rate-limiter'],
    'SCRUM-46': ['ECO-20', 'SCRUM-46', 'report schema', '2dsphere'],
    'SCRUM-47': ['ECO-21', 'SCRUM-47', 'media-api', 'sharp', 'exif'],
    'SCRUM-48': ['ECO-22', 'SCRUM-48', 'classification route'],
    'SCRUM-49': ['ECO-23', 'SCRUM-49', 'report.created', 'report-api', 'spatial engine'],
    'SCRUM-55': ['ECO-05', 'SCRUM-55', 'star schema', 'postgresql', 'schéma en étoile'],
    'SCRUM-56': ['ECO-15', 'SCRUM-56', 'auditlogs', 'rgpd'],
}

def get_jira_issues():
    cmd = ['twg', 'jira', 'workitem', 'query', '--jql', 'project = SCRUM ORDER BY created ASC', '-o', 'json']
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        m = re.search(r'stdout:\s*"([^"]+)"', res.stdout)
        if m:
            tmp_path = m.group(1).replace("\\\\", "\\")
            if os.path.exists(tmp_path):
                with open(tmp_path, "r", encoding="utf-8") as f:
                    d = json.load(f)
                    return d.get('data', {}).get('issues', [])
        d = json.loads(res.stdout)
        return d.get('data', {}).get('issues', []) or d.get('issues', [])
    except Exception as e:
        print(f"[ERROR] Failed to query Jira: {e}", file=sys.stderr)
        return []

def get_git_commits():
    cmd = ['git', 'log', '--all', '--format=%h|%an|%ae|%s']
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', check=True)
        raw_commits = [line.split('|', 3) for line in res.stdout.strip().splitlines() if line]
        return [{'hash': c[0], 'author': c[1], 'email': c[2], 'msg': c[3]} for c in raw_commits]
    except Exception as e:
        print(f"[ERROR] Failed to read Git commits: {e}", file=sys.stderr)
        return []

def run_cross_audit():
    issues = get_jira_issues()
    commits = get_git_commits()
    
    print("================================================================================")
    print("  ECOTRACK V2 - AUDIT GOUVERNANCE DEV LEAD : JIRA vs GITHUB COMMIT TRACKING")
    print(f"  Horodatage : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Règle : No Push = No Done")
    print("================================================================================\n")
    
    substitution_count = 0
    valid_count = 0
    untracked_count = 0
    delayed_count = 0
    
    for i in sorted(issues, key=lambda x: int(x['key'].split('-')[1])):
        key = i.get('key')
        summary = i.get('summary')
        status = i.get('status', {}).get('name')
        assignee = i.get('assignee', {}).get('displayName', 'Non assigné')
        itype = (i.get('issueType') or i.get('issuetype') or {}).get('name')
        
        if itype == 'Epic':
            continue
            
        eco_match = re.search(r'ECO-\d+', summary)
        eco_tag = eco_match.group(0) if eco_match else None
        aliases = TICKET_COMMIT_ALIASES.get(key, [])
        if eco_tag and eco_tag not in aliases:
            aliases.append(eco_tag)
        if key not in aliases:
            aliases.append(key)
        
        matched_commits = []
        for c in commits:
            msg_lower = c['msg'].lower()
            if any(a.lower() in msg_lower for a in aliases):
                matched_commits.append(c)
                
        patterns = ASSIGNEE_MAP.get(assignee, [])
        has_own = any(any(p in c['email'].lower() or p in c['author'].lower() for p in patterns) for c in matched_commits)
        has_lead = any('ouerha' in c['email'].lower() or 'ouerha' in c['author'].lower() for c in matched_commits)
        
        verdict = "INCONNU"
        
        if status == 'Terminé(e)':
            if has_own:
                verdict = "🟢 CONFORME & LIVRÉ SUR GIT (Auteur assigné vérifié)"
                valid_count += 1
            elif has_lead and assignee != 'Adem Ouerhani':
                verdict = "⚠️ SUBSTITUTION LEAD / PAIR PROGRAMMING (Committé/intégré par le Lead Dev Adem)"
                substitution_count += 1
            elif matched_commits:
                verdict = "🟢 CONFORME & LIVRÉ SUR GIT (Commit identifié)"
                valid_count += 1
            else:
                verdict = "🔴 LIVRAISON FICTIVE (Terminé sur Jira, 0 commit sur Git)"
                untracked_count += 1
        elif status == 'En cours':
            if has_own or has_lead:
                verdict = "🟡 EN COURS SUR GIT (Commits actifs détectés)"
            else:
                verdict = "🟠 EN ATTENTE DE COMMITS GIT (Ticket en cours sur Jira)"
                delayed_count += 1
        else:
            verdict = "⚪ NON DÉMARRÉ (Backlog)"
            
        # Display critical ones
        if status in ['Terminé(e)', 'En cours']:
            print(f"[{key}] {assignee} -> Jira: {status}")
            print(f"  Statut Audit : {verdict}")
            if matched_commits:
                for mc in matched_commits[:3]:
                    print(f"    - Git {mc['hash']} by {mc['author']} <{mc['email']}> : {mc['msg'][:65]}")
            else:
                print("    - AUCUN COMMIT RETROUVÉ DANS L'HISTORIQUE GIT !")
            print("-" * 80)
            
    print("\n" + "=" * 80)
    print(f"BILAN AUDIT GOUVERNANCE DEVLEAD / SCRUM MASTER :")
    print(f"  - Livraisons Directes Conformes (Par Assigné) : {valid_count}")
    print(f"  - Livraisons Intégrées / Pair-Programmed par Lead : {substitution_count}")
    print(f"  - Livraisons Fictives (Zéro Code) : {untracked_count}")
    print(f"  - Tickets 'En cours' en attente de commit : {delayed_count}")
    print("=" * 80)

if __name__ == '__main__':
    run_cross_audit()
