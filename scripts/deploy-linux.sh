#!/usr/bin/env bash
set -e

#
# QMS v0.4 — Pilot Deployment (Linux / WSL)
# Run this from the project root directory.
#
# Usage:
#   bash scripts/deploy-linux.sh          # install + build only
#   bash scripts/deploy-linux.sh --start  # install + build + start server
#

echo "=== QMS v0.4 — Pilot Deployment ==="

# ── Prerequisites ──────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js is not installed. Install Node.js 20+ first."; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "ERROR: npm is not installed."; exit 1; }
command -v git  >/dev/null 2>&1 || { echo "ERROR: git is not installed."; exit 1; }

echo "Node: $(node -v)"
echo "npm:  $(npm -v)"

# ── Environment ────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "WARN: .env not found. Copying .env.example → .env"
    cp .env.example .env
    echo "WARN: Edit .env and set JWT_SECRET before going live!"
  else
    echo "ERROR: .env and .env.example both missing. Create .env first."
    exit 1
  fi
fi

# ── Uploads directory ──────────────────────────────────────────────────────
mkdir -p public/uploads
echo "OK: public/uploads ready"

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

echo "--- Seeding demo data ---"
npx prisma db seed

# ── Build ──────────────────────────────────────────────────────────────────
echo ""
echo "--- Building production bundle ---"
npm run build

echo ""
echo "=== Deployment complete ==="

# ── Start (optional) ──────────────────────────────────────────────────────
if [ "$1" = "--start" ]; then
  echo ""
  echo "--- Starting server (port ${PORT:-3000}) ---"
  NODE_OPTIONS="--max-old-space-size=1024" npx next start -p "${PORT:-3000}"
else
  echo ""
  echo "Next step: start the server"
  echo ""
  echo "  NODE_OPTIONS=\"--max-old-space-size=1024\" npx next start -p ${PORT:-3000}"
  echo ""
  echo "Or use the convenience script:"
  echo ""
  echo "  bash scripts/start-linux.sh"
  echo ""
fi
