# Run ALL web (Karma) + mobile (Flutter) automated tests with NFR-003 coverage gates.
# Usage (repo root):
#   .\scripts\verify-clients.ps1
#   .\scripts\verify-clients.ps1 -WebOnly
#   .\scripts\verify-clients.ps1 -MobileOnly
#   .\scripts\verify-clients.ps1 -SkipCoverage   # test:ci + flutter test only (faster)

param(
    [switch]$WebOnly,
    [switch]$MobileOnly,
    [switch]$SkipCoverage
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Resolve-FlutterPath {
    $flutter = Get-Command flutter -ErrorAction SilentlyContinue
    if ($flutter) {
        return $flutter.Source
    }
    $candidates = @(
        "$env:USERPROFILE\flutter\flutter_windows_3.44.2-stable\flutter\bin\flutter.bat",
        "$env:LOCALAPPDATA\flutter\bin\flutter.bat"
    )
    foreach ($path in $candidates) {
        if (Test-Path $path) {
            return $path
        }
    }
    return $null
}

if (-not $MobileOnly) {
    Write-Host "[verify-clients] Web Karma (ChromeHeadless)..."
    Set-Location "$RepoRoot\clients\web"
    npm run test:ci
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if (-not $SkipCoverage) {
        Write-Host "[verify-clients] Web branch coverage gate..."
        npm run test:coverage
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}

if (-not $WebOnly) {
    $flutterExe = Resolve-FlutterPath
    if (-not $flutterExe) {
        Write-Host "[verify-clients] SKIP mobile: Flutter SDK not on PATH."
        Write-Host "[verify-clients] Install stable SDK outside Downloads; see docs/dev/local-environment.md"
        if ($MobileOnly) {
            exit 1
        }
    }
    else {
        Write-Host "[verify-clients] Mobile Flutter tests..."
        Set-Location "$RepoRoot\clients\mobile"
        & $flutterExe pub get
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

        if ($SkipCoverage) {
            & $flutterExe test
        }
        else {
            & $flutterExe test --coverage
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
            python "$RepoRoot\scripts\check-flutter-coverage.py" --lcov coverage/lcov.info --min 80
        }
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}

Write-Host "[verify-clients] OK"
exit 0
