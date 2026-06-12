@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
set "DOCKER_DIR=%ROOT%\infra\docker"
set "ERR=0"

cd /d "%ROOT%"

echo ========================================
echo  EMCAP - tests, stack, seed, web client
echo ========================================

call "%~dp0stop-emcap.bat"

echo.
echo [run-emcap] Lint and format checks...
call "%~dp0lint-format.bat"
if errorlevel 1 goto :failed

echo.
echo [run-emcap] Backend tests (pytest)...
pushd "%ROOT%\platform\api"
python -m pytest -q --cov=src --cov-fail-under=80
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

echo.
echo [run-emcap] Web client build...
pushd "%ROOT%\clients\web"
call npm run build
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

echo.
echo [run-emcap] Web client tests (Karma CI)...
pushd "%ROOT%\clients\web"
call npm run test:ci
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

where flutter >nul 2>&1
if %errorlevel%==0 (
  echo.
  echo [run-emcap] Mobile tests...
  pushd "%ROOT%\clients\mobile"
  flutter test
  if errorlevel 1 set ERR=1
  popd
  if %ERR% neq 0 goto :failed
) else (
  echo [run-emcap] Flutter SDK not found - skipping mobile tests.
)

echo.
echo [run-emcap] Starting infrastructure (postgres, redis, minio)...
pushd "%DOCKER_DIR%"
docker compose up -d postgres redis minio
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

echo [run-emcap] Waiting for PostgreSQL...
set /a PG_WAIT=0
:wait_pg
pushd "%DOCKER_DIR%"
docker compose exec -T postgres pg_isready -U emcap >nul 2>&1
popd
if errorlevel 1 (
  set /a PG_WAIT+=1
  if %PG_WAIT% geq 30 goto :pg_timeout
  timeout /t 2 /nobreak >nul
  goto wait_pg
)
echo [run-emcap] PostgreSQL ready.

echo.
echo [run-emcap] Starting API...
pushd "%DOCKER_DIR%"
docker compose up -d api
popd

echo [run-emcap] Waiting for API health...
set /a API_WAIT=0
:wait_api
curl -sf http://localhost:8000/api/v1/health >nul 2>&1
if errorlevel 1 (
  set /a API_WAIT+=1
  if %API_WAIT% geq 45 goto :api_timeout
  timeout /t 2 /nobreak >nul
  goto wait_api
)
echo [run-emcap] API ready.

echo.
echo [run-emcap] Applying seed data (config-driven JSON)...
python "%ROOT%\scripts\apply-seed.py"
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed

echo.
echo [run-emcap] Starting Angular web client in new window...
start "EMCAP Web" cmd /k "cd /d %ROOT%\clients\web && npm start"

echo.
echo ========================================
echo  EMCAP stack is running
echo  API: http://localhost:8000/api/v1/health
echo  Web: http://localhost:4200
echo  Login: admin / admin123
echo ========================================
goto :eof

:pg_timeout
echo [run-emcap] ERROR: PostgreSQL did not become ready within 60s.
set ERR=1
goto :failed

:api_timeout
echo [run-emcap] ERROR: API did not become healthy within 90s.
set ERR=1
goto :failed

:failed
echo.
echo [run-emcap] FAILED (exit code %ERR%).
exit /b %ERR%
