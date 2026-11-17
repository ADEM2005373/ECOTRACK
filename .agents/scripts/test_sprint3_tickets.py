"""
ECOTRACK Sprint 3 & Review Tickets Automated Test Suite
Validates deliverables for:
- SCRUM-50 (ECO-30): Workflow State Machine Service (T1-T5) & FSM Guards
- SCRUM-51 (ECO-31): Agent Qualification Split-Screen & AnomalyCard
- SCRUM-58 (ECO-32): Worker Mobile Roadmap ($near proximity) & Intervention Detail (T3)
- SCRUM-60 (ECO-40): T4 Resolution with Mandatory Completion Photo & Admin Reopen Guard
- SCRUM-61 (ECO-43): AI/MLOps Concordance Tracker, 6x6 Confusion Matrix & Active Learning
- SCRUM-64 (ECO-52): Recette E2E Multi-Acteurs (Playwright) & Audit Accessibilité WCAG 2.1 AA
"""

import sys
import os
import re

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

# --- SCRUM-50 (ECO-30) TESTS ---

@test("SCRUM-50: FSM State Machine Service & Transition Rules (T1-T5)")
def test_fsm_service():
    path = os.path.join("services", "workflow-api", "src", "services", "state-machine.service.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for t in ["T1", "T2", "T3", "T4", "T5"]:
        assert t in content, f"Transition {t} definition missing"
    assert "InvalidTransitionError" in content, "InvalidTransitionError missing"
    assert "WorkflowForbiddenError" in content, "WorkflowForbiddenError missing"
    assert "WorkflowValidationError" in content, "WorkflowValidationError missing"
    assert "statusHistory" in content, "statusHistory append-only audit missing"

@test("SCRUM-50: Report Schema Workflow Extensions & Status History in @ecotrack/db")
def test_report_schema_workflow():
    path = os.path.join("packages", "db", "src", "schemas", "report.schema.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "statusHistory: {" in content, "statusHistory subdocument missing in ReportSchema"
    assert "assignedTeamId:" in content, "assignedTeamId field missing"
    assert "assignedWorkerId:" in content, "assignedWorkerId field missing"
    assert "completionPhotoUrl:" in content, "completionPhotoUrl field missing"

# --- SCRUM-51 (ECO-31) TESTS ---

@test("SCRUM-51: AnomalyCard Component with Zoom & Photo Controls (apps/web-react)")
def test_anomaly_card():
    card_path = os.path.join("apps", "web-react", "src", "components", "moderation", "AnomalyCard.tsx")
    assert os.path.exists(card_path), f"{card_path} missing"
    with open(card_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "zoomScale" in content, "zoomScale prop missing"
    assert "onZoomIn" in content, "onZoomIn handler missing"
    assert "onZoomOut" in content, "onZoomOut handler missing"
    assert "onMaximize" in content, "onMaximize handler missing"

@test("SCRUM-51: Qualification Split-Screen Page with Validation T1 & Rejection T5")
def test_qualification_page():
    page_path = os.path.join("apps", "web-react", "src", "pages", "agent", "QualificationPage.tsx")
    assert os.path.exists(page_path), f"{page_path} missing"
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "handleValidate" in content, "handleValidate T1 action missing"
    assert "handleConfirmReject" in content, "handleConfirmReject T5 action missing"
    assert "isOverrideModalOpen" in content, "Manual category override modal missing"
    assert "confidenceBadge" in content, "AI confidence badge missing"

# --- SCRUM-58 (ECO-32) TESTS ---

@test("SCRUM-58: Mobile Intervention API with $near Proximity & T3 Start Action")
def test_mobile_intervention_api():
    api_path = os.path.join("apps", "mobile", "src", "services", "interventionApi.ts")
    assert os.path.exists(api_path), f"{api_path} missing"
    with open(api_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "fetchWorkerRoadmap" in content, "fetchWorkerRoadmap method missing"
    assert "startIntervention" in content, "startIntervention method missing"
    assert "near" in content, "$near geospatial query missing"
    assert "START_WORK" in content, "START_WORK action missing"

@test("SCRUM-58: Mobile RoadmapScreen with Location & GPS Directions (apps/mobile)")
def test_mobile_roadmap_screen():
    screen_path = os.path.join("apps", "mobile", "src", "screens", "Worker", "RoadmapScreen.tsx")
    assert os.path.exists(screen_path), f"{screen_path} missing"
    with open(screen_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "requestForegroundPermissionsAsync" in content, "Location permission request missing"
    assert "getCurrentPositionAsync" in content, "GPS position retrieval missing"
    assert "distanceMeters" in content, "Haversine distance calculation missing"
    assert "google.com/maps/dir" in content, "External GPS navigation link missing"

# --- SCRUM-60 (ECO-40) TESTS ---

@test("SCRUM-60: T4 Resolution Controller requiring Photo After Works & AuditLog")
def test_resolution_controller():
    ctrl_path = os.path.join("services", "workflow-api", "src", "controllers", "resolution.controller.ts")
    assert os.path.exists(ctrl_path), f"{ctrl_path} missing"
    with open(ctrl_path, "r", encoding="utf-8") as f:
        content = f.read()
      # Enforce mandatory completion photo
    assert "completionPhotoUrl" in content, "completionPhotoUrl validation missing"
    assert "AuditAction.REPORT_RESOLVED_T4" in content, "REPORT_RESOLVED_T4 audit action missing"
    assert "publishReportResolved" in content, "RabbitMQ publishReportResolved missing"

@test("SCRUM-60: Admin Reopen Controller with RBAC Guard & Reopen Reason")
def test_reopen_controller():
    ctrl_path = os.path.join("services", "workflow-api", "src", "controllers", "reopen.controller.ts")
    assert os.path.exists(ctrl_path), f"{ctrl_path} missing"
    with open(ctrl_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "reopenReport" in content, "reopenReport call missing"
    assert "AuditAction.REPORT_REOPENED" in content, "REPORT_REOPENED audit action missing"
    assert "UserRole.ADMIN" in content, "Admin role check missing"

# --- SCRUM-61 (ECO-43) TESTS ---

@test("SCRUM-61: AI/Human Concordance Tracker & Active Learning Dataset Export")
def test_agreement_tracker():
    tracker_path = os.path.join("services", "ai-vision", "evaluation", "agreement_tracker.py")
    assert os.path.exists(tracker_path), f"{tracker_path} missing"
    with open(tracker_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "calculate_agreement_rate" in content, "calculate_agreement_rate missing"
    assert "build_confusion_matrix" in content, "build_confusion_matrix missing"
    assert "export_divergences_to_json" in content, "export_divergences_to_json missing"
    assert "CRITICAL_ALERT_THRESHOLD_PERCENT" in content, "Threshold constant missing"

@test("SCRUM-61: AI Governance Admin Page (AiGovernancePage.tsx)")
def test_ai_governance_page():
    page_path = os.path.join("apps", "web-react", "src", "pages", "admin", "AiGovernancePage.tsx")
    assert os.path.exists(page_path), f"{page_path} missing"
    with open(page_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Matrice de Confusion" in content or "confusion" in content.lower(), "Confusion matrix view missing"
    assert "Active Learning" in content, "Active Learning export view missing"
    assert "handleExportActiveLearning" in content, "Dataset export handler missing"

# --- SCRUM-64 (ECO-52) TESTS ---

@test("SCRUM-64: E2E Citizen to Worker Lifecycle Spec (Playwright)")
def test_e2e_spec():
    spec_path = os.path.join("tests", "e2e", "citizen_to_worker.spec.ts")
    assert os.path.exists(spec_path), f"{spec_path} missing"
    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "EN_COURS_DE_VALIDATION" in content, "T1 assertion missing"
    assert "ASSIGNE" in content, "T2 assertion missing"
    assert "EN_TRAITEMENT" in content, "T3 assertion missing"
    assert "RESOLU" in content, "T4 assertion missing"

@test("SCRUM-64: Accessibility WCAG 2.1 AA Audit Spec (Playwright + Axe)")
def test_a11y_spec():
    spec_path = os.path.join("tests", "e2e", "a11y_audit.spec.ts")
    assert os.path.exists(spec_path), f"{spec_path} missing"
    with open(spec_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "AxeBuilder" in content, "AxeBuilder import missing"
    assert "wcag2aa" in content, "wcag2aa tag assertion missing"

def main():
    print("=" * 65)
    print("RUNNING ECOTRACK SPRINT 3 & REVIEW TEST SUITE")
    print("=" * 65)
    for test_fn in [
        test_fsm_service,
        test_report_schema_workflow,
        test_anomaly_card,
        test_qualification_page,
        test_mobile_intervention_api,
        test_mobile_roadmap_screen,
        test_resolution_controller,
        test_reopen_controller,
        test_agreement_tracker,
        test_ai_governance_page,
        test_e2e_spec,
        test_a11y_spec,
    ]:
        test_fn()
    
    total = len(TEST_RESULTS)
    passed = sum(1 for t in TEST_RESULTS if t["status"] == "PASS")
    print("=" * 65)
    print(f"SUMMARY: {passed}/{total} SPRINT 3 TESTS PASSED")
    print("=" * 65)
    if passed != total:
        sys.exit(1)

if __name__ == "__main__":
    main()
