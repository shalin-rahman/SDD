@echo off
rem Approximate sleep (seconds). Works when stdin is redirected (unlike timeout.exe).
set /a "_PINGS=%~1+1"
if %_PINGS% lss 2 set "_PINGS=2"
ping 127.0.0.1 -n %_PINGS% >nul 2>&1
