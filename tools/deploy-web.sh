#!/usr/bin/env bash
# Deploy apps/web to Vercel by pushing the current branch to the `repo-deploy`
# remote (git@github-moiday:xxmoiday/tuyensinhnhanh-senera.git). Vercel watches
# that remote and rebuilds on every push.
#
# Pre-reqs:
#   • `repo-deploy` git remote configured.
#       git remote add repo-deploy git@github-moiday:xxmoiday/tuyensinhnhanh-senera.git
#   • SSH alias `github-moiday` in ~/.ssh/config + key in ssh-agent.
#       Host github-moiday
#         HostName github.com
#         User git
#         IdentityFile ~/.ssh/moiday_rsa
#
# Flow:
#   1. Ensure remote exists.
#   2. Local `pnpm --filter web build` — catches breaks before Vercel does
#      so we don't burn a deployment slot on a broken push.
#   3. Push current branch to the same-named branch on repo-deploy.

set -euo pipefail

cd "$(dirname "$0")/.."

if ! git remote get-url repo-deploy >/dev/null 2>&1; then
  cat >&2 <<EOF
✗ Remote 'repo-deploy' is not configured. Add it with:

    git remote add repo-deploy git@github-moiday:xxmoiday/tuyensinhnhanh-senera.git

EOF
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "✗ Detached HEAD — checkout a branch first." >&2
  exit 1
fi

echo "→ Building apps/web (so we don't ship a broken commit)…"
pnpm --filter web build

echo "→ Pushing $BRANCH → repo-deploy/$BRANCH…"
git push repo-deploy "$BRANCH":"$BRANCH"

echo "✓ Pushed. Vercel will rebuild from repo-deploy/$BRANCH."
