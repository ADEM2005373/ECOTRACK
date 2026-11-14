from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from bson import ObjectId

from transform import (
    COORD_DECIMALS,
    InvalidReportError,
    hash_citizen_id,
    map_report,
    round_coordinate,
    to_date_key,
)

SALT = "unit-test-salt-not-a-secret-0123"
REPORTER = ObjectId("65a1b2c3d4e5f60718293a4b")
CREATED = datetime(2026, 11, 10, 10, 0, tzinfo=timezone.utc)
UPDATED = datetime(2026, 11, 10, 12, 30, tzinfo=timezone.utc)


def make_doc(**overrides):
    doc = {
        "_id": ObjectId("672f10a8b9e1c2d3e4f5a6b7"),
        "reporterId": REPORTER,
        "category": "DEPOT_SAUVAGE",
        "status": "NOUVEAU",
        "location": {"type": "Point", "coordinates": [10.1815, 36.8065]},  # Tunis [lng, lat]
        "createdAt": CREATED,
        "updatedAt": UPDATED,
    }
    doc.update(overrides)
    return doc


# --- Pseudonymisation ---------------------------------------------------------

def test_hash_is_deterministic_and_64_hex():
    first = hash_citizen_id(REPORTER, SALT)
    assert first == hash_citizen_id(REPORTER, SALT)
    assert len(first) == 64
    assert all(c in "0123456789abcdef" for c in first)


def test_hash_changes_with_salt():
    assert hash_citizen_id(REPORTER, SALT) != hash_citizen_id(REPORTER, SALT + "x")


def test_hash_accepts_object_id_and_equals_its_hex_string():
    # The ticket snippet `reporterId + salt` would raise TypeError on an ObjectId.
    assert hash_citizen_id(REPORTER, SALT) == hash_citizen_id(str(REPORTER), SALT)


def test_hash_never_contains_raw_id():
    assert str(REPORTER) not in hash_citizen_id(REPORTER, SALT)


def test_hash_refuses_empty_salt():
    with pytest.raises(ValueError):
        hash_citizen_id(REPORTER, "")


# --- Coordinates ----------------------------------------------------------------

def test_coord_decimals_is_three():
    assert COORD_DECIMALS == 3


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (10.1815, "10.182"),
        (36.8065, "36.807"),
        (10.76, "10.760"),
        (34.7406, "34.741"),
        (10.8575, "10.858"),
        (33.8076, "33.808"),
        (2.3522219, "2.352"),
        (-0.0004, "0.000"),
    ],
)
def test_round_coordinate(raw, expected):
    assert round_coordinate(raw) == Decimal(expected)


# --- Mapping --------------------------------------------------------------------

def test_map_report_uses_geojson_lng_lat_order_and_rounds():
    row = map_report(make_doc(), SALT)
    assert row.longitude == Decimal("10.182")
    assert row.latitude == Decimal("36.807")


def test_map_report_core_fields():
    row = map_report(make_doc(), SALT)
    assert row.report_id == "672f10a8b9e1c2d3e4f5a6b7"
    assert row.citizen_hash == hash_citizen_id(REPORTER, SALT)
    assert row.category_code == "DEPOT_SAUVAGE"
    assert row.report_status == "NOUVEAU"
    assert row.date_created_key == 20261110
    assert row.is_ai_concordant is None
    assert row.ai_confidence_score is None


def test_map_report_never_exposes_raw_reporter_id():
    row = map_report(make_doc(), SALT)
    assert str(REPORTER) not in repr(row)


def test_map_report_timestamps_are_utc():
    tunis = timezone(timedelta(hours=1))
    row = map_report(make_doc(createdAt=datetime(2026, 11, 10, 0, 30, tzinfo=tunis)), SALT)
    assert row.created_at == datetime(2026, 11, 9, 23, 30, tzinfo=timezone.utc)
    assert row.created_at.utcoffset() == timedelta(0)
    assert row.date_created_key == 20261109  # UTC calendar day


def test_naive_bson_datetime_is_treated_as_utc():
    row = map_report(make_doc(updatedAt=datetime(2026, 11, 10, 12, 30)), SALT)
    assert row.updated_at == UPDATED


def test_to_date_key():
    assert to_date_key(datetime(2026, 1, 5, 23, 59, tzinfo=timezone.utc)) == 20260105


def test_ai_fields_and_concordance():
    row = map_report(
        make_doc(categorySuggested="DEPOT_SAUVAGE", categoryValidated="ENCOMBRANTS", aiConfidenceScore=0.87654),
        SALT,
    )
    assert row.is_ai_concordant is False
    assert row.ai_confidence_score == Decimal("0.8765")
    same = map_report(make_doc(categorySuggested="ENCOMBRANTS", categoryValidated="ENCOMBRANTS"), SALT)
    assert same.is_ai_concordant is True


def test_out_of_range_ai_score_is_dropped():
    assert map_report(make_doc(aiConfidenceScore=1.5), SALT).ai_confidence_score is None


@pytest.mark.parametrize(
    ("overrides", "reason"),
    [
        ({"location": None}, "invalid_location"),
        ({"location": {"type": "Point", "coordinates": [10.18]}}, "invalid_location"),
        ({"location": {"type": "Point", "coordinates": [200.0, 36.8]}}, "invalid_location"),
        ({"location": {"type": "Point", "coordinates": ["10.1", "36.8"]}}, "invalid_location"),
        ({"location": {"type": "Polygon", "coordinates": [10.18, 36.80]}}, "invalid_location"),
        ({"reporterId": None}, "invalid_reporter_id"),
        ({"reporterId": 42}, "invalid_reporter_id"),
        ({"status": "CLOSED"}, "invalid_status"),
        ({"category": ""}, "invalid_category"),
        ({"category": "X" * 51}, "invalid_category"),
        ({"createdAt": "2026-11-10"}, "invalid_timestamps"),
        ({"_id": "not-an-object-id"}, "invalid_id"),
    ],
)
def test_invalid_documents_raise_reason_without_data(overrides, reason):
    with pytest.raises(InvalidReportError) as info:
        map_report(make_doc(**overrides), SALT)
    assert info.value.reason == reason
    assert str(REPORTER) not in str(info.value)


def test_missing_reporter_id_is_invalid():
    doc = make_doc()
    del doc["reporterId"]
    with pytest.raises(InvalidReportError):
        map_report(doc, SALT)
