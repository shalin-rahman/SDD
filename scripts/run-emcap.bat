@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Run from repository root:  scripts\run-emcap.bat
rem   --stack-only   skip lint/tests
rem   --skip-tests   lint only
rem   --skip-lint    tests only
rem   --no-follow    do not tail Docker logs at end
rem   --local        SQLite + uvicorn (no Docker)

set "SKIP_LINT=0"
set "SKIP_TESTS=0"
set "STACK_ONLY=0"
set "NO_FOLLOW=0"
set "LOCAL=0"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--stack-only" set "STACK_ONLY=1" & shift & goto :parse_args
if /i "%~1"=="--skip-tests" set "SKIP_TESTS=1" & shift & goto :parse_args
if /i "%~1"=="--skip-lint" set "SKIP_LINT=1" & shift & goto :parse_args
if /i "%~1"=="--no-follow" set "NO_FOLLOW=1" & shift & goto :parse_args
if /i "%~1"=="--local" set "LOCAL=1" & shift & goto :parse_args
echo Unknown option: %~1
exit /b 1
:args_done

if "%STACK_ONLY%"=="1" (
  set "SKIP_LINT=1"
  set "SKIP_TESTS=1"
)

call "%CD%\scripts\_resolve-scripts.bat" 2>nul
if errorlevel 1 call "%~dp0_resolve-scripts.bat"
if errorlevel 1 (
  echo.
  echo [run-emcap] ERROR: Start from the repository root, then run:
  echo   scripts\run-emcap.bat
  echo.
  echo Current directory: %CD%
  pause
  exit /b 1
)

call "!EMCAP_SCRIPTS!emcap-env.bat"
if errorlevel 1 goto :failed
set "ERR=0"

cd /d "%EMCAP_ROOT%"

call :log "========================================"
call :log " EMCAP run - tests, stack, logs"
call :log " Log directory: %EMCAP_LOG_DIR%"
call :log "========================================"

if "%SKIP_LINT%"=="0" (
  call :log ""
  call :log "[run-emcap] Lint and format checks..."
  call "!EMCAP_SCRIPTS!lint-format.bat" >>"%EMCAP_LOG_DIR%\run.log" 2>&1
  if errorlevel 1 goto :failed
)

if "%SKIP_TESTS%"=="0" (
  call :log ""
  call :log "[run-emcap] Backend tests (pytest)..."
  pushd "%EMCAP_API_DIR%"
  python -m pytest -q --cov=src --cov-fail-under=80 >>"%EMCAP_LOG_DIR%\pytest.log" 2>&1
  if errorlevel 1 set ERR=1
  popd
  if !ERR! neq 0 goto :failed
  type "%EMCAP_LOG_DIR%\pytest.log"

  call :log ""
  call :log "[run-emcap] Web client build..."
  pushd "%EMCAP_WEB_DIR%"
  call npm run build >>"%EMCAP_LOG_DIR%\web-build.log" 2>&1
  if errorlevel 1 set ERR=1
  popd
  if !ERR! neq 0 goto :failed

  call :log ""
  call :log "[run-emcap] Web client tests (Karma CI)..."
  pushd "%EMCAP_WEB_DIR%"
  call npm run test:ci >>"%EMCAP_LOG_DIR%\web-test.log" 2>&1
  if errorlevel 1 set ERR=1
  popd
  if !ERR! neq 0 goto :failed

  where flutter >nul 2>&1
  if !errorlevel!==0 (
    call :log ""
    call :log "[run-emcap] Mobile tests..."
    pushd "%EMCAP_MOBILE_DIR%"
    flutter test >>"%EMCAP_LOG_DIR%\flutter-test.log" 2>&1
    if errorlevel 1 set ERR=1
    popd
    if !ERR! neq 0 goto :failed
  ) else (
    call :log "[run-emcap] Flutter SDK not found - skipping mobile tests."
  )
)

call :log "[run-emcap] Starting stack..."
if "%LOCAL%"=="1" (
  call "!EMCAP_SCRIPTS!start-emcap-local.bat"
) else (
  call "!EMCAP_SCRIPTS!start-emcap-stack.bat"
)
set "ERR=!errorlevel!"
if !ERR! neq 0 goto :failed

if "%LOCAL%"=="1" goto :done_pause
if "%NO_FOLLOW%"=="1" goto :done_pause

call :log ""
call :log "[run-emcap] Following Docker service logs (Ctrl+C to stop follow)..."
call :log "[run-emcap] Web logs: EMCAP Web window + %EMCAP_LOG_DIR%\web.log"
call :log ""

pushd "%EMCAP_DOCKER_DIR%"
docker compose logs -f --timestamps api postgres redis minio 2>&1 | powershell -NoProfile -Command "$input | Tee-Object -FilePath '%EMCAP_LOG_DIR%\docker.log' -Append"
popd

goto :done_pause

:failed
if not defined ERR set ERR=1

:done_pause
echo.
if defined EMCAP_LOG_DIR (
  echo Log files: %EMCAP_LOG_DIR%
) else (
  echo Log files: ^(not created^)
)
echo.
if %ERR% neq 0 (
  echo Run failed.
) else (
  echo Stack running. Open http://localhost:4200
)
pause
exit /b %ERR%

:log
if "%~1"=="" exit /b 0
echo %~1
if defined EMCAP_LOG_DIR >>"%EMCAP_LOG_DIR%\run.log" echo %~1
exit /b 0
