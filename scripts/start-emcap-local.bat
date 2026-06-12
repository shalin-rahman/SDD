@echo off
setlocal EnableExtensions EnableDelayedExpansion

if not defined EMCAP_ROOT (
  call "%CD%\scripts\_resolve-scripts.bat" 2>nul
  if errorlevel 1 call "%~dp0_resolve-scripts.bat"
  if errorlevel 1 exit /b 1
  call "!EMCAP_SCRIPTS!emcap-env.bat"
  if errorlevel 1 exit /b 1
)

call "%EMCAP_SCRIPTS%_ensure-python-dev.bat"
if errorlevel 1 exit /b 1

set "ERR=0"
set "DATABASE_URL=sqlite:///./emcap-local.db"
set "EMCAP_CONFIG_PATH=%EMCAP_ROOT%\config\platform.yaml"
set "EMCAP_MODULES_PATH=%EMCAP_ROOT%\modules"

call :log "========================================"
call :log " Starting EMCAP stack (local, no Docker)"
call :log " Log directory: %EMCAP_LOG_DIR%"
call :log " DATABASE_URL: %DATABASE_URL%"
call :log "========================================"

call :log "[local] Stopping listeners on 8000 and 4200..."
call "!EMCAP_SCRIPTS!stop-emcap.bat" >>"%EMCAP_LOG_DIR%\run.log" 2>&1

call :log "[local] Starting API (uvicorn)..."
start "EMCAP API" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File "%EMCAP_ROOT%\scripts\run-api-with-logs.ps1" -ApiDir "%EMCAP_API_DIR%" -LogFile "%EMCAP_LOG_DIR%\api.log" -DatabaseUrl "%DATABASE_URL%" -ConfigPath "%EMCAP_CONFIG_PATH%" -ModulesPath "%EMCAP_MODULES_PATH%"

call :log "[local] Waiting for API health..."
set /a API_WAIT=0
:wait_api
curl.exe -sf http://localhost:8000/api/v1/health >nul 2>&1
if errorlevel 1 (
  set /a API_WAIT+=1
  if !API_WAIT! geq 45 goto :api_timeout
  call "!EMCAP_SCRIPTS!_sleep.bat" 2
  goto wait_api
)
call :log "[local] API ready."

call :log "[local] Applying seed data..."
set "DATABASE_URL=%DATABASE_URL%"
python "%EMCAP_ROOT%\scripts\apply-seed.py" >>"%EMCAP_LOG_DIR%\seed.log" 2>&1
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed

call :log "[local] Starting Angular web..."
start "EMCAP Web" powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File "%EMCAP_ROOT%\scripts\run-web-with-logs.ps1" -WebDir "%EMCAP_WEB_DIR%" -LogFile "%EMCAP_LOG_DIR%\web.log"

call :log ""
call :log "========================================"
call :log " EMCAP local stack is running"
call :log " API:  http://localhost:8000/api/v1/health"
call :log " Web:  http://localhost:4200"
call :log " Login: admin / admin123"
call :log " Logs: %EMCAP_LOG_DIR%"
call :log "========================================"
exit /b 0

:api_timeout
call :log "[local] ERROR: API not healthy within 90s. See EMCAP API window or api.log"
set ERR=1
goto :failed

:failed
call :log "[local] FAILED."
exit /b %ERR%

:log
if "%~1"=="" exit /b 0
echo %~1
>>"%EMCAP_LOG_DIR%\run.log" echo %~1
exit /b 0
