@echo off
setlocal EnableExtensions

set "ROOT=%~dp0.."
set "ERR=0"

cd /d "%ROOT%"

echo [lint-format] Python — ruff, black, mypy...
pushd "%ROOT%\platform\api"
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

echo [lint-format] Web — prettier, eslint...
pushd "%ROOT%\clients\web"
call npm run format:check
if errorlevel 1 set ERR=1
if %ERR% neq 0 goto :failed
call npm run lint
if errorlevel 1 set ERR=1
popd
if %ERR% neq 0 goto :failed

where flutter >nul 2>&1
if %errorlevel%==0 (
  echo [lint-format] Mobile — dart format, flutter analyze...
  pushd "%ROOT%\clients\mobile"
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
