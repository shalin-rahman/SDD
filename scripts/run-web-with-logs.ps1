param(
    [Parameter(Mandatory = $true)]
    [string]$WebDir,
    [Parameter(Mandatory = $true)]
    [string]$LogFile
)

Set-Location $WebDir
Write-Host "EMCAP Web — logging to $LogFile"
Write-Host "URL: http://localhost:4200"
Write-Host ""

npm start 2>&1 | Tee-Object -FilePath $LogFile

Write-Host ""
Write-Host "Web process ended. Log saved to $LogFile"
Read-Host "Press Enter to close this window"
