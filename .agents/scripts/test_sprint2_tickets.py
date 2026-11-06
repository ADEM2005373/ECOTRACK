"""
ECOTRACK Sprint 2 Automated Test Suite
Validates deliverables for:
- SCRUM-46 (ECO-20): Report Mongoose Schema & 2dsphere Geospatial Index
- SCRUM-47 (ECO-21): Media Service with Sharp, EXIF/GPS Metadata Purge & 224x224 AI Thumbnail
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

# --- SCRUM-46 (ECO-20) TESTS ---

@test("SCRUM-46: ReportStatus & GeoLocation Types in @ecotrack/shared")
def test_report_types():
    path = os.path.join("packages", "shared", "src", "types", "report.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for status in ["NOUVEAU", "EN_COURS_DE_VALIDATION", "REJETE", "VALIDE", "ASSIGNE", "EN_TRAITEMENT", "RESOLU"]:
        assert status in content, f"Status {status} missing from ReportStatus"
    assert "coordinates: [number, number]" in content, "GeoJSON coordinates type missing"

@test("SCRUM-46: Report Mongoose Schema & 2dsphere Spatial Index in @ecotrack/db")
def test_report_schema():
    path = os.path.join("packages", "db", "src", "schemas", "report.schema.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "location: '2dsphere'" in content, "2dsphere spatial index missing"
    assert "ReportModel" in content, "ReportModel export missing"
    assert "enum: ['Point']" in content, "Point GeoJSON type missing"
    assert "coordinates" in content, "coordinates field missing"

# --- SCRUM-47 (ECO-21) TESTS ---

@test("SCRUM-47: Media Service package & dependencies definition")
def test_media_service_package():
    pkg_path = os.path.join("services", "media-service", "package.json")
    assert os.path.exists(pkg_path), f"{pkg_path} missing"
    with open(pkg_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert '"sharp"' in content, "sharp dependency missing"
    assert '"multer"' in content, "multer dependency missing"
    assert '"express"' in content, "express dependency missing"

@test("SCRUM-47: Image Processor Service with Sharp (EXIF Purge & AI 224x224)")
def test_image_processor():
    svc_path = os.path.join("services", "media-service", "src", "services", "image-processor.service.ts")
    assert os.path.exists(svc_path), f"{svc_path} missing"
    with open(svc_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "withMetadata(false)" in content, "EXIF/GPS metadata purge missing"
    assert "resize(224, 224" in content, "224x224 AI vision thumbnail resizing missing"
    assert "webp" in content, "webp conversion missing"

@test("SCRUM-47: Media Service Upload Route & Server definition")
def test_media_routes_and_server():
    routes_path = os.path.join("services", "media-service", "src", "routes", "media.routes.ts")
    server_path = os.path.join("services", "media-service", "src", "index.ts")
    assert os.path.exists(routes_path), f"{routes_path} missing"
    assert os.path.exists(server_path), f"{server_path} missing"
    with open(routes_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "router.post('/upload'" in content, "POST /upload endpoint missing"
    assert "upload.single('photo')" in content, "Multer single upload missing"
    assert "FICHIER_MANQUANT" in content or "metadataPurged" in content, "Validation checks missing"

def main():
    print("=" * 65)
    print("RUNNING ECOTRACK SPRINT 2 TEST SUITE (SCRUM-46 & SCRUM-47)")
    print("=" * 65)
    
    test_report_types()
    test_report_schema()
    test_media_service_package()
    test_image_processor()
    test_media_routes_and_server()
    
    print("=" * 65)
    passed = sum(1 for r in TEST_RESULTS if r["status"] == "PASS")
    total = len(TEST_RESULTS)
    print(f"SUMMARY: {passed}/{total} SPRINT 2 TESTS PASSED")
    print("=" * 65)
    
    if passed != total:
        sys.exit(1)

if __name__ == "__main__":
    main()
