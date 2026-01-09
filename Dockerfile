FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire repository
COPY . .

# Expose port for Jupyter or web server
EXPOSE 8080

# Default command: serve the GitHub Pages hologram
CMD ["python", "-m", "http.server", "8080", "--directory", "github-page-hologram"]

