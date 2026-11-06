"""
ECOTRACK Sprint 2 Automated Test Suite
Validates deliverables for:
- SCRUM-46 (ECO-20): Report Mongoose Schema & 2dsphere Geospatial Index
- SCRUM-47 (ECO-21): Media Service & Media API with Sharp (EXIF/GPS Purge, S3/MinIO PutObjectCommand)
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

@test("SCRUM-47: Sharp Utility (sharp.util.ts) - Max 1920px & withMetadata(false)")
def test_sharp_util():
    util_path = os.path.join("services", "media-api", "src", "utils", "sharp.util.ts")
    assert os.path.exists(util_path), f"{util_path} missing"
    with open(util_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "withMetadata(false)" in content, "EXIF/GPS metadata purge missing (.withMetadata(false))"
    assert "1920" in content, "1920px max resize constraint missing"
    assert "224" in content, "224x224 AI thumbnail format missing"
    assert "webp" in content, "webp conversion missing"

@test("SCRUM-47: Upload Controller & Multer 10MB Limit (upload.controller.ts)")
def test_upload_controller():
    ctrl_path = os.path.join("services", "media-api", "src", "controllers", "upload.controller.ts")
    assert os.path.exists(ctrl_path), f"{ctrl_path} missing"
    with open(ctrl_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "multer.memoryStorage" in content, "Multer memoryStorage missing"
    assert "10 * 1024 * 1024" in content, "10MB file size limit missing"
    assert "processCitizenImage" in content, "processCitizenImage call missing"
    assert "201" in content, "HTTP 201 Created status missing"

@test("SCRUM-47: AWS SDK v3 PutObjectCommand S3/MinIO Integration (s3.service.ts)")
def test_s3_storage_service():
    s3_path = os.path.join("services", "media-api", "src", "services", "s3.service.ts")
    pkg_path = os.path.join("services", "media-api", "package.json")
    assert os.path.exists(s3_path), f"{s3_path} missing"
    with open(s3_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "PutObjectCommand" in content, "PutObjectCommand missing from s3.service.ts"
    assert "S3Client" in content, "S3Client missing from s3.service.ts"
    assert "forcePathStyle" in content, "forcePathStyle for MinIO missing"
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg_content = f.read()
    assert "@aws-sdk/client-s3" in pkg_content, "@aws-sdk/client-s3 dependency missing"

@test("SCRUM-47: Media API Server & Routes Definition (index.ts)")
def test_media_api_server():
    server_path = os.path.join("services", "media-api", "src", "index.ts")
    assert os.path.exists(server_path), f"{server_path} missing"
    with open(server_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "uploadRouter" in content, "uploadRouter missing"
    assert "SCRUM-47" in content and "ECO-21" in content, "SCRUM-47 / ECO-21 tracking info missing"

def main():
    print("=" * 65)
    print("RUNNING ECOTRACK SPRINT 2 TEST SUITE (SCRUM-46 & SCRUM-47)")
    print("=" * 65)
    
    test_report_types()
    test_report_schema()
    test_sharp_util()
    test_upload_controller()
    test_s3_storage_service()
    test_media_api_server()
    
    print("=" * 65)
    passed = sum(1 for r in TEST_RESULTS if r["status"] == "PASS")
    total = len(TEST_RESULTS)
    print(f"SUMMARY: {passed}/{total} SPRINT 2 TESTS PASSED")
    print("=" * 65)
    
    if passed != total:
        sys.exit(1)

if __name__ == "__main__":
    main()
