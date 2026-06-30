#!/usr/bin/env bash
set -e

#
# QMS v0.4 — Update App (Linux / WSL)
# Run this from the project root directory.
#
# Usage:
#   bash scripts/update-linux.sh              # update to latest v0.4
#   bash scripts/update-linux.sh v0.4         # update to specific tag
#

VERSION="${1:-v0.4}"

echo "=== QMS v0.4 — Update to ${VERSION} ==="

# ── Backup first ──────────────────────────────────────────────────────────
if [ -f scripts/backup.sh ]; then
  echo ""
  echo "--- Running backup ---"
  bash scripts/backup.sh
fi

# ── Git pull ───────────────────────────────────────────────────────────────
echo ""
echo "--- Fetching latest tags ---"
git fetch --all --tags

echo "--- Checking out ${VERSION} ---"
git checkout "${VERSION}"

# ── Install dependencies ───────────────────────────────────────────────────
echo ""
echo "--- Installing dependencies ---"
npm install

# ── Database ───────────────────────────────────────────────────────────────
echo ""
echo "--- Running database migrations ---"
npx prisma migrate deploy

echo "--- Generating Prisma client ---"
npx prisma generate

# ── Build ──────────────────────────────────────────────────────────────────
echo ""
echo "--- Building production bundle ---"
npm run build

echo ""
echo "=== Update complete ==="
echo ""
echo "Restart the server to apply changes:"
echo ""
echo "  # If running in foreground: Ctrl+C then start again"
echo "  # If running with PM2:"
echo "  pm2 restart qms-app"
echo "  # Or:"
echo "  bash scripts/start-linux.sh"
echo ""
