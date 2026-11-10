import json

with open("dashboard/data.json", encoding="utf-8") as f:
    data = json.load(f)

print("=======================================================")
print(f"PROJECT: {data['project']['name']}")
print(f"Total: {data['kpis']['totalTasks']} Tasks across {data['kpis']['totalEpics']} Epics")
print(f"Done: {data['kpis']['doneIssues']} | In Progress: {data['kpis']['inProgressIssues']} | To Do: {data['kpis']['toDoIssues']}")
print(f"Global Completion Rate: {data['kpis']['completionRate']}%")
print("=======================================================")

print("\n--- EPICS BREAKDOWN ---")
for ep in data["epics"]:
    print(f"{ep['key']} | {ep['name']} | Done: {ep['done']}/{ep['total']} ({ep['rate']}%) | Owner: {ep['owner']}")

print("\n--- TEAM MEMBERS PROGRESS ---")
for member, stats in data["assignees"].items():
    print(f"\n{member} (Completion: {stats['completion_rate']}%, Done: {stats['done']}, InProg: {stats['in_progress']}, ToDo: {stats['to_do']}):")
    for iss in stats["issues"]:
        print(f"  [{iss['status']}] {iss['key']}: {iss['summary']}")

print("\n--- DETAILED TASK LIST BY STATUS ---")
for iss in data["issues"]:
    if iss.get("type") != "Epic":
        print(f"{iss['key']} | {iss.get('epicKey','--')} | {iss['status']:<11} | {str(iss.get('assignee')):<15} | {iss['summary']}")
