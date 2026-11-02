"""
Assigns all ECOTRACK V2 tasks to their respective Sprint containers on Jira board 1.
"""

import subprocess
import time

SPRINT_ASSIGNMENTS = {
    # Sprint 0 - Socles V2 (ID: 106)
    106: ["SCRUM-38", "SCRUM-39", "SCRUM-40", "SCRUM-41"],
    # Sprint 1 - Fondations, Auth RB (ID: 68)
    68: ["SCRUM-42", "SCRUM-43", "SCRUM-44", "SCRUM-45"],
    # Sprint 2 - Carte Citoyenne 2ds (ID: 69)
    69: ["SCRUM-46", "SCRUM-47", "SCRUM-48", "SCRUM-49"],
    # Sprint 3 - Qualification IA Cô (ID: 70)
    70: ["SCRUM-50", "SCRUM-51"],
    # Sprint 5 - Stabilisation, Test (ID: 72)
    72: ["SCRUM-52", "SCRUM-53"],
}

print("--> Affectation des 16 tickets dans les conteneurs de Sprints Jira...")

for sprint_id, issues in SPRINT_ASSIGNMENTS.items():
    print(f"\n[Sprint ID: {sprint_id}] Affectation de {len(issues)} tickets : {', '.join(issues)}")
    for issue_key in issues:
        cmd = ["twg", "jira", "workitem", "update", "--id", issue_key, "--sprint", str(sprint_id), "-o", "json"]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode == 0:
            print(f"  [OK] {issue_key} -> Sprint {sprint_id}")
        else:
            print(f"  [ERROR] {issue_key} FAILED: {res.stderr.strip()}")
        time.sleep(0.5)

print("\n[SUCCESS] Tous les tickets ont ete places dans leurs Sprints respectifs !")
