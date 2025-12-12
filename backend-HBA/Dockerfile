# ---- Base image ----
    FROM python:3.10-slim

    # ---- Environment ----
    ENV PYTHONDONTWRITEBYTECODE=1
    ENV PYTHONUNBUFFERED=1
    
    WORKDIR /app
    
    # ---- System dependencies ----
    RUN apt-get update && apt-get install -y \
        build-essential \
        libgl1 \
        curl \
        && rm -rf /var/lib/apt/lists/*
    
    # ---- Copy and install Python deps ----
    COPY requirements.txt .
    RUN pip install --upgrade pip
    RUN pip install -r requirements.txt --no-cache-dir
    
    # ---- Copy app ----
    COPY . .
    
    # ---- Expose FastAPI port ----
    EXPOSE 7000
    
    # ---- Command ----
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7000"]
    
