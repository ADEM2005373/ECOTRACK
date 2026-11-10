"""
ECOTRACK Automated Verification Test Suite - Sprint 0 (EPIC 0: SCRUM-33)
Validates all deliverables for tickets:
- SCRUM-38 (ECO-01): DevOps, Nx Monorepo, Docker Compose, CI/CD
- SCRUM-55 (ECO-05): PostgreSQL Star Schema DW, Dimensions Seeding, OpenAPI Contracts, ADRs
- SCRUM-40 (ECO-03): AI FastAPI & PyTorch Microservice Environment
- SCRUM-39 (ECO-02): Expo Mobile App & CDCF V2 Design Tokens
- SCRUM-41 (ECO-04): React Vite & Tailwind CSS Atomic UI
"""

import os
import sys
import json
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

# --- SCRUM-38 TESTS ---

@test("SCRUM-38: package.json validation")
def test_package_json():
    assert os.path.exists("package.json"), "package.json missing"
    with open("package.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data.get("name") == "ecotrack", "Root package name should be ecotrack"
    workspaces = data.get("workspaces", [])
    assert "apps/*" in workspaces, "apps/* workspace missing"
    assert "services/*" in workspaces, "services/* workspace missing"
    assert "packages/*" in workspaces, "packages/* workspace missing"

@test("SCRUM-38: nx.json validation")
def test_nx_json():
    assert os.path.exists("nx.json"), "nx.json missing"
    with open("nx.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "targetDefaults" in data, "targetDefaults missing from nx.json"
    assert "build" in data["targetDefaults"], "build target missing"

@test("SCRUM-38: tsconfig.base.json validation")
def test_tsconfig():
    assert os.path.exists("tsconfig.base.json"), "tsconfig.base.json missing"
    with open("tsconfig.base.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    paths = data.get("compilerOptions", {}).get("paths", {})
    assert "@ecotrack/db" in paths, "@ecotrack/db alias missing"
    assert "@ecotrack/contracts" in paths, "@ecotrack/contracts alias missing"
    assert "@ecotrack/shared" in paths, "@ecotrack/shared alias missing"

@test("SCRUM-38: docker-compose.yml structure & services")
def test_docker_compose():
    assert os.path.exists("docker-compose.yml"), "docker-compose.yml missing"
    with open("docker-compose.yml", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check all 6 required infrastructure services
    services = ["mongodb:", "postgres:", "redis:", "rabbitmq:", "minio:", "api-gateway:"]
    for s in services:
        assert s in content, f"Service {s} missing from docker-compose.yml"
    
    # Check images & versions per CDCF V2
    assert "mongo:7.0" in content, "mongo:7.0 image missing"
    assert "postgres:16-alpine" in content, "postgres:16 image missing"
    assert "redis:7-alpine" in content, "redis:7 image missing"
    assert "rabbitmq:3-management-alpine" in content, "rabbitmq:3 image missing"
    assert "minio/minio" in content, "minio image missing"
    assert "nginx:1.25-alpine" in content, "nginx image missing"
    
    # Check healthchecks and network
    assert "ecotrack-network" in content, "ecotrack-network missing"
    assert "healthcheck:" in content, "Healthchecks missing"

@test("SCRUM-38: deploy/docker/nginx.conf validation")
def test_nginx_conf():
    path = os.path.join("deploy", "docker", "nginx.conf")
    assert os.path.exists(path), "nginx.conf missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "upstream identity_service" in content, "identity upstream missing"
    assert "upstream report_service" in content, "report upstream missing"
    assert "upstream workflow_service" in content, "workflow upstream missing"
    assert "upstream ai_service" in content, "ai upstream missing"
    assert "/api/v1/auth" in content, "/api/v1/auth route missing"
    assert "/api/v1/reports" in content, "/api/v1/reports route missing"
    assert "/health" in content, "/health route missing"

@test("SCRUM-38: .github/workflows/ci.yml validation")
def test_ci_workflow():
    path = os.path.join(".github", "workflows", "ci.yml")
    assert os.path.exists(path), "ci.yml missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "name: EcoTrack CI/CD Pipeline" in content, "CI pipeline name missing"
    assert "lint-and-typecheck:" in content, "lint job missing"
    assert "test-unit-and-contracts:" in content, "test job missing"
    assert "docker-compose-config:" in content, "docker compose config job missing"

@test("SCRUM-38: .env.example environment variables")
def test_env_example():
    assert os.path.exists(".env.example"), ".env.example missing"
    with open(".env.example", "r", encoding="utf-8") as f:
        content = f.read()
    required_vars = [
        "MONGODB_URI", "POSTGRES_DB", "REDIS_URI", "RABBITMQ_URI",
        "MINIO_ROOT_USER", "JWT_ACCESS_SECRET", "ARGON2_MEMORY_COST"
    ]
    for var in required_vars:
        assert var in content, f"Environment variable {var} missing from .env.example"

# --- SCRUM-55 TESTS ---

@test("SCRUM-55: PostgreSQL Star Schema DDL (01_create_star_schema.sql)")
def test_star_schema_ddl():
    path = os.path.join("services", "bi-etl", "sql", "01_create_star_schema.sql")
    assert os.path.exists(path), "01_create_star_schema.sql missing"
    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    # 5 Dimensions
    dimensions = ["Dim_Date", "Dim_Geography", "Dim_Category", "Dim_Team", "Dim_AI_Model"]
    for d in dimensions:
        assert f"CREATE TABLE IF NOT EXISTS {d}" in sql, f"Dimension {d} missing"
    
    # 2 Fact tables
    facts = ["Fact_Reports", "Fact_Interventions"]
    for fact in facts:
        assert f"CREATE TABLE IF NOT EXISTS {fact}" in sql, f"Fact table {fact} missing"
    
    # Check FK relationships
    assert "REFERENCES Dim_Date(date_key)" in sql, "Dim_Date FK missing"
    assert "REFERENCES Dim_Geography(geo_key)" in sql, "Dim_Geography FK missing"
    assert "REFERENCES Dim_Category(category_key)" in sql, "Dim_Category FK missing"
    assert "REFERENCES Dim_Team(team_key)" in sql, "Dim_Team FK missing"
    assert "REFERENCES Dim_AI_Model(model_key)" in sql, "Dim_AI_Model FK missing"
    
    # Check Power BI Analytical Views
    assert "View_KPI_Territory_Performance" in sql, "View_KPI_Territory_Performance missing"
    assert "View_KPI_AI_Accuracy" in sql, "View_KPI_AI_Accuracy missing"

@test("SCRUM-55: Dimensions Initial Seeding (02_seed_dimensions.sql)")
def test_seed_dimensions():
    path = os.path.join("services", "bi-etl", "sql", "02_seed_dimensions.sql")
    assert os.path.exists(path), "02_seed_dimensions.sql missing"
    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()
    
    # Date generation
    assert "GENERATE_SERIES" in sql, "Date series generator missing"
    assert "'2025-01-01'::DATE" in sql and "'2030-12-31'::DATE" in sql, "Calendar span 2025-2030 missing"
    
    # Categories from CDCF V2
    assert "DEPOT_SAUVAGE" in sql, "Category DEPOT_SAUVAGE missing"
    assert "ENCOMBRANTS" in sql, "Category ENCOMBRANTS missing"
    assert "DECHETS_VERTS" in sql, "Category DECHETS_VERTS missing"
    assert "DECHETS_TOXIQUES" in sql, "Category DECHETS_TOXIQUES missing"
    
    # Teams & Models
    assert "EQP_VOIRIE_01" in sql, "EQP_VOIRIE_01 missing"
    assert "YOLOv8x-EcoTrack" in sql, "YOLOv8x-EcoTrack missing"

@test("SCRUM-55: OpenAPI 3.1.0 Contract (openapi.yaml)")
def test_openapi_contract():
    path = os.path.join("packages", "contracts", "openapi.yaml")
    assert os.path.exists(path), "openapi.yaml missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    assert "openapi: 3.1.0" in content, "OpenAPI version must be 3.1.0"
    
    routes = [
        "/auth/register",
        "/auth/login",
        "/auth/refresh",
        "/reports",
        "/interventions/{id}/transition",
        "/vision/classify",
        "/bi/kpis/performance"
    ]
    for r in routes:
        assert r in content, f"Route {r} missing from openapi.yaml"
    
    # Check Schemas
    assert "AuthTokenResponse:" in content, "AuthTokenResponse schema missing"
    assert "Report:" in content, "Report schema missing"

@test("SCRUM-55: Architecture Decisions Records (docs/decisions.md)")
def test_adrs():
    path = os.path.join("docs", "decisions.md")
    assert os.path.exists(path), "docs/decisions.md missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    for i in range(1, 6):
        assert f"ADR-0{i}" in content, f"ADR-0{i} missing from decisions.md"

# --- SCRUM-40 TESTS ---

@test("SCRUM-40: FastAPI & PyTorch dependencies in requirements.txt")
def test_ai_vision_requirements():
    path = os.path.join("services", "ai-vision", "requirements.txt")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    required = ["fastapi", "uvicorn", "torch", "torchvision", "pillow", "pydantic"]
    for pkg in required:
        assert pkg in content, f"Dependency {pkg} missing from {path}"

@test("SCRUM-40: FastAPI application & GET /health route (main.py)")
def test_ai_vision_main():
    path = os.path.join("services", "ai-vision", "main.py")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "FastAPI" in content, "FastAPI import/app missing"
    assert "/health" in content, "GET /health route missing"
    assert "torch" in content, "torch import missing"
    assert "device" in content, "device status missing in health check"

@test("SCRUM-40: Multi-stage Dockerfile based on python:3.11-slim")
def test_ai_vision_dockerfile():
    path = os.path.join("services", "ai-vision", "Dockerfile")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "python:3.11-slim" in content, "Base image python:3.11-slim missing"
    assert "AS builder" in content, "Multi-stage builder missing"
    assert "uvicorn" in content, "uvicorn command missing"

# --- SCRUM-39 TESTS ---

@test("SCRUM-39: Expo configuration (app.json) & packages")
def test_expo_app_config():
    paths = [
        os.path.join("apps", "mobile-expo", "app.json"),
        os.path.join("apps", "mobile", "app.json")
    ]
    found = any(os.path.exists(p) for p in paths)
    assert found, "app.json missing from mobile app directory"
    chosen_path = next(p for p in paths if os.path.exists(p))
    with open(chosen_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "expo" in data, "'expo' section missing from app.json"
    assert data["expo"].get("name") == "EcoTrack Mobile", "Mobile app name should be EcoTrack Mobile"

@test("SCRUM-39: Design Tokens Colors (#059669 & #1E3A8A)")
def test_expo_theme_colors():
    paths = [
        os.path.join("apps", "mobile-expo", "src", "theme", "colors.ts"),
        os.path.join("apps", "mobile", "src", "theme", "colors.ts")
    ]
    found = any(os.path.exists(p) for p in paths)
    assert found, "colors.ts missing"
    chosen_path = next(p for p in paths if os.path.exists(p))
    with open(chosen_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "#059669" in content, "Primary color #059669 missing"
    assert "#1E3A8A" in content, "Secondary color #1E3A8A missing"

@test("SCRUM-39: Typography (PlusJakartaSans-Bold & Inter-Regular)")
def test_expo_theme_typography():
    paths = [
        os.path.join("apps", "mobile-expo", "src", "theme", "typography.ts"),
        os.path.join("apps", "mobile", "src", "theme", "typography.ts")
    ]
    found = any(os.path.exists(p) for p in paths)
    assert found, "typography.ts missing"
    chosen_path = next(p for p in paths if os.path.exists(p))
    with open(chosen_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "PlusJakartaSans-Bold" in content, "PlusJakartaSans-Bold missing"
    assert "Inter-Regular" in content, "Inter-Regular missing"

# --- SCRUM-41 TESTS ---

@test("SCRUM-41: Tailwind CSS Configuration & CDCF V2 Palette")
def test_web_tailwind_config():
    paths = [
        os.path.join("apps", "web-react", "tailwind.config.js"),
        os.path.join("apps", "web", "tailwind.config.js")
    ]
    found = any(os.path.exists(p) for p in paths)
    assert found, "tailwind.config.js missing"
    chosen_path = next(p for p in paths if os.path.exists(p))
    with open(chosen_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "#059669" in content, "Primary color #059669 missing from tailwind config"
    assert "#1e3a8a" in content.lower(), "Secondary color #1E3A8A missing from tailwind config"

@test("SCRUM-41: Atomic Button Component with Variants")
def test_web_button_component():
    paths = [
        os.path.join("apps", "web-react", "src", "components", "ui", "Button.tsx"),
        os.path.join("apps", "web", "src", "components", "ui", "Button.tsx")
    ]
    found = any(os.path.exists(p) for p in paths)
    assert found, "Button.tsx missing"
    chosen_path = next(p for p in paths if os.path.exists(p))
    with open(chosen_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "primary" in content, "Primary button variant missing"
    assert "secondary" in content, "Secondary button variant missing"
    assert "destructive" in content, "Destructive button variant missing"

@test("SCRUM-41: React App & Test Showcase (App.tsx)")
def test_web_app_showcase():
    paths = [
        os.path.join("apps", "web-react", "src", "App.tsx"),
        os.path.join("apps", "web", "src", "App.tsx")
    ]
    found = any(os.path.exists(p) for p in paths)
    assert found, "App.tsx missing"
    chosen_path = next(p for p in paths if os.path.exists(p))
    with open(chosen_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Button" in content, "Button import/usage missing in App.tsx"
    assert "ECOTRACK" in content, "ECOTRACK title missing in App.tsx"

def main():
    print("=" * 60)
    print("RUNNING ECOTRACK DELIVERY VALIDATION TEST SUITE (SPRINT 0 / EPIC 0)")
    print("=" * 60)
    
    # SCRUM-38
    test_package_json()
    test_nx_json()
    test_tsconfig()
    test_docker_compose()
    test_nginx_conf()
    test_ci_workflow()
    test_env_example()

    # SCRUM-55
    test_star_schema_ddl()
    test_seed_dimensions()
    test_openapi_contract()
    test_adrs()

    # SCRUM-40
    test_ai_vision_requirements()
    test_ai_vision_main()
    test_ai_vision_dockerfile()

    # SCRUM-39
    test_expo_app_config()
    test_expo_theme_colors()
    test_expo_theme_typography()

    # SCRUM-41
    test_web_tailwind_config()
    test_web_button_component()
    test_web_app_showcase()
    
    print("=" * 60)
    passed = sum(1 for r in TEST_RESULTS if r["status"] == "PASS")
    total = len(TEST_RESULTS)
    print(f"SUMMARY: {passed}/{total} TESTS PASSED")
    print("=" * 60)
    
    if passed != total:
        sys.exit(1)

if __name__ == "__main__":
    main()
