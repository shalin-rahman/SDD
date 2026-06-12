@echo off
if not defined EMCAP_SCRIPTS call "%CD%\scripts\_resolve-scripts.bat"
if not defined EMCAP_SCRIPTS call "%~dp0_resolve-scripts.bat"
if errorlevel 1 exit /b 1

if not defined EMCAP_LOG_DIR (
  for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"`) do set "EMCAP_SESSION=%%T"
  if not defined EMCAP_SESSION set "EMCAP_SESSION=session"
  set "EMCAP_LOG_DIR=%EMCAP_ROOT%\logs\emcap\%EMCAP_SESSION%"
)
if not exist "%EMCAP_LOG_DIR%" mkdir "%EMCAP_LOG_DIR%"
if not exist "%EMCAP_ROOT%\logs\emcap" mkdir "%EMCAP_ROOT%\logs\emcap"
echo %EMCAP_LOG_DIR%> "%EMCAP_ROOT%\logs\emcap\latest.txt"
exit /b 0
