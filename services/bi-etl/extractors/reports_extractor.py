"""Incremental extraction of MongoDB `reports` (ECO-24 / SCRUM-57).

Reads only the reports modified after the watermark, in (updatedAt, _id) order,
batch by batch through a server-side cursor (the collection is never loaded
into memory at once).
"""

from __future__ import annotations

from collections.abc import Iterator
from datetime import timezone
from typing import Any

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection

from watermark import Watermark, build_incremental_filter

REPORTS_COLLECTION = "reports"
# Data minimisation: only the fields needed by Fact_Reports leave MongoDB
# (no description, no image URLs).
REPORT_PROJECTION: dict[str, int] = {
    "_id": 1,
    "reporterId": 1,
    "category": 1,
    "categorySuggested": 1,
    "categoryValidated": 1,
    "aiConfidenceScore": 1,
    "location": 1,
    "status": 1,
    "createdAt": 1,
    "updatedAt": 1,
}
# Must match the watermark ordering (see watermark.py).
REPORT_SORT = [("updatedAt", ASCENDING), ("_id", ASCENDING)]
SERVER_SELECTION_TIMEOUT_MS = 10_000


def create_mongo_client(uri: str) -> MongoClient:
    """MongoDB client returning timezone-aware UTC datetimes; fails fast if unreachable."""
    client: MongoClient = MongoClient(
        uri,
        tz_aware=True,
        tzinfo=timezone.utc,
        serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS,
        appname="ecotrack-bi-etl",
    )
    client.admin.command("ping")
    return client


class ReportsExtractor:
    def __init__(self, collection: Collection, batch_size: int) -> None:
        if batch_size <= 0:
            raise ValueError("batch_size must be greater than 0")
        self._collection = collection
        self._batch_size = batch_size

    def iter_batches(self, watermark: Watermark | None) -> Iterator[list[dict[str, Any]]]:
        """Yield lists of at most batch_size plain dicts, oldest modification first."""
        cursor = (
            self._collection.find(build_incremental_filter(watermark), REPORT_PROJECTION)
            .sort(REPORT_SORT)
            .batch_size(self._batch_size)
        )
        try:
            batch: list[dict[str, Any]] = []
            for doc in cursor:
                batch.append(dict(doc))
                if len(batch) == self._batch_size:
                    yield batch
                    batch = []
            if batch:
                yield batch
        finally:
            cursor.close()
