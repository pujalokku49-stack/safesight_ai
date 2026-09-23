#!/usr/bin/env bash
set -e

echo "=== SafeSight AI Build Script ==="
python -m pip install --upgrade pip

if [ -f "requirements.txt" ]; then
    echo "Installing requirements from ./requirements.txt"
    python -m pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    echo "Installing requirements from ./backend/requirements.txt"
    python -m pip install -r backend/requirements.txt
fi

echo "=== Build Complete ==="
