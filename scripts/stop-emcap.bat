@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
set "DOCKER_DIR=%ROOT%\infra\docker"

echo [stop-emcap] Stopping Docker stack...
if exist "%DOCKER_DIR%\docker-compose.yml" (
  pushd "%DOCKER_DIR%"
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
