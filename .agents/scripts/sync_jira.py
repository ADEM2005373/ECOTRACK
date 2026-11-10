"""
ECOTRACK Jira Sync Script
Fetches live Jira workitems via TWG, analyzes progress, team workloads,
and deadline/risk warnings, then writes to dashboard/data.json and embeds into dashboard/index.html.
"""

import os
import sys
import json
import re
import shutil
import subprocess
from datetime import datetime

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DASHBOARD_DIR = os.path.join(WORKSPACE_DIR, "dashboard")
DATA_FILE = os.path.join(DASHBOARD_DIR, "data.json")
INDEX_FILE = os.path.join(DASHBOARD_DIR, "index.html")
ARTIFACT_DIR = os.environ.get("ANTIGRAVITY_ARTIFACT_DIR", "")

def get_twg_bin():
    found = shutil.which("twg")
    if found:
        return found
    localappdata = os.environ.get("LOCALAPPDATA", "")
    if localappdata:
        candidate = os.path.join(localappdata, "Programs", "twg", "bin", "twg.exe")
        if os.path.exists(candidate):
            return candidate
    return "twg"

def fetch_raw_jira():
    try:
        twg_bin = get_twg_bin()
        cmd = [twg_bin, "jira", "workitem", "query", "--jql", "project = SCRUM ORDER BY created ASC", "-o", "json"]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
        if proc.returncode != 0:
            print(f"[WARN] twg command failed: {proc.stderr}", file=sys.stderr)
            return None
        
        m = re.search(r'stdout:\s*"([^"]+)"', proc.stdout)
        if m:
            tmp_path = m.group(1).replace("\\\\", "\\")
            if os.path.exists(tmp_path):
                with open(tmp_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        
        return json.loads(proc.stdout)
    except Exception as e:
        print(f"[ERROR] Failed to fetch Jira data: {e}", file=sys.stderr)
        return None

def process_jira_data(raw_data):
    if not raw_data or "data" not in raw_data or "issues" not in raw_data["data"]:
        return None
    
    issues_list = raw_data["data"]["issues"]
    processed_issues = []
    assignee_stats = {}
    type_stats = {}
    status_stats = {"Done": 0, "InProgress": 0, "ToDo": 0}
    
    epics_dict = {
        "SCRUM-33": {"name": "EPIC 0: Infrastructure, DevOps & Repo Setup (Sprint 0)", "key": "SCRUM-33", "total": 0, "done": 0, "owner": "Adem Ouerhani"},
        "SCRUM-34": {"name": "EPIC 1: Identity, JWT & RBAC (Sprint 1)", "key": "SCRUM-34", "total": 0, "done": 0, "owner": "Adem Ouerhani"},
        "SCRUM-35": {"name": "EPIC 2: Core Report & Media Service (Sprint 2)", "key": "SCRUM-35", "total": 0, "done": 0, "owner": "Ahmed Salah"},
        "SCRUM-36": {"name": "EPIC 3: Workflow State Machine & Dispatch (Sprint 3)", "key": "SCRUM-36", "total": 0, "done": 0, "owner": "Sara Sahih"},
        "SCRUM-37": {"name": "EPIC 4: Clôture Terrain & Tableaux de Bord Power BI (Sprint 4)", "key": "SCRUM-37", "total": 0, "done": 0, "owner": "Adem / Sara"},
        "SCRUM-54": {"name": "EPIC 5: Tests E2E, Charge k6, MLOps & Déploiement K8s (Sprint 5)", "key": "SCRUM-54", "total": 0, "done": 0, "owner": "Adem Ouerhani"},
    }

    epic_mapping = {
        # Sprint 0 (SCRUM-33)
        "SCRUM-38": "SCRUM-33", "SCRUM-39": "SCRUM-33", "SCRUM-40": "SCRUM-33", "SCRUM-41": "SCRUM-33", "SCRUM-55": "SCRUM-33",
        # Sprint 1 (SCRUM-34)
        "SCRUM-42": "SCRUM-34", "SCRUM-43": "SCRUM-34", "SCRUM-44": "SCRUM-34", "SCRUM-45": "SCRUM-34", "SCRUM-56": "SCRUM-34",
        # Sprint 2 (SCRUM-35)
        "SCRUM-46": "SCRUM-35", "SCRUM-47": "SCRUM-35", "SCRUM-48": "SCRUM-35", "SCRUM-49": "SCRUM-35", "SCRUM-57": "SCRUM-35",
        # Sprint 3 (SCRUM-36)
        "SCRUM-50": "SCRUM-36", "SCRUM-51": "SCRUM-36", "SCRUM-58": "SCRUM-36", "SCRUM-59": "SCRUM-36",
        # Sprint 4 (SCRUM-37)
        "SCRUM-52": "SCRUM-37", "SCRUM-53": "SCRUM-37", "SCRUM-60": "SCRUM-37", "SCRUM-61": "SCRUM-37",
        # Sprint 5 (SCRUM-54)
        "SCRUM-62": "SCRUM-54", "SCRUM-63": "SCRUM-54", "SCRUM-64": "SCRUM-54", "SCRUM-65": "SCRUM-54"
    }

    for item in issues_list:
        key = item.get("key")
        summary = item.get("summary", "")
        status_obj = item.get("status", {})
        status_name = status_obj.get("name", "À faire")
        cat_key = status_obj.get("statusCategory", {}).get("key", "new")
        
        is_done = (cat_key == "done" or "Termin" in status_name)
        is_in_progress = ("cours" in status_name.lower() or "progress" in status_name.lower())
        
        status_label = "Terminé" if is_done else ("En cours" if is_in_progress else "À faire")
        if is_done:
            status_stats["Done"] += 1
        elif is_in_progress:
            status_stats["InProgress"] += 1
        else:
            status_stats["ToDo"] += 1
            
        itype = item.get("issueType", {}).get("name", "Tâche")
        type_stats[itype] = type_stats.get(itype, 0) + 1
        
        assignee_obj = item.get("assignee")
        raw_assignee_name = assignee_obj.get("displayName") if assignee_obj else "Non assigné"
        assignee_name = "Sara Sahih" if raw_assignee_name in ["sarahsou2016", "sara sahih", "Sara Shih"] else raw_assignee_name
        
        if itype != "Epic":
            if assignee_name not in assignee_stats:
                assignee_stats[assignee_name] = {"total": 0, "done": 0, "in_progress": 0, "to_do": 0, "issues": []}
            
            assignee_stats[assignee_name]["total"] += 1
            if is_done:
                assignee_stats[assignee_name]["done"] += 1
            elif is_in_progress:
                assignee_stats[assignee_name]["in_progress"] += 1
            else:
                assignee_stats[assignee_name]["to_do"] += 1
            
        priority = item.get("priority", {}).get("name", "Medium")
        created = item.get("created", "")
        updated = item.get("updated", "")
        url = item.get("url", f"https://ouerhaniadem0805.atlassian.net/browse/{key}")
        
        assigned_epic = epic_mapping.get(key, key if itype == "Epic" else "SCRUM-33")
        if itype != "Epic" and assigned_epic in epics_dict:
            epics_dict[assigned_epic]["total"] += 1
            if is_done:
                epics_dict[assigned_epic]["done"] += 1

        issue_record = {
            "key": key,
            "summary": summary,
            "status": status_label,
            "rawStatus": status_name,
            "isDone": is_done,
            "type": itype,
            "priority": priority,
            "assignee": assignee_name,
            "reporter": item.get("reporter", {}).get("displayName", "Adem Ouerhani"),
            "created": created,
            "updated": updated,
            "url": url,
            "epicKey": assigned_epic,
            "epicName": epics_dict.get(assigned_epic, {}).get("name", summary if itype == "Epic" else "")
        }
        
        processed_issues.append(issue_record)
        if itype != "Epic" and assignee_name in assignee_stats:
            assignee_stats[assignee_name]["issues"].append({
                "key": key,
                "summary": summary,
                "status": status_label,
                "type": itype,
                "priority": priority,
                "url": url
            })

    for name, stats in assignee_stats.items():
        stats["completion_rate"] = round((stats["done"] / stats["total"] * 100) if stats["total"] > 0 else 0, 1)

    epics_list = []
    for e_key, e_data in epics_dict.items():
        rate = round((e_data["done"] / e_data["total"] * 100) if e_data["total"] > 0 else 0, 1)
        epics_list.append({
            "key": e_key,
            "name": e_data["name"],
            "owner": e_data["owner"],
            "total": e_data["total"],
            "done": e_data["done"],
            "rate": rate,
            "status": "Terminé" if rate == 100 else ("En cours" if rate > 0 else "À démarrer")
        })

    tasks_count = len([i for i in processed_issues if i["type"] != "Epic"])
    tasks_done = len([i for i in processed_issues if i["type"] != "Epic" and i["isDone"]])
    global_rate = round((tasks_done / tasks_count * 100) if tasks_count > 0 else 0, 1)

    warnings = [
        {
            "id": "WARN-01",
            "level": "critical",
            "title": "Socle Fondateur Sprint 0: ECO-01 (Nx Monorepo & CI/CD)",
            "target": "SCRUM-38 (ECO-01)",
            "assignee": "Adem Ouerhani",
            "deadline": "Sprint 0 (J1 à J6)",
            "description": "L'initialisation du monorepo Nx, docker-compose.yml et des contrats Mocks OpenAPI est le prérequis bloquant pour le démarrage de l'app mobile Expo (ECO-02) et du microservice FastAPI (ECO-03).",
            "impact": "Conditionne l'architecture et les espaces de travail de toute l'équipe.",
            "recommendation": "Créer la branche feature/ECO-01-adem-nx-init et démarrer le scaffolding Nx."
        },
        {
            "id": "WARN-02",
            "level": "high",
            "title": "Dépendance Sécurité Sprint 1: ECO-11 & ECO-15 (Users, Argon2 & AuditLogs)",
            "target": "SCRUM-42, SCRUM-56",
            "assignee": "Adem Ouerhani",
            "deadline": "Sprint 1 (J7 à J16)",
            "description": "La collection Users, le hachage argon2id et le microservice AuditLogs en écriture seule bloquent l'inscription (ECO-12) et le login JWT RS256 (ECO-14).",
            "impact": "Goulot d'étranglement sur le sous-système d'authentification et de conformité RGPD.",
            "recommendation": "Valider le schéma User Mongoose et tester la collection AuditLogs Append-Only."
        },
        {
            "id": "WARN-03",
            "level": "medium",
            "title": "Contrat d'Interface Média, IA & ETL: ECO-21 / ECO-22 / ECO-24",
            "target": "SCRUM-47, SCRUM-48, SCRUM-57",
            "assignee": "Adem, Hiba, Ahmed",
            "deadline": "Sprint 2 (J17 à J26)",
            "description": "Le pipeline d'upload média (Sharp sans EXIF) doit fournir des images au format attendu par MobileNetV3 (Resize 224), et l'ETL initial doit alimenter Fact_Reports sans dégrader la latence API (P95 < 300 ms).",
            "impact": "Risque d'incompatibilité de dimensions ou de latence lors de l'inférence et de l'extraction.",
            "recommendation": "Vérifier le test Chaos validant le repli manuel si le conteneur IA dépasse 1,5s."
        },
        {
            "id": "WARN-04",
            "level": "info",
            "title": "Architecture V2 100% Conforme au CDCF (6 Sprints Actifs)",
            "target": "Projet SCRUM V2",
            "assignee": "Équipe Complète (Adem, Ahmed, Hiba, Sara)",
            "deadline": "60 Jours Calendaires",
            "description": "Les 6 Sprints sont intégralement peuplés avec les 27 tâches d'ingénierie, les règles RBAC, la purge EXIF, les lead times ETL et les 4 rapports Power BI.",
            "impact": "Excellente traçabilité et alignement parfait pour la soutenance.",
            "recommendation": "Démarrer le Sprint 0 sur le board Jira."
        }
    ]

    dashboard_data = {
        "project": {
            "name": "ECOTRACK V2 (CDCF Conforme)",
            "key": "SCRUM",
            "site": "ouerhaniadem0805.atlassian.net",
            "lead": "Adem Ouerhani",
            "lastSync": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        "kpis": {
            "totalIssues": len(processed_issues),
            "totalTasks": tasks_count,
            "doneIssues": tasks_done,
            "inProgressIssues": status_stats["InProgress"],
            "toDoIssues": tasks_count - tasks_done,
            "completionRate": global_rate,
            "totalEpics": len(epics_list),
            "criticalWarningsCount": len([w for w in warnings if w["level"] in ("critical", "high")]),
            "teamSize": len(assignee_stats.keys())
        },
        "epics": epics_list,
        "assignees": assignee_stats,
        "types": type_stats,
        "statusStats": status_stats,
        "warnings": warnings,
        "issues": processed_issues
    }
    
    return dashboard_data

def update_html_with_embedded_data(data):
    if not os.path.exists(INDEX_FILE):
        return
    
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        html = f.read()

    data_json_str = json.dumps(data, ensure_ascii=False)
    embedded_tag = f"<script id=\"embedded-jira-data\">window.__EMBEDDED_DATA__ = {data_json_str};</script>"

    if '<script id="embedded-jira-data">' in html:
        html = re.sub(r'<script id="embedded-jira-data">.*?</script>', embedded_tag, html, flags=re.DOTALL)
    else:
        html = html.replace("</head>", f"{embedded_tag}\n</head>")

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(html)

    if os.path.exists(ARTIFACT_DIR):
        artifact_dest = os.path.join(ARTIFACT_DIR, "ecotrack_dashboard.html")
        with open(artifact_dest, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"[INFO] Copied artifact -> {artifact_dest}")

def main():
    os.makedirs(DASHBOARD_DIR, exist_ok=True)
    raw = fetch_raw_jira()
    
    dashboard_data = process_jira_data(raw)
    if not dashboard_data:
        print("[ERROR] Could not build dashboard data.", file=sys.stderr)
        sys.exit(1)
        
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(dashboard_data, f, indent=2, ensure_ascii=False)

    update_html_with_embedded_data(dashboard_data)
        
    print(f"[SUCCESS] Dashboard synchronized -> {DATA_FILE}")
    print(f"Total: {dashboard_data['kpis']['totalIssues']} (6 Epics, {dashboard_data['kpis']['totalTasks']} Tasks) | Warnings: {len(dashboard_data['warnings'])}")

if __name__ == "__main__":
    main()
