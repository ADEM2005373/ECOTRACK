import json
import subprocess
import re

proc = subprocess.run(['twg', 'jira', 'workitem', 'query', '--jql', 'project = SCRUM ORDER BY key ASC', '-o', 'json'], capture_output=True, text=True, encoding='utf-8')
m = re.search(r'stdout:\s*"([^"]+)"', proc.stdout)
if m:
    with open(m.group(1).replace("\\\\", "\\"), encoding='utf-8') as f:
        data = json.load(f)
else:
    data = json.loads(proc.stdout)

issues = data.get('data', {}).get('issues', data.get('issues', []))
tasks = [i for i in issues if i.get('issueType', {}).get('name') != 'Epic']

print(f"Total tasks: {len(tasks)}")
pending = []
for t in tasks:
    status = t['status']['name']
    assignee = t.get('assignee', {}).get('displayName', 'Non assigné')
    key = t['key']
    summary = t['summary']
    if status in ['Revue en cours', 'In Review']:
        pending.append(t)
    print(f"{key} | {status:15} | {assignee:15} | {summary}")

print("\n" + "="*50)
print(f"PENDING FOR REVIEW ({len(pending)}):")
for p in pending:
    print(f"- {p['key']}: {p['summary']} (Assignee: {p.get('assignee', {}).get('displayName')})")
