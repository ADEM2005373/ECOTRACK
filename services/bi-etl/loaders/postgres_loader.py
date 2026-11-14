"""Secure load of Fact_Reports rows into the PostgreSQL warehouse (ECO-24 / SCRUM-57).

- Parameterized SQL only (psycopg2 placeholders / execute_values), never string-built.
- One transaction per batch: the rows AND the watermark are committed together,
  or both are rolled back (a failed batch never advances the watermark).
- UPSERT on report_id: re-running the ETL never creates duplicates.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from typing import Any

import psycopg2
from psycopg2.extensions import connection as PgConnection
from psycopg2.extras import execute_values

from transform import FactReportRow, as_utc
from watermark import Watermark

PIPELINE_NAME = "reports_to_fact_reports"
CONNECT_TIMEOUT_SECONDS = 10

# The WHERE clause keeps the newest version if an older one is ever replayed
# (for example after a manual watermark reset). category* fields are updated
# too: the category can change after the human validation.
UPSERT_FACT_REPORTS_SQL = """
INSERT INTO ecotrack_dw.Fact_Reports AS f (
    report_id, citizen_hash, date_created_key, category_code,
    category_suggested_ai_key, category_validated_human_key,
    ai_confidence_score, is_ai_concordant, report_status,
    longitude, latitude, created_at, updated_at
)
VALUES %s
ON CONFLICT (report_id) DO UPDATE SET
    report_status = EXCLUDED.report_status,
    updated_at = EXCLUDED.updated_at,
    category_code = EXCLUDED.category_code,
    category_suggested_ai_key = EXCLUDED.category_suggested_ai_key,
    category_validated_human_key = EXCLUDED.category_validated_human_key,
    ai_confidence_score = EXCLUDED.ai_confidence_score,
    is_ai_concordant = EXCLUDED.is_ai_concordant
WHERE f.updated_at IS NULL OR EXCLUDED.updated_at >= f.updated_at
RETURNING f.report_id
"""

UPSERT_WATERMARK_SQL = """
INSERT INTO ecotrack_dw.etl_sync_state (pipeline_name, last_updated_at, last_report_id, updated_at)
VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
ON CONFLICT (pipeline_name) DO UPDATE SET
    last_updated_at = EXCLUDED.last_updated_at,
    last_report_id = EXCLUDED.last_report_id,
    updated_at = CURRENT_TIMESTAMP
"""

SELECT_WATERMARK_SQL = """
SELECT last_updated_at, last_report_id
FROM ecotrack_dw.etl_sync_state
WHERE pipeline_name = %s
"""

SELECT_CATEGORY_KEYS_SQL = "SELECT category_code, category_key FROM ecotrack_dw.Dim_Category"
SELECT_DATE_KEYS_SQL = "SELECT date_key FROM ecotrack_dw.Dim_Date"


def connect_postgres(dsn: str) -> PgConnection:
    """Open a warehouse connection with a UTC session time zone."""
    return psycopg2.connect(
        dsn,
        connect_timeout=CONNECT_TIMEOUT_SECONDS,
        application_name="ecotrack-bi-etl",
        options="-c TimeZone=UTC",
    )


def dedupe_latest(rows: Iterable[FactReportRow]) -> list[FactReportRow]:
    """Keep one row per report_id (the most recent): a single INSERT ... ON CONFLICT
    statement cannot update the same row twice."""
    latest: dict[str, FactReportRow] = {}
    for row in rows:
        current = latest.get(row.report_id)
        if current is None or row.updated_at >= current.updated_at:
            latest[row.report_id] = row
    return list(latest.values())


def _category_key(code: str | None, category_keys: Mapping[str, int]) -> tuple[int | None, bool]:
    """(key, unknown): unknown codes become NULL keys (no insert: Dim_Category
    requires business attributes such as the SLA that the ETL cannot invent)."""
    if code is None:
        return None, False
    key = category_keys.get(code)
    return key, key is None


def build_fact_values(
    rows: Sequence[FactReportRow], category_keys: Mapping[str, int]
) -> tuple[list[tuple[Any, ...]], int]:
    """Rows -> SQL parameter tuples, plus the number of rows with an unknown category code."""
    values: list[tuple[Any, ...]] = []
    unknown = 0
    for row in rows:
        suggested_key, suggested_unknown = _category_key(row.category_suggested, category_keys)
        validated_key, validated_unknown = _category_key(row.category_validated, category_keys)
        unknown += int(suggested_unknown or validated_unknown)
        values.append((
            row.report_id,
            row.citizen_hash,
            row.date_created_key,
            row.category_code,
            suggested_key,
            validated_key,
            row.ai_confidence_score,
            row.is_ai_concordant,
            row.report_status,
            row.longitude,
            row.latitude,
            row.created_at,
            row.updated_at,
        ))
    return values, unknown


class PostgresLoader:
    def __init__(self, conn: PgConnection, pipeline_name: str = PIPELINE_NAME) -> None:
        self._conn = conn
        self._pipeline_name = pipeline_name

    def load_watermark(self) -> Watermark | None:
        with self._conn, self._conn.cursor() as cur:
            cur.execute(SELECT_WATERMARK_SQL, (self._pipeline_name,))
            row = cur.fetchone()
        if row is None:
            return None
        return Watermark(updated_at=as_utc(row[0]), report_id=row[1])

    def load_category_keys(self) -> dict[str, int]:
        with self._conn, self._conn.cursor() as cur:
            cur.execute(SELECT_CATEGORY_KEYS_SQL)
            return {code: key for code, key in cur.fetchall()}

    def load_date_keys(self) -> frozenset[int]:
        with self._conn, self._conn.cursor() as cur:
            cur.execute(SELECT_DATE_KEYS_SQL)
            return frozenset(key for (key,) in cur.fetchall())

    def commit_batch(self, values: Sequence[tuple[Any, ...]], watermark: Watermark | None) -> int:
        """Upsert the rows and store the watermark in ONE transaction.

        Returns the number of rows inserted or updated. On any error the
        transaction is rolled back (psycopg2 `with conn`) and the error propagates.
        """
        with self._conn, self._conn.cursor() as cur:
            upserted = 0
            if values:
                returned = execute_values(
                    cur, UPSERT_FACT_REPORTS_SQL, values, page_size=len(values), fetch=True
                )
                upserted = len(returned)
            if watermark is not None:
                cur.execute(
                    UPSERT_WATERMARK_SQL,
                    (self._pipeline_name, watermark.updated_at, watermark.report_id),
                )
        return upserted
