from pathlib import Path
backend_app_path = str(Path(__file__).resolve().parent.parent / "backend" / "app")
if backend_app_path not in __path__:
    __path__.append(backend_app_path)
