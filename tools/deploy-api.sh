#!/usr/bin/env bash
# Deploy apps/api + packages/{db,shared,ui} to the VPS and restart pm2.
#
# Pre-reqs:
#   • SSH key in ~/.ssh/authorized_keys on the VPS, OR `sshpass` installed +
#     SSHPASS env var set (falls back to .deploy.env). Either way no password
#     is hardcoded in this script.
#   • Config in `.deploy.env` at the repo root (gitignored). Example:
#       VPS_HOST=45.76.161.193
#       VPS_USER=root
#       VPS_PATH=/var/www/tuyensinhnhanh-api
#       PM2_APP=tuyensinhnhanh-api
#       API_HEALTH_URL=https://api.tuyensinhnhanh.vn/v1/health
#       # SSHPASS=...     # only if you don't use an SSH key
#
# What it does (in order):
#   1. Local typecheck — abort on failure so we never ship broken code.
#   2. rsync apps/api + packages/* + root config to VPS, excluding
#      node_modules, .env.local, .git, build artefacts, and FE-only paths.
#   3. pnpm install --frozen-lockfile (skips if the lockfile/package.json
#      shas didn't change since the last deploy).
#   4. pnpm db:migrate (idempotent — `_migrations` ledger gates each file).
#   5. pm2 restart $PM2_APP --update-env and pm2 save.
#   6. Curl the health endpoint and exit non-zero if it doesn't return 200.

set -euo pipefail

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f "$REPO_ROOT/.deploy.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$REPO_ROOT/.deploy.env"; set +a
fi

: "${VPS_HOST:?VPS_HOST is required (set in .deploy.env)}"
: "${VPS_USER:=root}"
: "${VPS_PATH:=/var/www/tuyensinhnhanh-api}"
: "${PM2_APP:=tuyensinhnhanh-api}"
: "${API_HEALTH_URL:=https://api.tuyensinhnhanh.vn/v1/health}"

# Use sshpass when SSHPASS is set; otherwise rely on SSH key auth.
if [[ -n "${SSHPASS:-}" ]]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    echo "✗ SSHPASS is set but sshpass binary not found. brew install hudochenkov/sshpass/sshpass" >&2
    exit 1
  fi
  SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
  RSYNC_RSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
else
  SSH=(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
  RSYNC_RSH=(ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
fi

REMOTE="$VPS_USER@$VPS_HOST"

say() { printf "\033[1;36m▸\033[0m %s\n" "$*"; }
ok()  { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
die() { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1) Local typecheck
# ---------------------------------------------------------------------------
say "Local typecheck (api + db + shared + ui)"
pnpm --filter api --filter db --filter shared --filter ui typecheck \
  || die "Typecheck failed — fix before deploying."
ok "Typecheck passed"

# Warn on uncommitted changes — not fatal because we want quick iteration.
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  printf "\033[1;33m!\033[0m Uncommitted changes will be deployed.\n"
fi

# ---------------------------------------------------------------------------
# 2) rsync
# ---------------------------------------------------------------------------
say "Sync repo to $REMOTE:$VPS_PATH"
"${RSYNC_RSH[@]:0:0}" rsync -az --delete \
  -e "${RSYNC_RSH[*]}" \
  --exclude='node_modules' --exclude='.next' --exclude='.turbo' --exclude='dist' \
  --exclude='.git' --exclude='.env.local' --exclude='.env' \
  --exclude='content/' --exclude='docs/' --exclude='specs/' --exclude='tools/' \
  --exclude='*.docx' --exclude='docker-compose.yml' --exclude='.deploy.env' \
  --exclude='apps/web/' \
  ./ "$REMOTE:$VPS_PATH/" \
  || die "rsync failed"
ok "Code synced"

# ---------------------------------------------------------------------------
# 3+4+5) Remote: install (if changed), migrate, restart
# ---------------------------------------------------------------------------
# All remote commands run in one SSH session to avoid the ~1s connect cost
# of each separate ssh invocation. Inline `set -e` so a step failing aborts
# the whole remote block.
say "Install deps + migrate + restart on VPS"
"${SSH[@]}" "$REMOTE" "set -euo pipefail
  cd $VPS_PATH

  # Detect whether deps need a full install. We hash package.json + lock and
  # compare against the previous hash kept beside node_modules. First run or
  # any change → install; otherwise skip (saves ~25s per deploy).
  HASH_FILE=node_modules/.deploy-hash
  CURRENT_HASH=\$( { sha256sum package.json pnpm-lock.yaml apps/api/package.json packages/db/package.json packages/shared/package.json packages/ui/package.json 2>/dev/null || true; } | sha256sum | awk '{print \$1}')
  if [[ ! -f \$HASH_FILE ]] || [[ \"\$(cat \$HASH_FILE 2>/dev/null)\" != \"\$CURRENT_HASH\" ]]; then
    echo '▸ deps changed — pnpm install --frozen-lockfile'
    pnpm install --frozen-lockfile
    mkdir -p node_modules && echo \$CURRENT_HASH > \$HASH_FILE
  else
    echo '✓ deps unchanged — skipping install'
  fi

  echo '▸ db migrate'
  # migrate.ts reads DATABASE_URL_MAINTENANCE / DATABASE_URL from its env, but
  # the secret lives in apps/api/.env.local. Source it just for this step so
  # the URL never leaks into shell history or process listings.
  ( set -a; . apps/api/.env.local; set +a; pnpm db:migrate )

  echo '▸ pm2 restart $PM2_APP'
  pm2 restart $PM2_APP --update-env >/dev/null
  pm2 save >/dev/null
" || die "Remote step failed — check 'pm2 logs $PM2_APP' on the VPS."
ok "API restarted"

# ---------------------------------------------------------------------------
# 6) Health check
# ---------------------------------------------------------------------------
say "Health check $API_HEALTH_URL"
# Allow up to 10s for pm2 to bring the process back up.
for i in 1 2 3 4 5 6 7 8 9 10; do
  if [[ "$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 3 "$API_HEALTH_URL" 2>/dev/null || true)" == "200" ]]; then
    ok "$API_HEALTH_URL → 200 (deploy complete)"
    exit 0
  fi
  sleep 1
done
die "Health check failed after 10s. Check 'pm2 logs $PM2_APP' on the VPS."
