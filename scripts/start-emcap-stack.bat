@echo off
setlocal EnableExtensions EnableDelayedExpansion

if not defined EMCAP_ROOT (
  call "%CD%\scripts\_resolve-scripts.bat" 2>nul
  if errorlevel 1 call "%~dp0_resolve-scripts.bat"
  if errorlevel 1 exit /b 1
  call "!EMCAP_SCRIPTS!emcap-env.bat"
  if errorlevel 1 exit /b 1
)
set "ERR=0"

call :log "========================================"
call :log " Starting EMCAP stack"
call :log " Log directory: %EMCAP_LOG_DIR%"
call :log "========================================"

call :log "[stack] Stopping any existing listeners..."
call "!EMCAP_SCRIPTS!stop-emcap.bat" >>"%EMCAP_LOG_DIR%\run.log" 2>&1

call :log "[stack] Docker compose up (postgres, redis, minio, api)..."
pushd "%EMCAP_DOCKER_DIR%"
docker compose up -d --build postgres redis minio api >>"%EMCAP_LOG_DIR%\docker-start.log" 2>&1
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

call :log "[stack] Waiting for PostgreSQL..."
set /a PG_WAIT=0
:wait_pg
pushd "%EMCAP_DOCKER_DIR%"
docker compose exec -T postgres pg_isready -U emcap >nul 2>&1
popd
if errorlevel 1 (
  set /a PG_WAIT+=1
  if !PG_WAIT! geq 30 goto :pg_timeout
  timeout /t 2 /nobreak >nul
  goto wait_pg
)
call :log "[stack] PostgreSQL ready."

call :log "[stack] Waiting for API health..."
set /a API_WAIT=0
:wait_api
curl -sf http://localhost:8000/api/v1/health >nul 2>&1
if errorlevel 1 (
  set /a API_WAIT+=1
  if !API_WAIT! geq 45 goto :api_timeout
  timeout /t 2 /nobreak >nul
  goto wait_api
)
call :log "[stack] API ready."

call :log "[stack] Applying seed data..."
python "%EMCAP_ROOT%\scripts\apply-seed.py" >>"%EMCAP_LOG_DIR%\seed.log" 2>&1
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed

call :log "[stack] Snapshotting Docker logs..."
pushd "%EMCAP_DOCKER_DIR%"
docker compose logs --no-color >"%EMCAP_LOG_DIR%\docker-snapshot.log" 2>&1
popd

call :log "[stack] Starting Angular web (live output + web.log)..."
start "EMCAP Web" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File "%EMCAP_ROOT%\scripts\run-web-with-logs.ps1" -WebDir "%EMCAP_WEB_DIR%" -LogFile "%EMCAP_LOG_DIR%\web.log"

timeout /t 3 /nobreak >nul

call :log ""
call :log "========================================"
call :log " EMCAP stack is running"
call :log " API:  http://localhost:8000/api/v1/health"
call :log " Web:  http://localhost:4200"
call :log " Login: admin / admin123"
call :log " Logs: %EMCAP_LOG_DIR%"
call :log "========================================"
exit /b 0

:pg_timeout
call :log "[stack] ERROR: PostgreSQL not ready within 60s."
set ERR=1
goto :failed

:api_timeout
call :log "[stack] ERROR: API not healthy within 90s."
set ERR=1
goto :failed

:failed
call :log "[stack] FAILED."
exit /b %ERR%

:log
if "%~1"=="" exit /b 0
echo %~1
>>"%EMCAP_LOG_DIR%\run.log" echo %~1
exit /b 0
