"""
ECOTRACK Sprint 4 Automated Test Suite
Validates deliverables for:
- SCRUM-53 (ECO-42): Power BI Embed Token API & React Decision Container (US-10)
- SCRUM-52 (ECO-41): Anonymized CDC Pipeline (SHA-256) & Power BI DAX Model
- SCRUM-60 (ECO-40): T4 Resolution with Mandatory Completion Photo & Admin Reopen
- SCRUM-61 (ECO-43): AI/MLOps Concordance Tracker & Active Learning
"""

import sys
import os

TEST_RESULTS = []

def test(name):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            try:
                fn(*args, **kwargs)
                TEST_RESULTS.append({"name": name, "status": "PASS", "error": None})
                print(f"[PASS] {name}")
            except Exception as e:
                TEST_RESULTS.append({"name": name, "status": "FAIL", "error": str(e)})
                print(f"[FAIL] {name}: {e}")
        return wrapper
    return decorator


# ==============================================================================
# SCRUM-53 (ECO-42) TESTS: POWER BI EMBED TOKEN & REACT CONTAINER (US-10)
# ==============================================================================

def _read_eco42(*parts):
    path = os.path.join(*parts)
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


@test("SCRUM-53: bi-api embed controller (services/bi-api) with JWT check, fail-closed RLS & GenerateToken identities")
def test_bi_embed_controller():
    controller = _read_eco42("services", "bi-api", "src", "controllers", "bi-embed.controller.ts")
    assert "createEmbedTokenHandler" in controller, "Missing createEmbedTokenHandler"
    assert "verifyAccessToken" in controller, "The controller must verify the identity-api JWT"
    assert "rlsRolesFor" in controller and "buildEffectiveIdentity" in controller, "Missing RLS role mapping"
    assert "no-store" in controller, "Embed token response must be Cache-Control: no-store"
    rls = _read_eco42("services", "bi-api", "src", "rls.ts")
    assert "username" in rls and "roles" in rls and "datasets" in rls, "Missing RLS identity attributes"
    client = _read_eco42("services", "bi-api", "src", "powerbi", "powerbi-client.ts")
    assert "/GenerateToken" in client, "Missing Power BI GenerateToken call"
    assert "identities" in client, "GenerateToken body must carry RLS identities"
    assert "accessLevel:" not in client, "GenerateToken V2 must not send accessLevel"
    mock = os.path.join("services", "bi-etl", "controllers", "bi_embed.controller.ts")
    assert not os.path.exists(mock), f"Mock controller {mock} must be removed"


@test("SCRUM-53: 4 official reports server whitelist (REPORT_KEYS) mapped to env report IDs")
def test_bi_official_reports():
    content = _read_eco42("services", "bi-api", "src", "reports.ts")
    assert "REPORT_KEYS" in content, "Missing REPORT_KEYS whitelist"
    for key in ("operationnel", "mlops", "performance-equipes", "sla"):
        assert f"'{key}'" in content, f"Missing report key {key}"
    for env in ("OPERATIONNEL", "MLOPS", "PERFORMANCE_EQUIPES", "SLA"):
        assert f"POWERBI_REPORT_ID_{env}" in content, f"Missing env variable POWERBI_REPORT_ID_{env}"


@test("SCRUM-53: AnalyticsPage.tsx with the 4 report tabs and PowerBIEmbed (TokenType.Embed)")
def test_analytics_page():
    page = _read_eco42("apps", "web-react", "src", "pages", "admin", "AnalyticsPage.tsx")
    assert "export default function AnalyticsPage" in page, "Missing AnalyticsPage export"
    assert "ReportTabs" in page and "ReportEmbed" in page, "Missing report tabs or embed container"
    assert "selectedDistrict" not in page, "RLS scope must be decided server-side, not chosen in the browser"
    reports = _read_eco42("apps", "web-react", "src", "components", "analytics", "reports.ts")
    for label in ("Opérationnel", "MLOps", "Performance Équipes", "SLA"):
        assert label in reports, f"Missing report tab {label}"
    embed = _read_eco42("apps", "web-react", "src", "components", "analytics", "ReportEmbed.tsx")
    assert "PowerBIEmbed" in embed, "Missing PowerBIEmbed component"
    assert "models.TokenType.Embed" in embed, "Embed must use TokenType.Embed"
    assert "setAccessToken" in embed, "Missing embed token refresh"


@test("SCRUM-53: Web Routing for /admin/analytics in main.tsx")
def test_analytics_routing():
    content = _read_eco42("apps", "web-react", "src", "main.tsx")
    assert "import AnalyticsPage from './pages/admin/AnalyticsPage'" in content, "AnalyticsPage must be imported in main.tsx"
    assert '<Route path="/admin/analytics" element={<AnalyticsPage />} />' in content, "Missing /admin/analytics route"


@test("SCRUM-53: Navigation Link in App.tsx (Analytique / Décisionnel, ECO-42)")
def test_analytics_nav_link():
    app = _read_eco42("apps", "web-react", "src", "App.tsx")
    assert 'to="/admin/analytics"' in app, "Missing /admin/analytics link in navbar"
    assert "ANALYTICS_STRINGS.navLink" in app, "Navbar label must come from ANALYTICS_STRINGS.navLink"
    strings = _read_eco42("apps", "web-react", "src", "components", "analytics", "strings.fr.ts")
    assert "navLink: 'Analytique / Décisionnel (ECO-42)'" in strings, "Navbar link must read 'Analytique / Décisionnel (ECO-42)'"


# ==============================================================================
# MAIN TEST RUNNER
# ==============================================================================

if __name__ == "__main__":
    print("=" * 65)
    print("RUNNING ECOTRACK SPRINT 4 TEST SUITE (SCRUM-53 / ECO-42)")
    print("=" * 65)

    test_bi_embed_controller()
    test_bi_official_reports()
    test_analytics_page()
    test_analytics_routing()
    test_analytics_nav_link()

    passed = sum(1 for t in TEST_RESULTS if t["status"] == "PASS")
    total = len(TEST_RESULTS)

    print("=" * 65)
    print(f"SUMMARY: {passed}/{total} SPRINT 4 TESTS PASSED")
    print("=" * 65)

    if passed != total:
        sys.exit(1)
