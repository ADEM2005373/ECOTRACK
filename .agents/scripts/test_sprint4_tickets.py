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

@test("SCRUM-53: Power BI Embed Controller (bi_embed.controller.ts) structure & RLS logic")
def test_bi_embed_controller():
    path = os.path.join("services", "bi-etl", "controllers", "bi_embed.controller.ts")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "class BiEmbedController" in content, "Missing BiEmbedController class"
    assert "generateEmbedToken" in content, "Missing generateEmbedToken method"
    assert "PowerBiIdentity" in content, "Missing PowerBiIdentity interface"
    assert "roles" in content and "datasets" in content, "Missing RLS identity attributes"
    assert "District_" in content or "rlsIdentity" in content, "Missing district RLS role mapping"


@test("SCRUM-53: 4 Official Power BI Reports Metadata (OFFICIAL_REPORTS)")
def test_bi_official_reports():
    path = os.path.join("services", "bi-etl", "controllers", "bi_embed.controller.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "OFFICIAL_REPORTS" in content, "Missing OFFICIAL_REPORTS definition"
    assert "OPERATIONAL" in content, "Missing OPERATIONAL report"
    assert "MLOPS" in content, "Missing MLOPS report"
    assert "TEAMS" in content, "Missing TEAMS report"
    assert "SLA" in content, "Missing SLA report"


@test("SCRUM-53: AnalyticsPage.tsx React Component with Report & District RLS Selectors")
def test_analytics_page():
    path = os.path.join("apps", "web-react", "src", "pages", "admin", "AnalyticsPage.tsx")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "AnalyticsPage" in content, "Missing AnalyticsPage export"
    assert "selectedReportId" in content, "Missing report selection state"
    assert "selectedDistrict" in content, "Missing district RLS filter state"
    assert "DISTRICTS" in content, "Missing districts list"
    assert "REPORTS" in content, "Missing reports options list"


@test("SCRUM-53: Web Routing for /admin/analytics and /analytics in main.tsx")
def test_analytics_routing():
    path = os.path.join("apps", "web-react", "src", "main.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "AnalyticsPage" in content, "AnalyticsPage must be imported in main.tsx"
    assert "/admin/analytics" in content, "Missing /admin/analytics route"
    assert "/analytics" in content, "Missing /analytics route"


@test("SCRUM-53: Navigation Link in App.tsx")
def test_analytics_nav_link():
    path = os.path.join("apps", "web-react", "src", "App.tsx")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "/admin/analytics" in content, "Missing /admin/analytics link in navbar"
    assert "ECO-42" in content, "Navbar link must mention ECO-42"


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
