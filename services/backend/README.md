# Backend (FastAPI)

## Setup

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

## Run (dev)

```bash
python -m app.cli --reload
```

## Build a standalone backend binary

```bash
python build_backend.py
```

## Health check

```bash
http://127.0.0.1:8000/health
```
