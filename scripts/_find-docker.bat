@echo off
rem Sets EMCAP_DOCKER to full path of docker.exe, or exits 1 with help text.

set "EMCAP_DOCKER="
where docker >nul 2>&1
if %errorlevel%==0 (
  set "EMCAP_DOCKER=docker"
  exit /b 0
)

for %%P in (
  "%ProgramFiles%\Docker\Docker\resources\bin\docker.exe"
  "%LocalAppData%\Programs\Docker\Docker\resources\bin\docker.exe"
) do (
  if exist %%P (
    set "EMCAP_DOCKER=%%~fP"
    exit /b 0
  )
)

echo.
echo [emcap] Docker is not installed or not on PATH.
echo   Install: https://docs.docker.com/desktop/setup/install/windows-install/
echo   Then start Docker Desktop and open a NEW terminal.
echo   Verify: docker --version
echo.
echo   Or run without Docker: scripts\run-emcap.bat --stack-only --local
echo.
exit /b 1
