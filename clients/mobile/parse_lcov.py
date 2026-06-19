#!/usr/bin/env python3
"""Parse lcov.info and show lowest lib/ coverage files."""
from pathlib import Path

path = Path("coverage/lcov.info")
text = path.read_text(encoding="utf-8", errors="replace")
files = []
current = None
lf = lh = 0
for line in text.splitlines():
    if line.startswith("SF:"):
        if current and lf > 0:
            files.append((lh / lf * 100, lh, lf, current))
        current = line[3:].replace("\\", "/")
        lf = lh = 0
    elif line.startswith("LF:"):
        lf = int(line[3:])
    elif line.startswith("LH:"):
        lh = int(line[3:])
if current and lf > 0:
    files.append((lh / lf * 100, lh, lf, current))

lib_files = [(p, h, t, f) for p, h, t, f in files if "/lib/" in f or f.startswith("lib/")]
lib_files.sort(key=lambda x: (x[0], -x[2]))
print("=== Lowest lib/ coverage (bottom 35) ===")
for p, h, t, f in lib_files[:35]:
    idx = f.find("/lib/")
    short = f[idx + 5 :] if idx >= 0 else f
    print(f"{p:5.1f}% ({h:4}/{t:4}) {short}")

print("\n=== Target utils ===")
targets = [
    "payment_util",
    "purchase_order_util",
    "organization_logo_util",
    "i18n_service",
    "locale_format_util",
    "bulk_grid_util",
    "stock_movement_util",
    "shell",
    "emcap_client",
    "entity_list",
    "entity_record",
]
for p, h, t, f in sorted(lib_files, key=lambda x: x[0]):
    for tname in targets:
        if tname in f.lower():
            idx = f.find("/lib/")
            short = f[idx + 5 :] if idx >= 0 else f
            print(f"{p:5.1f}% ({h:4}/{t:4}) {short}")
            break

total_hit = sum(h for _, h, _, _ in files)
total_lf = sum(t for _, _, t, _ in files)
print(f"\nTotal: {100 * total_hit / total_lf:.2f}% ({total_hit}/{total_lf})")
need = int(total_lf * 0.8) + 1
print(f"Need {max(0, need - total_hit)} more lines for 80%")

print("\n=== Most uncovered lib files ===")
by_miss = sorted(lib_files, key=lambda x: -(x[2] - x[1]))
for p, h, t, f in by_miss[:25]:
    miss = t - h
    if miss == 0:
        continue
    idx = f.find("/lib/")
    short = f[idx + 5 :] if idx >= 0 else f.replace("lib/", "", 1)
    print(f"  miss {miss:4} ({p:5.1f}%) {short}")

# Uncovered lines in target utils
print("\n=== Uncovered DA lines in target utils ===")
current = None
uncovered = []
for line in text.splitlines():
    if line.startswith("SF:"):
        current = line[3:].replace("\\", "/")
        uncovered = []
    elif line.startswith("DA:") and current:
        parts = line[3:].split(",")
        if len(parts) == 2 and parts[1] == "0":
            uncovered.append(int(parts[0]))
    elif line == "end_of_record" and current:
        if any(t in current.lower() for t in targets):
            idx = current.find("/lib/")
            short = current[idx + 5 :] if idx >= 0 else current
            if uncovered:
                print(f"{short}: {uncovered[:20]}{'...' if len(uncovered) > 20 else ''} ({len(uncovered)} lines)")
        current = None
