#!/usr/bin/env python3
"""Fail when Flutter lcov line coverage is below threshold (NFR-003)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_lcov(path: Path) -> tuple[int, int]:
    total = hit = 0
    lf = lh = 0
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("LF:"):
            lf = int(line[3:])
        elif line.startswith("LH:"):
            lh = int(line[3:])
            total += lf
            hit += lh
    return hit, total


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--lcov",
        default="clients/mobile/coverage/lcov.info",
        help="Path to lcov.info relative to repo root",
    )
    parser.add_argument("--min", type=float, default=80.0, help="Minimum line coverage percent")
    args = parser.parse_args()

    path = Path(args.lcov)
    if not path.is_file():
        print(f"Missing coverage file: {path}", file=sys.stderr)
        return 1

    hit, total = parse_lcov(path)
    if total == 0:
        print("No line coverage data in lcov file", file=sys.stderr)
        return 1

    pct = 100.0 * hit / total
    print(f"Flutter line coverage: {pct:.2f}% ({hit}/{total})")
    if pct + 1e-9 < args.min:
        print(f"Coverage below {args.min}% gate", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
