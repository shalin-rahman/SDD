# Lint and format checks (no auto-fix). Mirrors scripts/lint-format.bat.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

Set-Location "$RepoRoot\platform\api"
Write-Host "[lint-format] Python — ruff, black, mypy..."
ruff check src tests
black --check src tests
mypy src

Set-Location "$RepoRoot\clients\web"
Write-Host "[lint-format] Web — prettier, eslint..."
npm run format:check
npm run lint

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if ($flutter) {
    Set-Location "$RepoRoot\clients\mobile"
    Write-Host "[lint-format] Mobile — dart format, flutter analyze..."
    dart format --output=none --set-exit-if-changed .
    flutter analyze
} else {
    Write-Host "[lint-format] Flutter SDK not on PATH — skipping mobile lint/format."
}

Write-Host "[lint-format] OK"
