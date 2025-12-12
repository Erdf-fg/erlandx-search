FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/ ./backend/

# Install dependencies
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt
RUN chmod +x start.sh

# Create a non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Expose Hugging Face default port
EXPOSE 7860

# Run the start script
CMD ["./start.sh"]
