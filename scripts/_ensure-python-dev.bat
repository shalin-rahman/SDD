@echo off
rem Ensure platform/api dev tools (ruff, black, mypy) are importable via python -m.

if not defined EMCAP_API_DIR (
  call "%CD%\scripts\_resolve-scripts.bat" 2>nul
  if errorlevel 1 call "%~dp0_resolve-scripts.bat"
)
if not defined EMCAP_API_DIR exit /b 1

pushd "%EMCAP_API_DIR%"
python -m ruff --version >nul 2>&1
if errorlevel 1 (
  echo [python-dev] Installing platform/api dev dependencies...
  python -m pip install -e ".[dev]"
  if errorlevel 1 (
    popd
    exit /b 1
  )
)
popd
exit /b 0
