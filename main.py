"""
SafeSight AI Root Entrypoint
Allows Render/Docker/Heroku/Railway to run the backend from the repository root:
    python main.py
or
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be resolved
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Expose app for ASGI servers like uvicorn: `uvicorn main:app`
from app.main import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
