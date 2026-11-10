"""
ECOTRACK Sprint 1 Automated Test Suite
Validates deliverables for:
- SCRUM-42 (ECO-11): User Mongoose Schema, Argon2id Hashing Logic & RBAC Enums
- SCRUM-56 (ECO-15): AuditLogs Append-Only Collection, RGPD IP Truncation & RBAC Admin Guard
- SCRUM-43 (ECO-12): Auth Register Route & Controller Security (Sara Shih / DevLead)
- TECH-DEBT: Nx apps cleanup, local tsconfig & cn() utility
"""

import sys
import os
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

# --- SCRUM-42 (ECO-11) TESTS ---

@test("SCRUM-42: UserRole enum definition in @ecotrack/shared")
def test_user_roles():
    path = os.path.join("packages", "shared", "src", "types", "user.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for role in ["CITOYEN", "AGENT", "OUVRIER", "ADMIN"]:
        assert role in content, f"Role {role} missing from UserRole enum"

@test("SCRUM-42: User Mongoose Schema structure in @ecotrack/db")
def test_user_schema():
    path = os.path.join("packages", "db", "src", "schemas", "user.schema.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    fields = ["email", "password", "fullName", "phoneNumber", "role", "isActive", "lastLogin", "refreshTokenHash"]
    for fld in fields:
        assert fld in content, f"Field {fld} missing from UserSchema"
    assert "UserSchema.index({ email: 1 }, { unique: true })" in content, "Unique email index missing"

@test("SCRUM-42: Argon2id Hashing parameters & Pre-save hook")
def test_argon2id_hashing():
    path = os.path.join("packages", "db", "src", "schemas", "user.schema.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "argon2.argon2id" in content, "Argon2id algorithm missing"
    assert "65536" in content, "Argon2 64MB memoryCost missing"
    assert "timeCost: 3" in content, "Argon2 3 iterations missing"
    assert "parallelism: 4" in content, "Argon2 4 threads parallelism missing"
    assert "UserSchema.pre<IUserDocument>('save'" in content, "Pre-save hashing hook missing"
    assert "UserSchema.methods.comparePassword" in content, "comparePassword method missing"

@test("SCRUM-42: Identity Service utility and user service")
def test_identity_service():
    hash_path = os.path.join("services", "identity-api", "src", "utils", "hashing.ts")
    service_path = os.path.join("services", "identity-api", "src", "services", "user.service.ts")
    assert os.path.exists(hash_path), f"{hash_path} missing"
    assert os.path.exists(service_path), f"{service_path} missing"
    with open(service_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "createUser" in content, "createUser method missing"
    assert "validateCredentials" in content, "validateCredentials method missing"

# --- SCRUM-56 (ECO-15) TESTS ---

@test("SCRUM-56: AuditAction enum & AuditLog Types in @ecotrack/shared")
def test_audit_types():
    path = os.path.join("packages", "shared", "src", "types", "audit.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    actions = [
        "USER_REGISTER", "USER_LOGIN", "REPORT_CREATED", "REPORT_VALIDATED_T1",
        "REPORT_ASSIGNED_T2", "REPORT_STARTED_T3", "REPORT_RESOLVED_T4", "REPORT_REJECTED_T5"
    ]
    for act in actions:
        assert act in content, f"Action {act} missing from AuditAction enum"

@test("SCRUM-56: AuditLog Mongoose Schema structure")
def test_audit_schema():
    path = os.path.join("packages", "db", "src", "schemas", "audit-log.schema.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    fields = ["actorId", "actorRole", "action", "entityType", "entityId", "before", "after", "reason", "ipTruncated", "timestamp"]
    for fld in fields:
        assert fld in content, f"Field {fld} missing from AuditLogSchema"
    assert "immutable: true" in content, "timestamp must be immutable"

@test("SCRUM-56: Strict Immutability (Append-Only) enforcement")
def test_append_only_enforcement():
    path = os.path.join("packages", "db", "src", "schemas", "audit-log.schema.ts")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    blocked_operations = ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"]
    for op in blocked_operations:
        assert f"AuditLogSchema.pre('{op}'" in content, f"Pre-hook blocking '{op}' missing"
    assert "VIOLATION_CONFORMITE_RGPD" in content or "Append-Only strict" in content, "Append-only error message missing"

@test("SCRUM-56: RGPD IP Truncation Utility")
def test_ip_anonymizer():
    path = os.path.join("services", "audit-api", "src", "utils", "ip-anonymizer.ts")
    assert os.path.exists(path), f"{path} missing"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "truncateIp" in content, "truncateIp function missing"
    assert ".0/24" in content, "IPv4 /24 subnet masking missing"

@test("SCRUM-56: Audit Service & Controller with ADMIN RBAC Guard")
def test_audit_controller_rbac():
    controller_path = os.path.join("services", "audit-api", "src", "controllers", "audit.controller.ts")
    assert os.path.exists(controller_path), f"{controller_path} missing"
    with open(controller_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "userRole !== UserRole.ADMIN" in content, "ADMIN RBAC check missing"
    assert "403" in content, "403 Forbidden status missing"
    assert "getLogs" in content and "createLog" in content, "getLogs and createLog methods missing"

@test("SCRUM-56: Audit API Routes & Server definition")
def test_audit_routes_and_server():
    routes_path = os.path.join("services", "audit-api", "src", "routes", "audit.routes.ts")
    server_path = os.path.join("services", "audit-api", "src", "index.ts")
    assert os.path.exists(routes_path), f"{routes_path} missing"
    assert os.path.exists(server_path), f"{server_path} missing"
    with open(routes_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "router.get('/logs'" in content, "GET /logs route missing"
    assert "router.post('/log'" in content, "POST /log route missing"

# --- SCRUM-43 (ECO-12) & LEAD DEV DELIVERABLES ---

@test("SCRUM-43: Auth Register Route & Controller (Identity API)")
def test_auth_register_route():
    routes_path = os.path.join("services", "identity-api", "src", "routes", "auth.routes.ts")
    server_path = os.path.join("services", "identity-api", "src", "index.ts")
    assert os.path.exists(routes_path), f"{routes_path} missing"
    with open(routes_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "router.post('/register'" in content, "POST /register endpoint missing"
    assert "password.length < 8" in content, "Password min-length 8 validation missing"
    assert "201" in content, "HTTP 201 Created status missing"
    assert "400" in content, "HTTP 400 Bad Request status missing"
    assert "409" in content, "HTTP 409 Conflict status missing"
    with open(server_path, "r", encoding="utf-8") as f:
        s_content = f.read()
    assert "authRouter" in s_content, "authRouter must be mounted in index.ts"

@test("TECH-DEBT: Orphan apps/web removed, local tsconfig & cn() plugged")
def test_tech_debt_cleanup():
    orphan_web = os.path.join("apps", "web")
    assert not os.path.exists(orphan_web), "Orphan directory apps/web must be removed"
    
    tsconfig_path = os.path.join("apps", "web-react", "tsconfig.json")
    assert os.path.exists(tsconfig_path), "Local tsconfig.json in apps/web-react missing"
    
    button_path = os.path.join("apps", "web-react", "src", "components", "ui", "Button.tsx")
    with open(button_path, "r", encoding="utf-8") as f:
        b_content = f.read()
    assert "cn(" in b_content, "Button.tsx must use cn() helper"

def main():
    print("=" * 65)
    print("RUNNING ECOTRACK SPRINT 1 TEST SUITE (SCRUM-42, SCRUM-56 & SCRUM-43)")
    print("=" * 65)
    
    test_user_roles()
    test_user_schema()
    test_argon2id_hashing()
    test_identity_service()
    test_audit_types()
    test_audit_schema()
    test_append_only_enforcement()
    test_ip_anonymizer()
    test_audit_controller_rbac()
    test_audit_routes_and_server()
    test_auth_register_route()
    test_tech_debt_cleanup()
    
    print("=" * 65)
    passed = sum(1 for r in TEST_RESULTS if r["status"] == "PASS")
    total = len(TEST_RESULTS)
    print(f"SUMMARY: {passed}/{total} TESTS PASSED")
    print("=" * 65)
    
    if passed != total:
        sys.exit(1)

if __name__ == "__main__":
    main()
