#!/usr/bin/env python3
"""
ECOTRACK DevLead & Scrum Master Governance Tool
Strict Cross-Audit: Jira Workitems vs GitHub Commits & Branches
Identifies Phantom Deliveries (Fraud), Lead Substitutions, and Blockers.
"""

import sys
import subprocess
import json
import re
from datetime import datetime

# Enforce UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

ASSIGNEE_MAP = {
    'Adem Ouerhani': ['ouerhaniadem7@gmail.com', 'ouerhaniadem@djerba.r-iset.tn', 'ouerha'],
    'Hiba Dhouib': ['hibadhouib6@gmail.com', 'hibadh'],
    'sarahsou2016': ['sarah.sou2016@gmail.com', 'sarah-sahih'],
    'Ahmed Salah': ['ahmed.salah', 'ah-med-sal-ah']
}

def get_jira_issues():
    cmd = ['twg', 'jira', 'workitem', 'query', '--jql', 'project = SCRUM']
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', check=True)
        data = json.loads(res.stdout)
        return data.get('issues', [])
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
    
    fraud_count = 0
    valid_count = 0
    delayed_count = 0
    
    audit_results = []
    
    for i in sorted(issues, key=lambda x: int(x['key'].split('-')[1])):
        key = i.get('key')
        summary = i.get('summary')
        status = i.get('status', {}).get('name')
        assignee = i.get('assignee', {}).get('displayName', 'Non assigné')
        itype = i.get('issueType', {}).get('name')
        
        if itype == 'Epic':
            continue
            
        eco_match = re.search(r'ECO-\d+', summary)
        eco_tag = eco_match.group(0) if eco_match else None
        
        matched_commits = []
        for c in commits:
            if key in c['msg'] or (eco_tag and eco_tag in c['msg']):
                matched_commits.append(c)
                
        patterns = ASSIGNEE_MAP.get(assignee, [])
        has_own = any(any(p in c['email'].lower() or p in c['author'].lower() for p in patterns) for c in matched_commits)
        has_lead = any('ouerha' in c['email'].lower() or 'ouerha' in c['author'].lower() for c in matched_commits)
        
        verdict = "INCONNU"
        color_code = "WHITE"
        
        if status == 'Terminé(e)':
            if has_own:
                verdict = "🟢 CONFORME & LIVRÉ SUR GIT"
                valid_count += 1
            elif has_lead and assignee != 'Adem Ouerhani':
                verdict = "⚠️ SUBSTITUTION LEAD (Codé par Adem, non par l'assignee)"
                fraud_count += 1
            else:
                verdict = "🔴 FRAUDE / LIVRAISON FICTIVE (Terminé sur Jira, 0 commit sur Git)"
                fraud_count += 1
        elif status == 'En cours':
            if has_own:
                verdict = "🟡 EN COURS SUR GIT (Pushs actifs détectés)"
            else:
                verdict = "🟠 RETARD / ENGAGEMENT NON LIVRÉ (En cours Jira, 0 push Git)"
                delayed_count += 1
        else:
            verdict = "⚪ NON DÉMARRÉ (Backlog)"
            
        audit_results.append({
            'key': key,
            'summary': summary,
            'status': status,
            'assignee': assignee,
            'verdict': verdict,
            'matched': matched_commits
        })
        
        # Display critical ones
        if status in ['Terminé(e)', 'En cours']:
            print(f"[{key}] {assignee} -> Jira: {status}")
            print(f"  Statut Audit : {verdict}")
            if matched_commits:
                for mc in matched_commits:
                    print(f"    - Git {mc['hash']} by {mc['author']} <{mc['email']}> : {mc['msg'][:65]}")
            else:
                print("    - AUCUN COMMIT SUR TOUT LE HISTORIQUE GITHUB !")
            print("-" * 80)
            
    print("\n" + "=" * 80)
    print(f"BILAN AUDIT GOUVERNANCE :")
    print(f"  - Livraisons Conformes réelles : {valid_count}")
    print(f"  - Livraisons Fictives / Substitutions (Fraude) : {fraud_count}")
    print(f"  - Tickets 'En cours' sans code poussé : {delayed_count}")
    print("=" * 80)

if __name__ == '__main__':
    run_cross_audit()
