
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY easyocr_server.py .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["python", "easyocr_server.py"]
