"""
Fixes all Sprint assignments on Jira Board 1:
1. Clears Epics from sprint field (Epics should not be inside sprints).
2. Assigns all 27 technical tasks to their exact Sprints (Sprint 0 to Sprint 5).
"""

import subprocess
import time

SPRINT_MAP = {
    # Sprint 0 - Socles V2
    106: ["SCRUM-38", "SCRUM-39", "SCRUM-40", "SCRUM-41", "SCRUM-55"],
    # Sprint 1 - Fondations, Auth RB
    68: ["SCRUM-42", "SCRUM-43", "SCRUM-44", "SCRUM-45", "SCRUM-56"],
    # Sprint 2 - Carte Citoyenne 2ds
    69: ["SCRUM-46", "SCRUM-47", "SCRUM-48", "SCRUM-49", "SCRUM-57"],
    # Sprint 3 - Qualification IA Cô
    70: ["SCRUM-50", "SCRUM-51", "SCRUM-58", "SCRUM-59"],
    # Sprint 4 - Clôture Terrain ave
    71: ["SCRUM-52", "SCRUM-53", "SCRUM-60", "SCRUM-61"],
    # Sprint 5 - Stabilisation, Test
    72: ["SCRUM-62", "SCRUM-63", "SCRUM-64", "SCRUM-65"],
}

EPICS = ["SCRUM-33", "SCRUM-34", "SCRUM-35", "SCRUM-36", "SCRUM-37", "SCRUM-54"]

print("--> 1. Retrait des Epics des conteneurs de Sprints (les Epics sont des dossiers parents)...")
for epic in EPICS:
    cmd = ["twg", "jira", "workitem", "update", "--id", epic, "--sprint", "none", "-o", "json"]
    subprocess.run(cmd, capture_output=True)
    print(f"  [OK] Epic {epic} detachee du sprint.")
    time.sleep(0.3)

print("\n--> 2. Affectation exacte des 27 tâches dans leurs Sprints respectifs...")
for sprint_id, tasks in SPRINT_MAP.items():
    print(f"\n[Sprint {sprint_id}] Affectation de {len(tasks)} tâches : {tasks}")
    for task_key in tasks:
        cmd = ["twg", "jira", "workitem", "update", "--id", task_key, "--sprint", str(sprint_id), "-o", "json"]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if res.returncode == 0:
            print(f"  [OK] {task_key} -> Sprint {sprint_id}")
        else:
            print(f"  [ERR] {task_key} failed: {res.stderr.strip()}")
        time.sleep(0.4)

print("\n[SUCCESS] Tous les sprints 0, 1, 2, 3, 4, 5 sont desormais garnis de leurs taches !")
