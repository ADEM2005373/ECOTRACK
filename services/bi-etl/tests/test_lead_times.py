import json
from datetime import datetime, timedelta, timezone

import pytest

from transformers.lead_times import (
    INVALID_TIMESTAMP,
    NEGATIVE_DURATION,
    build_lead_times,
    elapsed,
    pickup_hours,
    sla_breached,
    total_resolution_hours,
    triage_hours,
)

UTC = timezone.utc
CET = timezone(timedelta(hours=1))   # Paris winter time
CEST = timezone(timedelta(hours=2))  # Paris summer time

# Ticket example: triage 2.4 h, pickup 5.1 h, total 14.8 h.
CREATED = datetime(2026, 11, 10, 8, 0, tzinfo=UTC)
VALIDATED = datetime(2026, 11, 10, 10, 24, tzinfo=UTC)
ASSIGNED = datetime(2026, 11, 10, 11, 0, tzinfo=UTC)
STARTED = datetime(2026, 11, 10, 16, 6, tzinfo=UTC)
RESOLVED = datetime(2026, 11, 10, 22, 48, tzinfo=UTC)
DEPOT_SAUVAGE_SLA = 24  # Dim_Category seed (02_seed_dimensions.sql)


# --- Normal values ------------------------------------------------------------

def test_ticket_example_values():
    assert triage_hours(CREATED, VALIDATED) == 2.4
    assert pickup_hours(ASSIGNED, STARTED) == 5.1
    assert total_resolution_hours(CREATED, RESOLVED) == 14.8


def test_build_lead_times_matches_ticket_json():
    lead_times = build_lead_times(
        created_at=CREATED,
        validated_at=VALIDATED,
        assigned_at=ASSIGNED,
        started_at=STARTED,
        resolved_at=RESOLVED,
        target_sla_hours=DEPOT_SAUVAGE_SLA,
    )
    assert lead_times.as_dict() == {
        "triageHours": 2.4,
        "pickupHours": 5.1,
        "totalResolutionHours": 14.8,
        "slaBreached": False,
    }
    assert lead_times.anomalies == ()
    json.dumps(lead_times.as_dict())  # JSON-serialisable as is


def test_multi_day_duration():
    assert total_resolution_hours(CREATED, CREATED + timedelta(days=3, hours=6)) == 78.0


# --- Missing inputs -----------------------------------------------------------

@pytest.mark.parametrize("start, end", [(None, VALIDATED), (CREATED, None), (None, None)])
def test_missing_timestamp_returns_none_without_anomaly(start, end):
    result = elapsed(start, end)
    assert result.hours is None
    assert result.anomaly is None


def test_report_not_processed_yet_has_only_none():
    lead_times = build_lead_times(
        created_at=CREATED, validated_at=None, assigned_at=None,
        started_at=None, resolved_at=None, target_sla_hours=DEPOT_SAUVAGE_SLA,
    )
    assert lead_times.as_dict() == {
        "triageHours": None, "pickupHours": None, "totalResolutionHours": None, "slaBreached": None,
    }
    assert lead_times.anomalies == ()


@pytest.mark.parametrize("bad", ["2026-11-10T10:24:00Z", 1731233040, 2.5])
def test_non_datetime_is_flagged_invalid(bad):
    result = elapsed(CREATED, bad)
    assert result.hours is None
    assert result.anomaly == INVALID_TIMESTAMP


# --- Zero and negative durations ----------------------------------------------

def test_zero_duration_is_zero_not_an_error():
    assert triage_hours(CREATED, CREATED) == 0.0
    assert elapsed(CREATED, CREATED).anomaly is None


def test_negative_duration_returns_none_and_is_flagged():
    result = elapsed(VALIDATED, CREATED)
    assert result.hours is None
    assert result.anomaly == NEGATIVE_DURATION
    assert triage_hours(VALIDATED, CREATED) is None


def test_negative_interval_is_reported_by_name_only():
    lead_times = build_lead_times(
        created_at=CREATED,
        validated_at=CREATED - timedelta(minutes=5),  # clock skew
        assigned_at=ASSIGNED,
        started_at=STARTED,
        resolved_at=RESOLVED,
        target_sla_hours=DEPOT_SAUVAGE_SLA,
    )
    assert lead_times.triage_hours is None
    assert lead_times.pickup_hours == 5.1
    assert lead_times.anomalies == ("triage:negative_duration",)


def test_one_microsecond_backwards_is_negative():
    assert elapsed(CREATED, CREATED - timedelta(microseconds=1)).anomaly == NEGATIVE_DURATION


# --- Time zones ---------------------------------------------------------------

def test_dst_change_uses_real_elapsed_time():
    # 2026-03-29 in Paris: 01:30 CET -> 03:30 CEST is 1 real hour, not 2.
    start = datetime(2026, 3, 29, 1, 30, tzinfo=CET)
    end = datetime(2026, 3, 29, 3, 30, tzinfo=CEST)
    assert triage_hours(start, end) == 1.0


def test_different_offsets_for_the_same_instant_give_zero():
    assert triage_hours(datetime(2026, 11, 10, 9, 0, tzinfo=CET), datetime(2026, 11, 10, 8, 0, tzinfo=UTC)) == 0.0


def test_naive_datetime_is_treated_as_utc():
    naive = datetime(2026, 11, 10, 8, 0)
    assert triage_hours(naive, datetime(2026, 11, 10, 10, 0, tzinfo=CET)) == 1.0


# --- Rounding -----------------------------------------------------------------

def test_rounds_half_up_to_two_decimals():
    # 9630 s = 2.675 h exactly; float round(2.675, 2) would give 2.67.
    assert triage_hours(CREATED, CREATED + timedelta(seconds=9630)) == 2.68


@pytest.mark.parametrize("seconds, expected", [(1, 0.0), (17, 0.0), (18, 0.01), (5400, 1.5), (3599, 1.0)])
def test_small_durations_rounding(seconds, expected):
    assert triage_hours(CREATED, CREATED + timedelta(seconds=seconds)) == expected


def test_microseconds_are_counted():
    # 17.999999 s -> 0.004999 h -> 0.00 ; 18.000001 s -> 0.01
    assert triage_hours(CREATED, CREATED + timedelta(seconds=17, microseconds=999_999)) == 0.0
    assert triage_hours(CREATED, CREATED + timedelta(seconds=18, microseconds=1)) == 0.01


# --- SLA ----------------------------------------------------------------------

@pytest.mark.parametrize(
    "total, target, expected",
    [
        (14.8, 24, False),
        (30.0, 24, True),
        (24.0, 24, False),     # equal = respected
        (24.01, 24, True),
        (None, 24, None),      # not resolved yet
        (14.8, None, None),    # unknown category / SLA
        (14.8, 0, None),       # invalid target
        (14.8, -5, None),
    ],
)
def test_sla_breached(total, target, expected):
    assert sla_breached(total, target) is expected


def test_build_lead_times_sla_breached_true():
    lead_times = build_lead_times(
        created_at=CREATED, validated_at=VALIDATED, assigned_at=ASSIGNED, started_at=STARTED,
        resolved_at=CREATED + timedelta(hours=13), target_sla_hours=12,  # DECHETS_TOXIQUES
    )
    assert lead_times.total_resolution_hours == 13.0
    assert lead_times.sla_breached is True
