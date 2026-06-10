"""One-off runner for gap tests (delete after verification)."""
import subprocess
import sys

env = {
    **dict(__import__("os").environ),
    "EMCAP_CONFIG_PATH": r"C:\Users\u1074139\workstation\Study\SDD\config\platform.yaml",
    "EMCAP_MODULES_PATH": r"C:\Users\u1074139\workstation\Study\SDD\modules",
    "DATABASE_URL": "sqlite:///:memory:",
}
tests = [
    "tests/test_client_api_gaps.py::test_offline_sync_snapshot_and_changes",
    "tests/test_client_api_gaps.py::test_realtime_stream_endpoint",
    "tests/test_platform_core_unchanged.py::test_platform_core_has_no_git_diff_for_inventory_work",
]
result = subprocess.run(
    [sys.executable, "-m", "pytest", "-q", "--tb=short", *tests],
    cwd=r"C:\Users\u1074139\workstation\Study\SDD\platform\api",
    env=env,
)
sys.exit(result.returncode)
