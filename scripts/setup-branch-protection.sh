# Apply GitHub branch protection for EMCAP (P0-T05).
# Requires: gh CLI authenticated, repo pushed to GitHub with main + develop branches.
#
# Usage:
#   ./scripts/setup-branch-protection.sh [owner/repo]
#   If owner/repo omitted, uses current git remote origin.

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)}"
if [ -z "$REPO" ]; then
  echo "Usage: $0 owner/repo   (or run from a git repo with gh configured)"
  exit 1
fi

echo "Applying branch protection on $REPO ..."

for BRANCH in main develop; do
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${REPO}/branches/${BRANCH}/protection" \
    -f required_status_checks='{"strict":true,"contexts":["backend","integration","security-dependencies","security-sast","client-lint-web","client-lint-mobile"]}' \
    -F enforce_admins=false \
    -F required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    -F restrictions=null \
    -F allow_force_pushes=false \
    -F allow_deletions=false
  echo "  protected: $BRANCH"
done

echo "Done. Verify in GitHub: Settings → Branches."
