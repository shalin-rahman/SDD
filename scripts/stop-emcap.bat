@echo off
setlocal EnableExtensions

call "%CD%\scripts\_resolve-scripts.bat" 2>nul
if errorlevel 1 call "%~dp0_resolve-scripts.bat"
if errorlevel 1 exit /b 1

echo [stop-emcap] Stopping Docker stack...
where docker >nul 2>&1
if errorlevel 1 (
  echo [stop-emcap] Docker not installed - skipping compose down.
) else if exist "%EMCAP_DOCKER_DIR%\docker-compose.yml" (
  pushd "%EMCAP_DOCKER_DIR%"
  docker compose down
  popd
)

echo [stop-emcap] Stopping local listeners on ports 8000 and 4200...
for %%P in (8000 4200) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING" 2^>nul') do (
    taskkill /F /PID %%A >nul 2>&1
  )
)

echo [stop-emcap] Done.
