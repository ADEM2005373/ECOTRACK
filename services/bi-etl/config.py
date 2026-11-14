"""Environment-based configuration of the bi-etl worker (ECO-24 / SCRUM-57).

Only the process environment is read (no .env loader). Secrets (salt, URIs,
DSN) are excluded from repr() so they can never leak through logging.
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass, field

DEFAULT_MONGODB_DB = "ecotrack_db"
DEFAULT_BATCH_SIZE = 500
DEFAULT_INTERVAL_SECONDS = 300
MIN_SALT_LENGTH = 16
# Default value published in the Jira ticket: public, therefore not a secret.
_FORBIDDEN_SALTS = frozenset({"ecotrack_secret_salt_2026"})


class ConfigError(ValueError):
    """Raised when the configuration is missing or invalid (never contains secrets)."""


@dataclass(frozen=True)
class EtlConfig:
    mongodb_uri: str = field(repr=False)
    mongodb_db: str
    postgres_dsn: str = field(repr=False)
    salt: str = field(repr=False)
    batch_size: int = DEFAULT_BATCH_SIZE
    interval_seconds: int = DEFAULT_INTERVAL_SECONDS


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if not value:
        raise ConfigError(f"Environment variable {name} is required but missing or empty.")
    return value


def _positive_int(env: Mapping[str, str], name: str, default: int) -> int:
    raw = env.get(name, "").strip()
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ConfigError(f"Environment variable {name} must be an integer.") from exc
    if value <= 0:
        raise ConfigError(f"Environment variable {name} must be greater than 0.")
    return value


def _validate_salt(salt: str) -> str:
    if salt in _FORBIDDEN_SALTS:
        raise ConfigError("ETL_SALT uses the public example value from the ticket; set a secret one.")
    if len(salt) < MIN_SALT_LENGTH:
        raise ConfigError(f"ETL_SALT must be at least {MIN_SALT_LENGTH} characters long.")
    return salt


def load_config(env: Mapping[str, str] | None = None) -> EtlConfig:
    """Build the configuration from the environment, failing fast with a clear message."""
    source = os.environ if env is None else env
    return EtlConfig(
        mongodb_uri=_required(source, "MONGODB_URI"),
        mongodb_db=source.get("MONGODB_DB", "").strip() or DEFAULT_MONGODB_DB,
        postgres_dsn=_required(source, "POSTGRES_DSN"),
        salt=_validate_salt(_required(source, "ETL_SALT")),
        batch_size=_positive_int(source, "ETL_BATCH_SIZE", DEFAULT_BATCH_SIZE),
        interval_seconds=_positive_int(source, "ETL_INTERVAL_SECONDS", DEFAULT_INTERVAL_SECONDS),
    )
