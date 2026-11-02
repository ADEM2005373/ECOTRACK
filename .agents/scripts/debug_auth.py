import json

with open(r'C:\Users\MSI\AppData\Roaming\twg\auth-profiles.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for p in data.get("profiles", []):
    print("Profile name:", p.get("name"), "type:", p.get("type"))
    print("Keys in profile:", list(p.keys()))
    if "cloudId" in p:
        print("cloudId:", p.get("cloudId"))
    if "site" in p:
        print("site:", p.get("site"))
    if "oauth" in p:
        print("oauth keys:", list(p["oauth"].keys()))
        print("has access_token:", "access_token" in p["oauth"] or "accessToken" in p["oauth"])
