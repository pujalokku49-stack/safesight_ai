#!/usr/bin/env bash
set -e

echo "=== SafeSight AI Backend Build ==="
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo "=== Backend Build Complete ==="
