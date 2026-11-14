import logging
from collections import Counter
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from bson import ObjectId

import main
from config import DEFAULT_BATCH_SIZE, ConfigError, load_config
from loaders.postgres_loader import build_fact_values, dedupe_latest
from transform import FactReportRow

SALT = "unit-test-salt-not-a-secret-0123"
VALID_ENV = {
    "MONGODB_URI": "mongodb://user:secret-pw@localhost:27017/?authSource=admin",
    "POSTGRES_DSN": "host=localhost dbname=dw user=etl password=secret-pw",
    "ETL_SALT": SALT,
}


# --- Configuration --------------------------------------------------------------

def test_valid_config_and_defaults():
    config = load_config(VALID_ENV)
    assert config.batch_size == DEFAULT_BATCH_SIZE
    assert config.mongodb_db == "ecotrack_db"


@pytest.mark.parametrize("salt", [None, "", "   "])
def test_missing_or_empty_salt_is_refused(salt):
    env = dict(VALID_ENV)
    if salt is None:
        del env["ETL_SALT"]
    else:
        env["ETL_SALT"] = salt
    with pytest.raises(ConfigError, match="ETL_SALT"):
        load_config(env)


def test_ticket_default_salt_is_refused():
    with pytest.raises(ConfigError, match="public example"):
        load_config({**VALID_ENV, "ETL_SALT": "ecotrack_secret_salt_2026"})


def test_short_salt_is_refused():
    with pytest.raises(ConfigError, match="at least"):
        load_config({**VALID_ENV, "ETL_SALT": "short"})


@pytest.mark.parametrize("name", ["MONGODB_URI", "POSTGRES_DSN"])
def test_missing_connection_settings_are_refused(name):
    env = {k: v for k, v in VALID_ENV.items() if k != name}
    with pytest.raises(ConfigError, match=name):
        load_config(env)


@pytest.mark.parametrize("value", ["0", "-5", "abc"])
def test_invalid_batch_size_is_refused(value):
    with pytest.raises(ConfigError, match="ETL_BATCH_SIZE"):
        load_config({**VALID_ENV, "ETL_BATCH_SIZE": value})


def test_config_repr_hides_secrets():
    text = repr(load_config(VALID_ENV))
    assert SALT not in text
    assert "secret-pw" not in text


def test_main_refuses_to_start_without_salt(monkeypatch, caplog):
    monkeypatch.setenv("MONGODB_URI", VALID_ENV["MONGODB_URI"])
    monkeypatch.setenv("POSTGRES_DSN", VALID_ENV["POSTGRES_DSN"])
    monkeypatch.delenv("ETL_SALT", raising=False)

    def fail_if_called(*_args, **_kwargs):
        raise AssertionError("must not connect without a valid configuration")

    monkeypatch.setattr(main, "run_once", fail_if_called)
    with caplog.at_level(logging.ERROR):
        assert main.main(["--once"]) == main.EXIT_CONFIG_ERROR
    assert "ETL_SALT" in caplog.text
    assert "secret-pw" not in caplog.text


# --- Pipeline helpers -------------------------------------------------------------

def _doc(oid, created, **overrides):
    doc = {
        "_id": ObjectId(oid),
        "reporterId": ObjectId("65a1b2c3d4e5f60718293a4b"),
        "category": "DEPOT_SAUVAGE",
        "status": "NOUVEAU",
        "location": {"type": "Point", "coordinates": [10.7600, 34.7406]},  # Sfax
        "createdAt": created,
        "updatedAt": created,
    }
    doc.update(overrides)
    return doc


def test_transform_batch_skips_invalid_and_out_of_dim_date_documents():
    in_range = datetime(2026, 11, 10, tzinfo=timezone.utc)
    out_of_range = datetime(2031, 1, 1, tzinfo=timezone.utc)
    docs = [
        _doc("672f10a8b9e1c2d3e4f5a601", in_range),
        _doc("672f10a8b9e1c2d3e4f5a602", in_range, location=None),
        _doc("672f10a8b9e1c2d3e4f5a603", out_of_range),
    ]
    rows, skipped = main.transform_batch(docs, SALT, frozenset({20261110}))
    assert [r.report_id for r in rows] == ["672f10a8b9e1c2d3e4f5a601"]
    assert skipped == Counter({"invalid_location": 1, "date_outside_dim_date": 1})


def _row(report_id, updated_at, suggested=None, validated=None):
    return FactReportRow(
        report_id=report_id, citizen_hash="a" * 64, date_created_key=20261110,
        category_code="DEPOT_SAUVAGE", category_suggested=suggested, category_validated=validated,
        ai_confidence_score=None, is_ai_concordant=None, report_status="NOUVEAU",
        longitude=Decimal("10.760"), latitude=Decimal("34.741"),
        created_at=updated_at, updated_at=updated_at,
    )


def test_dedupe_latest_keeps_most_recent_version():
    t = datetime(2026, 11, 10, tzinfo=timezone.utc)
    rows = dedupe_latest([_row("a", t), _row("a", t + timedelta(minutes=1)), _row("b", t)])
    assert sorted((r.report_id, r.updated_at) for r in rows) == [("a", t + timedelta(minutes=1)), ("b", t)]


def test_build_fact_values_resolves_known_categories_and_counts_unknown():
    t = datetime(2026, 11, 10, tzinfo=timezone.utc)
    values, unknown = build_fact_values(
        [_row("a", t, suggested="DEPOT_SAUVAGE", validated="NOT_IN_DIM"), _row("b", t)],
        {"DEPOT_SAUVAGE": 1},
    )
    assert unknown == 1
    # (report_id, citizen_hash, date_key, category_code, suggested_key, validated_key, ...)
    assert values[0][4] == 1 and values[0][5] is None
    assert values[1][4] is None and values[1][5] is None
    # GeoJSON order kept: longitude column before latitude column
    assert values[0][9] == Decimal("10.760") and values[0][10] == Decimal("34.741")


def test_safe_error_drops_detail_lines():
    exc = RuntimeError('null value violates constraint\nDETAIL:  Failing row contains (secret-data).')
    assert main.safe_error(exc) == "RuntimeError: null value violates constraint"
