## Multi-stage Dockerfile for FastAPI backend (dev and prod)

# ------------------------------
# Base builder image
# ------------------------------
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install build dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

# ------------------------------
# Development image (hot reload)
# ------------------------------
FROM python:3.11-slim AS dev

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    ENVIRONMENT=development \
    DEBUG=true

WORKDIR /app

# Install runtime dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl bash \
    && rm -rf /var/lib/apt/lists/*

# Copy venv from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 emruser \
    && adduser --system --uid 1001 --gid 1001 emruser \
    && chown -R emruser:emruser /app

USER emruser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8080/health || exit 1

# Uvicorn for development with reload
COPY --chown=emruser:emruser --chmod=0755 scripts/startup.sh ./scripts/startup.sh
CMD ["./scripts/startup.sh"]

# ------------------------------
# Production image
# ------------------------------
FROM python:3.11-slim AS prod

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    ENVIRONMENT=production \
    DEBUG=false

WORKDIR /app

# Install minimal runtime libs
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 curl bash \
    && rm -rf /var/lib/apt/lists/*

# Copy venv and application code
COPY --from=builder /opt/venv /opt/venv
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 emruser \
    && adduser --system --uid 1001 --gid 1001 emruser \
    && chown -R emruser:emruser /app

USER emruser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8080/health || exit 1

# Gunicorn with Uvicorn workers for production; Cloud Run provides $PORT
COPY --chmod=0755 scripts/startup.sh ./scripts/startup.sh
CMD ["./scripts/startup.sh"]


