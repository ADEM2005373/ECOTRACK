"""Incremental extraction watermark: a compound cursor (updatedAt, _id).

Why not `updatedAt > last_sync` alone: several reports can share the exact same
updatedAt (millisecond precision). If a batch ends in the middle of such a group,
`$gt` would skip the rest of the group forever. `$gte` would not lose them but
would re-read the last group on every run. The compound cursor resumes exactly
after the last (updatedAt, _id) pair processed: nothing is lost, nothing is re-read.

Why not "now": reports written while a run is in progress could be older than
"now" but not yet read. The watermark is therefore the maximum (updatedAt, _id)
actually read in the committed batch.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from bson import ObjectId

from transform import as_utc


@dataclass(frozen=True, order=True)
class Watermark:
    updated_at: datetime
    report_id: str

    def describe(self) -> str:
        return f"{self.updated_at.isoformat()}/{self.report_id}"


def build_incremental_filter(watermark: Watermark | None) -> dict[str, Any]:
    """MongoDB filter selecting reports strictly after the watermark.

    Only documents with a usable cursor position are selected: an ObjectId _id
    and a date updatedAt (always true for documents written through Mongoose).
    """
    if watermark is None:
        # First run: load everything.
        return {"_id": {"$type": "objectId"}, "updatedAt": {"$type": "date"}}
    last_id = ObjectId(watermark.report_id)
    return {
        "_id": {"$type": "objectId"},
        "$or": [
            {"updatedAt": {"$gt": watermark.updated_at}},
            {"updatedAt": watermark.updated_at, "_id": {"$gt": last_id}},
        ]
    }


def doc_position(doc: Mapping[str, Any]) -> Watermark:
    """Cursor position of a document (it was selected on a date updatedAt)."""
    return Watermark(updated_at=as_utc(doc["updatedAt"]), report_id=str(doc["_id"]))


def next_watermark(docs: Iterable[Mapping[str, Any]], current: Watermark | None) -> Watermark | None:
    """Highest position among the documents READ in a batch, loaded or skipped.

    Skipped (invalid) documents are included on purpose: otherwise they would be
    re-read forever. Ties on updatedAt are ordered by the ObjectId hex string,
    which matches MongoDB's ObjectId ordering.
    """
    best = current
    for doc in docs:
        position = doc_position(doc)
        if best is None or position > best:
            best = position
    return best
