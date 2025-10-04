FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY backend/ .

# --- TEMPORARILY DISABLED FOR TESTING ---
# RUN useradd -m appuser
# USER app
# --- END TEMPORARY DISABLE ---

# The command to start the app, hardcoded for reliability
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "2", "-b", "0.0.0.0:8080", "simple_main:app"]