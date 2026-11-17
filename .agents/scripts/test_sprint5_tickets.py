"""
ECOTRACK Sprint 5 Automated Test Suite
Validates deliverables for:
- SCRUM-62 (ECO-50): k6 Load Tests & Resilience Chaos Testing (NFR-01 P95 < 300ms)
- SCRUM-65 (ECO-53): Kubernetes HPA Deployment, 500 Realistic Seeds & Soutenance Runbook (NFR-04)
"""

import sys
import os
import json
import yaml

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
# SCRUM-62 (ECO-50) TESTS: k6 LOAD & CHAOS TESTING (NFR-01)
# ==============================================================================

@test("SCRUM-62: k6 Load Test Script (load_test_reports.js) structure & imports")
def test_k6_load_script_structure():
    path = os.path.join("tests", "k6", "load_test_reports.js")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "import http from 'k6/http';" in content, "Missing k6/http import"
    assert "import { check, group, sleep } from 'k6';" in content, "Missing k6 check/group/sleep import"
    assert "export const options" in content, "Missing k6 options export"
    assert "export default function" in content, "Missing k6 default function"


@test("SCRUM-62: k6 Ramping Stages (0-50 VUs in 30s, 100 VUs for 2m, rampdown 30s)")
def test_k6_ramping_stages():
    path = os.path.join("tests", "k6", "load_test_reports.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "target: 50" in content, "Missing 50 VUs ramp-up stage"
    assert "target: 100" in content, "Missing 100 VUs sustained stage"
    assert "target: 0" in content, "Missing ramp-down to 0 stage"
    assert "'30s'" in content, "Missing 30s stage duration"
    assert "'2m'" in content, "Missing 2m stage duration"


@test("SCRUM-62: Strict NFR-01 Latency & Error Thresholds (p(95)<300 & rate<0.01)")
def test_k6_thresholds():
    path = os.path.join("tests", "k6", "load_test_reports.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "p(95)<300" in content, "Missing p(95)<300 threshold for NFR-01"
    assert "rate<0.01" in content, "Missing rate<0.01 threshold for error rate"
    assert "http_req_duration" in content, "Missing http_req_duration threshold config"
    assert "http_req_failed" in content, "Missing http_req_failed threshold config"


@test("SCRUM-62: Geospatial & Creation Traffic Simulation in k6 Scenarios")
def test_k6_scenarios_traffic():
    path = os.path.join("tests", "k6", "load_test_reports.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "/api/reports" in content, "Missing /api/reports endpoint calls"
    assert "/api/reports/nearby" in content, "Missing /api/reports/nearby geospatial queries"
    assert "POST" in content or "http.post" in content, "Missing write POST traffic simulation"
    assert "DISTRICTS_COORDINATES" in content, "Missing realistic Tunis district coordinates"


@test("SCRUM-62: Gateway Stress & Chaos Outage Fallback Script (stress_test_gateway.js)")
def test_k6_chaos_script():
    path = os.path.join("tests", "k6", "stress_test_gateway.js")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "target: 250" in content, "Missing 250 VUs stress spike stage"
    assert "NON_QUALIFIE" in content or "A_QUALIFIER" in content, "Missing graceful fallback category assertion"
    assert "status !== 500" in content or "res.status < 500" in content, "Missing 500 error prevention check"


@test("SCRUM-62: k6 Documentation & Execution Runbook (tests/k6/README.md)")
def test_k6_readme():
    path = os.path.join("tests", "k6", "README.md")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "NFR-01" in content, "README must mention NFR-01"
    assert "300" in content, "README must document 300ms SLA"
    assert "k6 run" in content, "README must provide k6 run commands"
    assert "docker" in content.lower(), "README must document Docker execution"


# ==============================================================================
# SCRUM-65 (ECO-53) TESTS: K8S HPA, 500 SEEDS & SOUTENANCE RUNBOOK (NFR-04)
# ==============================================================================

@test("SCRUM-65: Kubernetes HPA Autoscaler Manifest (hpa-report-service.yaml)")
def test_k8s_hpa_manifest():
    path = os.path.join("deploy", "k8s", "hpa-report-service.yaml")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        doc = yaml.safe_load(f)
    assert doc.get("apiVersion") == "autoscaling/v2", "HPA must use autoscaling/v2"
    assert doc.get("kind") == "HorizontalPodAutoscaler", "Kind must be HorizontalPodAutoscaler"
    assert doc.get("spec", {}).get("scaleTargetRef", {}).get("name") == "ecotrack-report-service"


@test("SCRUM-65: HPA Target CPU 70% and Pod Scaling Limits (min 2, max 10)")
def test_k8s_hpa_rules():
    path = os.path.join("deploy", "k8s", "hpa-report-service.yaml")
    with open(path, "r", encoding="utf-8") as f:
        doc = yaml.safe_load(f)
    spec = doc.get("spec", {})
    assert spec.get("minReplicas") == 2, "HPA minReplicas must be 2"
    assert spec.get("maxReplicas") == 10, "HPA maxReplicas must be 10"
    
    cpu_metric = next((m for m in spec.get("metrics", []) if m.get("resource", {}).get("name") == "cpu"), None)
    assert cpu_metric is not None, "Missing CPU resource metric"
    assert cpu_metric.get("resource", {}).get("target", {}).get("averageUtilization") == 70, "Target CPU utilization must be 70%"


@test("SCRUM-65: 500 Realistic Reports Seed Script (scripts/seed_demo_data.ts & .py)")
def test_seed_demo_scripts():
    ts_path = os.path.join("scripts", "seed_demo_data.ts")
    py_path = os.path.join("scripts", "seed_demo_data.py")
    assert os.path.exists(ts_path), f"File {ts_path} does not exist"
    assert os.path.exists(py_path), f"File {py_path} does not exist"
    with open(ts_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "generateSeedReports" in content, "Missing generateSeedReports export"
    assert "DISTRICTS" in content, "Missing districts configuration"


@test("SCRUM-65: 500 Seeds Distribution (60% RESOLU, 20% EN_TRAITEMENT, 15% NOUVEAU, 5% REJETE)")
def test_seed_data_distribution():
    json_path = os.path.join("scripts", "demo_500_reports.json")
    assert os.path.exists(json_path), f"Dataset {json_path} does not exist"
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert len(data) == 500, f"Expected 500 reports, got {len(data)}"
    
    resolved = sum(1 for r in data if r["status"] == "RESOLU")
    in_progress = sum(1 for r in data if r["status"] == "EN_TRAITEMENT")
    new_reports = sum(1 for r in data if r["status"] == "NOUVEAU")
    rejected = sum(1 for r in data if r["status"] == "REJETE")
    
    assert resolved == 300, f"Expected 300 RESOLU (60%), got {resolved}"
    assert in_progress == 100, f"Expected 100 EN_TRAITEMENT (20%), got {in_progress}"
    assert new_reports == 75, f"Expected 75 NOUVEAU (15%), got {new_reports}"
    assert rejected == 25, f"Expected 25 REJETE (5%), got {rejected}"
    
    # Check resolved items have afterImageUrl and leadTime
    sample_resolved = next(r for r in data if r["status"] == "RESOLU")
    assert sample_resolved.get("afterImageUrl") is not None, "Resolved report must have afterImageUrl"
    assert sample_resolved.get("leadTimeHours") is not None, "Resolved report must have leadTimeHours"
    assert sample_resolved.get("location", {}).get("type") == "Point", "Location must be GeoJSON Point"


@test("SCRUM-65: Timed 20-minute Defense Presentation Runbook (docs/deroule_soutenance.md)")
def test_defense_runbook():
    path = os.path.join("docs", "deroule_soutenance.md")
    assert os.path.exists(path), f"File {path} does not exist"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Adem Ouerhani" in content, "Must include Adem Ouerhani"
    assert "Ahmed Salah" in content, "Must include Ahmed Salah"
    assert "Hiba Dhouib" in content, "Must include Hiba Dhouib"
    assert "Sara Sahih" in content, "Must include Sara Sahih"
    assert "20 minutes" in content or "20 min" in content, "Must specify 20 minutes duration"
    assert "HPA" in content, "Must cover Kubernetes HPA"
    assert "k6" in content, "Must cover k6 load testing"


# ==============================================================================
# MAIN TEST RUNNER
# ==============================================================================

if __name__ == "__main__":
    print("=" * 65)
    print("RUNNING ECOTRACK SPRINT 5 TEST SUITE (SCRUM-62 & SCRUM-65)")
    print("=" * 65)

    # SCRUM-62
    test_k6_load_script_structure()
    test_k6_ramping_stages()
    test_k6_thresholds()
    test_k6_scenarios_traffic()
    test_k6_chaos_script()
    test_k6_readme()

    # SCRUM-65
    test_k8s_hpa_manifest()
    test_k8s_hpa_rules()
    test_seed_demo_scripts()
    test_seed_data_distribution()
    test_defense_runbook()

    passed = sum(1 for t in TEST_RESULTS if t["status"] == "PASS")
    total = len(TEST_RESULTS)

    print("=" * 65)
    print(f"SUMMARY: {passed}/{total} SPRINT 5 TESTS PASSED")
    print("=" * 65)

    if passed != total:
        sys.exit(1)
