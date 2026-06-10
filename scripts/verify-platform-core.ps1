# P5-T05: Informational check that platform core (platform/api/src/emcap/) has no diff.
# Always exits 0 — use in reviews and pre-merge checks; failures are informational only.

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$CorePath = "platform/api/src/emcap/"

Set-Location $RepoRoot

function Test-GitRepository {
    $ErrorActionPreference = "SilentlyContinue"
    git rev-parse --is-inside-work-tree 2>$null | Out-Null
    $ok = $LASTEXITCODE -eq 0
    $ErrorActionPreference = "Stop"
    return $ok
}

if (-not (Test-GitRepository)) {
    Write-Host "[verify-platform-core] Not a git repository - skipping diff check."
    Write-Host "[verify-platform-core] OK (informational): no git metadata to compare."
    exit 0
}

$Unstaged = @(git diff --name-only -- $CorePath 2>$null)
$Staged = @(git diff --cached --name-only -- $CorePath 2>$null)
$Changed = ($Unstaged + $Staged | Where-Object { $_ -and $_.Trim() } | Sort-Object -Unique)

if ($Changed.Count -eq 0) {
    Write-Host "[verify-platform-core] OK: no changes under $CorePath"
    Write-Host "[verify-platform-core] Business modules should add capabilities via modules/*/module.py only (SDD §30)."
    exit 0
}

Write-Host "[verify-platform-core] NOTE: platform core has local changes (informational, exit 0):"
foreach ($file in $Changed) {
    Write-Host "  - $file"
}
Write-Host "[verify-platform-core] For plug-in modules, only modules/ should change. Review before merge."
exit 0
