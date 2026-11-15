"""Lead-time metrics of a report, in decimal hours for Power BI (ECO-33 / SCRUM-59).

Pure functions, no I/O. Timestamps follow the FSM of ADR-03:
    created_at  -> report creation (citizen)
    validated_at -> T1 NOUVEAU -> VALIDE (agent)
    assigned_at  -> T2 VALIDE -> ASSIGNE (agent)
    started_at   -> T3 ASSIGNE -> EN_TRAITEMENT (worker)
    resolved_at  -> T4 EN_TRAITEMENT -> RESOLU (worker)

    triage  = validated_at - created_at
    pickup  = started_at - assigned_at
    total   = resolved_at - created_at

A missing timestamp gives None (the step has not happened yet). An end before
its start (clock skew, bad data) also gives None and is reported as an anomaly
code, never with report data. Naive datetimes are treated as UTC, like the
BSON dates handled by transform.as_utc.

Not wired into the ETL yet: validatedAt / assignedAt / startedAt / resolvedAt
do not exist in the MongoDB reports (ECO-20 schema); they depend on the
workflow FSM (ECO-30 / SCRUM-50).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from transform import as_utc

HOURS_DECIMALS = 2
_HOURS_QUANTUM = Decimal(1).scaleb(-HOURS_DECIMALS)
_SECONDS_PER_HOUR = Decimal(3600)

# Anomaly reasons (fixed codes, safe to log or count).
NEGATIVE_DURATION = "negative_duration"
INVALID_TIMESTAMP = "invalid_timestamp"


@dataclass(frozen=True)
class Duration:
    """Elapsed hours, or None with an optional anomaly reason."""

    hours: float | None
    anomaly: str | None = None


def _timedelta_hours(delta: timedelta) -> float:
    """Exact timedelta -> hours rounded half up to HOURS_DECIMALS (no float drift)."""
    seconds = Decimal(delta.days * 86400 + delta.seconds) + Decimal(delta.microseconds) / Decimal(1_000_000)
    return float((seconds / _SECONDS_PER_HOUR).quantize(_HOURS_QUANTUM, rounding=ROUND_HALF_UP))


def elapsed(start: Any, end: Any) -> Duration:
    """Duration between two timestamps.

    None input -> Duration(None) (step not reached, not an anomaly).
    Non-datetime input -> Duration(None, INVALID_TIMESTAMP).
    end < start -> Duration(None, NEGATIVE_DURATION). end == start -> 0.0 hours.
    """
    if start is None or end is None:
        return Duration(None)
    if not isinstance(start, datetime) or not isinstance(end, datetime):
        return Duration(None, INVALID_TIMESTAMP)
    delta = as_utc(end) - as_utc(start)
    if delta < timedelta(0):
        return Duration(None, NEGATIVE_DURATION)
    return Duration(_timedelta_hours(delta))


def triage_hours(created_at: datetime | None, validated_at: datetime | None) -> float | None:
    """T_Triage = validatedAt - createdAt, in decimal hours (None if unknown or invalid)."""
    return elapsed(created_at, validated_at).hours


def pickup_hours(assigned_at: datetime | None, started_at: datetime | None) -> float | None:
    """T_Pickup = startedAt - assignedAt, in decimal hours (None if unknown or invalid)."""
    return elapsed(assigned_at, started_at).hours


def total_resolution_hours(created_at: datetime | None, resolved_at: datetime | None) -> float | None:
    """resolvedAt - createdAt, in decimal hours (None while the report is not resolved)."""
    return elapsed(created_at, resolved_at).hours


def sla_breached(total_hours: float | None, target_sla_hours: float | None) -> bool | None:
    """True if the resolution took longer than the category SLA (Dim_Category.target_sla_hours).

    None when the report is not resolved yet (the value would depend on the ETL run
    time, and an unchanged report is not re-extracted), or when the target is
    unknown or not a positive number. Equal to the target = respected.
    """
    if total_hours is None or target_sla_hours is None or target_sla_hours <= 0:
        return None
    return total_hours > target_sla_hours


@dataclass(frozen=True)
class LeadTimes:
    triage_hours: float | None
    pickup_hours: float | None
    total_resolution_hours: float | None
    sla_breached: bool | None
    # One code per invalid interval, e.g. ("triage:negative_duration",). No report data.
    anomalies: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, float | bool | None]:
        """`leadTimes` object of the ticket example (camelCase keys)."""
        return {
            "triageHours": self.triage_hours,
            "pickupHours": self.pickup_hours,
            "totalResolutionHours": self.total_resolution_hours,
            "slaBreached": self.sla_breached,
        }


def build_lead_times(
    *,
    created_at: datetime | None,
    validated_at: datetime | None,
    assigned_at: datetime | None,
    started_at: datetime | None,
    resolved_at: datetime | None,
    target_sla_hours: float | None,
) -> LeadTimes:
    """Compute every lead time of one report and collect the anomaly codes."""
    intervals = {
        "triage": elapsed(created_at, validated_at),
        "pickup": elapsed(assigned_at, started_at),
        "total": elapsed(created_at, resolved_at),
    }
    anomalies = tuple(f"{name}:{d.anomaly}" for name, d in intervals.items() if d.anomaly)
    total = intervals["total"].hours
    return LeadTimes(
        triage_hours=intervals["triage"].hours,
        pickup_hours=intervals["pickup"].hours,
        total_resolution_hours=total,
        sla_breached=sla_breached(total, target_sla_hours),
        anomalies=anomalies,
    )
