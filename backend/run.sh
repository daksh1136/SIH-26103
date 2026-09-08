#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================="
echo "Starting MoSPI ProjectPulse Backend Service"
echo "=========================================="

# Check if uvicorn is available
if command -v uvicorn >/dev/null 2>&1; then
    PYTHON_CMD="uvicorn"
elif [ -f "../ai_engine/venv/bin/uvicorn" ]; then
    PYTHON_CMD="../ai_engine/venv/bin/uvicorn"
elif [ -f "venv/bin/uvicorn" ]; then
    PYTHON_CMD="venv/bin/uvicorn"
else
    PYTHON_CMD="python3 -m uvicorn"
fi

echo "Serving on http://127.0.0.1:8000 (API Docs: http://127.0.0.1:8000/docs)"
exec $PYTHON_CMD app.main:app --host 0.0.0.0 --port 8000 --reload
