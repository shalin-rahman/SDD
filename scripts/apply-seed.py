#!/usr/bin/env python3
"""Apply EMCAP seed packs from JSON per config/platform.yaml."""

from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_SRC = ROOT / "platform" / "api" / "src"

os.chdir(ROOT)
if str(API_SRC) not in sys.path:
    sys.path.insert(0, str(API_SRC))

os.environ.setdefault("EMCAP_CONFIG_PATH", str(ROOT / "config" / "platform.yaml"))
os.environ.setdefault("EMCAP_MODULES_PATH", str(ROOT / "modules"))
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://emcap:emcap@localhost:5432/emcap",
)


def main() -> int:
    from emcap.config.loader import load_platform_config
    from emcap.persistence.database import configure_database, get_session_factory, init_db
    from emcap.seed.loader import apply_configured_seeds

    config = load_platform_config()
    configure_database()
    init_db()

    session = get_session_factory()()
    try:
        apply_configured_seeds(session, config)
        print("[apply-seed] OK")
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main())
