# # Use official Python image
# FROM python:3.10-slim

# # Set working directory
# WORKDIR /app

# # Install system dependencies (optional but recommended)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     && rm -rf /var/lib/apt/lists/*

# # Copy requirements first (better caching)
# COPY requirements.txt /app/requirements.txt

# # Install dependencies
# RUN pip install --no-cache-dir -r requirements.txt

# # Copy entire backend folder
# COPY . /app

# # Expose backend port
# EXPOSE 9000

# # Run FastAPI app using uvicorn
# CMD ["python", "main.py", "--host", "0.0.0.0", "--port", "9000", "--no-reload"]


# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies required by Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt /app/requirements.txt

# Upgrade pip and install dependencies with longer timeout
RUN pip install --upgrade pip
RUN pip install --default-timeout=120 --no-cache-dir -r requirements.txt

# Copy entire backend folder
COPY . /app

# Expose backend port
EXPOSE 9000

# Run FastAPI app using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9000", "--reload"]

