import json
import urllib.request

with open(r'C:\Users\MSI\AppData\Roaming\twg\auth-profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

p = data["profiles"][0]
cloud_id = p["cloudId"]
prim = p.get("credentials", {}).get("primary", {})
token = prim.get("oauthAccessToken") or prim.get("token")

url = f'https://api.atlassian.com/ex/jira/{cloud_id}/rest/agile/1.0/board/1/sprint'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    for s in res.get('values', []):
        s_id = s['id']
        s_name = s['name']
        s_state = s['state']
        
        # Get issues in this sprint
        url_iss = f'https://api.atlassian.com/ex/jira/{cloud_id}/rest/agile/1.0/sprint/{s_id}/issue'
        req_iss = urllib.request.Request(url_iss, headers={'Authorization': f'Bearer {token}', 'Accept': 'application/json'})
        try:
            with urllib.request.urlopen(req_iss) as r_iss:
                d_iss = json.loads(r_iss.read().decode('utf-8'))
                keys = [i['key'] for i in d_iss.get('issues', [])]
                print(f"Sprint [{s_id}] '{s_name}' ({s_state}) -> {len(keys)} tickets: {keys}")
        except Exception as e:
            print(f"Sprint [{s_id}] '{s_name}' error: {e}")
