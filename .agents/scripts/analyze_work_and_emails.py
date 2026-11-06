import json
import subprocess
import os
import sys

# 1. Load data.json
with open('dashboard/data.json', encoding='utf-8') as f:
    d = json.load(f)

print("=" * 70)
print("ASSIGNEES PROGRESS REPORT")
print("=" * 70)
for name, stats in d.get("assignees", {}).items():
    print(f"Assignee: {name}")
    print(f"  Total: {stats.get('total')} | Done: {stats.get('done')} | In Progress: {stats.get('in_progress')} | To Do: {stats.get('to_do')}")
    print(f"  Completion Rate: {stats.get('completion_rate')}%")

# 2. Check Jira users & emails using twg or Jira API
print("\n" + "=" * 70)
print("FETCHING TEAM MEMBER DETAILS & EMAILS")
print("=" * 70)

# Query Jira workitems raw to get full assignee objects including emails
r = subprocess.run(["twg", "jira", "workitem", "query", "--jql", "project = SCRUM", "-o", "json"], capture_output=True, text=True, encoding="utf-8")
team_emails = {}
if r.returncode == 0:
    import re
    m = re.search(r'stdout:\s*"([^"]+)"', r.stdout)
    data = None
    if m:
        tmp_path = m.group(1).replace("\\\\", "\\")
        if os.path.exists(tmp_path):
            with open(tmp_path, "r", encoding="utf-8") as f:
                data = json.load(f)
    if not data:
        try:
            data = json.loads(r.stdout)
        except:
            pass

    if data and "data" in data and "issues" in data["data"]:
        for item in data["data"]["issues"]:
            assignee = item.get("assignee")
            if assignee:
                name = assignee.get("displayName")
                email = assignee.get("emailAddress")
                acc_id = assignee.get("accountId")
                if name:
                    if name not in team_emails:
                        team_emails[name] = {"email": email, "accountId": acc_id}
                    elif email and not team_emails[name].get("email"):
                        team_emails[name]["email"] = email

print("Discovered team members & emails:")
for name, info in team_emails.items():
    print(f"  {name} -> Email: {info.get('email')} | AccountId: {info.get('accountId')}")

# 3. Check Sprints and Deadlines
print("\n" + "=" * 70)
print("SPRINT DATES & DEADLINES ANALYSIS")
print("=" * 70)
r_sprints = subprocess.run(["twg", "jira", "board", "sprints", "query", "--board-id", "1"], capture_output=True, text=True, encoding="utf-8")
sprints_info = {}
try:
    s_json = json.loads(r_sprints.stdout)
    for s in s_json.get("sprints", []):
        sprints_info[s.get("id")] = {
            "name": s.get("name"),
            "state": s.get("state"),
            "startDate": s.get("startDate"),
            "endDate": s.get("endDate"),
            "goal": s.get("goal")
        }
        print(f"Sprint {s.get('id')} ({s.get('state')}): '{s.get('name')}'")
        print(f"  Start: {s.get('startDate')} | End: {s.get('endDate')}")
except Exception as e:
    print(f"Failed to parse sprints: {e}")

# 4. Map which tickets are in active sprint, their deadlines, critical priority
print("\n" + "=" * 70)
print("CRITICAL & OVERDUE ISSUES BREAKDOWN")
print("=" * 70)

# Check each sprint's workitems
for sid in [68, 69, 70, 71, 72, 106]:
    s_meta = sprints_info.get(sid, {})
    s_name = s_meta.get("name", f"Sprint {sid}")
    s_state = s_meta.get("state", "unknown")
    s_end = s_meta.get("endDate", "N/A")
    
    r_w = subprocess.run(["twg", "jira", "sprint", "workitems", "query", "--id", str(sid)], capture_output=True, text=True, encoding="utf-8")
    try:
        w_json = json.loads(r_w.stdout)
        issues = w_json.get("issues", [])
        print(f"\n--- {s_name} (ID: {sid}, State: {s_state}, Deadline: {s_end}) ---")
        for iss in issues:
            k = iss.get("key")
            fields = iss.get("fields", {})
            summary = fields.get("summary", "")
            prio = fields.get("priority", {}).get("name", "Medium")
            status = fields.get("status", {}).get("name", "Unknown")
            assignee = fields.get("assignee", {})
            a_name = assignee.get("displayName", "Unassigned") if assignee else "Unassigned"
            a_email = assignee.get("emailAddress", "No email") if assignee else "No email"
            print(f"  {k} [{prio}] - {status} - Assignee: {a_name} ({a_email}) - {summary[:50]}")
    except Exception as e:
        print(f"Error querying sprint {sid}: {e}")
