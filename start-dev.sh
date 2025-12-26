#!/usr/bin/env bash
set -euo pipefail

# start-dev.sh - Start frontend (Next dev) and backend (server.js) for local development.
# Usage: bash start-dev.sh

cd "$(dirname "$0")"

echo "Starting dev servers (frontend + backend) with combined logs..."
echo "- Combined: logs/dev-combined.log"
echo "- Frontend: logs/frontend.log"
echo "- Backend:  logs/backend.log"

# Delegate to the npm runner which uses concurrently and tee.
# This keeps Ctrl+C behavior and log formatting consistent.
exec npm run serve:concurrent
