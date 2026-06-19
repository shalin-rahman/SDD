# Phase 25 verify suite (plan section 11.3). Re-run from repo root: .\scripts\verify-phase25.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "[verify-phase25] Platform API finance module tests (cov >= 80%)..."
Set-Location "$RepoRoot\platform\api"
python -m pytest -q `
  tests/test_purchase_order_entities.py `
  tests/test_vendor_payment_entities.py `
  tests/test_customer_payment_entities.py `
  tests/test_journal_double_entry.py `
  --cov=src --cov-fail-under=80
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[verify-phase25] Web client coverage..."
Set-Location "$RepoRoot\clients\web"
npm run test:coverage
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutter) {
    Write-Host "[verify-phase25] SKIP mobile: Flutter SDK not on PATH."
    Write-Host "[verify-phase25] OK (API + web)"
    exit 0
}

Write-Host "[verify-phase25] Mobile coverage..."
Set-Location "$RepoRoot\clients\mobile"
flutter test --coverage
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python "$RepoRoot\scripts\check-flutter-coverage.py" --lcov coverage/lcov.info --min 80
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[verify-phase25] OK (API + web + mobile)"
exit 0
