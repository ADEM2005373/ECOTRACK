import json
import urllib.request
from datetime import datetime, timezone, timedelta

with open(r'C:\Users\MSI\AppData\Roaming\twg\auth-profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

p = data["profiles"][0]
cloud_id = p["cloudId"]
prim = p.get("credentials", {}).get("primary", {})
token = prim.get("oauthAccessToken") or prim.get("token")

url = f'https://api.atlassian.com/ex/jira/{cloud_id}/rest/agile/1.0/sprint/69'

now = datetime.now(timezone.utc)
end = now + timedelta(days=14)

payload = {
    "state": "active",
    "startDate": now.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    "endDate": end.strftime("%Y-%m-%dT%H:%M:%S.000Z")
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"[SUCCESS] Sprint 69 started successfully! State: {res.get('state')}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    print(f"[HTTP {e.code}] Failed to update sprint: {err_body}")
except Exception as e:
    print(f"[ERROR] {e}")
