# Apply GitHub branch protection for EMCAP (P0-T05).
# Requires: gh CLI authenticated, repo pushed to GitHub with main + develop branches.
#
# Usage:
#   .\scripts\setup-branch-protection.ps1 [-Repo owner/repo]

param(
    [string]$Repo = ""
)

$ErrorActionPreference = "Stop"

if (-not $Repo) {
    $Repo = gh repo view --json nameWithOwner -q .nameWithOwner 2>$null
}
if (-not $Repo) {
    Write-Error "Usage: .\scripts\setup-branch-protection.ps1 [-Repo owner/repo]"
}

$contexts = @(
    "backend", "integration", "security-dependencies", "security-sast",
    "client-lint-web", "client-lint-mobile"
) -join '","'

$checksJson = "{ `"strict`": true, `"contexts`": [`"$contexts`"] }"
$reviewsJson = "{ `"required_approving_review_count`": 1, `"dismiss_stale_reviews`": true }"

Write-Host "Applying branch protection on $Repo ..."

foreach ($branch in @("main", "develop")) {
    gh api `
        --method PUT `
        -H "Accept: application/vnd.github+json" `
        "/repos/$Repo/branches/$branch/protection" `
        -f "required_status_checks=$checksJson" `
        -F enforce_admins=false `
        -f "required_pull_request_reviews=$reviewsJson" `
        -F restrictions=null `
        -F allow_force_pushes=false `
        -F allow_deletions=false
    Write-Host "  protected: $branch"
}

Write-Host "Done. Verify in GitHub: Settings -> Branches."
