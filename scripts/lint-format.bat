@echo off
setlocal EnableExtensions

call "%CD%\scripts\_resolve-scripts.bat" 2>nul
if errorlevel 1 call "%~dp0_resolve-scripts.bat"
if errorlevel 1 exit /b 1
set "ERR=0"

cd /d "%EMCAP_ROOT%"

echo [lint-format] Python - ruff, black, mypy...
pushd "%EMCAP_API_DIR%"
ruff check src tests
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed
black --check src tests
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed
mypy src
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

echo [lint-format] Web - prettier, eslint...
pushd "%EMCAP_WEB_DIR%"
call npm run format:check
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed
call npm run lint
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

where flutter >nul 2>&1
if %errorlevel%==0 (
  echo [lint-format] Mobile - dart format, flutter analyze...
  pushd "%EMCAP_MOBILE_DIR%"
  dart format --output=none --set-exit-if-changed .
  if errorlevel 1 set ERR=1
  if %ERR% neq 0 goto :failed
  flutter analyze
  if errorlevel 1 set ERR=1
  popd
  if %ERR% neq 0 goto :failed
) else (
  echo [lint-format] Flutter SDK not found - skipping mobile lint/format.
)

echo [lint-format] OK
exit /b 0

:failed
echo [lint-format] FAILED.
exit /b %ERR%
