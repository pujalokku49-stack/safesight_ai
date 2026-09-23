#!/usr/bin/env bash
set -e

PORT="${PORT:-8000}"
echo "=== Starting SafeSight AI Backend on port $PORT ==="

if [ -d "backend" ]; then
    export PYTHONPATH="${PYTHONPATH}:$(pwd)/backend"
fi

exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
