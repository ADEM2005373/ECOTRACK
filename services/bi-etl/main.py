"""bi-etl worker entry point (ECO-24 / SCRUM-57).

Incremental ETL: MongoDB `reports` -> pseudonymised Fact_Reports rows -> PostgreSQL.

Usage:
    py -3.12 services/bi-etl/main.py --once    # one cycle (default)
    py -3.12 services/bi-etl/main.py --loop    # every ETL_INTERVAL_SECONDS until Ctrl+C / SIGTERM

Exit codes: 0 success, 1 run failure, 2 invalid configuration.
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import threading
import time
from collections import Counter
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from config import ConfigError, EtlConfig, load_config
from extractors.reports_extractor import REPORTS_COLLECTION, ReportsExtractor, create_mongo_client
from loaders.postgres_loader import PostgresLoader, build_fact_values, connect_postgres, dedupe_latest
from transform import FactReportRow, InvalidReportError, map_report
from watermark import Watermark, next_watermark

EXIT_OK = 0
EXIT_FAILURE = 1
EXIT_CONFIG_ERROR = 2
_MAX_ERROR_LENGTH = 300

logger = logging.getLogger("bi_etl")


@dataclass
class RunStats:
    read: int = 0
    upserted: int = 0
    unknown_categories: int = 0
    batches: int = 0
    skipped: Counter[str] = field(default_factory=Counter)
    watermark: Watermark | None = None
    watermark_loaded: bool = False

    def summary(self) -> str:
        reasons = ", ".join(f"{reason}={count}" for reason, count in sorted(self.skipped.items()))
        if not self.watermark_loaded:
            watermark = "not-loaded"
        else:
            watermark = self.watermark.describe() if self.watermark else "none"
        return (
            f"read={self.read} upserted={self.upserted} skipped={sum(self.skipped.values())}"
            f"{f' ({reasons})' if reasons else ''} unknown_categories={self.unknown_categories}"
            f" batches={self.batches} watermark={watermark}"
        )


def safe_error(exc: BaseException) -> str:
    """Exception class + first message line only. psycopg2 puts row values in the
    DETAIL lines, which are dropped; no URI or password is ever formatted here."""
    lines = str(exc).strip().splitlines()
    first_line = lines[0] if lines else ""
    return f"{type(exc).__name__}: {first_line[:_MAX_ERROR_LENGTH]}"


def transform_batch(
    docs: Iterable[Mapping[str, Any]], salt: str, date_keys: frozenset[int]
) -> tuple[list[FactReportRow], Counter[str]]:
    """Map documents to rows; invalid ones are counted by reason, never logged."""
    rows: list[FactReportRow] = []
    skipped: Counter[str] = Counter()
    for doc in docs:
        try:
            row = map_report(doc, salt)
        except InvalidReportError as exc:
            skipped[exc.reason] += 1
            continue
        if row.date_created_key not in date_keys:
            skipped["date_outside_dim_date"] += 1
            continue
        rows.append(row)
    return rows, skipped


def run_cycle(config: EtlConfig, stats: RunStats, stop_event: threading.Event | None = None) -> None:
    """One extraction-transform-load cycle. Each batch is committed with its watermark;
    an exception rolls back the current batch and propagates."""
    mongo = create_mongo_client(config.mongodb_uri)
    try:
        pg = connect_postgres(config.postgres_dsn)
        try:
            loader = PostgresLoader(pg)
            watermark = loader.load_watermark()
            stats.watermark = watermark
            stats.watermark_loaded = True
            category_keys = loader.load_category_keys()
            date_keys = loader.load_date_keys()
            logger.info("ETL run started (watermark=%s, batch_size=%d)",
                        watermark.describe() if watermark else "none", config.batch_size)

            extractor = ReportsExtractor(mongo[config.mongodb_db][REPORTS_COLLECTION], config.batch_size)
            for docs in extractor.iter_batches(watermark):
                rows, skipped = transform_batch(docs, config.salt, date_keys)
                values, unknown = build_fact_values(dedupe_latest(rows), category_keys)
                batch_watermark = next_watermark(docs, watermark)
                upserted = loader.commit_batch(values, batch_watermark)

                watermark = batch_watermark
                stats.watermark = watermark
                stats.read += len(docs)
                stats.upserted += upserted
                stats.unknown_categories += unknown
                stats.skipped.update(skipped)
                stats.batches += 1
                logger.debug("Batch %d committed: read=%d upserted=%d", stats.batches, len(docs), upserted)

                if stop_event is not None and stop_event.is_set():
                    logger.info("Shutdown requested: stopping after the committed batch.")
                    break
        finally:
            pg.close()
    finally:
        mongo.close()


def run_once(config: EtlConfig, stop_event: threading.Event | None = None) -> bool:
    stats = RunStats()
    started = time.monotonic()
    try:
        run_cycle(config, stats, stop_event)
    except Exception as exc:  # noqa: BLE001 - top-level guard: log safely, report failure
        logger.error("ETL run FAILED after %.2fs: %s. Uncommitted batch rolled back, "
                     "watermark kept at the last committed batch; %s",
                     time.monotonic() - started, safe_error(exc), stats.summary())
        return False
    logger.info("ETL run finished: %s duration=%.2fs", stats.summary(), time.monotonic() - started)
    return True


def run_loop(config: EtlConfig) -> int:
    stop_event = threading.Event()

    def request_stop(signum: int, _frame: object) -> None:
        logger.info("Signal %s received: graceful shutdown.", signal.Signals(signum).name)
        stop_event.set()

    signal.signal(signal.SIGINT, request_stop)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, request_stop)

    logger.info("ETL loop mode: one run every %d s (Ctrl+C to stop).", config.interval_seconds)
    last_ok = True
    while not stop_event.is_set():
        # A failed run is retried at the next interval; the worker keeps running.
        last_ok = run_once(config, stop_event)
        stop_event.wait(config.interval_seconds)
    logger.info("ETL loop stopped.")
    return EXIT_OK if last_ok else EXIT_FAILURE


def parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="EcoTrack bi-etl: incremental MongoDB reports -> Fact_Reports.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--once", action="store_true", help="run one cycle and exit (default)")
    mode.add_argument("--loop", action="store_true", help="run every ETL_INTERVAL_SECONDS until stopped")
    parser.add_argument("--verbose", action="store_true", help="debug logs for the bi_etl logger only")
    return parser.parse_args(argv)


def configure_logging(verbose: bool) -> None:
    # Only our logger goes to DEBUG: pymongo/psycopg2 debug logs can contain documents.
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    configure_logging(args.verbose)
    try:
        config = load_config()
    except ConfigError as exc:
        logger.error("Invalid configuration, refusing to start: %s", exc)
        return EXIT_CONFIG_ERROR
    if args.loop:
        return run_loop(config)
    return EXIT_OK if run_once(config) else EXIT_FAILURE


if __name__ == "__main__":
    sys.exit(main())
