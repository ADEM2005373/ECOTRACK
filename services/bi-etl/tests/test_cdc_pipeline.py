"""Unit & Integration Tests for ECO-41 / SCRUM-52:
CDC Pipeline, GDPR Anonymisation, MTTR & SLA Calculations, and Power BI DAX Support.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from bson import ObjectId

import main
from config import DEFAULT_CDC_INTERVAL_SECONDS, EtlConfig, load_config
from loaders.postgres_loader import build_fact_values, dedupe_latest
from transform import (
    CATEGORY_SLA_TARGET_HOURS,
    FactReportRow,
    hash_citizen_id,
    map_report,
    round_coordinate,
)

SALT = "unit-test-salt-not-a-secret-0123"
REPORTER = ObjectId("65a1b2c3d4e5f60718293a4b")
CREATED = datetime(2026, 11, 10, 8, 0, tzinfo=timezone.utc)
VALIDATED = datetime(2026, 11, 10, 9, 30, tzinfo=timezone.utc)
ASSIGNED = datetime(2026, 11, 10, 10, 0, tzinfo=timezone.utc)
STARTED = datetime(2026, 11, 10, 12, 0, tzinfo=timezone.utc)
RESOLVED = datetime(2026, 11, 10, 20, 0, tzinfo=timezone.utc)


def make_report_doc(**overrides):
    doc = {
        "_id": ObjectId("672f10a8b9e1c2d3e4f5a6b7"),
        "reporterId": REPORTER,
        "category": "DEPOT_SAUVAGE",
        "status": "RESOLU",
        "location": {"type": "Point", "coordinates": [10.1815234, 36.8064891]},  # Tunis [lng, lat]
        "createdAt": CREATED,
        "updatedAt": RESOLVED,
        "validatedAt": VALIDATED,
        "assignedAt": ASSIGNED,
        "startedAt": STARTED,
        "resolvedAt": RESOLVED,
        "categorySuggested": "DEPOT_SAUVAGE",
        "categoryValidated": "DEPOT_SAUVAGE",
        "aiConfidenceScore": 0.94,
    }
    doc.update(overrides)
    return doc


def test_gps_coordinate_truncation_to_100m():
    """GDPR / CDCF V2 requirement: coordinates rounded to 3 decimals (~100m)."""
    assert round_coordinate(10.1815234) == Decimal("10.182")
    assert round_coordinate(36.8064891) == Decimal("36.806")
    assert round_coordinate(2.3522219) == Decimal("2.352")


def test_citizen_id_salted_sha256_pseudonymisation():
    """ADR-05 & GDPR requirement: raw citizen ID is never exposed, hashed with secret salt."""
    hash_val = hash_citizen_id(REPORTER, SALT)
    assert len(hash_val) == 64
    assert hash_val.islower()
    # Deterministic: same reporter and salt produce the exact same hash
    assert hash_citizen_id(REPORTER, SALT) == hash_val
    # Changing salt alters hash
    assert hash_citizen_id(REPORTER, "different-salt-99999") != hash_val


def test_map_report_calculates_mttr_and_sla_metrics():
    """ECO-41: map_report calculates MTTR in decimal hours and checks SLA breach."""
    doc = make_report_doc()
    row = map_report(doc, SALT)

    # 12 hours from 08:00 to 20:00
    assert row.mttr_hours == Decimal("12.00")
    # DEPOT_SAUVAGE target SLA is 24h, so 12h is NOT breached
    assert row.sla_breached is False
    # Time to qualify: 08:00 to 09:30 = 90 minutes = 5400 seconds
    assert row.time_to_qualify_seconds == 5400
    # Time to pickup: 10:00 to 12:00 = 2.0 hours
    assert row.time_to_pickup_hours == Decimal("2.00")
    # Conformance to 3-decimal coordinates
    assert row.longitude == Decimal("10.182")
    assert row.latitude == Decimal("36.806")


def test_sla_breach_detected_when_mttr_exceeds_threshold():
    """When resolution duration exceeds the category SLA target, sla_breached is True."""
    # Resolved 30 hours after creation (exceeds 24h target for DEPOT_SAUVAGE)
    resolved_late = CREATED + timedelta(hours=30)
    doc = make_report_doc(resolvedAt=resolved_late, updatedAt=resolved_late)
    row = map_report(doc, SALT)

    assert row.mttr_hours == Decimal("30.00")
    assert row.sla_breached is True


def test_unresolved_report_sla_breach_detection():
    """An unresolved report past its SLA target is flagged as sla_breached = True."""
    # Created 50 hours ago, still in status NOUVEAU
    old_created = datetime.now(timezone.utc) - timedelta(hours=50)
    doc = make_report_doc(
        createdAt=old_created,
        status="NOUVEAU",
        resolvedAt=None,
    )
    row = map_report(doc, SALT)
    assert row.mttr_hours is None
    assert row.sla_breached is True


def test_cdc_cli_args_parsing():
    """bi-etl CLI parses --cdc and --mode=cdc flags."""
    args_cdc = main.parse_args(["--cdc"])
    assert args_cdc.cdc is True

    args_mode = main.parse_args(["--mode", "cdc"])
    assert args_mode.mode == "cdc"


def test_etl_config_cdc_interval_setting():
    """EtlConfig includes cdc_interval_seconds configurable via environment."""
    env = {
        "MONGODB_URI": "mongodb://localhost:27017",
        "POSTGRES_DSN": "dbname=dw",
        "ETL_SALT": SALT,
        "ETL_CDC_INTERVAL_SECONDS": "10",
    }
    config = load_config(env)
    assert config.cdc_interval_seconds == 10

    # Default value
    env_default = {
        "MONGODB_URI": "mongodb://localhost:27017",
        "POSTGRES_DSN": "dbname=dw",
        "ETL_SALT": SALT,
    }
    assert load_config(env_default).cdc_interval_seconds == DEFAULT_CDC_INTERVAL_SECONDS


def test_build_fact_values_with_cdc_metrics():
    """PostgresLoader build_fact_values includes mttr_hours, sla_breached, and lead times."""
    doc = make_report_doc()
    row = map_report(doc, SALT)
    values, unknown = build_fact_values([row], {"DEPOT_SAUVAGE": 10})

    assert len(values) == 1
    tup = values[0]
    # Check appended metrics
    # tup index 13: mttr_hours
    # tup index 14: sla_breached
    # tup index 15: time_to_qualify_seconds
    # tup index 16: time_to_pickup_hours
    assert tup[13] == Decimal("12.00")
    assert tup[14] is False
    assert tup[15] == 5400
    assert tup[16] == Decimal("2.00")
