# bi-etl worker (ECO-24 / SCRUM-57)

Incremental ETL **MongoDB `reports` → PostgreSQL `ecotrack_dw.Fact_Reports`** for the Power BI reports (US-12).

- **Incremental**: only reports modified after the last committed watermark, a compound cursor `(updatedAt, _id)` stored in `ecotrack_dw.etl_sync_state`.
- **GDPR**: `citizen_hash = sha256(str(reporterId) + ETL_SALT)`. The raw citizen id never reaches the warehouse or the logs. Coordinates are rounded to 3 decimals (~100 m); MongoDB keeps the exact values.
- **Idempotent**: `INSERT ... ON CONFLICT (report_id) DO UPDATE`, one transaction per batch (rows + watermark).

## Layout

| Path | Role |
| --- | --- |
| `main.py` | Orchestration, `--once` (default) / `--loop` |
| `config.py` | Environment configuration (fails fast, secrets hidden from `repr`) |
| `extractors/reports_extractor.py` | MongoDB incremental extraction (pymongo, batched cursor) |
| `transform.py` | Pure mapping + pseudonymisation + rounding (`COORD_DECIMALS`) |
| `watermark.py` | Compound cursor logic |
| `loaders/postgres_loader.py` | psycopg2 UPSERT + watermark in one transaction |
| `sql/03_eco24_incremental_etl.sql` | Additive DDL on top of ECO-05 (`01`, `02`) |

## Setup (PowerShell, from the repo root)

```powershell
py -3.12 -m venv services/bi-etl/venv
services/bi-etl/venv/Scripts/python.exe -m pip install -r services/bi-etl/requirements.txt
```

Set the variables listed in [`.env.example`](.env.example) in your shell (the worker does not load `.env` files):
`MONGODB_URI`, `MONGODB_DB`, `POSTGRES_DSN` (+ `PGPASSWORD`), `ETL_SALT` (required, ≥ 16 chars), `ETL_BATCH_SIZE`, `ETL_INTERVAL_SECONDS`.

> ⚠️ If MongoDB or PostgreSQL is also installed natively on Windows, `localhost:27017` / `localhost:5432`
> may reach the native server instead of the Docker container.

## Database migration

A fresh Docker volume runs `sql/01`, `02` and `03` automatically. For an **existing** volume, apply `03` once
(psql runs inside the container through the local socket, so no password is typed; replace `ecotrack_admin` /
`ecotrack_dw` if you overrode `POSTGRES_USER` / `POSTGRES_DB`):

```powershell
docker exec ecotrack-postgres-dw psql -v ON_ERROR_STOP=1 -U ecotrack_admin -d ecotrack_dw -f /docker-entrypoint-initdb.d/03_eco24_incremental_etl.sql
```

## Run

```powershell
services/bi-etl/venv/Scripts/python.exe services/bi-etl/main.py --once   # exit 0 ok, 1 failure, 2 bad config
services/bi-etl/venv/Scripts/python.exe services/bi-etl/main.py --loop   # Ctrl+C for a graceful stop
docker exec ecotrack-postgres-dw psql -U ecotrack_admin -d ecotrack_dw -c "SELECT COUNT(*) FROM ecotrack_dw.Fact_Reports;"
```

Full reload: delete the watermark row (`DELETE FROM ecotrack_dw.etl_sync_state WHERE pipeline_name = 'reports_to_fact_reports';`); the UPSERT makes the reload safe.

## Tests

```powershell
cd services/bi-etl; venv/Scripts/python.exe -m pytest
```
