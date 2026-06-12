# Lint and format checks (no auto-fix). Mirrors scripts/lint-format.bat.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ApiDir = Join-Path $RepoRoot "platform\api"

function Ensure-PythonDev {
    Set-Location $ApiDir
    $ruffOk = $false
    try {
        python -m ruff --version 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $ruffOk = $true }
    } catch { }
    if (-not $ruffOk) {
        Write-Host "[python-dev] Installing platform/api dev dependencies..."
        python -m pip install -e ".[dev]"
    }
}

Ensure-PythonDev

Write-Host "[lint-format] Python - ruff, black, mypy..."
Set-Location $ApiDir
python -m ruff check src tests
python -m black --check src tests
python -m mypy src

Set-Location (Join-Path $RepoRoot "clients\web")
Write-Host "[lint-format] Web - prettier, eslint..."
npm run format:check
npm run lint

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if ($flutter) {
    Set-Location (Join-Path $RepoRoot "clients\mobile")
    Write-Host "[lint-format] Mobile - dart format, flutter analyze..."
    dart format --output=none --set-exit-if-changed .
    flutter analyze
} else {
    Write-Host "[lint-format] Flutter SDK not on PATH - skipping mobile lint/format."
}

Write-Host "[lint-format] OK"
