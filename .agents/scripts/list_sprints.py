import json
import urllib.request

with open(r'C:\Users\MSI\AppData\Roaming\twg\auth-profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

p = data["profiles"][0]
cloud_id = p["cloudId"]
prim = p.get("credentials", {}).get("primary", {})
token = prim.get("oauthAccessToken") or prim.get("token")

url = f'https://api.atlassian.com/ex/jira/{cloud_id}/rest/agile/1.0/board/1/sprint'
req = urllib.request.Request(url, headers={
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
})

with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    print(f"Total Sprints found: {len(res.get('values', []))}")
    for s in res.get('values', []):
        print(f"ID: {s['id']:<4} | State: {s['state']:<7} | Name: {s['name']}")
