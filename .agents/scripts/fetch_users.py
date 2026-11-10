import json
import urllib.request
import os

with open(r'C:\Users\MSI\AppData\Roaming\twg\auth-profiles.json', encoding='utf-8') as f:
    d = json.load(f)

p = d.get('profiles', [])[0]
prim = p.get('credentials', {}).get('primary', {})
token = prim.get('oauthAccessToken')
cloud_id = prim.get('cloudId')

url = f'https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/user/assignable/search?project=SCRUM'
req = urllib.request.Request(url, headers={
    'Authorization': f'Bearer {token}',
    'Accept': 'application/json'
})

try:
    with urllib.request.urlopen(req) as resp:
        users = json.loads(resp.read().decode('utf-8'))
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"Name: {u.get('displayName')} | Email: {u.get('emailAddress')} | AccountId: {u.get('accountId')}")
except Exception as e:
    print(f"Error: {e}")
