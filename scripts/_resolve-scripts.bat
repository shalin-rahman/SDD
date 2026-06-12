@echo off
rem Sets EMCAP_SCRIPTS and EMCAP_ROOT. Run from repo root (recommended).

if defined EMCAP_SCRIPTS if defined EMCAP_ROOT if exist "%EMCAP_SCRIPTS%emcap-env.bat" exit /b 0

if exist "%CD%\scripts\emcap-env.bat" (
  set "EMCAP_SCRIPTS=%CD%\scripts\"
  goto :root
)
if exist "%CD%\emcap-env.bat" (
  set "EMCAP_SCRIPTS=%CD%\"
  goto :root
)
if exist "%~dp0emcap-env.bat" (
  set "EMCAP_SCRIPTS=%~dp0"
  goto :root
)

echo [emcap] ERROR: Cannot find scripts folder.
echo   Run from repo root:  scripts\run-emcap.bat
echo   Current directory:   %CD%
exit /b 1

:root
pushd "%EMCAP_SCRIPTS%.."
set "EMCAP_ROOT=%CD%"
popd
set "EMCAP_DOCKER_DIR=%EMCAP_ROOT%\infra\docker"
set "EMCAP_WEB_DIR=%EMCAP_ROOT%\clients\web"
set "EMCAP_API_DIR=%EMCAP_ROOT%\platform\api"
set "EMCAP_MOBILE_DIR=%EMCAP_ROOT%\clients\mobile"
exit /b 0
