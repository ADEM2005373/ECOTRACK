"""Pure transformation of a MongoDB report into a Fact_Reports row (ECO-24 / SCRUM-57).

No I/O here: everything is deterministic and unit-testable. The raw reporterId
is hashed immediately and is never part of the returned row.
"""

from __future__ import annotations

import hashlib
import math
import re
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from bson import ObjectId

# GDPR data minimisation: the warehouse only keeps positions rounded to
# 3 decimals (~100 m), the precision planned by ECO-41 / SCRUM-52 for
# Dim_Geography. MongoDB keeps the exact coordinates for operations.
COORD_DECIMALS = 3
_COORD_QUANTUM = Decimal(1).scaleb(-COORD_DECIMALS)

# ReportStatus enum of packages/shared/src/types/report.ts (ECO-20).
REPORT_STATUSES = frozenset({
    "NOUVEAU",
    "EN_COURS_DE_VALIDATION",
    "VALIDE",
    "ASSIGNE",
    "EN_TRAITEMENT",
    "RESOLU",
    "REJETE",
})
MAX_CATEGORY_LENGTH = 50
_OBJECT_ID_HEX = re.compile(r"^[0-9a-f]{24}$")


class InvalidReportError(ValueError):
    """A document that cannot be loaded. `reason` is a fixed code, never document data."""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


@dataclass(frozen=True)
class FactReportRow:
    report_id: str
    citizen_hash: str
    date_created_key: int
    category_code: str
    category_suggested: str | None
    category_validated: str | None
    ai_confidence_score: Decimal | None
    is_ai_concordant: bool | None
    report_status: str
    longitude: Decimal
    latitude: Decimal
    created_at: datetime
    updated_at: datetime


def hash_citizen_id(reporter_id: ObjectId | str, salt: str) -> str:
    """Salted SHA-256 pseudonym of a citizen id (64 lowercase hex chars).

    Deterministic, so Power BI can still count distinct citizens. str() is
    required: the ticket snippet `reporterId + salt` raises TypeError on an ObjectId.
    """
    if not salt:
        raise ValueError("salt must not be empty")
    return hashlib.sha256((str(reporter_id) + salt).encode("utf-8")).hexdigest()


def round_coordinate(value: float) -> Decimal:
    """Round a coordinate to COORD_DECIMALS decimals (half up, via its decimal repr)."""
    return Decimal(repr(float(value))).quantize(_COORD_QUANTUM, rounding=ROUND_HALF_UP)


def as_utc(value: datetime) -> datetime:
    """Return an aware UTC datetime (naive values are BSON dates, hence already UTC)."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def to_date_key(value: datetime) -> int:
    """Dim_Date key (YYYYMMDD) of the UTC calendar day."""
    day = as_utc(value)
    return day.year * 10000 + day.month * 100 + day.day


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _extract_lng_lat(location: Any) -> tuple[float, float]:
    """GeoJSON Point -> (longitude, latitude). GeoJSON order is [lng, lat]."""
    if not isinstance(location, Mapping) or location.get("type") != "Point":
        raise InvalidReportError("invalid_location")
    coords = location.get("coordinates")
    if not isinstance(coords, (list, tuple)) or len(coords) != 2:
        raise InvalidReportError("invalid_location")
    lng, lat = coords
    if not (_is_number(lng) and _is_number(lat) and -180 <= lng <= 180 and -90 <= lat <= 90):
        raise InvalidReportError("invalid_location")
    return float(lng), float(lat)


def _report_id(doc: Mapping[str, Any]) -> str:
    report_id = str(doc.get("_id", ""))
    if not _OBJECT_ID_HEX.match(report_id):
        raise InvalidReportError("invalid_id")
    return report_id


def _reporter_id(doc: Mapping[str, Any]) -> ObjectId | str:
    reporter_id = doc.get("reporterId")
    if isinstance(reporter_id, ObjectId):
        return reporter_id
    if isinstance(reporter_id, str) and reporter_id.strip():
        return reporter_id.strip()
    raise InvalidReportError("invalid_reporter_id")


def _timestamp(doc: Mapping[str, Any], name: str) -> datetime:
    value = doc.get(name)
    if not isinstance(value, datetime):
        raise InvalidReportError("invalid_timestamps")
    return as_utc(value)


def _category(doc: Mapping[str, Any]) -> str:
    category = doc.get("category")
    if not isinstance(category, str) or not category.strip() or len(category.strip()) > MAX_CATEGORY_LENGTH:
        raise InvalidReportError("invalid_category")
    return category.strip()


def _optional_code(doc: Mapping[str, Any], name: str) -> str | None:
    value = doc.get(name)
    if isinstance(value, str) and value.strip():
        return value.strip()[:MAX_CATEGORY_LENGTH]
    return None


def _ai_score(doc: Mapping[str, Any]) -> Decimal | None:
    value = doc.get("aiConfidenceScore")
    if _is_number(value) and 0 <= value <= 1:
        return Decimal(repr(float(value))).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return None


def _concordance(suggested: str | None, validated: str | None) -> bool | None:
    """AI vs human agreement (US-10); unknown (NULL) until both categories exist."""
    if suggested is None or validated is None:
        return None
    return suggested == validated


def map_report(doc: Mapping[str, Any], salt: str) -> FactReportRow:
    """Map a MongoDB `reports` document to a Fact_Reports row or raise InvalidReportError."""
    report_id = _report_id(doc)
    reporter_id = _reporter_id(doc)
    lng, lat = _extract_lng_lat(doc.get("location"))
    status = doc.get("status")
    if status not in REPORT_STATUSES:
        raise InvalidReportError("invalid_status")
    created_at = _timestamp(doc, "createdAt")
    updated_at = _timestamp(doc, "updatedAt")
    suggested = _optional_code(doc, "categorySuggested")
    validated = _optional_code(doc, "categoryValidated")
    return FactReportRow(
        report_id=report_id,
        citizen_hash=hash_citizen_id(reporter_id, salt),
        date_created_key=to_date_key(created_at),
        category_code=_category(doc),
        category_suggested=suggested,
        category_validated=validated,
        ai_confidence_score=_ai_score(doc),
        is_ai_concordant=_concordance(suggested, validated),
        report_status=status,
        longitude=round_coordinate(lng),
        latitude=round_coordinate(lat),
        created_at=created_at,
        updated_at=updated_at,
    )
