# Full-stack smoke: platform tests, web lint/test, optional API health.
# API health step requires a running stack (docker compose or uvicorn).

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiUrl = if ($env:EMCAP_API_URL) { $env:EMCAP_API_URL } else { "http://localhost:8000" }

Set-Location $RepoRoot

Write-Host "[verify-full-stack] Platform API tests..."
Set-Location "$RepoRoot\platform\api"
python -m pytest -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[verify-full-stack] Web client lint + test..."
Set-Location "$RepoRoot\clients\web"
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[verify-full-stack] API health ($ApiUrl)..."
Set-Location $RepoRoot
try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -ne 200) {
        Write-Host "[verify-full-stack] WARN: health returned $($response.StatusCode)"
        exit 1
    }
    Write-Host "[verify-full-stack] Health OK"
} catch {
    Write-Host "[verify-full-stack] WARN: API not reachable at $ApiUrl (start docker compose or uvicorn)"
    Write-Host "[verify-full-stack] Platform + web checks passed; skipping health failure."
}

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if ($flutter) {
    Write-Host "[verify-full-stack] Flutter analyze..."
    Set-Location "$RepoRoot\clients\mobile"
    flutter analyze
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "[verify-full-stack] Flutter SDK not on PATH — skipping mobile analyze"
}

Write-Host "[verify-full-stack] OK"
exit 0
