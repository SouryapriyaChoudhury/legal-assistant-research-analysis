# L.A.R.A — website and API in one image.
# Build:  docker build -t lara .
# Run:    docker run --env-file backend/.env -p 8000:8000 lara
# Open:   http://localhost:8000

FROM node:22-bookworm-slim AS frontend

WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same origin as the API, so the built site calls whatever host published port 8000.
ENV VITE_API_BASE_URL=
RUN npm run build

FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/app/.cache/huggingface \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# x86 images must use the CPU torch wheel. Oracle's free servers are Arm,
# and those wheels come from PyPI instead.
RUN set -eux; \
    grep -vi '^torch' requirements.txt > /tmp/requirements-docker.txt; \
    arch="$(uname -m)"; \
    if [ "$arch" = "aarch64" ] || [ "$arch" = "arm64" ]; then \
      pip install --no-cache-dir 'torch>=2.2.0'; \
    else \
      pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu 'torch>=2.2.0'; \
    fi; \
    pip install --no-cache-dir -r /tmp/requirements-docker.txt; \
    if [ "$arch" != "aarch64" ] && [ "$arch" != "arm64" ]; then \
      pip install --no-cache-dir --force-reinstall --no-deps --index-url https://download.pytorch.org/whl/cpu 'torch>=2.2.0'; \
    fi; \
    python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

COPY backend ./backend
COPY --from=frontend /src/dist ./frontend/dist

WORKDIR /app/backend
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
