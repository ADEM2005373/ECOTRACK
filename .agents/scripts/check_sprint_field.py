import json
import urllib.request

with open(r'C:\Users\MSI\AppData\Roaming\twg\auth-profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

p = data["profiles"][0]
cloud_id = p["cloudId"]
prim = p.get("credentials", {}).get("primary", {})
token = prim.get("oauthAccessToken") or prim.get("token")

for key in ["SCRUM-62", "SCRUM-63", "SCRUM-64", "SCRUM-65"]:
    url = f'https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue/{key}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        sp = res.get('fields', {}).get('customfield_10020')
        print(key, "Sprint field (customfield_10020):", sp)
