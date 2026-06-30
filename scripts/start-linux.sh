#!/usr/bin/env bash
set -e

#
# QMS v0.4 — Start Server (Linux / WSL)
# Run this from the project root directory.
#

PORT="${PORT:-3000}"

echo "=== QMS v0.4 — Starting server on port ${PORT} ==="
echo ""
echo "  URL: http://localhost:${PORT}"
echo ""

NODE_OPTIONS="--max-old-space-size=1024" npx next start -p "${PORT}"
