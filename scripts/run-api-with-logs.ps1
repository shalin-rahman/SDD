param(
    [Parameter(Mandatory = $true)]
    [string]$ApiDir,
    [Parameter(Mandatory = $true)]
    [string]$LogFile,
    [Parameter(Mandatory = $true)]
    [string]$DatabaseUrl,
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    [Parameter(Mandatory = $true)]
    [string]$ModulesPath
)

Set-Location $ApiDir
$env:DATABASE_URL = $DatabaseUrl
$env:EMCAP_CONFIG_PATH = $ConfigPath
$env:EMCAP_MODULES_PATH = $ModulesPath

Write-Host "EMCAP API - http://localhost:8000"
Write-Host "Logging to $LogFile"
Write-Host ""

# Run via cmd so uvicorn INFO on stderr is not shown as PowerShell NativeCommandError.
cmd /c "python -m uvicorn emcap.main:app --host 0.0.0.0 --port 8000 --app-dir src 2>&1" |
    Tee-Object -FilePath $LogFile

Write-Host ""
Write-Host "API process ended. Log saved to $LogFile"
Read-Host "Press Enter to close this window"
