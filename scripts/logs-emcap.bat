@echo off
setlocal EnableExtensions

call "%CD%\scripts\_resolve-scripts.bat" 2>nul
if errorlevel 1 call "%~dp0_resolve-scripts.bat"
if errorlevel 1 exit /b 1

if not defined EMCAP_LOG_DIR (
  if exist "%EMCAP_ROOT%\logs\emcap\latest.txt" (
    set /p EMCAP_LOG_DIR=<"%EMCAP_ROOT%\logs\emcap\latest.txt"
  ) else (
    echo [logs-emcap] No log sessions found. Run scripts\run-emcap.bat first.
    pause
    exit /b 1
  )
)

echo [logs-emcap] Log directory: %EMCAP_LOG_DIR%
echo [logs-emcap] Following Docker logs (Ctrl+C stops follow)...
echo.

pushd "%EMCAP_DOCKER_DIR%"
docker compose logs -f --timestamps api postgres redis minio 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%EMCAP_LOG_DIR%\docker.log' -Append"
popd

echo.
pause
