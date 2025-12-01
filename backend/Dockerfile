# Use a lightweight Python base image
FROM python:3.10-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing pyc files to disc
# PYTHONUNBUFFERED: Prevents Python from buffering stdout and stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Set working directory
WORKDIR /app

# Install system dependencies
# gcc and python3-dev might be needed for building some python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only version first to avoid downloading huge CUDA binaries
# This significantly reduces the image size
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements file
COPY requirements.txt .

# Install other Python dependencies
RUN pip install -r requirements.txt

# Create a non-root user for security
# Create a non-root user for security
RUN adduser --disabled-password --gecos "" appuser

# Copy the rest of the application code
COPY . .

# Change ownership of the application code to the non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 9000

# Command to run the application
CMD ["uvicorn", "apps.fastapi_app:app", "--host", "0.0.0.0", "--port", "9000"]
