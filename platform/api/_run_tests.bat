@echo off
set EMCAP_CONFIG_PATH=C:\Users\u1074139\workstation\Study\SDD\config\platform.yaml
set EMCAP_MODULES_PATH=C:\Users\u1074139\workstation\Study\SDD\modules
set DATABASE_URL=sqlite:///:memory:
cd /d C:\Users\u1074139\workstation\Study\SDD\platform\api
pytest -q tests/test_client_api_gaps.py tests/test_platform_core_unchanged.py::test_platform_core_has_no_git_diff_for_inventory_work --tb=short
