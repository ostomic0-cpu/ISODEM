#!/usr/bin/env bash
set -e

#
# QMS v0.4 — Backup Database and Uploads
# Run this from the project root directory.
#
# Keeps the 7 most recent backups.
#
# Usage:
#   bash scripts/backup.sh
#

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "=== QMS v0.4 — Backup (${TIMESTAMP}) ==="

mkdir -p "${BACKUP_DIR}"

# ── Backup database ────────────────────────────────────────────────────────
if [ -f prisma/dev.db ]; then
  cp prisma/dev.db "${BACKUP_DIR}/dev-${TIMESTAMP}.db"
  echo "  ✔ Database: backups/dev-${TIMESTAMP}.db"
else
  echo "  – Database file not found (prisma/dev.db), skipping"
fi

# ── Backup uploads ─────────────────────────────────────────────────────────
if [ -d public/uploads ] && [ "$(ls -A public/uploads 2>/dev/null)" ]; then
  cp -r public/uploads "${BACKUP_DIR}/uploads-${TIMESTAMP}"
  echo "  ✔ Uploads:   backups/uploads-${TIMESTAMP}/"
else
  echo "  – Uploads directory empty or missing, skipping"
fi

# ── Prune old backups (keep 7 most recent) ─────────────────────────────────
echo ""
echo "--- Pruning old backups (keeping 7) ---"
COUNT_DB=0
COUNT_UPLOADS=0

# Keep 7 most recent .db backups
if ls "${BACKUP_DIR}"/dev-*.db 1>/dev/null 2>&1; then
  ls -t "${BACKUP_DIR}"/dev-*.db | tail -n +8 | while read -r OLD; do
    rm -f "${OLD}"
    echo "  Removed: ${OLD}"
    COUNT_DB=$((COUNT_DB + 1))
  done
fi

# Keep 7 most recent upload backups
if ls -d "${BACKUP_DIR}"/uploads-*/ 1>/dev/null 2>&1; then
  ls -td "${BACKUP_DIR}"/uploads-*/ | tail -n +8 | while read -r OLD; do
    rm -rf "${OLD}"
    echo "  Removed: ${OLD}"
    COUNT_UPLOADS=$((COUNT_UPLOADS + 1))
  done
fi

echo ""
echo "=== Backup complete ==="
echo "  Database:  ${BACKUP_DIR}/dev-${TIMESTAMP}.db"
echo "  Uploads:   ${BACKUP_DIR}/uploads-${TIMESTAMP}/"
echo ""
