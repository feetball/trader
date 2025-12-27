#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

RUN_BOT=1
RUN_API=1
RUN_DASHBOARD=1
AUTO_INSTALL=0

usage() {
  cat <<'USAGE'
Usage: ./start-all.sh [options]

Starts the trading bot, API server, and dashboard for local development.

Options:
  --no-bot        Do not start the trading bot
  --no-api        Do not start the API server
  --no-dashboard  Do not start the dashboard (Next.js)
  --install       Run npm install if node_modules are missing
  -h, --help      Show this help

Default ports:
  Dashboard: http://localhost:3000
  API:       http://localhost:3001
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-bot) RUN_BOT=0; shift ;;
    --no-api) RUN_API=0; shift ;;
    --no-dashboard) RUN_DASHBOARD=0; shift ;;
    --install) AUTO_INSTALL=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

ensure_deps() {
  local dir="$1"
  if [[ "$AUTO_INSTALL" -ne 1 ]]; then
    return 0
  fi

  if [[ ! -d "$dir/node_modules" ]]; then
    echo "[deps] Installing in $dir" >&2
    (cd "$dir" && npm install)
  fi
}

ensure_deps "$ROOT_DIR"
ensure_deps "$ROOT_DIR/frontend"

pids=()

cleanup() {
  local code=$?
  if [[ ${#pids[@]} -gt 0 ]]; then
    echo "[stop] Stopping processes..." >&2
    for pid in "${pids[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
      fi
    done

    # Give them a moment, then hard kill if needed
    sleep 1
    for pid in "${pids[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    done

    wait || true
  fi
  exit "$code"
}

trap cleanup INT TERM EXIT

echo "[start] Dashboard: http://localhost:3000" >&2
echo "[start] API:       http://localhost:3001" >&2

if [[ "$RUN_API" -eq 1 ]]; then
  echo "[start] API server (npm run server)" >&2
  npm run server &
  pids+=("$!")
fi

if [[ "$RUN_DASHBOARD" -eq 1 ]]; then
  echo "[start] Dashboard (npm run dashboard)" >&2
  npm run dashboard &
  pids+=("$!")
fi

if [[ "$RUN_BOT" -eq 1 ]]; then
  echo "[start] Trading bot (npm start)" >&2
  npm start &
  pids+=("$!")
fi

echo "[start] Running. Press Ctrl+C to stop." >&2

# Wait for any process to exit; if one dies, stop the others.
if command -v wait >/dev/null 2>&1; then
  # bash built-in wait supports -n on many distros; fall back if not.
  if wait -n 2>/dev/null; then
    echo "[stop] One process exited; stopping the rest." >&2
  else
    # No wait -n support: wait on all.
    wait || true
  fi
fi
